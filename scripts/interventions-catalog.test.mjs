import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import React from 'react'
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
  assert.ok(nodes.some((node) => node.type?.name === 'InterventionsCatalog' || node.type?.displayName === 'InterventionsCatalog' || String(node.type).includes('InterventionsCatalog') || node.type?.name === 'default'))
  const sourceText = readFileSync(new URL('../src/app/interventions/page.tsx', import.meta.url), 'utf8')
  const catalogSource = readFileSync(new URL('../src/components/InterventionsCatalog.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(sourceText + catalogSource, /cover.?flow|gallery|VARIANT/i)
  assert.match(catalogSource, /grid sm:grid-cols-2 lg:grid-cols-3/)
  assert.ok(nodes.some((node) => /Turning bottlenecks/.test(text(node))))
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
