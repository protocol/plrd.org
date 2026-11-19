import assert from 'node:assert/strict'
import { test } from 'node:test'

const load = () => import('./site-content-snapshot.mjs')
const record = (id) => ({ uri: `at://did:example:public/org.example.page/${id}`, cid: `cid-${id}`, value: { pageId: id } })

test('public collection capture follows every cursor and independently reconciles reverse traversal', async () => {
  const { readPdsCollection } = await load()
  const requests = []
  const result = await readPdsCollection('https://public.example', 'did:example:public', 'org.example.page', async (url) => {
    const u = new URL(url)
    requests.push(u)
    const reverse = u.searchParams.get('reverse') === 'true'
    const second = u.searchParams.has('cursor')
    return Response.json({ records: second ? [record(reverse ? 'a' : 'b')] : [record(reverse ? 'b' : 'a')], ...(second ? {} : { cursor: 'next' }) })
  })
  assert.equal(result.records.length, 2)
  assert.equal(result.forward.length, 2)
  assert.equal(result.reverse.length, 2)
  assert.equal(result.complete, true)
  assert.equal(requests.length, 4)
  assert.ok(requests.every(url => url.searchParams.get('repo') === 'did:example:public'))
})

test('capture rejects partial, unstable, duplicate, malformed, and looping source sets', async () => {
  const { readPdsCollection } = await load()
  const run = (fetcher) => readPdsCollection('https://public.example', 'did:example:public', 'org.example.page', fetcher)
  await assert.rejects(run(async () => new Response('unavailable', { status: 503 })), /503/)
  await assert.rejects(run(async () => Response.json({ error: 'bad' })), /records/)
  await assert.rejects(run(async () => Response.json({ records: [record('a'), record('a')] })), /duplicate/)
  await assert.rejects(run(async url => Response.json({ records: [record(new URL(url).searchParams.get('reverse') === 'true' ? 'b' : 'a')] })), /reconcile/)
  await assert.rejects(run(async () => Response.json({ records: [record('a')], cursor: 'loop' })), /duplicate|cursor/)
  await assert.rejects(run(async () => Response.json({ records: [{ uri: 'wrong', value: {} }] })), /record/)
})

test('indexer traversal checks totalCount, final pageInfo, identities, and GraphQL failures', async () => {
  const { readIndexerCollection } = await load()
  const node = id => ({ uri: `at://did:example:public/org.example.page/${id}`, pageId: id })
  const fetcher = async (_url, options) => {
    const { variables } = JSON.parse(options.body)
    const second = !!variables.after
    return Response.json({ data: { pages: { totalCount: 2, edges: [{ node: node(second ? 'b' : 'a') }], pageInfo: { hasNextPage: !second, endCursor: second ? null : 'next' } } } })
  }
  assert.equal((await readIndexerCollection('https://indexer.example/graphql', 'pages', 'uri pageId', '', fetcher)).nodes.length, 2)
  for (const connection of [
    { totalCount: 2, edges: [{ node: node('a') }], pageInfo: { hasNextPage: false, endCursor: null } },
    { totalCount: 1, edges: [{ node: node('a') }], pageInfo: { hasNextPage: true, endCursor: null } },
  ]) {
    await assert.rejects(readIndexerCollection('https://indexer.example/graphql', 'pages', 'uri pageId', '', async () => Response.json({ data: { pages: connection } })), /partial|cursor/i)
  }
  await assert.rejects(readIndexerCollection('https://indexer.example/graphql', 'pages', 'uri', '', async () => Response.json({ errors: [{ message: 'schema mismatch' }] })), /GraphQL/)
})

test('PDS and indexer must agree by identity and every projected field, not count alone', async () => {
  const { reconcilePublicSources } = await load()
  const collections = { 'org.plresearch.page': { records: [record('a')] }, 'org.plresearch.opportunitySpace': { records: [] } }
  const indexer = { orgPlresearchPage: { nodes: [{ uri: record('a').uri, pageId: 'a', title: null }] }, orgPlresearchOpportunitySpace: { nodes: [] } }
  assert.equal(reconcilePublicSources(collections, indexer).pages, 1)
  indexer.orgPlresearchPage.nodes[0].pageId = 'changed'
  assert.throws(() => reconcilePublicSources(collections, indexer), /parity/)
  indexer.orgPlresearchPage.nodes = []
  assert.throws(() => reconcilePublicSources(collections, indexer), /count/)
})

test('evidence writer creates a hashed immutable archive and never overwrites it', async () => {
  const { mkdtemp, readFile, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { createHash } = await import('node:crypto')
  const { writeImmutableSnapshot } = await load()
  const root = await mkdtemp(join(tmpdir(), 'site-content-evidence-'))
  try {
    const directory = join(root, 'capture')
    const payload = { capturedAt: '2026-01-01T00:00:00Z', collections: {} }
    await writeImmutableSnapshot(directory, payload)
    const bytes = await readFile(join(directory, 'public-records.json'))
    const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'))
    assert.equal(manifest.files['public-records.json'].sha256, createHash('sha256').update(bytes).digest('hex'))
    await assert.rejects(writeImmutableSnapshot(directory, { replaced: true }), /EEXIST/)
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'public-records.json'), 'utf8')), payload)
  } finally { await rm(root, { recursive: true, force: true }) }
})
