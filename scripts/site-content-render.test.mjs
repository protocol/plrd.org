import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const read = file => JSON.parse(readFileSync(`src/data/site-content/${file}.json`, 'utf8'))
const adapter = source('lib/indexer.ts')
const pages = read('pages')
const opportunities = read('opportunities')
const clone = record => record ? structuredClone(record) : null
const pageFromJson = key => {
  if (key !== 'about') return clone(pages.find(page => page.pageId === key))
  const collaboration = pages.find(page => page.pageId === 'collaborate')
  return clone({ pageId: 'about', rkey: 'about', updatedAt: collaboration.updatedAt,
    sections: collaboration.sections.filter(section => section.sectionId === 'collaborations') })
}

// Compare actual server-renderer trees/props before child components execute.
// This includes MarkdownContent bodies, links, headings, cards, and metadata.
function renderValue(value) {
  if (value === undefined) return null
  if (typeof value === 'function') return `[function:${value.name}]`
  if (typeof value === 'symbol') return value.toString()
  if (Array.isArray(value)) return value.map(renderValue)
  if (value && typeof value === 'object') {
    if (value.$$typeof) return { type: renderValue(value.type), key: value.key, props: renderValue(value.props) }
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, renderValue(child)]))
  }
  return value
}

const routes = [
  ['', {}], ['areas/', {}], ['insights/', { searchParams: Promise.resolve({}) }],
  ['team/', {}], ['blog/', {}], ['publications/', {}], ['talks/', {}], ['tutorials/', {}],
  ['outreach/collaboration/', {}], ['areas/economies-governance/', {}],
  ['areas/economies-governance/subareas/', {}], ['areas/economies-governance/impact/', {}],
  ...opportunities.filter(o => o.areaSlug === 'economies-governance').map(o => ['areas/economies-governance/[slug]/', { params: Promise.resolve({ slug: o.id }) }]),
]

test('active content routes render current JSON exactly, including links, props, and detail metadata', async t => {
  // Synthetic metric fixtures only: the public read-only provider implementations are not changed.
  const series = { days: [], values: [] }
  t.mock.method(source('lib/simocracy.ts'), 'fetchSimocracyStats', async () => ({ totals: { totalSims: 0, totalGatherings: 0 }, trends: { totalSims: series, totalGatherings: series } }))
  t.mock.method(source('lib/gainforest.ts'), 'fetchGainforestStats', async () => ({ observations: 0, bumicerts: 0, certifiedOrgs: 0, trends: { observations: series, bumicerts: series, certifiedOrgs: series } }))
  t.mock.method(source('lib/glow.ts'), 'fetchGlowStats', async () => ({ powerOutput: 0, activeFarms: 0, trends: { powerOutput: series, activeFarms: series } }))
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Render parity test must be offline') })
  assert.ok(routes.length >= 12)
  for (const [path, props] of routes) {
    await t.test(`/${path}${props.params ? (await props.params).slug : ''}`, async () => {
      const module = source(`app/${path}page.tsx`)
      const current = renderValue(await module.default(props))
      const currentMetadata = module.generateMetadata ? renderValue(await module.generateMetadata(props)) : null
      const mocks = [
        t.mock.method(adapter, 'fetchPage', async rkey => pageFromJson(rkey)),
        t.mock.method(adapter, 'fetchOpportunitySpaces', async area => clone(opportunities.filter(o => o.areaSlug === area))),
        t.mock.method(adapter, 'fetchOpportunitySpace', async rkey => clone(opportunities.find(o => o.rkey === rkey))),
        t.mock.method(adapter, 'fetchAtproPosts', async () => []), // Current repository blog entries own listing and visibility.
      ]
      try {
        const original = renderValue(await module.default(props))
        assert.deepEqual(current, original, `Rendered content/URLs changed: /${path}`)
        if (module.generateMetadata) assert.deepEqual(currentMetadata, renderValue(await module.generateMetadata(props)))
      } finally { mocks.forEach(mock => mock.mock.restore()) }
    })
  }
  assert.equal(network.mock.callCount(), 0)
})

function nodes(value, found = []) {
  if (Array.isArray(value)) value.forEach(child => nodes(child, found))
  else if (value && typeof value === 'object' && value.props) {
    found.push(value)
    nodes(value.props.children, found)
  }
  return found
}

test('missing, null, and empty authoring fields preserve actual renderer fallbacks without remote reads', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const blog = source('app/blog/page.tsx')
  const mock = t.mock.method(adapter, 'fetchPage', async () => null)
  const fallback = renderValue(await blog.default())
  assert.ok(JSON.stringify(fallback).includes('Updates, insights, and reflections from the PL R&D team.'))
  for (const sections of [[], [{ sectionId: 'hero' }], [{ sectionId: 'hero', title: null, subtitle: null }], [{ sectionId: 'hero', title: '', subtitle: '' }]]) {
    mock.mock.mockImplementation(async () => ({ pageId: 'blog', sections }))
    assert.deepEqual(renderValue(await blog.default()), fallback)
  }
  mock.mock.mockImplementation(async () => ({ pageId: 'blog', sections: [{ sectionId: 'hero', title: 'Edited heading', subtitle: 'Edited subtitle' }] }))
  const edited = JSON.stringify(renderValue(await blog.default()))
  assert.ok(edited.includes('Edited heading') && edited.includes('Edited subtitle'))
  assert.equal(network.mock.callCount(), 0)
})

test('current blog bodies render directly and listing cards follow current visibility without duplicates', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const { blogPosts } = source('lib/content.ts')
  const listed = blogPosts.filter(post => !post.unlisted)
  const blogTree = await source('app/blog/page.tsx').default()
  const cards = nodes(blogTree).find(node => node.type?.name === 'AreaFilteredListing').props.tiles
  assert.equal(new Set(cards.map(card => card.href)).size, cards.length, 'duplicate blog listing card')
  assert.deepEqual(cards.map(card => card.key), listed.map(post => post.slug), 'unlisted leakage or missing listing card')
  const insights = await source('app/insights/page.tsx').default({ searchParams: Promise.resolve({}) })
  const explorer = nodes(insights).find(node => node.type?.name === 'InsightsExplorer')
  const blogItems = explorer.props.sections.find(section => section.key === 'blog')?.items || []
  assert.deepEqual(blogItems.map(item => item.key), listed.map(post => post.slug), 'Insights blog visibility')
  assert.equal(new Set(blogItems.map(item => item.href)).size, blogItems.length, 'duplicate Insights blog card')
  const article = source('app/blog/[slug]/page.tsx')
  for (const post of blogPosts) {
    const tree = await article.default({ params: Promise.resolve({ slug: post.slug }) })
    const html = nodes(tree).filter(node => node.props.dangerouslySetInnerHTML).map(node => node.props.dangerouslySetInnerHTML.__html)
    const expected = post.html ? post.html.split('<div id="fa2-live-dashboard"></div>') : []
    assert.deepEqual(html, expected, `${post.slug} current body must render, not its historical capture`)
  }
  assert.equal(network.mock.callCount(), 0)
})
