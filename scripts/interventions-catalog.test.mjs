import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import React from 'react'
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
const { default: InterventionsPage } = source('app/interventions/page.tsx')
const { generateStaticParams } = source('app/interventions/[slug]/page.tsx')
const { GET } = source('app/api/interventions/route.ts')
const { mainNav, footerNav } = source('lib/site-config.ts')

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

test('global navigation puts Interventions between Focus Areas and Insights', () => {
  assert.deepEqual(mainNav.map((item) => item.name), ['About us', 'Focus Areas', 'Interventions', 'Insights', 'Team'])
  assert.equal(mainNav[2].url, '/interventions/')
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

test('Interventions surfaces the requested journey with one full catalog', () => {
  const Index = source('components/InterventionsIndex.tsx').default
  const doc = new JSDOM(renderToStaticMarkup(React.createElement(Index))).window.document
  const sectionIds = [...doc.querySelectorAll('section[aria-labelledby]')].map((node) => node.getAttribute('aria-labelledby'))
  assert.deepEqual(sectionIds.filter((id) => ['portfolio-map', 'featured-interventions', 'explore-all-interventions', 'intervention-evidence'].includes(id)), [
    'portfolio-map', 'featured-interventions', 'explore-all-interventions', 'intervention-evidence',
  ])
  const catalog = doc.querySelector('section[aria-labelledby="explore-all-interventions"]')
  assert.equal(catalog.querySelector('h2').textContent.trim(), 'Explore all interventions')
  const links = [...catalog.querySelectorAll('li a[href^="/interventions/"]')]
  assert.equal(links.length, publishedInterventions().length)
  assert.equal(new Set(links.map((a) => a.getAttribute('href'))).size, links.length)
  const overview = doc.querySelector('section[aria-labelledby="portfolio-map"]')
  assert.equal(overview.querySelectorAll('a[href^="/interventions/"]').length, 0, 'overview must not repeat the program tiles')
  assert.match(catalog.textContent, /Draft-source examples\. Not approved commitments\./)
  assert.equal(doc.querySelectorAll('input, select').length, 0, 'do not restore filters')
  assert.match(doc.querySelector('#featured-interventions').textContent, /Spotlight: three live programmatic interventions/)
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
    assert.match(doc.querySelector('caption').textContent, /counted once by primary intervention type/)
  }
})

test('public catalog publishes the 15 draft-source examples without private fields', () => {
  const items = publishedInterventions()
  assert.equal(items.length, 15)
  assert.equal(interventionsForArea('economies-governance').length, 8)
  assert.equal(interventionsForArea('neurotech').length, 7)
  assert.equal(interventionsForArea('digital-human-rights').length, 0)
  assert.equal(interventionsForArea('ai-robotics').length, 0)
  assert.equal(INTERVENTION_PROGRAMS.filter((item) => !item.published).length, 0)
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
  assert.match(mapSource, /Draft-source examples/)
})

test('catalog keeps grouping and drops the filter controls', () => {
  const mapSource = readFileSync(new URL('../src/components/PortfolioMap.tsx', import.meta.url), 'utf8')
  const pageSource = readFileSync(new URL('../src/app/interventions/page.tsx', import.meta.url), 'utf8')
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
  const { default: DetailPage } = source('app/interventions/[slug]/page.tsx')
  const tree = await DetailPage({ params: Promise.resolve({ slug: 'sovereign-ai' }) })
  const nodes = elements(tree)
  assert.ok(nodes.some((node) => node.type?.name === 'InterventionsIndex' || String(node.type).includes('InterventionsIndex')))
  assert.ok(nodes.some((node) => node.type?.name === 'InterventionModal' || String(node.type).includes('InterventionModal')))
  const cardSource = readFileSync(new URL('../src/components/InterventionCard.tsx', import.meta.url), 'utf8')
  assert.match(cardSource, /InterventionTypeIcon/)
  const intercept = readFileSync(new URL('../src/app/interventions/@modal/(.)[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(intercept, /InterventionModal/)
})

test('detail pages exist for every published slug', () => {
  const params = generateStaticParams()
  assert.equal(params.length, 15)
  assert.ok(params.every((row) => row.slug))
})

test('FA pages mount the in-place catalog from the same records', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  for (const slug of INTERVENTION_AREA_ORDER) {
    const route = slug === 'economies-governance' ? 'app/areas/economies-governance/page.tsx' : 'app/areas/[slug]/page.tsx'
    const Page = source(route).default
    const nodes = elements(await Page({ params: Promise.resolve({ slug }) }))
    const section = nodes.find((node) => node.type === FocusAreaInterventions)
    assert.ok(section, `${slug} must show interventions on the FA page`)
    assert.equal(section.props.area, slug)
    const heroLink = nodes.some((node) => node.props?.href === '#interventions')
    const heroAction = nodes.some((node) => node.type === AreaHeroActions)
    assert.ok(heroLink || heroAction, `${slug} needs a local Interventions entry point`)
  }
})

test('sitemap, nav, and JSON endpoint share the published selector', async () => {
  const urls = sitemap().map((row) => row.url)
  assert.ok(urls.includes('https://www.plrd.org/interventions/'))
  assert.ok(urls.includes('https://www.plrd.org/interventions/methodology/'))
  assert.ok(urls.includes('https://www.plrd.org/interventions/sovereign-ai/'))
  assert.equal(urls.filter((url) => url.includes('/interventions/')).length, 17)
  assert.ok(mainNav.some((item) => item.url === '/interventions/'))
  assert.ok(footerNav.some((item) => item.url === '/interventions/'))
  const res = await GET()
  const body = await res.json()
  assert.equal(body.count, 15)
  assert.equal(body.items.length, 15)
  assert.ok(body.items.every((item) => item.href.startsWith('https://www.plrd.org/interventions/')))
  assert.doesNotMatch(JSON.stringify(body), /docs\.google|\$[0-9]|budget|plRoleNote/i)
})

test('unpublished records stay off every public surface', () => {
  assert.equal(publishedInterventions().every((item) => item.published), true)
  assert.equal(interventionBySlug('not-a-record'), undefined)
})

test('search index includes the catalog, methodology, and every published program', () => {
  const index = JSON.parse(readFileSync(new URL('../public/search-index.json', import.meta.url), 'utf8'))
  const hrefs = new Set(index.map((row) => row.relpermalink))
  assert.ok(hrefs.has('/interventions/'))
  assert.ok(hrefs.has('/interventions/methodology/'))
  for (const item of publishedInterventions()) {
    assert.ok(hrefs.has(`/interventions/${item.slug}/`), `missing search entry for ${item.slug}`)
  }
})
