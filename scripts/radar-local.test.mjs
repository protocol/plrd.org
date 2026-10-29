import assert from 'node:assert/strict'
import { test } from 'node:test'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

// Keep every request inside the test, including the unrelated editable-page CMS.
// A configured, healthy Curator must not be able to replace the local Radar.
const indexerUrl = 'https://indexer.example.test/graphql'
process.env.TZ = 'UTC'
// Match next.config.ts; Next normally injects this into the client bundle.
process.env.__NEXT_MANUAL_TRAILING_SLASH = 'true'
process.env.INDEXER_URL = indexerUrl
process.env.NEXT_PUBLIC_RADAR_CURATOR_URL = 'https://curator.example.test'
const { default: InsightsPage } = source('app/insights/page.tsx')
const { default: PLRadar } = source('components/PLRadar.tsx')
const { default: InsightsExplorer } = source('components/InsightsExplorer.tsx')
const { publications, talks, listedBlogPosts, areas } = source('lib/content.ts')
const { FIELD_SIGNALS, CURRENT_RADAR_FEATURES } = source('lib/radar-signals.ts')

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

test('the October 2026 Radar selects all four curated features exactly once after two recent local cards', async (t) => {
  const { radar } = await renderInsights(t)
  const newestFirst = (a, b) => (b.date || '').localeCompare(a.date || '')
  const content = [
    ...talks.map((item) => ({ ...item, key: `talk-${item.slug}` })),
    ...publications.map((item) => ({ ...item, key: `pub-${item.slug}` })),
    ...listedBlogPosts.map((item) => ({ ...item, key: `blog-${item.slug}` })),
  ].sort(newestFirst)
  const featureKeys = [
    'signal-amodei-brain-computer-interfaces',
    'signal-neuralink-speaking-with-the-mind',
    'signal-phase-lock',
    'signal-neurotech-search-interest',
  ]
  assert.deepEqual(radar.items.map((item) => item.key), [
    ...content.slice(0, 2).map((item) => item.key), ...featureKeys,
  ])
  assert.equal(radar.items.length, 6)
  assert.equal(new Set(radar.items.map((item) => item.key)).size, 6)
  assert.equal(radar.edition, 'October 2026 Radar')
  for (const key of featureKeys) {
    const [item] = radar.items.filter((item) => item.key === key)
    assert.equal(item.type, 'Signal')
    assert.equal(item.external, true)
    assert.equal(item.areaSlug, 'neurotech')
    assert.equal(item.date, 'Added Oct 29, 2026', 'curation is not a publication date')
  }
  assert.deepEqual(FIELD_SIGNALS.map((item) => item.key), [
    'signal-chatrie-scotus', 'signal-robinson-moores-law-neurotech',
  ], 'older field signals stay in repository data')
})

test('curated source links, attribution, images and CTAs survive the actual page mapping', async (t) => {
  const { radar, tree } = await renderInsights(t)
  const features = radar.items.filter((item) => item.type === 'Signal')
  assert.deepEqual(features.map(({ href, areaLabel, image, ctaLabel }) => ({ href, areaLabel, image, ctaLabel })), [
    {
      href: 'https://www.youtube.com/watch?v=1OdoSzfUkec',
      areaLabel: 'Field signal · The Builders / Walter Isaacson',
      image: 'https://i.ytimg.com/vi/1OdoSzfUkec/maxresdefault.jpg',
      ctaLabel: 'Watch the conversation',
    },
    {
      href: 'https://www.youtube.com/watch?v=_j806JHhCRo',
      areaLabel: 'Field signal · Neuralink',
      image: 'https://i.ytimg.com/vi/_j806JHhCRo/maxresdefault.jpg',
      ctaLabel: 'Watch the video',
    },
    {
      href: 'https://phaselock.satpugnet.com/',
      areaLabel: 'Field signal · Saturnin Pugnet',
      image: '/images/radar/phase-lock.webp',
      ctaLabel: 'Read the manifesto',
    },
    {
      href: 'https://trends.google.com/trends/explore?date=2023-10-15%202026-10-15&q=neurotechnology,brain-computer%20interface',
      areaLabel: 'Field signal · Google Trends',
      image: '/images/radar/neurotech-search-interest-20261015.webp',
      ctaLabel: 'Explore the comparison',
    },
  ])
  assert.match(features[0].description, /not interested in doing it themselves/)
  assert.match(features[1].description, /ALS.*investigational VOICE trial/)
  assert.match(features[1].description, /not FDA approved/)
  assert.match(features[1].description, /not representative of outcomes/)
  assert.match(features[1].title, /10M\+ views/) // Source snapshot: 10,788,135 on Oct. 29.
  assert.equal(features[3].plainImage, true, 'chart labels must not be covered by a scrim or attribution')
  assert.match(features[2].description, /Saturnin Pugnet’s manifesto argues/)
  assert.match(features[3].description, /Oct 15, 2023 to Oct 15, 2026/)
  assert.match(features[3].description, /Worldwide Google Trends.*before falling back/ )
  assert.match(features[3].description, /relative index 0–100/)
  assert.match(features[3].description, /not a measure of technical progress or absolute search volume/)
  assert.ok(CURRENT_RADAR_FEATURES.every((item) => !item.date), 'no invented publication dates')

  const sections = elementsOfType(tree, InsightsExplorer)[0].props.sections
  for (const [key, sourceItems] of [['blog', listedBlogPosts], ['publications', publications], ['talks', talks]]) {
    assert.deepEqual(sections.find((section) => section.key === key).items.map((item) => item.key), sourceItems.map((item) => item.slug), 'the full Insights catalog is unchanged')
  }
})

function localContent(t, { talkItems = [], publicationItems = [], posts = [], signals = [], features = [] } = {}) {
  // Replace in-memory inputs only; use the actual page's selection and mapping.
  for (const [target, fixture] of [
    [talks, talkItems], [publications, publicationItems],
    [listedBlogPosts, posts], [FIELD_SIGNALS, signals], [CURRENT_RADAR_FEATURES, features],
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

async function mountRadar(t, props, { raf = () => 1, cancelRaf = () => {} } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><main id="app"></main></body></html>', { url: 'http://localhost/insights/' })
  const globals = {
    window: dom.window, self: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: raf, cancelAnimationFrame: cancelRaf,
  }
  const descriptors = Object.fromEntries(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('app'))
  t.after(async () => {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  await act(() => root.render(React.createElement(PLRadar, props)))
  return dom.window.document
}

const nextCard = async (document) => {
  const buttons = document.querySelectorAll('button[aria-label="Next"]')
  await act(() => buttons[buttons.length - 1].click())
}

test('each source card renders its specific CTA, complete copy and optional image', async (t) => {
  const { radar } = await renderInsights(t)
  const document = await mountRadar(t, radar)
  for (const item of radar.items) {
    const link = document.querySelector(`a[href="${item.href}"]`)
    assert.ok(link, JSON.stringify({ expected: item.href, actual: [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")) }))
    assert.equal(link.closest('[aria-hidden]').getAttribute('aria-hidden'), 'false')
    if (item.ctaLabel) assert.equal(link.textContent, `${item.ctaLabel} →`)
    assert.equal(link.getAttribute('target'), item.external ? '_blank' : null)
    if (item.external) assert.equal(link.getAttribute('rel'), 'noopener noreferrer')
    const slide = link.closest('[aria-hidden]')
    if (item.description) assert.equal(slide.querySelector('p').textContent, item.description)
    if (item.image) assert.equal(slide.querySelector('img').getAttribute('src'), item.image)
    await nextCard(document)
  }
  assert.match(document.querySelector('[aria-hidden="false"]').textContent, /all caught up/)
})

test('Radar cards share an auto-height grid and never clamp source qualifiers', async (t) => {
  const { radar } = await renderInsights(t)
  const document = await mountRadar(t, radar)
  const slides = [...document.querySelectorAll('div[aria-hidden]')]
  assert.equal(slides.length, radar.items.length + 1)
  for (const slide of slides) {
    assert.ok(!slide.classList.contains('absolute'), 'cards must contribute their full height, not overflow a 300px absolute box')
    assert.ok(slide.classList.contains('col-start-1') && slide.classList.contains('row-start-1'), 'cards overlap in a single auto-sized grid cell')
    assert.ok(slide.parentElement.classList.contains('grid'))
  }
  for (const item of radar.items.filter((item) => item.type === 'Signal')) {
    const paragraph = document.querySelector(`a[href="${item.href}"]`).closest('[aria-hidden]').querySelector('p')
    assert.doesNotMatch(paragraph.className, /line-clamp|truncate|max-h|overflow-hidden/)
    assert.equal(paragraph.textContent, item.description)
  }
})

test('inactive cards and the end slide are inert and excluded from tab order', async (t) => {
  const { radar } = await renderInsights(t)
  const document = await mountRadar(t, radar)
  for (let index = 0; index <= radar.items.length; index++) {
    const slides = [...document.querySelectorAll('div[aria-hidden]')]
    for (const [slideIndex, slide] of slides.entries()) {
      const active = slideIndex === index
      assert.equal(slide.getAttribute('aria-hidden'), String(!active))
      assert.equal(slide.hasAttribute('inert'), !active)
      for (const link of slide.querySelectorAll('a, button')) assert.equal(link.tabIndex, active ? 0 : -1)
    }
    if (index < radar.items.length) await nextCard(document)
  }
})

test('optional source-chart images retain descriptive alt text and explicit internal-link semantics', async (t) => {
  localContent(t, { features: [{
    key: 'chart-fixture', title: 'Search attention', description: 'Relative search attention, not progress.',
    href: '/insights/', external: false, source: 'Google Trends', areaSlug: 'neurotech',
    addedDate: '2026-10-29', image: '/images/chart-fixture.png',
    imageAlt: 'Weekly search interest for neurotechnology and brain-computer interface, index 0–100.',
    ctaLabel: 'Explore the comparison',
  }] })
  const { radar } = await renderInsights(t)
  const document = await mountRadar(t, radar)
  const image = document.querySelector('img')
  assert.equal(image.getAttribute('src'), '/images/chart-fixture.png')
  assert.equal(image.getAttribute('alt'), CURRENT_RADAR_FEATURES[0].imageAlt)
  const link = document.querySelector('a')
  assert.equal(link.getAttribute('href'), '/insights/')
  assert.equal(link.getAttribute('target'), null)
  assert.equal(link.textContent, 'Explore the comparison →')
})

test('keyboard focus pauses auto-advance and arrow navigation never strands focus in a hidden card', async (t) => {
  const { radar } = await renderInsights(t)
  const frames = new Map()
  let nextId = 0
  const document = await mountRadar(t, radar, {
    raf: (callback) => { frames.set(++nextId, callback); return nextId },
    cancelRaf: (id) => frames.delete(id),
  })
  assert.equal(frames.size, 1, 'auto-advance is initially scheduled')
  const link = document.querySelector('[aria-hidden="false"] a')
  await act(() => link.focus())
  assert.equal(frames.size, 0, 'no timer may hide a keyboard-focused CTA')
  await act(() => link.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
  assert.equal(document.querySelector('[aria-hidden="false"] h3').textContent, radar.items[1].title)
  assert.ok(!document.activeElement.closest('[inert], [aria-hidden="true"]'))
  assert.equal(document.activeElement, document.querySelector('section[aria-label="PL R&D Radar"]'))
  await act(() => document.activeElement.blur())
  assert.equal(frames.size, 1, 'advance resumes when keyboard focus leaves the Radar')
})

test('an empty local pool hides Radar without removing the Insights explorer', async (t) => {
  localContent(t)
  const { radar, tree, requests } = await renderInsights(t)
  assert.equal(radar, undefined)
  assert.equal(elementsOfType(tree, InsightsExplorer).length, 1)
  assert.deepEqual(requests.map(({ url }) => url), [indexerUrl])
})
