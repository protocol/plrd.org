import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

const route = 'app/methodology/page.tsx'

test('methodology identity is public, canonical, and still served on the old preview route via redirect', () => {
  const { metadata } = source('app/impact-preview-eb61fba1b98e/page.tsx')
  assert.equal(metadata.title, 'Intervention methodology')
  assert.equal(metadata.alternates.canonical, '/methodology/')
  assert.equal(metadata.robots, undefined)
  const reexport = readFileSync('src/app/methodology/page.tsx', 'utf8')
  assert.match(reexport, /impact-preview-eb61fba1b98e\/page/)
})

test('public methodology keeps its full-bleed footer without extra shell padding', () => {
  const shell = readFileSync('src/components/SiteShell.tsx', 'utf8')
  const patterns = Function(`return ${shell.match(/const NO_BOTTOM_PAD_PATTERNS = (\[[\s\S]*?\n\])/)[1]}`)()
  for (const path of ['/methodology', '/methodology/']) {
    assert.ok(patterns.some(pattern => pattern.test(path)), path)
  }
  assert.ok(!patterns.some(pattern => pattern.test('/interventions-preview-872d1767c376/methodology/')))
})

function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}

test('methodology page serves the approved tabbed page without a catalogue parent', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source(route).default
  const tree = await Page({ searchParams: Promise.resolve({ area: 'neurotech' }) })
  const nodes = elements(tree)
  const Tabs = source('components/ImpactMethodologyTabs.tsx').default
  assert.equal(nodes.filter(node => node.type === Tabs).length, 1, 'Methodology must use the approved three-tab page')
  const Breadcrumb = source('components/Breadcrumb.tsx').default
  assert.equal(nodes.some(node => node.type === Breadcrumb), false, 'no Interventions parent once the catalogue is removed')
  assert.deepEqual(nodes.filter(node => ['diagnose', 'intervene', 'learn'].includes(node.props.id)).map(node => node.props.id), ['diagnose', 'intervene', 'learn'])
  const Dashboard = source('components/ImpactDashboardV2.tsx').default
  assert.equal(nodes.find(node => node.type === Dashboard).props.initialArea, 'neurotech')
})

test('bottleneck names are smaller than the bottlenecks title', () => {
  const page = readFileSync('src/app/impact-preview-eb61fba1b98e/page.tsx', 'utf8')
  const title = page.match(/<h2 className="([^"]+)">\s*<ImpactSectionLink[^>]*>\s*Identify the bottlenecks\./)
  assert.ok(title, 'bottlenecks title class')
  const card = page.slice(page.indexOf('data-bottlenecks=""'))
  const name = card.match(/className="(text-\[[0-9]+px\][^"]+)"/)
  assert.ok(name, 'bottleneck name class')
  const size = (cls) => Number(cls.match(/text-\[(\d+)px\]/)[1])
  assert.ok(size(name[1]) < size(title[1]), `${name[1]} should be smaller than ${title[1]}`)
})

test('field velocity says coming soon instead of not yet wired', () => {
  const dashboard = readFileSync('src/components/ImpactDashboardV2.tsx', 'utf8')
  assert.doesNotMatch(dashboard, /Not yet wired/)
  assert.match(dashboard, /Coming soon/)
})
