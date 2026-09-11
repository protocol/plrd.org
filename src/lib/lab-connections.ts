import { Agent, AppBskyGraphFollow } from '@atproto/api'
import { labSessionRequestSignal } from '@/lib/lab-auth'
import { TID } from '@atproto/common-web'
import { ensureValidRecordKey } from '@atproto/syntax'
import { boundedLabFetch, type LabTransportOptions } from '@/lib/lab-bounded-transport'
import { assertLabDid } from '@/lib/lab-protocol'
import { safeLabHttpsUrl } from '@/lib/lab-validation'
import { fetchLabCapabilities, type LabOAuthSession } from '@/lib/lab-records'
import { configForBrowser, LAB_FOLLOW_COLLECTION, type LabConnectionAction, type LabOAuthConfig } from '@/lib/lab-oauth-config'

export type LabConnectionConsent = { public: true; did: string; subject: string; action: LabConnectionAction; uri?: string; expectedCid?: string }
export type LabFollowRecord = { uri: string; cid: string; value: AppBskyGraphFollow.Record }
export type LabConnectionReceipt = { status: 'following'; record: LabFollowRecord; verification: 'pds-readback' } | { status: 'not-following'; uri?: string; verification: 'pds-record-not-found' | 'pds-scan' }
export class LabConnectionPermissionError extends Error {
  constructor(public action: LabConnectionAction) { super(`Authorize ${action === 'create' ? 'following' : 'unfollowing'} on Bluesky, then review and confirm again.`); this.name = 'LabConnectionPermissionError' }
}
export class LabConnectionUnknownError extends Error {
  constructor(public uri: string) { super(`The public action may have completed. Check the exact record before doing anything else. No duplicate retry: ${uri}`); this.name = 'LabConnectionUnknownError' }
}
type ConnectionDependencies = {
  isCurrent: () => boolean;
  signal?: AbortSignal;
  loadConfig?: () => Promise<LabOAuthConfig>;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  lock?: <T>(key: string, work: () => Promise<T>) => Promise<T>;
  transport?: LabTransportOptions;
}
export type LabConnectionPending = { action: LabConnectionAction; subject: string; uri: string; record: AppBskyGraphFollow.Record; cid?: string }
const busy = new Set<string>()
async function browserLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks) throw new Error('This browser cannot safely lock a public connection action. Use a supported browser or manage it in Bluesky.')
  return navigator.locks.request(key, { mode: 'exclusive', ifAvailable: true }, async lock => {
    if (!lock) throw new Error('This connection is being handled in another tab. Review again when it finishes.')
    return work()
  })
}
export function hasLabConnectionPermission(scope: string, action: LabConnectionAction) {
  return typeof scope === 'string' && scope.split(' ').includes('atproto') && scope.split(' ').some(token => {
    const [resource, query, extra] = token.split('?')
    if (resource !== `repo:${LAB_FOLLOW_COLLECTION}` || extra !== undefined) return false
    const params = new URLSearchParams(query)
    return [...params.keys()].every(k => k === 'action') && params.getAll('action').every(a => ['create','delete'].includes(a)) && params.getAll('action').includes(action)
  })
}
function followParams(uri: string, did: string) {
  if (typeof uri !== 'string' || !uri.startsWith(`at://${did}/${LAB_FOLLOW_COLLECTION}/`)) throw new Error('Only an exact own-DID native follow record is allowed.')
  const rkey = uri.slice(`at://${did}/${LAB_FOLLOW_COLLECTION}/`.length)
  ensureValidRecordKey(rkey)
  return { repo: did, collection: LAB_FOLLOW_COLLECTION, rkey }
}
function followRecord(input: unknown, did: string, subject?: string, expectedUri?: string): LabFollowRecord {
  const row = input as LabFollowRecord
  if (!row || typeof row.uri !== 'string' || typeof row.cid !== 'string' || !/^b[a-z2-7]{20,120}$/.test(row.cid)) throw new Error('Invalid native follow record identity.')
  followParams(row.uri, did)
  if (expectedUri && row.uri !== expectedUri) throw new Error('Native follow URI mismatch.')
  if (!AppBskyGraphFollow.validateRecord(row.value).success) throw new Error('Invalid native Bluesky follow record.')
  assertLabDid(row.value.subject)
  if (subject && row.value.subject !== subject) throw new Error('Native follow subject mismatch.')
  return row
}
const canonical = (value: unknown): string => value && typeof value === 'object' ? JSON.stringify(value, Object.keys(value).sort()) : JSON.stringify(value)
function recordNotFound(error: unknown) { return !!error && typeof error === 'object' && 'status' in error && error.status === 400 && 'error' in error && error.error === 'RecordNotFound' }

// No server proxy, app password, CMS session or alternate write-as identity.
export function createLabConnectionClient(session: LabOAuthSession, deps: ConnectionDependencies) {
  const key = (subject: string) => `open-lab:connection:v1:${session.sub}:${subject}`
  const store = () => deps.storage ?? window.localStorage
  const signal = AbortSignal.any([labSessionRequestSignal(session), ...(deps.signal ? [deps.signal] : [])])
  function current() {
    if (typeof window === 'undefined' || !deps.isCurrent()) throw new Error('Your account changed or signed out. Review again.')
    signal.throwIfAborted()
    assertLabDid(session.sub)
    if (session.did !== session.sub) throw new Error('OAuth session DID mismatch.')
  }
  function target(subject: string) { current(); assertLabDid(subject); if (subject === session.sub) throw new Error('You cannot follow your own account.') }
  const bounded = boundedLabFetch({ fetchHandler: (path, init) => { current(); return session.fetchHandler(path, init) } }, deps.transport)
  const agent = new Agent({ get did() { return session.did }, fetchHandler: (path, init) => {
    current()
    return bounded(path, { ...init, redirect: 'error', signal: AbortSignal.any([signal, ...(init?.signal ? [init.signal] : [])]) })
  } })
  async function authorize(subject: string, action?: LabConnectionAction, consent?: LabConnectionConsent) {
    target(subject)
    if (action && (consent?.public !== true || consent.did !== session.sub || consent.subject !== subject || consent.action !== action)) throw new Error('Explicit public consent for this author, subject and action is required.')
    const config = configForBrowser(await (deps.loadConfig ?? fetchLabCapabilities)(), window.location.origin)
    if (!config.canSignIn || !config.canConnect) throw new Error('Public connections are disabled or configured for another origin.')
    const token = await session.getTokenInfo()
    current()
    if (token.sub !== session.sub) throw new Error('OAuth token DID mismatch.')
    if (!token.scope.split(' ').includes('atproto')) throw new Error('Missing AT Protocol identity permission.')
    const audience = new URL(safeLabHttpsUrl(token.aud))
    if (audience.pathname !== '/' || audience.search || audience.hash) throw new Error('Invalid OAuth PDS audience.')
    if (action && !hasLabConnectionPermission(token.scope, action)) throw new LabConnectionPermissionError(action)
  }
  function pending(subject: string): LabConnectionPending | null {
    target(subject)
    try {
      const raw = store().getItem(key(subject))
      if (!raw) return null
      if (raw.length > 8192) throw new Error('Oversized recovery state.')
      const p = JSON.parse(raw) as LabConnectionPending
      if (p.subject !== subject || !['create','delete'].includes(p.action)) throw new Error('Recovery identity mismatch.')
      followParams(p.uri, session.sub)
      if (!AppBskyGraphFollow.validateRecord(p.record).success || p.record.subject !== subject) throw new Error('Invalid recovery record.')
      if (p.cid !== undefined && !/^b[a-z2-7]{20,120}$/.test(p.cid)) throw new Error('Invalid recovery CID.')
      if (p.action === 'delete' && !p.cid) throw new Error('Missing reviewed CID.')
      return p
    } catch { throw new Error('Connection recovery storage is unavailable or invalid. Do not retry a public action; check your Bluesky account.') }
  }
  function save(subject: string, value: LabConnectionPending) {
    try {
      const raw = JSON.stringify(value)
      store().setItem(key(subject), raw)
      if (store().getItem(key(subject)) !== raw) throw new Error('Recovery state was not retained.')
    } catch { throw new Error('Browser recovery storage is blocked. No safe public retry is available.') }
  }
  function clear(subject: string) { store().removeItem(key(subject)) }
  async function locked<T>(subject: string, work: () => Promise<T>) {
    target(subject)
    const id = key(subject)
    if (busy.has(id)) throw new Error('This connection action is already in progress.')
    busy.add(id)
    try { return await (deps.lock ?? browserLock)(id, work) }
    finally { busy.delete(id) }
  }
  function noPending(subject: string) { const p = pending(subject); if (p) throw new LabConnectionUnknownError(p.uri) }
  async function read(uri: string, subject: string): Promise<LabFollowRecord | null> {
    try { return followRecord((await agent.com.atproto.repo.getRecord(followParams(uri, session.sub))).data, session.sub, subject, uri) }
    catch (error) { if (recordNotFound(error)) return null; throw error }
  }
  async function find(subject: string): Promise<LabFollowRecord | null> {
    let cursor: string | undefined
    const seen = new Set<string>()
    const started = performance.now()
    for (let page = 0; page < 10; page++) {
      if (performance.now() - started > 20_000) throw new Error('Follow lookup exceeded its deadline. Nothing new was written.')
      const { data } = await agent.com.atproto.repo.listRecords({ repo: session.sub, collection: LAB_FOLLOW_COLLECTION, limit: 100, cursor })
      if (data.records.length > 100) throw new Error('Invalid follow page size.')
      for (const row of data.records) {
        const record = followRecord(row, session.sub)
        if (record.value.subject === subject) {
          const latest = await read(record.uri, subject)
          if (!latest || latest.cid !== record.cid) throw new Error('Follow changed during lookup. Review again.')
          return latest
        }
      }
      if (!data.cursor) return null
      if (data.cursor.length > 1024 || /[\u0000-\u001f]/.test(data.cursor) || seen.has(data.cursor)) throw new Error('Invalid or repeated follow cursor.')
      seen.add(data.cursor); cursor = data.cursor
    }
    throw new Error('Follow lookup is incomplete (1,000-record limit). Manage this connection in Bluesky; no new follow was written.')
  }
  return {
    pending,
    async inspect(subject: string): Promise<LabConnectionReceipt> {
      await authorize(subject)
      noPending(subject)
      const record = await find(subject)
      current()
      return record ? { status: 'following', record, verification: 'pds-readback' } : { status: 'not-following', verification: 'pds-scan' }
    },
    async follow(subject: string, consent: LabConnectionConsent): Promise<LabConnectionReceipt> {
      return locked<LabConnectionReceipt>(subject, async () => {
        await authorize(subject, 'create', consent)
        noPending(subject)
        const existing = await find(subject)
        current()
        if (existing) return { status: 'following', record: existing, verification: 'pds-readback' }
        const rkey = TID.nextStr(), uri = `at://${session.sub}/${LAB_FOLLOW_COLLECTION}/${rkey}`
        const record: AppBskyGraphFollow.Record = { $type: LAB_FOLLOW_COLLECTION, subject, createdAt: new Date().toISOString() }
        const intent: LabConnectionPending = { action: 'create', subject, uri, record }
        save(subject, intent) // Persist BEFORE the first mutation, not after its response.
        try {
          const { data: written } = await agent.com.atproto.repo.createRecord({ repo: session.sub, collection: LAB_FOLLOW_COLLECTION, rkey, record, validate: true })
          intent.cid = written.cid
          save(subject, intent)
          const latest = await read(uri, subject)
          current()
          if (!latest || written.uri !== uri || written.cid !== latest.cid || canonical(latest.value) !== canonical(record)) throw new Error('Native follow readback mismatch.')
          clear(subject)
          return { status: 'following', record: latest, verification: 'pds-readback' }
        } catch { throw new LabConnectionUnknownError(uri) }
      })
    },
    async unfollow(subject: string, consent: LabConnectionConsent): Promise<LabConnectionReceipt> {
      return locked<LabConnectionReceipt>(subject, async () => {
        await authorize(subject, 'delete', consent)
        noPending(subject)
        if (!consent.uri || !consent.expectedCid) throw new Error('Review the exact own follow URI and CID before unfollowing.')
        const params = followParams(consent.uri, session.sub)
        const previous = await read(consent.uri, subject)
        if (!previous || previous.cid !== consent.expectedCid) throw new Error('Follow changed since you reviewed it. Refresh before confirming.')
        current()
        save(subject, { action: 'delete', subject, uri: previous.uri, cid: previous.cid, record: previous.value })
        try {
          await agent.com.atproto.repo.deleteRecord({ ...params, swapRecord: consent.expectedCid })
          if (await read(previous.uri, subject)) throw new Error('Follow still exists.')
          // A duplicate created by another client may still follow them.
          const remaining = await find(subject)
          current()
          clear(subject)
          return remaining ? { status: 'following', record: remaining, verification: 'pds-readback' } : { status: 'not-following', uri: previous.uri, verification: 'pds-record-not-found' }
        } catch { throw new LabConnectionUnknownError(previous.uri) }
      })
    },
    async recover(subject: string): Promise<LabConnectionReceipt> {
      return locked<LabConnectionReceipt>(subject, async () => {
        await authorize(subject)
        const intent = pending(subject)
        if (!intent) throw new Error('No pending public action to recover.')
        try {
          const latest = await read(intent.uri, subject)
          current()
          if (intent.action === 'create') {
            if (!latest || (intent.cid && latest.cid !== intent.cid) || canonical(latest.value) !== canonical(intent.record)) throw new Error('A delayed create may still complete; absence or mismatch does not permit retry.')
            clear(subject)
            return { status: 'following', record: latest, verification: 'pds-readback' }
          }
          if (latest) throw new Error('The deletion outcome is still unknown.')
          const remaining = await find(subject)
          current()
          clear(subject)
          return remaining ? { status: 'following', record: remaining, verification: 'pds-readback' } : { status: 'not-following', uri: intent.uri, verification: 'pds-record-not-found' }
        } catch { throw new LabConnectionUnknownError(intent.uri) }
      })
    },
  }
}
