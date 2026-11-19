import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const read = file => JSON.parse(readFileSync(`src/data/site-content/${file}.json`, 'utf8'))
const pages = read('pages')
const opportunities = read('opportunities')
const editEvents = read('edit-events')
const publication = read('publication')
const indexer = source('lib/indexer.ts')

test('publication discovery and legacy blog/audit reads use current local records only', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  assert.equal(indexer.REPO_PUBLICATION_URI, publication.uri)
  for (const target of new Set(editEvents.map(event => event.target))) {
    const expected = editEvents.filter(event => event.target === target).sort((a, b) => b.editedAt.localeCompare(a.editedAt))
    const current = await indexer.fetchEditEvents(target)
    assert.deepEqual(current, expected)
    current[0].changedFields?.push('caller mutation')
    current[0].note = 'caller mutation'
    assert.deepEqual(await indexer.fetchEditEvents(target), expected)
  }
  assert.deepEqual(await indexer.fetchEditEvents('at://unknown/record'), [])
  const posts = await indexer.fetchAtproPosts()
  assert.deepEqual(posts, [], 'no archival duplicate cards or new public entries')
  posts.push({ rkey: 'caller mutation' })
  assert.deepEqual(await indexer.fetchAtproPosts(), [])
  assert.equal(network.mock.callCount(), 0)
  assert.doesNotMatch(readFileSync('src/lib/indexer.ts', 'utf8'), /\bfetch\s*\(|process\.env|https:\/\//, 'runtime adapter has no remote CMS path or environment fallback')
})

test('opportunity reads equal current JSON in source order and return isolated nested clones', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  for (const area of new Set(opportunities.map(o => o.areaSlug))) {
    const expected = opportunities.filter(o => o.areaSlug === area)
    const current = await indexer.fetchOpportunitySpaces(area)
    assert.deepEqual(current, expected)
    for (const item of expected) {
      const single = await indexer.fetchOpportunitySpace(item.rkey)
      assert.deepEqual(single, item)
      single.description = 'caller mutation'
      single.subfields.push('caller mutation')
      if (single.fieldSignals?.length) single.fieldSignals[0].measurement = 'caller mutation'
      assert.deepEqual(await indexer.fetchOpportunitySpace(item.rkey), item)
    }
    current[0].subfields.push('caller mutation')
    assert.deepEqual(await indexer.fetchOpportunitySpaces(area), expected)
  }
  assert.equal(await indexer.fetchOpportunitySpace('does-not-exist'), null)
  assert.deepEqual(await indexer.fetchOpportunitySpaces('does-not-exist'), [])
  assert.equal(network.mock.callCount(), 0)
})

test('every page read equals current JSON; retired About only aliases current Collaboration copy', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const current = await indexer.fetchAllPages()
  assert.deepEqual(current, pages)
  assert.equal(current.some(page => page.pageId === 'about'), false)
  for (const page of pages) {
    const single = await indexer.fetchPage(page.pageId)
    assert.deepEqual(single, page)
    if (single.sections.length) single.sections[0].body = 'caller mutation'
    single.sections.push({ sectionId: 'caller-mutation' })
    assert.deepEqual(await indexer.fetchPage(page.pageId), page)
  }
  assert.equal(await indexer.fetchPage('does-not-exist'), null)
  const collaboration = pages.find(page => page.pageId === 'collaborate')
  const alias = await indexer.fetchPage('about')
  assert.deepEqual(alias, {
    pageId: 'about', rkey: 'about', updatedAt: collaboration.updatedAt,
    sections: collaboration.sections.filter(section => section.sectionId === 'collaborations'),
  })
  assert.equal(indexer.getSection(alias, 'hero'), null)
  alias.sections[0].body = 'caller mutation'
  assert.deepEqual((await indexer.fetchPage('about')).sections, collaboration.sections.filter(section => section.sectionId === 'collaborations'))
  current[0].sections = []
  assert.deepEqual(await indexer.fetchAllPages(), pages)
  assert.equal(network.mock.callCount(), 0)
})

test('section helpers retain order, null/missing semantics, and optional fields without inventing values', () => {
  const page = { sections: [
    { sectionId: 'hero', title: null, subtitle: '' },
    { sectionId: 'approach-b', body: 'Second' },
    { sectionId: 'approach-a' },
  ] }
  assert.equal(indexer.getSection(null, 'hero'), null)
  assert.equal(indexer.getSection(page, 'missing'), null)
  assert.deepEqual(indexer.getSectionsWithPrefix(null, 'approach-'), [])
  assert.deepEqual(indexer.getSectionsWithPrefix(page, 'missing'), [])
  assert.deepEqual(indexer.getSectionsWithPrefix(page, 'approach-'), page.sections.slice(1))
  assert.deepEqual(indexer.getSection(page, 'hero'), page.sections[0])
  assert.equal(indexer.getSection(page, 'approach-a').body, undefined)
})
