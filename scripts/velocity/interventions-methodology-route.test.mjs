import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

const route = 'app/interventions-preview-872d1767c376/methodology/page.tsx'

test('methodology identity is nested and noindex on both compatible entry routes', () => {
  for (const path of [route, 'app/impact-preview-eb61fba1b98e/page.tsx']) {
    const { metadata } = source(path)
    assert.equal(metadata.title, 'Intervention methodology')
    assert.equal(metadata.alternates.canonical, '/interventions-preview-872d1767c376/methodology/')
    assert.deepEqual(metadata.robots, { index: false, follow: false, googleBot: { index: false, follow: false } })
  }
})

test('nested methodology keeps its full-bleed footer without extra shell padding', () => {
  const shell = readFileSync('src/components/SiteShell.tsx', 'utf8')
  const patterns = Function(`return ${shell.match(/const NO_BOTTOM_PAD_PATTERNS = (\[[\s\S]*?\n\])/)[1]}`)()
  for (const path of ['/interventions-preview-872d1767c376/methodology', '/interventions-preview-872d1767c376/methodology/']) {
    assert.ok(patterns.some(pattern => pattern.test(path)), path)
  }
  assert.ok(!patterns.some(pattern => pattern.test('/interventions-preview-872d1767c376/')))
})

test('Methodology CTA uses document navigation rather than the program-modal interceptor', () => {
  const Index = source('components/InterventionsIndex.tsx').default
  const link = elements(Index()).find(node => node.props.href === '/interventions-preview-872d1767c376/methodology/')
  assert.equal(link.type, 'a', 'Next Link would match the dynamic intercepted program slug and leave the catalog displayed')
})

function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}

test('catalog methodology destination serves the approved tabbed page and its parent breadcrumb', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source(route).default
  const tree = await Page({ searchParams: Promise.resolve({ area: 'neurotech' }) })
  const nodes = elements(tree)
  const Tabs = source('components/ImpactMethodologyTabs.tsx').default
  assert.equal(nodes.filter(node => node.type === Tabs).length, 1, 'Methodology must use the approved three-tab page, not the catalog placeholder')
  const Breadcrumb = source('components/Breadcrumb.tsx').default
  assert.deepEqual(nodes.find(node => node.type === Breadcrumb).props.items, [
    { label: 'Interventions', href: '/interventions-preview-872d1767c376/' },
    { label: 'Methodology' },
  ])
  assert.deepEqual(nodes.filter(node => ['diagnose', 'intervene', 'learn'].includes(node.props.id)).map(node => node.props.id), ['diagnose', 'intervene', 'learn'])
  const Dashboard = source('components/ImpactDashboardV2.tsx').default
  assert.equal(nodes.find(node => node.type === Dashboard).props.initialArea, 'neurotech')
})
