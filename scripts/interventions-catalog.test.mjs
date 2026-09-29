import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'
import React, { act } from 'react'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
// Match next.config.ts when exercising Next Link outside the Next compiler.
process.env.__NEXT_TRAILING_SLASH = 'true'
const { AppRouterContext } = require('next/dist/shared/lib/app-router-context.shared-runtime.js')
const router = { back() {}, push() {} }
const withRouter = (node) => React.createElement(AppRouterContext.Provider, { value: router }, node)
const markupDocument = (node) => new JSDOM(renderToStaticMarkup(withRouter(node))).window.document
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const {
  INTERVENTION_PROGRAMS,
  publishedInterventions,
  interventionsForArea,
  interventionBySlug,
  INTERVENTION_AREA_ORDER,
} = source('lib/interventions.ts')
const FocusAreaInterventions = source('components/FocusAreaInterventions.tsx').default
const AreaHeroActions = source('components/AreaHeroActions.tsx').default
const { default: sitemap } = source('app/sitemap.ts')
const { default: InterventionsPage } = source('app/interventions-preview-872d1767c376/page.tsx')
const { generateStaticParams } = source('app/interventions-preview-872d1767c376/[slug]/page.tsx')
const { GET } = source('app/interventions-preview-872d1767c376/data/route.ts')
const { mainNav, footerNav } = source('lib/site-config.ts')

test('public statuses explicitly map legacy stages without inventing fundraising', () => {
  const catalog = source('lib/interventions.ts')
  assert.equal(typeof catalog.interventionStatus, 'function')
  const expected = { proposed: 'developing', active: 'live', raising: 'raising', completed: 'completed', published: 'published' }
  assert.deepEqual(catalog.INTERVENTION_STATUS_ORDER, ['live', 'published', 'raising', 'developing', 'completed'])
  for (const [stage, status] of Object.entries(expected)) {
    assert.ok(catalog.INTERVENTION_STAGE_LABEL[stage], `legacy stage label missing for ${stage}`)
    assert.equal(catalog.interventionStatus({ stage }), status)
    assert.equal(catalog.INTERVENTION_STATUS_LABEL[status], status[0].toUpperCase() + status.slice(1))
    assert.ok(catalog.INTERVENTION_STATUS_DESCRIPTION[status].length > 20)
  }
  for (const item of INTERVENTION_PROGRAMS.filter((item) => item.stage === 'proposed')) {
    assert.equal(catalog.interventionStatus(item), 'developing', item.slug)
  }
})

test('status tags describe every lifecycle across cards, catalog and modal', () => {
  const catalog = source('lib/interventions.ts')
  const Card = source('components/InterventionCard.tsx').default
  const Map = source('components/PortfolioMap.tsx').default
  const Modal = source('components/InterventionModal.tsx').default
  for (const stage of ['active', 'raising', 'proposed', 'completed', 'published']) {
    const item = { ...interventionBySlug('sovereign-ai'), stage }
    const status = catalog.interventionStatus(item)
    for (const node of [React.createElement(Card, { item }), React.createElement(Map, { items: [item] }), React.createElement(Modal, { item })]) {
      const badge = markupDocument(node).querySelector(`[data-intervention-status="${status}"]`)
      assert.ok(badge, `${stage} must have an explicit status tag`)
      assert.equal(badge.textContent, catalog.INTERVENTION_STATUS_LABEL[status])
      assert.equal(badge.title, catalog.INTERVENTION_STATUS_DESCRIPTION[status])
    }
  }
  const Featured = source('components/FeaturedInterventions.tsx').default
  const doc = markupDocument(React.createElement(Featured))
  assert.equal(doc.querySelector('h2').textContent.trim(), 'Spotlight: programmatic interventions')
  for (const item of catalog.featuredInterventions()) {
    const link = doc.querySelector(`a[href="/interventions-preview-872d1767c376/${item.slug}/"]`)
    assert.equal(link.querySelector('[data-intervention-status]').textContent, catalog.INTERVENTION_STATUS_LABEL[catalog.interventionStatus(item)])
  }
})

test('FA0 has complete metadata and a working catalogue anchor rather than a missing area page', () => {
  const catalog = source('lib/interventions.ts')
  const area = 'rnd-acceleration'
  assert.equal(catalog.INTERVENTION_AREA_ORDER[0], area)
  assert.equal(catalog.INTERVENTION_AREA_LABEL[area], 'R&D Acceleration (FA0)')
  assert.equal(catalog.INTERVENTION_AREA_HREF[area], '/interventions-preview-872d1767c376/#explore-all-interventions')
  assert.match(catalog.INTERVENTION_AREA_ACCENT[area], /^#[0-9a-f]{6}$/i)
  const { AreaIcon } = source('components/AreaIcons.tsx')
  const icon = renderToStaticMarkup(React.createElement(AreaIcon, { type: catalog.INTERVENTION_AREA_ICON[area] }))
  assert.doesNotMatch(icon, /undefined/)
  assert.match(icon, /svg|\/images\//)
  const Overview = source('components/PortfolioOverview.tsx').default
  const item = { ...interventionBySlug('sovereign-ai'), area }
  const doc = markupDocument(React.createElement(Overview, { items: [item] }))
  assert.match(doc.querySelector('thead').textContent, /R&D Acceleration \(FA0\)/)
  assert.equal([...doc.querySelectorAll('tbody td')].reduce((sum, cell) => sum + (Number(cell.textContent) || 0), 0), 1)
  const { metadata } = source('app/interventions-preview-872d1767c376/page.tsx')
  for (const description of [metadata.description, metadata.openGraph.description]) {
    assert.match(description, /R&D Acceleration/)
    assert.doesNotMatch(description, /four focus areas/)
  }
})

async function mount(node, run) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://www.plrd.org/interventions-preview-872d1767c376/' })
  const keys = ['window', 'self', 'document', 'HTMLElement', 'Element', 'Node', 'MouseEvent', 'IS_REACT_ACT_ENVIRONMENT']
  const previous = new Map(keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] })
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('app'))
  try {
    await act(() => root.render(withRouter(node)))
    await run(dom.window.document)
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
}
const click = async (node) => { assert.ok(node, 'control must exist'); await act(() => node.click()) }
const button = (doc, label) => [...doc.querySelectorAll('button')].find((node) => node.textContent.trim() === label)

const lifecycleItems = () => ['active', 'raising', 'proposed', 'completed'].map((stage) => ({
  ...interventionBySlug('sovereign-ai'), slug: `test-${stage}`, title: `Test ${stage}`, stage,
}))

test('grouping by status retains every record and separates completed events from live work', async () => {
  const Map = source('components/PortfolioMap.tsx').default
  const items = [...publishedInterventions(), ...lifecycleItems()]
  await mount(React.createElement(Map, { items }), async (doc) => {
    await click(button(doc, 'See more'))
    await click(button(doc, 'Status'))
    assert.equal(button(doc, 'Status').getAttribute('aria-pressed'), 'true')
    const groups = [...doc.querySelectorAll('[data-catalogue-group]')]
    assert.deepEqual(groups.map((group) => group.getAttribute('data-catalogue-group')), ['live', 'published', 'raising', 'developing', 'completed'])
    assert.deepEqual(groups.flatMap((group) => [...group.querySelectorAll('li a')].map((a) => a.getAttribute('href'))).sort(), items.map((item) => `/interventions-preview-872d1767c376/${item.slug}/`).sort())
    assert.equal(groups.at(-1).querySelector('[data-intervention-status]').textContent, 'Completed')
    assert.equal(doc.querySelectorAll('input, select').length, 0)
  })
})

test('compact catalogue is one five-card grid with a sixth expansion tile for every grouping', async () => {
  const Map = source('components/PortfolioMap.tsx').default
  const catalog = source('lib/interventions.ts')
  const items = [...publishedInterventions(), ...lifecycleItems()]
  const groupings = {
    'Intervention type': (item) => catalog.INTERVENTION_TYPES[item.type].title,
    'Focus area': (item) => catalog.INTERVENTION_AREA_LABEL[item.area],
    Status: (item) => catalog.INTERVENTION_STATUS_LABEL[catalog.interventionStatus(item)],
  }
  await mount(React.createElement(Map, { items }), async (doc) => {
    for (const [label, groupLabel] of Object.entries(groupings)) {
      await click(button(doc, label))
      const grids = doc.querySelectorAll('[data-testid="catalogue-grid"]')
      assert.equal(grids.length, 1, 'initial grouping must not create separate rows')
      const grid = grids[0]
      assert.ok(grid.classList.contains('lg:grid-cols-3'))
      assert.equal(grid.children.length, 6)
      const cards = [...grid.querySelectorAll('[data-intervention-slug]')]
      assert.equal(cards.length, 5, 'five overall, not per group')
      for (const card of cards) {
        const item = items.find((item) => item.slug === card.dataset.interventionSlug)
        assert.equal(card.querySelector('[data-group-label]').textContent, groupLabel(item))
      }
      assert.equal(grid.lastElementChild.querySelector('button'), button(doc, 'See more'))
      assert.equal(button(doc, 'See more').getAttribute('aria-expanded'), 'false')
      const compactOrder = cards.map((card) => card.dataset.interventionSlug)
      await click(button(doc, 'See more'))
      const expanded = [...doc.querySelectorAll('[data-intervention-slug]')].map((card) => card.dataset.interventionSlug)
      assert.deepEqual(expanded.slice(0, 5), compactOrder, 'preview follows the chosen grouping order')
      assert.deepEqual(expanded.toSorted(), items.map((item) => item.slug).toSorted())
      assert.ok(doc.querySelector('[data-catalogue-group]'), 'full library uses groups')
      assert.equal(button(doc, 'Show fewer').getAttribute('aria-expanded'), 'true')
      assert.equal(doc.activeElement, button(doc, 'Show fewer'))
      assert.ok(button(doc, 'Show fewer').compareDocumentPosition(doc.querySelector('[data-catalogue-group]')) & 4, 'expanded focus control must precede results rather than jump past the library')
      await click(button(doc, 'Show fewer'))
      assert.equal(button(doc, label).getAttribute('aria-pressed'), 'true')
      assert.equal(doc.querySelectorAll('[data-intervention-slug]').length, 5)
      assert.equal(doc.activeElement, button(doc, 'See more'))
    }
  })
})

test('catalogue controls and tiles share the Insights visual language with visible focus', async () => {
  const Map = source('components/PortfolioMap.tsx').default
  const { FilterPill } = source('components/FilterPill.tsx')
  await mount(React.createElement(Map, { items: publishedInterventions() }), async (doc) => {
    for (const label of ['Intervention type', 'Focus area', 'Status']) {
      await click(button(doc, label))
      for (const pill of doc.querySelectorAll('[aria-label="Group the map"] button')) {
        const active = pill.getAttribute('aria-pressed') === 'true'
        const reference = markupDocument(React.createElement(FilterPill, { label: pill.textContent, active, onClick() {} })).querySelector('button')
        for (const token of reference.classList) assert.ok(pill.classList.contains(token), `missing Insights pill class: ${token}`)
        assert.ok(!pill.classList.contains('uppercase'))
        assert.match(pill.className, /focus-visible:/)
      }
      const controls = doc.querySelector('[aria-label="Group the map"]')
      assert.ok(controls.classList.contains('gap-2'))
      assert.ok(controls.classList.contains('flex-wrap'))
    }
    for (const card of doc.querySelectorAll('[data-intervention-slug]')) {
      for (const token of ['rounded-lg', 'hover:border-blue', 'hover:shadow-sm']) assert.ok(card.classList.contains(token), token)
      assert.match(card.className, /focus-visible:/)
    }
  })
  for (const [file, radius] of [['InterventionCard', 'rounded-lg'], ['FeaturedInterventions', 'rounded-2xl']]) {
    const Component = source(`components/${file}.tsx`).default
    const doc = markupDocument(React.createElement(Component, { item: interventionBySlug('sovereign-ai') }))
    for (const card of doc.querySelectorAll('a')) {
      for (const token of [radius, 'hover:border-blue', 'hover:shadow-sm']) assert.ok(card.classList.contains(token), `${file}: ${token}`)
      assert.match(card.className, /focus-visible:/)
    }
  }
})

test('resource collections are clickable on intercepted modals and direct detail URLs', async () => {
  const Direct = source('app/interventions-preview-872d1767c376/[slug]/page.tsx').default
  const Intercept = source('app/interventions-preview-872d1767c376/@modal/(.)[slug]/page.tsx').default
  const fixture = {
    ...interventionBySlug('sovereign-ai'), slug: 'test-resource-collection', sourceKind: 'public', stage: 'active',
    resourceLabel: 'Episodes', resources: [
      { title: 'Published episode', href: 'https://example.org/episode/', date: '2026-09-01' },
      { title: 'Another episode', href: 'https://example.org/another/' },
    ],
  }
  INTERVENTION_PROGRAMS.push(fixture)
  try {
    for (const Page of [Direct, Intercept]) {
      const doc = markupDocument(await Page({ params: Promise.resolve({ slug: fixture.slug }) }))
      const collection = doc.querySelector('[role="dialog"] section[aria-labelledby="intervention-resources"]')
      assert.ok(collection, 'resource collection must be present on both entry paths')
      assert.equal(collection.querySelector('h2').textContent, 'Episodes')
      assert.deepEqual([...collection.querySelectorAll('a')].map((a) => ({ title: a.textContent, href: a.getAttribute('href') })), fixture.resources.map(({ title, href }) => ({ title, href })))
      assert.equal(collection.querySelector('time').getAttribute('datetime'), '2026-09-01')
    }
    delete fixture.resourceLabel
    assert.equal(markupDocument(await Direct({ params: Promise.resolve({ slug: fixture.slug }) })).querySelector('#intervention-resources').textContent, 'Resources')
    fixture.resources = []
    assert.equal(markupDocument(await Intercept({ params: Promise.resolve({ slug: fixture.slug }) })).querySelector('#intervention-resources'), null)
  } finally { INTERVENTION_PROGRAMS.pop() }
})

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  return node && typeof node === 'object' ? text(node.props?.children) : ''
}

test('prelaunch global navigation omits the unlisted catalogue', () => {
  assert.deepEqual(mainNav.map((item) => item.name), ['About us', 'Focus Areas', 'Insights', 'Team'])
  assert.equal(mainNav[2].url, '/insights/')
  assert.equal(mainNav[2].children, undefined)
  for (const component of ['SiteHeader', 'OffCanvasNav']) {
    const navigation = readFileSync(new URL(`../src/components/${component}.tsx`, import.meta.url), 'utf8')
    assert.match(navigation, /mainNav\.map/)
  }
})

test('Collaborate stays available in desktop and mobile navigation', () => {
  for (const component of ['SiteHeader', 'OffCanvasNav']) {
    const navigation = readFileSync(new URL(`../src/components/${component}.tsx`, import.meta.url), 'utf8')
    assert.match(navigation, /href="\/outreach\/collaboration\/"/)
    assert.match(navigation, /Collaborate/)
  }
})

test('mobile navigation can scroll to Collaborate on short screens', () => {
  const drawer = readFileSync(new URL('../src/components/OffCanvasNav.tsx', import.meta.url), 'utf8')
  assert.match(drawer, /fixed top-0 right-0 bottom-0[^`]*overflow-y-auto/)
})

test('Interventions surfaces the requested journey with one full catalog', () => {
  const Index = source('components/InterventionsIndex.tsx').default
  const doc = new JSDOM(renderToStaticMarkup(React.createElement(Index))).window.document
  const sectionIds = [...doc.querySelectorAll('section[aria-labelledby]')].map((node) => node.getAttribute('aria-labelledby'))
  assert.deepEqual(sectionIds.filter((id) => ['portfolio-map', 'featured-interventions', 'explore-all-interventions', 'intervention-evidence'].includes(id)), [
    'portfolio-map', 'featured-interventions', 'explore-all-interventions', 'intervention-evidence',
  ])
  const catalog = doc.querySelector('section[aria-labelledby="explore-all-interventions"]')
  assert.equal(catalog.querySelector('h2').textContent.trim(), 'Explore all interventions')
  const links = [...catalog.querySelectorAll('li a[href^="/interventions-preview-872d1767c376/"]')]
  assert.equal(links.length, Math.min(5, publishedInterventions().length))
  assert.equal(new Set(links.map((a) => a.getAttribute('href'))).size, links.length)
  const overview = doc.querySelector('section[aria-labelledby="portfolio-map"]')
  assert.equal(overview.querySelectorAll('a[href^="/interventions-preview-872d1767c376/"]').length, 0, 'overview must not repeat the program tiles')
  assert.match(catalog.textContent, /Draft proposals are not approved commitments\./)
  assert.equal(doc.querySelectorAll('input, select').length, 0, 'do not restore filters')
  assert.match(doc.querySelector('#featured-interventions').textContent, /Spotlight: programmatic interventions/)
})

test('portfolio overview counts each primary type once from the supplied records', () => {
  const Overview = source('components/PortfolioOverview.tsx').default
  const { INTERVENTION_TYPES } = source('lib/interventions.ts')
  for (const items of [publishedInterventions(), []]) {
    const doc = new JSDOM(renderToStaticMarkup(React.createElement(Overview, { items }))).window.document
    const rows = [...doc.querySelectorAll('tbody tr')]
    assert.equal(rows.length, Object.keys(INTERVENTION_TYPES).length)
    let total = 0
    rows.forEach((row, index) => {
      const type = Object.keys(INTERVENTION_TYPES)[index]
      const cells = [...row.querySelectorAll('td')]
      assert.equal(cells.length, INTERVENTION_AREA_ORDER.length)
      cells.forEach((cell, column) => {
        const actual = Number(cell.textContent.trim()) || 0
        const expected = items.filter((item) => item.type === type && item.area === INTERVENTION_AREA_ORDER[column]).length
        assert.equal(actual, expected)
        total += actual
      })
    })
    assert.equal(total, items.length)
    const sourceNote = doc.querySelector('#portfolio-source-note')
    assert.ok(sourceNote, 'source note must be independently visible on mobile')
    assert.equal(sourceNote.closest('[role=region]'), null, 'do not clip the source caveat inside horizontal scrolling')
    assert.match(sourceNote.textContent, /counted once by primary intervention type/)
  }
})

test('public catalog publishes unique records without private fields', () => {
  const items = publishedInterventions()
  assert.ok(items.length > 0)
  assert.equal(new Set(items.map((item) => item.slug)).size, items.length)
  for (const area of INTERVENTION_AREA_ORDER) {
    assert.deepEqual(interventionsForArea(area), items.filter((item) => item.area === area))
  }
  const blob = JSON.stringify(items)
  assert.doesNotMatch(blob, /docs\.google|\$[0-9]|budget/i)
  assert.ok(interventionBySlug('sovereign-ai'))
  assert.equal(interventionBySlug('missing'), undefined)
})

test('global catalog is an editorial grid, not a cover flow', async () => {
  const tree = await InterventionsPage({ searchParams: Promise.resolve({}) })
  const nodes = elements(tree)
  assert.ok(nodes.some((node) => node.type?.name === 'InterventionsIndex' || node.type?.displayName === 'InterventionsIndex' || String(node.type).includes('InterventionsIndex')))
  const sourceText = readFileSync(new URL('../src/components/InterventionsIndex.tsx', import.meta.url), 'utf8')
  const mapSource = readFileSync(new URL('../src/components/PortfolioMap.tsx', import.meta.url), 'utf8')
  const methodSource = readFileSync(new URL('../src/components/InterventionMethod.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(sourceText + mapSource, /cover.?flow|gallery|VARIANT/i)
  assert.match(mapSource, /grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3/)
  assert.match(methodSource, /Observe/)
  assert.match(methodSource, /Diagnose/)
  assert.match(methodSource, /Intervene/)
  assert.match(methodSource, /Repeat/)
  assert.match(methodSource, /method-cycle-return/)
  assert.match(methodSource, /The levers/)
  assert.doesNotMatch(methodSource, /method-cycle-forward/)
  assert.doesNotMatch(methodSource, /Field moves|intervention-chain|01 Field/)
  assert.match(sourceText, /InterventionMethod/)
  assert.match(sourceText, /PortfolioMap/)
  assert.doesNotMatch(sourceText, /InterventionsCatalog/)
  assert.match(mapSource, /Explore all interventions/)
  assert.match(mapSource, /publicInterventionHref/)
  assert.doesNotMatch(sourceText, /Find the bottleneck/)
  assert.match(sourceText, /Turning bottlenecks/)
  assert.match(mapSource, /draft-source examples/)
})

test('catalog keeps grouping and drops the filter controls', () => {
  const mapSource = readFileSync(new URL('../src/components/PortfolioMap.tsx', import.meta.url), 'utf8')
  const pageSource = readFileSync(new URL('../src/app/interventions-preview-872d1767c376/page.tsx', import.meta.url), 'utf8')
  const iconSource = readFileSync(new URL('../src/components/InterventionTypeIcon.tsx', import.meta.url), 'utf8')
  assert.match(mapSource, /Group the map/)
  assert.match(mapSource, /Intervention type/)
  assert.match(mapSource, /Focus area/)
  assert.match(mapSource, /useState<MapGroupBy>\('type'\)/)
  assert.doesNotMatch(mapSource, /toggleArea|intervention-search|FilterSelect|Reset filters|All focus areas/)
  assert.doesNotMatch(mapSource, /Coming next/)
  assert.doesNotMatch(pageSource, /searchParams|initialAreas|initialType/)
  assert.match(mapSource, /absolute right-3 top-3/)
  assert.match(mapSource, /auto-rows-fr/)
  assert.match(iconSource, /role="tooltip"/)
  assert.match(iconSource, /className="type-tip/)
  assert.doesNotMatch(mapSource, /ComingSoonTile/)
  assert.doesNotMatch(mapSource, /count === 0/)
})

test('program URLs open as a modal over the catalog, not a standalone deeper page', async () => {
  const { default: DetailPage } = source('app/interventions-preview-872d1767c376/[slug]/page.tsx')
  const tree = await DetailPage({ params: Promise.resolve({ slug: 'sovereign-ai' }) })
  const nodes = elements(tree)
  assert.ok(nodes.some((node) => node.type?.name === 'InterventionsIndex' || String(node.type).includes('InterventionsIndex')))
  assert.ok(nodes.some((node) => node.type?.name === 'InterventionModal' || String(node.type).includes('InterventionModal')))
  const cardSource = readFileSync(new URL('../src/components/InterventionCard.tsx', import.meta.url), 'utf8')
  assert.match(cardSource, /InterventionTypeIcon/)
  const intercept = readFileSync(new URL('../src/app/interventions-preview-872d1767c376/@modal/(.)[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(intercept, /InterventionModal/)
})

test('detail pages exist for every published slug', () => {
  const params = generateStaticParams()
  assert.deepEqual(params.map((row) => row.slug), publishedInterventions().map((item) => item.slug))
  assert.ok(params.every((row) => row.slug))
})

test('FA pages retain their content without promoting the unlisted catalogue', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ data: { orgPlresearchPage: { edges: [] } } }))
  for (const slug of INTERVENTION_AREA_ORDER.filter((area) => area !== 'rnd-acceleration')) {
    const route = slug === 'economies-governance' ? 'app/areas/economies-governance/page.tsx' : 'app/areas/[slug]/page.tsx'
    const Page = source(route).default
    const nodes = elements(await Page({ params: Promise.resolve({ slug }) }))
    const section = nodes.find((node) => node.type === FocusAreaInterventions)
    assert.ok(section)
    assert.equal(section.props.area, slug)
    assert.equal(renderToStaticMarkup(React.createElement(FocusAreaInterventions, section.props)), '')
    assert.ok(!nodes.some((node) => node.props?.href === '#interventions'))
  }
})

test('preview JSON keeps the published selector without adding navigation or sitemap entries', async () => {
  const { INTERVENTIONS_BASE_PATH } = source('lib/interventions.ts')
  const urls = sitemap().map((row) => row.url)
  assert.ok(!urls.some(url => url.includes('/interventions')))
  assert.ok(!mainNav.some(item => item.url.includes('/interventions')))
  assert.ok(!footerNav.some(item => item.url.includes('/interventions')))
  const res = await GET()
  const body = await res.json()
  assert.equal(body.count, publishedInterventions().length)
  assert.equal(body.items.length, publishedInterventions().length)
  assert.ok(body.items.every((item) => item.href.startsWith('https://www.plrd.org' + INTERVENTIONS_BASE_PATH + '/')))
  assert.match(res.headers.get('X-Robots-Tag'), /noindex/)
  assert.doesNotMatch(JSON.stringify(body), /docs\.google|\$[0-9]|budget|plRoleNote/i)
})

test('unpublished records stay off every public surface', () => {
  assert.equal(publishedInterventions().every((item) => item.published), true)
  assert.equal(interventionBySlug('not-a-record'), undefined)
})

test('public search index excludes the unlisted catalogue methodology and programs', () => {
  const index = JSON.parse(readFileSync(new URL('../public/search-index.json', import.meta.url), 'utf8'))
  assert.ok(!index.some(row => row.relpermalink.includes('/interventions')))
})

test('expanded catalogue lists override the prose negative list margin', () => {
  const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\[data-catalogue-group\]\s*>\s*ul\s*\{\s*margin-block-start:\s*1rem;/)
})

test('unpublished fixture is excluded from selectors API detail params and sitemap', async () => {
  const fixture = { ...interventionBySlug('sovereign-ai'), slug: 'unpublished-fixture', published: false }
  INTERVENTION_PROGRAMS.push(fixture)
  try {
    assert.ok(!publishedInterventions().some(i => i.slug === fixture.slug))
    assert.equal(interventionBySlug(fixture.slug), undefined)
    assert.ok(!interventionsForArea(fixture.area).some(i => i.slug === fixture.slug))
    assert.ok(!generateStaticParams().some(i => i.slug === fixture.slug))
    assert.ok(!(await sitemap()).some(i => i.url.includes(fixture.slug)))
    assert.ok(!(await (await GET()).json()).items.some(i => i.slug === fixture.slug))
  } finally { INTERVENTION_PROGRAMS.pop() }
})

