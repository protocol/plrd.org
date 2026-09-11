import { Agent } from '@atproto/api'
import { boundedLabFetch, type LabTransportOptions } from '@/lib/lab-bounded-transport'
import type { OAuthSession } from '@atproto/oauth-client-browser'
import { TID } from '@atproto/common-web'
import { configForBrowser, type LabOAuthConfig } from '@/lib/lab-oauth-config'
import { LAB_COLLECTIONS, LAB_COMMUNITY, safeLabHttpsUrl, validateLabData, validateLabRecord, type LabKind, type LabDataMap } from '@/lib/lab-validation'
import { assertLabDid, parseLabUri, labRecordView, type LabRecordView } from '@/lib/lab-protocol'

export type LabAction = 'create' | 'update' | 'delete'
export type LabWriteConsent = { public: true; experimental: true; did: string; action: LabAction; expectedCid?: string }
export type LabWriteReceipt = LabRecordView & { verified: true; verification: 'pds-readback' }
export type LabOAuthSession = Pick<OAuthSession, 'sub' | 'did' | 'getTokenInfo' | 'fetchHandler'>
export class LabPermissionError extends Error {
  constructor(public kind: LabKind, public action: LabAction) { super(`Authorize the ${action} action for this Open Lab ${kind}, then review and confirm again.`); this.name = 'LabPermissionError' }
}
export class LabWriteVerificationError extends Error {
  constructor(public uri: string) { super(`The PDS operation may have completed, but its current state could not be verified. Inspect ${uri} before retrying; do not publish a duplicate.`); this.name = 'LabWriteVerificationError' }
}
export async function fetchLabCapabilities(): Promise<LabOAuthConfig> {
  if (typeof window === 'undefined') throw new Error('Open Lab OAuth runs in the browser.')
  const res = await fetch('/api/lab/capabilities/', { cache: 'no-store', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error('Open Lab capabilities are unavailable. Browsing still works.')
  return configForBrowser(await res.json(), window.location.origin)
}
export function hasLabPermission(scope: string, kind: LabKind, action: LabAction): boolean {
  return scope.split(' ').some(token => {
    const [resource, query] = token.split('?')
    return resource === `repo:${LAB_COLLECTIONS[kind]}` && new URLSearchParams(query).getAll('action').includes(action)
  })
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  return JSON.stringify(value)
}
export function createLabRecordWriter(session: LabOAuthSession, loadConfig: () => Promise<LabOAuthConfig> = fetchLabCapabilities, transportOptions: LabTransportOptions = {}) {
  const agent = new Agent({ get did() { return session.did }, fetchHandler: boundedLabFetch(session, transportOptions) })
  async function authorize(kind: LabKind, action: LabAction, consent: LabWriteConsent) {
    if (typeof window === 'undefined') throw new Error('PDS operations run directly in the browser.')
    assertLabDid(session.sub)
    if (consent?.public !== true || consent?.experimental !== true || consent.did !== session.sub || consent.action !== action) throw new Error('Explicit public, experimental-schema consent for this DID and action is required.')
    const config = configForBrowser(await loadConfig(), window.location.origin)
    if (!config.canSignIn || !config.canPublish || config.mode !== 'ready') throw new Error('Public publication is disabled or configured for another origin.')
    const token = await session.getTokenInfo()
    if (token.sub !== session.sub || session.did !== session.sub) throw new Error('OAuth session DID mismatch.')
    if (!hasLabPermission(token.scope, kind, action)) throw new LabPermissionError(kind, action)
    return safeLabHttpsUrl(token.aud)
  }
  return {
    async publish<K extends LabKind>(kind: K, input: LabDataMap[K], consent: LabWriteConsent): Promise<LabWriteReceipt> {
      const data = validateLabData(kind, input)
      const action = consent?.action === 'update' && kind === 'profile' ? 'update' : 'create'
      const pds = await authorize(kind, action, consent)
      const collection = LAB_COLLECTIONS[kind]
      const rkey = kind === 'profile' ? 'self' : TID.nextStr()
      const uri = `at://${session.sub}/${collection}/${rkey}`
      let createdAt: string = new Date().toISOString()
      if (action === 'update') {
        if (!consent.expectedCid) throw new Error('Profile update requires the CID of the version you reviewed.')
        const previous = labRecordView((await agent.com.atproto.repo.getRecord({ repo: session.sub, collection, rkey })).data, uri, pds)
        if (previous.cid !== consent.expectedCid) throw new Error('Profile changed since you reviewed it. Reload before confirming.')
        createdAt = previous.record.createdAt
      }
      const record = validateLabRecord(kind, { ...data, $type: collection, community: LAB_COMMUNITY, createdAt })
      try {
        // Candidate lexicons are validated locally; PDS schema resolution is not claimed.
        const written = action === 'update'
          ? await agent.com.atproto.repo.putRecord({ repo: session.sub, collection, rkey, record, validate: false, swapRecord: consent.expectedCid })
          : await agent.com.atproto.repo.createRecord({ repo: session.sub, collection, rkey, record, validate: false })
        const read = await agent.com.atproto.repo.getRecord({ repo: session.sub, collection, rkey })
        const view = labRecordView(read.data, uri, pds)
        if (written.data.uri !== uri || written.data.cid !== view.cid || canonical(record) !== canonical(view.record)) throw new Error('Readback mismatch.')
        return { ...view, verified: true, verification: 'pds-readback' }
      } catch (cause) { throw Object.assign(new LabWriteVerificationError(uri), { cause }) }
    },
    async delete(uri: string, consent: LabWriteConsent): Promise<LabDeleteReceipt> {
      const { did, kind, collection, rkey } = parseLabUri(uri)
      if (did !== session.sub) throw new Error('You can delete only your own records.')
      const pds = await authorize(kind, 'delete', consent)
      if (!consent.expectedCid) throw new Error('Deletion requires the CID of the record you reviewed.')
      const params = { repo: did, collection, rkey }
      const previous = labRecordView((await agent.com.atproto.repo.getRecord(params)).data, uri, pds)
      if (previous.cid !== consent.expectedCid) throw new Error('Record changed since you reviewed it. Reload before deleting.')
      try {
        await agent.com.atproto.repo.deleteRecord({ ...params, swapRecord: consent.expectedCid })
        try { await agent.com.atproto.repo.getRecord(params) }
        catch (error) {
          if (error instanceof Error && 'status' in error && error.status === 400 && 'error' in error && error.error === 'RecordNotFound') return { uri, deleted: true, verified: true, verification: 'pds-record-not-found' }
          throw error
        }
        throw new Error('The record is still present.')
      } catch (cause) { throw Object.assign(new LabWriteVerificationError(uri), { cause }) }
    },
  }
}
export type LabDeleteReceipt = { uri: string; deleted: true; verified: true; verification: 'pds-record-not-found' }
export const deleteLabRecord = (session: LabOAuthSession, uri: string, consent: LabWriteConsent) => createLabRecordWriter(session).delete(uri, consent)
export const publishLabRecord = <K extends LabKind>(session: LabOAuthSession, kind: K, data: LabDataMap[K], consent: LabWriteConsent) => createLabRecordWriter(session).publish(kind, data, consent)
