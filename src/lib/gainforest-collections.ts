/**
 * Client-side GainForest data layer for the `/gainforest/` carousel.
 *
 * Reads the most recent biodiversity *data collections* (Darwin Core
 * occurrence records, `app.gainforest.dwc.occurrence`) straight from the
 * GainForest Hyperindex GraphQL endpoint, then resolves each record's photo
 * blob to a fetchable URL via plc.directory → `com.atproto.sync.getBlob`.
 *
 * This runs in the browser, fetched dynamically: Hyperindex, plc.directory,
 * and the PDS sync endpoint all serve `access-control-allow-origin: *`, so the
 * carousel queries the indexer and resolves blob images per-record client-side.
 * (Ported from ../gainforest-explorer/app/_lib/{indexer,pds,urls}.ts, narrowed
 * to just the image-bearing occurrence stream the carousel needs.)
 *
 * NOTE: distinct from the `server-only` `@/lib/gainforest` stats module used by
 * the FA2 live dashboard — this one is browser-safe (no `server-only` import).
 */

/** Hyperindex GraphQL endpoint. CORS `*`, queryable from the browser. */
export const GAINFOREST_INDEXER_URL = 'https://api-hi.gainforest.app/graphql'

/** Hyperscan record-view base (provenance link-out for each card). */
const HYPERSCAN_URL = 'https://www.hyperscan.dev'

export type GainforestCollection = {
  id: string
  did: string
  rkey: string
  atUri: string
  /** Hyperscan record-view URL for provenance. */
  recordUrl: string
  scientificName: string | null
  vernacularName: string | null
  family: string | null
  country: string | null
  countryCode: string | null
  locality: string | null
  recordedBy: string | null
  eventDate: string | null
  createdAt: string
  /** Resolved, fetchable image URL (PDS blob or external thumbnail). */
  imageUrl: string | null
}

// ── GraphQL ─────────────────────────────────────────────────────────────────

type RawNode = {
  did: string
  rkey: string
  uri?: string | null
  createdAt: string
  eventDate?: string | null
  scientificName?: string | null
  vernacularName?: string | null
  family?: string | null
  recordedBy?: string | null
  country?: string | null
  countryCode?: string | null
  locality?: string | null
  thumbnailUrl?: string | null
  speciesImageUrl?: string | null
  imageEvidence?: { file?: { ref?: string | null } | null } | null
}

const OCCURRENCE_QUERY = `
  query RecentCollections($first: Int!) {
    appGainforestDwcOccurrence(
      first: $first
      where: { imageEvidence: { isNull: false } }
      sortBy: createdAt
      sortDirection: DESC
    ) {
      totalCount
      edges {
        node {
          did rkey uri createdAt eventDate
          scientificName vernacularName family recordedBy
          country countryCode locality
          thumbnailUrl speciesImageUrl
          imageEvidence { file { ref } }
        }
      }
    }
  }
`

// ── PDS blob resolution ───────────────────────────────────────────────────

const pdsHostCache = new Map<string, string | null>()

/** Resolve a DID's PDS host via plc.directory (cached per session). */
async function resolvePdsHost(did: string, signal?: AbortSignal): Promise<string | null> {
  if (pdsHostCache.has(did)) return pdsHostCache.get(did) ?? null
  if (did.startsWith('did:web:')) {
    const host = did.slice('did:web:'.length).replace(/:/g, '/')
    pdsHostCache.set(did, host)
    return host
  }
  try {
    const res = await fetch(`https://plc.directory/${did}`, { signal })
    if (!res.ok) {
      pdsHostCache.set(did, null)
      return null
    }
    const doc: { service?: Array<{ type?: string; serviceEndpoint?: string }> } = await res.json()
    const endpoint = doc.service?.find((s) => s.type === 'AtprotoPersonalDataServer')?.serviceEndpoint
    const host = endpoint ? new URL(endpoint).host : null
    pdsHostCache.set(did, host)
    return host
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    pdsHostCache.set(did, null)
    return null
  }
}

/** Hyperindex sometimes serialises a blob ref as a Go map string
 *  ("map[$link:bafkrei…]") instead of a bare CID; extract the CID either way. */
function normaliseRef(ref: string | null | undefined): string | null {
  if (!ref) return null
  if (ref.startsWith('b') || ref.startsWith('Q')) return ref
  const m = ref.match(/\$link:([a-zA-Z0-9]+)/)
  return m ? m[1] : ref
}

/** Build a public `com.atproto.sync.getBlob` URL for a DID + ref. */
async function resolveBlobUrl(
  did: string,
  ref: string | null | undefined,
  signal?: AbortSignal,
): Promise<string | null> {
  const cid = normaliseRef(ref)
  if (!cid) return null
  const host = await resolvePdsHost(did, signal)
  if (!host) return null
  return `https://${host}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`
}

// ── Public fetcher ──────────────────────────────────────────────────────────

const RESOLVE_CONCURRENCY = 8

function clean(v: string | null | undefined): string | null {
  return v?.trim() || null
}

function hyperscanRecordHref(did: string, collection: string, rkey: string): string {
  const params = new URLSearchParams({ did, collection, rkey })
  return `${HYPERSCAN_URL}/data?${params.toString()}`
}

/**
 * Fetch up to `limit` of the most recent image data collections, resolving
 * each record's photo blob to a URL with bounded concurrency. Records whose
 * blob fails to resolve keep `imageUrl: null` (the card shows a placeholder
 * rather than dropping the record).
 */
export async function fetchRecentCollections(
  limit = 100,
  signal?: AbortSignal,
): Promise<GainforestCollection[]> {
  const res = await fetch(GAINFOREST_INDEXER_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: OCCURRENCE_QUERY, variables: { first: limit } }),
    signal,
  })

  // Hyperindex can return HTTP 400 with valid partial `data`; parse regardless.
  let json: {
    data?: { appGainforestDwcOccurrence?: { edges?: Array<{ node?: RawNode | null } | null> | null } } | null
    errors?: Array<{ message: string }>
  }
  try {
    json = await res.json()
  } catch {
    throw new Error(`gainforest indexer ${res.status}: non-JSON response`)
  }
  if (json.errors?.length && !json.data) {
    throw new Error(json.errors[0]?.message ?? 'gainforest indexer graphql error')
  }

  const nodes = (json.data?.appGainforestDwcOccurrence?.edges ?? [])
    .map((e) => e?.node)
    .filter((n): n is RawNode => Boolean(n?.did))

  const collections: GainforestCollection[] = nodes.map((n) => {
    const collection = 'app.gainforest.dwc.occurrence'
    // Restor-sourced records carry an external photo URL; render it directly.
    const externalImage = clean(n.thumbnailUrl) || clean(n.speciesImageUrl)
    return {
      id: `${n.did}-${n.rkey}`,
      did: n.did,
      rkey: n.rkey,
      atUri: n.uri || `at://${n.did}/${collection}/${n.rkey}`,
      recordUrl: hyperscanRecordHref(n.did, collection, n.rkey),
      scientificName: clean(n.scientificName),
      vernacularName: clean(n.vernacularName),
      family: clean(n.family),
      country: clean(n.country),
      countryCode: clean(n.countryCode),
      locality: clean(n.locality),
      recordedBy: clean(n.recordedBy),
      eventDate: clean(n.eventDate),
      createdAt: n.createdAt,
      imageUrl: externalImage,
    }
  })

  // Resolve PDS blob URLs for records without an external thumbnail.
  let cursor = 0
  async function worker() {
    while (cursor < collections.length) {
      const i = cursor++
      const rec = collections[i]!
      if (rec.imageUrl) continue
      const ref = nodes[i]?.imageEvidence?.file?.ref
      if (!ref) continue
      try {
        collections[i] = { ...rec, imageUrl: await resolveBlobUrl(rec.did, ref, signal) }
      } catch (err) {
        if ((err as Error).name === 'AbortError') throw err
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(RESOLVE_CONCURRENCY, collections.length) }, worker),
  )

  return collections
}

/** ISO alpha-2 → flag emoji (e.g. "BR" → 🇧🇷). Empty string on bad input. */
export function countryFlag(code: string | null): string {
  if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}
