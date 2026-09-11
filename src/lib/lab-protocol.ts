import { Agent } from '@atproto/api'
import { DidResolverCommon } from '@atproto-labs/did-resolver'
import { ensureValidRecordKey } from '@atproto/syntax'
import { LAB_COLLECTIONS, safeLabHttpsUrl, validateLabRecord, type LabKind, type LabRecord, type LabDataMap } from '@/lib/lab-validation'

export type LabRecordView<K extends LabKind = LabKind> = {
  uri: string; cid: string; authorDid: string; kind: K; record: LabRecord<K>; data: LabDataMap[K];
  pds: string; provenance: 'pds-https-unverified-signature';
}
export function assertLabDid(did: unknown): asserts did is `did:plc:${string}` | `did:web:${string}` {
  if (typeof did !== 'string') throw new Error('Use an exact AT Protocol DID.')
  if (/^did:plc:[a-z2-7]{24}$/.test(did)) return
  if (did.startsWith('did:web:') && !/[:%/#?]/.test(did.slice(8))) {
    safeLabHttpsUrl(`https://${did.slice(8)}/`)
    return
  }
  throw new Error('Use a valid did:plc or domain-only did:web identifier.')
}
export function parseLabUri(uri: string) {
  if (typeof uri !== 'string' || uri.length > 1024) throw new Error('Invalid Open Lab AT URI.')
  const match = /^at:\/\/([^/]+)\/([^/]+)\/([^/?#]+)$/.exec(uri)
  if (!match) throw new Error('Use an exact Open Lab AT URI, not a handle or web URL.')
  const [, did, collection, rkey] = match
  assertLabDid(did)
  const kind = (Object.keys(LAB_COLLECTIONS) as LabKind[]).find(k => LAB_COLLECTIONS[k] === collection)
  if (!kind) throw new Error('Not an Open Lab collection.')
  ensureValidRecordKey(rkey)
  if (kind === 'profile' && rkey !== 'self') throw new Error('Open Lab profiles use the self record key.')
  return { did, collection, kind, rkey }
}
export function labRecordView(input: { uri: string; cid?: string; value: unknown }, expectedUri: string, pds: string): LabRecordView {
  const { did, kind } = parseLabUri(expectedUri)
  if (input.uri !== expectedUri || typeof input.cid !== 'string' || !/^b[a-z2-7]{20,120}$/.test(input.cid)) throw new Error('PDS returned a mismatched record identity or invalid CID.')
  const record = validateLabRecord(kind, input.value)
  const { $type, community, createdAt, ...data } = record
  void $type; void community; void createdAt
  return { uri: input.uri, cid: input.cid, authorDid: did, kind, record, data: data as LabDataMap[LabKind], pds, provenance: 'pds-https-unverified-signature' }
}

// Browser only: never expose a server proxy for visitor-selected DID/PDS URLs.
export function createLabPublicReader(fetcher: typeof fetch = globalThis.fetch, requestSignal?: AbortSignal) {
  const publicFetch: typeof fetch = async (input, init) => {
    if (typeof window === 'undefined') throw new Error('Public PDS reads must run directly in the browser.')
    const url = safeLabHttpsUrl(input instanceof Request ? input.url : String(input))
    const upstreamSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined)
    const signal = AbortSignal.any([AbortSignal.timeout(12_000), ...(upstreamSignal ? [upstreamSignal] : []), ...(requestSignal ? [requestSignal] : [])])
    signal.throwIfAborted()
    const response = await fetcher(url, { method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store', headers: { Accept: 'application/json' }, signal })
    signal.throwIfAborted()
    const reader = response.body?.getReader()
    if (!reader) return response
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        signal.throwIfAborted()
        if (done) break
        size += value.byteLength
        if (size > 1_048_576) throw new Error('Public response exceeds the 1 MiB limit; request a smaller page.')
        chunks.push(value)
      }
    } finally { await reader.cancel() }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    return new Response(bytes, { status: response.status, headers: response.headers })
  }
  const resolver = new DidResolverCommon({ fetch: publicFetch, allowHttp: false })
  async function connect(did: string) {
    requestSignal?.throwIfAborted()
    assertLabDid(did)
    const doc = await resolver.resolve(did)
    requestSignal?.throwIfAborted()
    if (doc.id !== did) throw new Error('DID document identity mismatch.')
    const services = doc.service?.filter(s => (s.id === '#atproto_pds' || s.id === `${did}#atproto_pds`) && s.type === 'AtprotoPersonalDataServer')
    if (services?.length !== 1 || typeof services[0].serviceEndpoint !== 'string') throw new Error('DID does not declare exactly one usable PDS.')
    const pds = safeLabHttpsUrl(services[0].serviceEndpoint)
    const u = new URL(pds)
    if (u.pathname !== '/' || u.search || u.hash) throw new Error('PDS must be a public HTTPS origin.')
    return { pds: u.origin, agent: new Agent((path, init) => publicFetch(new URL(path, u.origin), init)) }
  }
  return {
    async readRecord(uri: string): Promise<LabRecordView> {
      const { did, collection, rkey } = parseLabUri(uri)
      const { agent, pds } = await connect(did)
      const { data } = await agent.com.atproto.repo.getRecord({ repo: did, collection, rkey })
      return labRecordView(data, uri, pds)
    },
    async listRecords(did: string, kind: LabKind, options: LabListOptions = {}): Promise<LabRecordPage> {
      assertLabDid(did)
      const limit = options.limit ?? 30
      if (!Object.hasOwn(LAB_COLLECTIONS, kind) || !Number.isInteger(limit) || limit < 1 || limit > 100 || (options.cursor !== undefined && (typeof options.cursor !== 'string' || options.cursor.length > 1024 || /[\u0000-\u001f]/.test(options.cursor)))) throw new Error('Invalid notebook page request.')
      const { agent, pds } = await connect(did)
      const collection = LAB_COLLECTIONS[kind]
      const { data } = await agent.com.atproto.repo.listRecords({ repo: did, collection, limit, cursor: options.cursor })
      if (data.records.length > limit || (data.cursor !== undefined && (data.cursor.length > 1024 || /[\u0000-\u001f]/.test(data.cursor)))) throw new Error('Invalid PDS page bounds.')
      const seen = new Set<string>()
      const records = data.records.map(row => {
        const parsed = parseLabUri(row.uri)
        if (parsed.did !== did || parsed.kind !== kind || seen.has(row.uri)) throw new Error('PDS page identity mismatch or duplicate record.')
        seen.add(row.uri)
        return labRecordView(row, row.uri, pds)
      })
      return { records, cursor: data.cursor, authorDid: did, kind }
    },
  }
}
export type LabListOptions = { limit?: number; cursor?: string }
export type LabRecordPage = { records: LabRecordView[]; cursor?: string; authorDid: string; kind: LabKind }
export const readLabRecord = (uri: string): Promise<LabRecordView> => createLabPublicReader().readRecord(uri)
export const listLabRecords = (did: string, kind: LabKind, options?: LabListOptions): Promise<LabRecordPage> => createLabPublicReader().listRecords(did, kind, options)
