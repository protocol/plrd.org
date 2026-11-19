// Public, unauthenticated migration evidence. Never imports deployment configuration.
export async function readPdsCollection(pds, did, collection, fetcher = fetch) {
  async function traverse(reverse) {
    const pages = [], records = [], seenCursors = new Set(), seenRecords = new Set()
    let cursor
    do {
      const url = new URL('/xrpc/com.atproto.repo.listRecords', pds)
      url.search = new URLSearchParams({ repo: did, collection, limit: '5', reverse: String(reverse), ...(cursor ? { cursor } : {}) }).toString()
      const response = await fetcher(url.toString())
      if (!response.ok) throw new Error(`Public source HTTP ${response.status}: ${url}`)
      const body = await response.json()
      if (!Array.isArray(body.records)) throw new Error(`Missing records: ${url}`)
      for (const record of body.records) {
        if (!record.uri?.startsWith(`at://${did}/${collection}/`) || !record.cid || !record.value) throw new Error('Malformed public record')
        if (seenRecords.has(record.uri)) throw new Error(`duplicate record ${record.uri}`)
        seenRecords.add(record.uri)
      }
      if (body.cursor !== undefined && (typeof body.cursor !== 'string' || !body.cursor || seenCursors.has(body.cursor))) throw new Error('Invalid/repeated cursor')
      if (body.cursor) seenCursors.add(body.cursor)
      pages.push({ url: url.toString(), body })
      records.push(...body.records)
      cursor = body.cursor
    } while (cursor)
    return { pages, records }
  }
  const forward = await traverse(false)
  const reverse = await traverse(true)
  const identities = (records) => records.map(r => `${r.uri}:${r.cid}`).sort().join('\n')
  if (identities(forward.records) !== identities(reverse.records)) throw new Error(`Cannot reconcile complete ${collection} traversals`)
  return { records: forward.records, forward: forward.pages, reverse: reverse.pages, complete: true }
}

export async function readIndexerCollection(endpoint, field, fields, where, fetcher = fetch) {
  const nodes = [], pages = [], seen = new Set(), cursors = new Set()
  let after = null, totalCount
  do {
    const query = `query($after: String) { ${field}(first: 5, after: $after${where ? `, where: ${where}` : ''}) { totalCount edges { node { ${fields} } } pageInfo { hasNextPage endCursor } } }`
    const request = { query, variables: { after } }
    const response = await fetcher(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
    if (!response.ok) throw new Error(`Indexer HTTP ${response.status}`)
    const body = await response.json()
    if (body.errors) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`)
    const connection = body.data?.[field]
    if (!connection || !Number.isInteger(connection.totalCount) || !Array.isArray(connection.edges) || typeof connection.pageInfo?.hasNextPage !== 'boolean') throw new Error(`Malformed/partial ${field} response`)
    if (totalCount !== undefined && totalCount !== connection.totalCount) throw new Error('Unstable/partial indexer count')
    totalCount = connection.totalCount
    for (const { node } of connection.edges) {
      if (!node?.uri || seen.has(node.uri)) throw new Error('Missing/duplicate indexer identity')
      seen.add(node.uri)
      nodes.push(node)
    }
    pages.push({ request, body })
    if (!connection.pageInfo.hasNextPage) break
    after = connection.pageInfo.endCursor
    if (!after || cursors.has(after) || !connection.edges.length) throw new Error('Invalid indexer cursor')
    cursors.add(after)
    if (nodes.length >= totalCount) throw new Error('Partial indexer pagination/count disagreement')
  } while (true)
  if (nodes.length !== totalCount) throw new Error(`Partial ${field}: ${nodes.length}/${totalCount}`)
  return { nodes, pages, totalCount, complete: true }
}

export async function writeImmutableSnapshot(directory, snapshot) {
  const { mkdir, writeFile } = await import('node:fs/promises')
  const { dirname, join } = await import('node:path')
  const { createHash } = await import('node:crypto')
  const sha256 = value => createHash('sha256').update(value).digest('hex')
  await mkdir(dirname(directory), { recursive: true })
  await mkdir(directory) // EEXIST is intentional: captures are never overwritten.
  const bytes = JSON.stringify(snapshot, null, 2) + '\n'
  const manifest = {
    schemaVersion: 1, capturedAt: snapshot.capturedAt, did: snapshot.did, pds: snapshot.pds,
    files: { 'public-records.json': { sha256: sha256(bytes), bytes: Buffer.byteLength(bytes) } },
    collections: Object.fromEntries(Object.entries(snapshot.collections).map(([collection, set]) => [collection, {
      count: set.records.length, complete: set.complete, forwardPages: set.forward.length, reversePages: set.reverse.length,
      records: set.records.map(({ uri, cid, value }) => ({ uri, cid, updatedAt: value.updatedAt ?? null, createdAt: value.createdAt ?? null, publishedAt: value.publishedAt ?? null, valueSha256: sha256(JSON.stringify(value)) })),
    }])),
    indexer: Object.fromEntries(Object.entries(snapshot.indexer ?? {}).map(([field, set]) => [field, { count: set.nodes.length, totalCount: set.totalCount, pages: set.pages.length, complete: set.complete }])),
  }
  await writeFile(join(directory, 'public-records.json'), bytes, { flag: 'wx' })
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
  return manifest
}

export function reconcilePublicSources(collections, indexer) {
  const counts = {}
  function project(shape, value) {
    if (shape === null || typeof shape !== 'object') return value ?? null
    if (Array.isArray(shape)) {
      if (!Array.isArray(value) || shape.length !== value.length) throw new Error('Source parity array mismatch')
      return shape.map((item, i) => project(item, value[i]))
    }
    return Object.fromEntries(Object.entries(shape).map(([key, child]) => [key, project(child, value?.[key])]))
  }
  for (const [collection, field, label] of [['org.plresearch.page', 'orgPlresearchPage', 'pages'], ['org.plresearch.opportunitySpace', 'orgPlresearchOpportunitySpace', 'opportunities']]) {
    const records = collections[collection].records, nodes = indexer[field].nodes
    if (records.length !== nodes.length) throw new Error(`Source count mismatch: ${collection}`)
    const byUri = new Map(records.map(r => [r.uri, r]))
    for (const node of nodes) {
      const record = byUri.get(node.uri)
      if (!record || JSON.stringify(project(node, { ...record.value, uri: record.uri })) !== JSON.stringify(node)) throw new Error(`Source field parity mismatch: ${node.uri}`)
    }
    counts[label] = nodes.length
  }
  return counts
}

// Fixed public endpoints only. All errors/partial sets abort before any archive is written.
if (import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1] ?? '').href) {
  const directory = process.argv[2]
  if (!directory || process.argv.length !== 3) throw new Error('Usage: node scripts/site-content-snapshot.mjs NEW_CAPTURE_DIRECTORY')
  const did = 'did:plc:pgwr6hkosgznfl5nz7egajei'
  const endpoint = 'https://plresearch-indexer-production.up.railway.app/graphql'
  const startedAt = new Date().toISOString()
  async function json(url, options) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`Public HTTP ${response.status}: ${url}`)
    return response.json()
  }
  const didDoc = await json(`https://plc.directory/${did}`)
  const pds = didDoc.service?.find(s => s.type === 'AtprotoPersonalDataServer')?.serviceEndpoint
  if (didDoc.id !== did || !pds?.startsWith('https://')) throw new Error('Invalid public DID/PDS resolution')
  const describeRepo = await json(`${pds}/xrpc/com.atproto.repo.describeRepo?repo=${encodeURIComponent(did)}`)
  if (describeRepo.did !== did || !Array.isArray(describeRepo.collections)) throw new Error('Invalid public repository description')
  const collections = {}
  const publicFetch = (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
  for (const collection of ['org.plresearch.page', 'org.plresearch.opportunitySpace', 'site.standard.document', 'site.standard.publication', 'org.hypercerts.claim.activity', 'org.plresearch.post']) {
    collections[collection] = await readPdsCollection(pds, did, collection, publicFetch)
  }
  const where = `{ did: { eq: "${did}" } }`
  const indexer = {}
  for (const [field, fields, filter] of [
    ['orgPlresearchPage', 'uri pageId iconType leads advisors updatedAt sections { sectionId label title subtitle body }', where],
    ['orgPlresearchOpportunitySpace', 'uri areaSlug id title tagline image description inflectionPoint shift theOpportunity subfields tippingSignals keyAssumptions observations fieldSignals { kpi measurement } updatedAt', where],
    ['orgPlresearchEditEvent', 'uri did target targetCid collection editor editorHandle changedFields note editedAt', ''],
  ]) indexer[field] = await readIndexerCollection(endpoint, field, fields, filter, publicFetch)
  const parity = reconcilePublicSources(collections, indexer)
  // Record the actual failing old blog query rather than treating failure as no documents.
  const blogQuery = '{ records(collection: "site.standard.document", first: 50) { edges { node { rkey uri value } } } }'
  const legacyBlogResponse = await json(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: blogQuery }) })
  if (!legacyBlogResponse.errors?.some(error => /Cannot query field.*records/.test(error.message))) throw new Error('Legacy blog schema changed; reconcile its complete result before capturing')
  const snapshot = { schemaVersion: 1, startedAt, capturedAt: new Date().toISOString(), did, pds, endpoint, didDoc, describeRepo, collections, indexer, parity, legacyBlogQuery: { query: blogQuery, response: legacyBlogResponse } }
  const manifest = await writeImmutableSnapshot(directory, snapshot)
  console.log(JSON.stringify({ directory, capturedAt: snapshot.capturedAt, collections: Object.fromEntries(Object.entries(manifest.collections).map(([name, set]) => [name, { count: set.count, forwardPages: set.forwardPages, reversePages: set.reversePages }])), indexer: manifest.indexer, parity }, null, 2))
}
