import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const snapshot = JSON.parse(readFileSync('src/data/site-content/provenance/2026-11-19/public-records.json', 'utf8'))
const indexer = source('lib/indexer.ts')

test('publication discovery and legacy blog/audit reads are local and preserve visibility/history', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const publication = snapshot.collections['site.standard.publication'].records
  assert.equal(publication.length, 1)
  assert.equal(indexer.REPO_PUBLICATION_URI, publication[0].uri)
  const originals = snapshot.indexer.orgPlresearchEditEvent.nodes
  for (const target of new Set(originals.map(event => event.target))) {
    const expected = originals.filter(event => event.target === target).sort((a, b) => b.editedAt.localeCompare(a.editedAt))
    assert.deepEqual(await indexer.fetchEditEvents(target), expected)
  }
  assert.deepEqual(await indexer.fetchEditEvents('at://unknown/record'), [])
  assert.deepEqual(await indexer.fetchAtproPosts(), [], 'all three external documents already have canonical repo counterparts; no duplicate cards')
  assert.equal(network.mock.callCount(), 0)
  assert.doesNotMatch(readFileSync('src/lib/indexer.ts', 'utf8'), /\bfetch\s*\(|process\.env|https:\/\//, 'runtime adapter has no remote CMS path or environment fallback')
})

test('opportunity reads retain every indexed field and ordering without remote fallback', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const originals = snapshot.indexer.orgPlresearchOpportunitySpace.nodes
  for (const area of new Set(originals.map(o => o.areaSlug))) {
    const expected = originals.filter(o => o.areaSlug === area).map(o => ({ ...o, rkey: o.uri.split('/').at(-1) }))
    const current = await indexer.fetchOpportunitySpaces(area)
    assert.deepEqual(current, expected)
    for (const item of expected) assert.deepEqual(await indexer.fetchOpportunitySpace(item.rkey), item)
    current[0].subfields.push('caller mutation')
    assert.deepEqual(await indexer.fetchOpportunitySpaces(area), expected)
  }
  assert.equal(await indexer.fetchOpportunitySpace('does-not-exist'), null)
  assert.deepEqual(await indexer.fetchOpportunitySpaces('does-not-exist'), [])
  assert.equal(network.mock.callCount(), 0)
})

test('page reads preserve current indexer fields without contacting any network', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const expected = snapshot.indexer.orgPlresearchPage.nodes.find(n => n.pageId === 'landing')
  assert.deepEqual(await indexer.fetchPage('landing'), { ...expected, rkey: 'landing' })
  assert.equal(await indexer.fetchPage('does-not-exist'), null)
  assert.equal(network.mock.callCount(), 0)
})

test('all retained page fields match the snapshot; retired About only aliases Collaboration copy', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const pages = await indexer.fetchAllPages()
  assert.equal(pages.length, 15, 'the retired About page must not return to the page inventory')
  assert.equal(pages.some(p => p.pageId === 'about'), false)
  for (const original of snapshot.indexer.orgPlresearchPage.nodes.filter(p => p.pageId !== 'about')) {
    const current = await indexer.fetchPage(original.pageId)
    const retained = { ...current, sections: current.sections.filter(s => original.sections.some(old => old.sectionId === s.sectionId)) }
    assert.deepEqual(retained, { ...original, rkey: original.uri.split('/').at(-1) })
  }
  const oldAbout = snapshot.indexer.orgPlresearchPage.nodes.find(p => p.pageId === 'about')
  const alias = await indexer.fetchPage('about')
  assert.deepEqual(alias.sections, [oldAbout.sections.find(s => s.sectionId === 'collaborations')])
  assert.equal(indexer.getSection(alias, 'hero'), null)
  assert.deepEqual(indexer.getSection(alias, 'collaborations'), indexer.getSection(await indexer.fetchPage('collaborate'), 'collaborations'))
  alias.sections[0].body = 'attempted caller mutation'
  assert.notEqual(indexer.getSection(await indexer.fetchPage('about'), 'collaborations').body, 'attempted caller mutation')
  pages[0].sections = []
  assert.notEqual((await indexer.fetchPage(pages[0].pageId)).sections.length, 0)
  assert.equal(network.mock.callCount(), 0)
})
