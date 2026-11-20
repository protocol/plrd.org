#!/usr/bin/env node
/**
 * Resolve the geographic locations of GainForest's **certified actor
 * organizations** into a committed JSON for the FA2 live-dashboard map.
 *
 * Pipeline (all against CORS-open public endpoints):
 *   1. page `appCertifiedActorOrganization` on the Hyperindex GraphQL API,
 *      collecting each org's DID + `app.certified.location` strongRef.
 *   2. batch-resolve those location records → inline "lat,lon"/GeoJSON string
 *      or a PDS blob ref.
 *   3. blobs: resolve DID → PDS host via plc.directory, fetch the blob, parse
 *      it as "lat,lon" or GeoJSON (centroid).
 *   4. join each org's display name from its certified profile.
 *
 * Writes src/data/gainforest-sites.json (committed). Resolving ~750 blobs
 * across many PDS hosts is too slow/fragile for a serverless render, so we do
 * it here at build time; the live dashboard's *counts* stay live via GraphQL.
 *
 * NOTE: the Hyperindex API returns HTTP 400 *with* a valid partial `data`
 * payload when an aliased batch hits a dangling location strongRef — `gql()`
 * deliberately honours that partial data instead of throwing, otherwise a
 * single bad record sinks an 80-wide batch and freezes the snapshot.
 *
 * Refresh ad-hoc:  node scripts/generate-gainforest-sites.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/data/gainforest-sites.json')
const INDEXER = 'https://api-hi.gainforest.app/graphql'

async function gql(query, variables = {}) {
  const res = await fetch(INDEXER, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  // Hyperindex returns HTTP 400 with a *valid partial* `data` payload whenever
  // an aliased batch references a dangling strongRef — a location record whose
  // non-nullable `location` field is missing. Honour GraphQL partial-data
  // semantics: surface `data` whenever it's present (the offending aliases come
  // back null and are skipped downstream) and only throw when data is truly
  // absent. Throwing on every 400 is what froze the committed snapshot: one bad
  // record sank an entire 80-wide location batch and aborted the whole script.
  const json = await res.json().catch(() => null)
  if (json && json.data) return json
  throw new Error(`gql ${res.status}${json?.errors?.[0]?.message ? `: ${json.errors[0].message}` : ''}`)
}

// ── GeoJSON / inline string → {lat, lon} ───────────────────────────────────
function centroid(g) {
  if (!g || typeof g !== 'object') return null
  if (g.type === 'Feature') return centroid(g.geometry)
  if (g.type === 'FeatureCollection') {
    for (const f of g.features ?? []) {
      const c = centroid(f?.geometry)
      if (c) return c
    }
    return null
  }
  if (g.type === 'Point' && Array.isArray(g.coordinates)) {
    const [lon, lat] = g.coordinates
    return Number.isFinite(lon) && Number.isFinite(lat) ? { lat, lon } : null
  }
  let ring
  if (g.type === 'Polygon') ring = g.coordinates?.[0]
  else if (g.type === 'MultiPolygon') ring = g.coordinates?.[0]?.[0]
  if (!Array.isArray(ring) || !ring.length) return null
  let sx = 0, sy = 0, n = 0
  for (const p of ring) {
    if (Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) {
      sx += p[0]; sy += p[1]; n++
    }
  }
  return n ? { lat: sy / n, lon: sx / n } : null
}

function parseLocation(str) {
  if (!str) return null
  const t = str.trim()
  const m = t.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
  if (m) {
    const lat = Number(m[1]), lon = Number(m[2])
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
  }
  try {
    return centroid(JSON.parse(t))
  } catch {
    return null
  }
}

/** Normalise an indexer blob ref (Hyperindex sometimes serialises it as a Go
 *  map string "map[$link:bafkrei…]" instead of a bare CID). */
function normaliseRef(ref) {
  if (!ref) return null
  if (ref.startsWith('b') || ref.startsWith('Q')) return ref
  const m = ref.match(/\$link:([a-zA-Z0-9]+)/)
  return m ? m[1] : ref
}

const hostCache = new Map()
async function pdsHost(did) {
  if (hostCache.has(did)) return hostCache.get(did)
  let host = null
  try {
    if (did.startsWith('did:web:')) host = did.slice(8).replace(/:/g, '/')
    else {
      const r = await fetch(`https://plc.directory/${did}`)
      if (r.ok) {
        const doc = await r.json()
        const ep = doc.service?.find((s) => s.type === 'AtprotoPersonalDataServer')?.serviceEndpoint
        host = ep ? new URL(ep).host : null
      }
    }
  } catch {}
  // certified.one's TLS cert only covers *.certified.one, so the bare apex
  // fails the handshake in browsers (blob images never load). Use the www
  // subdomain, which serves the same blobs and matches the wildcard cert.
  if (host === 'certified.one') host = 'www.certified.one'
  hostCache.set(did, host)
  return host
}

async function runLimited(tasks, concurrency = 8) {
  let i = 0
  async function worker() {
    while (i < tasks.length) await tasks[i++]()
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker))
}

// ── 1. page certified orgs ──────────────────────────────────────────────────
const ORG_Q = `query($after:String){ appCertifiedActorOrganization(first:100, after:$after){ pageInfo{hasNextPage endCursor} edges{ node{ did location{ uri } organizationType urls{ url } longDescription{ __typename ... on OrgHypercertsDefsDescriptionString { value } } } } } }`
const orgs = []
const meta = new Map() // did -> { type, website, description }
let after = null
for (;;) {
  const j = await gql(ORG_Q, { after })
  const c = j.data?.appCertifiedActorOrganization
  if (!c) break
  for (const e of c.edges ?? []) {
    const n = e?.node
    if (!n?.did) continue
    orgs.push(n)
    meta.set(n.did, {
      type: (n.organizationType ?? []).filter(Boolean).join(' · ') || null,
      website: n.urls?.find((u) => u?.url)?.url || null,
      description: n.longDescription?.value?.trim() || null,
    })
  }
  if (!c.pageInfo?.hasNextPage) break
  after = c.pageInfo.endCursor
}
const withLoc = orgs.filter((o) => o.location?.uri)
console.log(`[gf-sites] ${orgs.length} certified orgs · ${withLoc.length} with a location`)

// ── 2. batch-resolve location records (aliased, 80 per query) ───────────────
const LOC_SEL = `{ did location{ __typename ... on AppCertifiedLocationString{ string } ... on OrgHypercertsDefsSmallBlob{ blob{ ref } } } }`
const locByUri = new Map()
for (let i = 0; i < withLoc.length; i += 80) {
  const slice = withLoc.slice(i, i + 80)
  const parts = slice.map((o, k) => `l${k}: appCertifiedLocationByUri(uri:"${o.location.uri}") ${LOC_SEL}`)
  const j = await gql(`query{${parts.join('\n')}}`)
  slice.forEach((o, k) => { locByUri.set(o.location.uri, j.data?.[`l${k}`] ?? null) })
}

// ── 3. resolve coordinates (inline now, blobs concurrency-limited) ──────────
// Two distinct DIDs per location: the *org* DID (`o.did`) is the entity we map
// — it keys the name/profile/meta/url joins below — while the location record's
// own repo DID (`node.did`) is where the blob actually lives and must be used
// for getBlob. They usually coincide, but some orgs reference location records
// hosted in a shared seed repo; attributing the point to that host repo (the
// old `node.did || o.did`) collapsed ~67 distinct orgs into one bogus name.
const points = []
const blobTasks = []
for (const o of withLoc) {
  const node = locByUri.get(o.location.uri)
  const loc = node?.location
  const orgDid = o.did // identity: name, profile, meta, url
  const hostDid = node?.did || o.did // blob host repo
  if (loc?.__typename === 'AppCertifiedLocationString' && loc.string) {
    const c = parseLocation(loc.string)
    if (c) points.push({ did: orgDid, ...c })
  } else if (loc?.__typename === 'OrgHypercertsDefsSmallBlob' && loc.blob?.ref) {
    blobTasks.push(async () => {
      const host = await pdsHost(hostDid)
      if (!host) return
      try {
        const r = await fetch(
          `https://${host}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(hostDid)}&cid=${encodeURIComponent(loc.blob.ref)}`,
          { signal: AbortSignal.timeout(10000) },
        )
        if (!r.ok) return
        const c = parseLocation(await r.text())
        if (c) points.push({ did: orgDid, ...c })
      } catch {}
    })
  }
}
await runLimited(blobTasks)

// ── 4. join display names from certified profiles ───────────────────────────
const dids = [...new Set(points.map((p) => p.did))]
const names = new Map()
const avatarRefs = new Map()
for (let i = 0; i < dids.length; i += 80) {
  const slice = dids.slice(i, i + 80)
  const parts = slice.map(
    (did, k) =>
      `p${k}: appCertifiedActorProfileByUri(uri:"at://${did}/app.certified.actor.profile/self"){ displayName avatar{ __typename ... on OrgHypercertsDefsSmallImage{ image{ ref } } } }`,
  )
  try {
    const j = await gql(`query{${parts.join('\n')}}`)
    slice.forEach((did, k) => {
      const n = j.data?.[`p${k}`]
      if (n?.displayName) names.set(did, n.displayName)
      const ref = normaliseRef(n?.avatar?.image?.ref)
      if (ref) avatarRefs.set(did, ref)
    })
  } catch {}
}

// ── resolve org logo blob URLs (PDS-hosted, CORS-open) ─────────────────
const imageByDid = new Map()
await runLimited(
  dids.map((did) => async () => {
    const ref = avatarRefs.get(did)
    if (!ref) return
    const host = await pdsHost(did)
    if (!host) return
    imageByDid.set(
      did,
      `https://${host}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(ref)}`,
    )
  }),
)

const trunc = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '\u2026' : s)
const out = {
  points: points.map((p) => {
    const m = meta.get(p.did) || {}
    return {
      lat: +p.lat.toFixed(5),
      lon: +p.lon.toFixed(5),
      name: names.get(p.did) || null,
      type: m.type || null,
      description: trunc(m.description, 180) || null,
      image: imageByDid.get(p.did) || null,
      url: m.website || `https://certs.gainforest.app/account/${p.did}`,
    }
  }),
}
await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(out))
console.log(`[gf-sites] resolved ${out.points.length} certified-org locations · ${OUT}`)
