import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

// Keep every request inside the test, including the unrelated editable-page CMS.
// A configured, healthy Curator must not be able to replace the local Radar.
const indexerUrl = 'https://indexer.example.test/graphql'
process.env.TZ = 'UTC'
process.env.INDEXER_URL = indexerUrl
process.env.NEXT_PUBLIC_RADAR_CURATOR_URL = 'https://curator.example.test'
const { default: InsightsPage } = source('app/insights/page.tsx')
const { default: PLRadar } = source('components/PLRadar.tsx')
const { default: InsightsExplorer } = source('components/InsightsExplorer.tsx')
const { publications, talks, listedBlogPosts, areas } = source('lib/content.ts')
const { FIELD_SIGNALS } = source('lib/radar-signals.ts')

function elementsOfType(node, type) {
  if (Array.isArray(node)) return node.flatMap((child) => elementsOfType(child, type))
  if (!node || typeof node !== 'object') return []
  return [
    ...(node.type === type ? [node] : []),
    ...elementsOfType(node.props?.children, type),
  ]
}

async function renderInsights(t) {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url: String(url), options })
    if (String(url) === indexerUrl) {
      return Response.json({ data: { orgPlresearchPage: { edges: [] } } })
    }
    // This would have overridden the local cut before ingestion was removed.
    return Response.json({ label: 'Remote edition', items: [{
      key: 'remote-only', title: 'Remote-only story', href: 'https://remote.example.test/',
      type: 'Signal', date: 'Sep 14, 2026', areaLabel: 'Remote', areaSlug: 'neurotech',
    }] })
  })
  const tree = await InsightsPage({ searchParams: Promise.resolve({ area: 'neurotech' }) })
  return { tree, requests, radar: elementsOfType(tree, PLRadar)[0]?.props }
}

test('Insights never fetches external Radar even with a healthy configured Curator', async (t) => {
  const { requests, radar, tree } = await renderInsights(t)
  assert.deepEqual(requests.map(({ url }) => url), [indexerUrl], 'only the existing page CMS may be fetched')
  assert.equal(requests[0].options.method, 'POST')
  assert.match(requests[0].options.body, /insights/)
  assert.ok(radar, 'the local Radar remains on Insights')
  assert.equal(radar.items.length, 6)
  assert.ok(radar.items.every((item) => item.key !== 'remote-only'))
  assert.equal(elementsOfType(tree, InsightsExplorer)[0].props.initialArea, 'neurotech')
})

test('the current Radar selects the newest listed local content and one hand-picked field signal', async (t) => {
  const { radar } = await renderInsights(t)
  const newestFirst = (a, b) => (b.date || '').localeCompare(a.date || '')
  const content = [
    ...talks.map((item) => ({ ...item, key: `talk-${item.slug}` })),
    ...publications.map((item) => ({ ...item, key: `pub-${item.slug}` })),
    ...listedBlogPosts.map((item) => ({ ...item, key: `blog-${item.slug}` })),
  ].sort(newestFirst)
  const signals = [...FIELD_SIGNALS].sort(newestFirst).slice(0, 1)
  const selected = [...content.slice(0, 6 - signals.length), ...signals]
  assert.deepEqual(radar.items.map((item) => item.key), selected.map((item) => item.key))
  const newest = [...selected].sort(newestFirst)[0]
  assert.equal(radar.edition, `${new Date(newest.date).toLocaleDateString('en-US', { month: 'long' })} Radar`)
  assert.equal(radar.items.at(-1).type, 'Signal')
  assert.equal(radar.items.at(-1).href, signals[0].href)
  assert.equal(radar.items.at(-1).external, true)
})

function localContent(t, { talkItems = [], publicationItems = [], posts = [], signals = [] } = {}) {
  // Replace in-memory inputs only; use the actual page's selection and mapping.
  for (const [target, fixture] of [
    [talks, talkItems], [publications, publicationItems],
    [listedBlogPosts, posts], [FIELD_SIGNALS, signals],
  ]) {
    const original = [...target]
    target.splice(0, target.length, ...fixture)
    t.after(() => target.splice(0, target.length, ...original))
  }
}

test('local recency selection preserves card metadata, six slots, and PL-first ordering', async (t) => {
  localContent(t, {
    talkItems: [
      { slug: 'old-talk', title: 'Old talk', date: '2026-01-01', areas: [] },
      { slug: 'podcast', title: 'Podcast', date: '2026-08-29', areas: [], venue: 'Podcast', venue_location: '', abstract: 'Audio' },
      { slug: 'talk', title: 'Talk', date: '2026-09-09', areas: ['neurotech'], venue: 'Conference', venue_location: '', abstract: 'Video', html: '{{< youtube test-video >}}' },
    ],
    publicationItems: [{ slug: 'paper', title: 'Paper', date: '2026-09-08', areas: ['neurotech'], venue: 'Journal' }],
    posts: [
      { slug: 'undated', title: 'Undated', date: '', areas: [] },
      { slug: 'external-post', title: 'External post', date: '2026-09-07', areas: [], external_url: 'https://protocol.ai/example/', summary: 'External summary' },
      { slug: 'post', title: 'Post', date: '2026-09-10', areas: ['neurotech'], summary: 'Post summary', coverImage: '/images/example.webp' },
    ],
    signals: [
      { key: 'old-signal', title: 'Old signal', date: '2026-01-01' },
      { key: 'new-signal', title: 'New signal', date: '2026-10-01', href: 'https://signal.example.test/', source: 'Primary source', areaSlug: 'neurotech', description: 'Signal summary' },
    ],
  })
  const { radar } = await renderInsights(t)
  assert.equal(radar.edition, 'October Radar', 'edition follows the newest selected item, even when the field signal displays last')
  assert.deepEqual(radar.items.map((item) => item.key), [
    'blog-post', 'talk-talk', 'pub-paper', 'blog-external-post', 'talk-podcast', 'new-signal',
  ])
  assert.deepEqual(radar.items.map((item) => item.type), ['Blog', 'Talk', 'Publication', 'Blog', 'Podcast', 'Signal'])
  assert.deepEqual(radar.items.map((item) => item.href), [
    '/blog/post/', '/talks/talk/', '/publications/paper/', 'https://protocol.ai/example/', '/talks/podcast/', 'https://signal.example.test/',
  ])
  assert.deepEqual(radar.items.map((item) => item.external), [false, false, false, true, false, true])
  assert.deepEqual(radar.items.map((item) => item.date), [
    'Sep 10, 2026', 'Sep 9, 2026', 'Sep 8, 2026', 'Sep 7, 2026', 'Aug 29, 2026', 'Oct 1, 2026',
  ])
  assert.deepEqual(radar.items.map((item) => item.image), [
    '/images/example.webp', 'https://i.ytimg.com/vi/test-video/maxresdefault.jpg', undefined, undefined, '/images/podcast.webp', undefined,
  ])
  assert.equal(radar.items[0].description, 'Post summary')
  assert.equal(radar.items[1].areaLabel, `${areas.find((area) => area.slug === 'neurotech').title} · Conference`)
  assert.equal(radar.items[3].areaLabel, 'PL R&D')
  assert.equal(radar.items.at(-1).areaLabel, 'Field signal · Primary source')
  assert.equal(radar.items.at(-1).description, 'Signal summary')
  assert.ok(radar.items.every((item) => !('_sort' in item)))
})

test('without field signals all six Radar slots remain available for local content', async (t) => {
  localContent(t, { posts: Array.from({ length: 7 }, (_, index) => ({
    slug: `post-${index}`, title: `Post ${index}`, date: `2026-09-0${index + 1}`, areas: [],
  })) })
  const { radar } = await renderInsights(t)
  assert.equal(radar.edition, 'September Radar')
  assert.deepEqual(radar.items.map((item) => item.key), [
    'blog-post-6', 'blog-post-5', 'blog-post-4', 'blog-post-3', 'blog-post-2', 'blog-post-1',
  ])
})

test('an empty local pool hides Radar without removing the Insights explorer', async (t) => {
  localContent(t)
  const { radar, tree, requests } = await renderInsights(t)
  assert.equal(radar, undefined)
  assert.equal(elementsOfType(tree, InsightsExplorer).length, 1)
  assert.deepEqual(requests.map(({ url }) => url), [indexerUrl])
})
