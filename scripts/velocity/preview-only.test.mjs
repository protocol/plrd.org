import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

const Panel = source('components/AreaFieldVelocity.tsx').default
const Dashboard = source('components/ImpactDashboardV2.tsx').default
const Methodology = source('components/MeasuringQuestionsV2.tsx').default
const { FOCUS_AREAS, FIELD_VELOCITY_OVERVIEW } = source('lib/field-velocity.ts')

function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}

function offlineProviders(t) {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
}

for (const { key } of FOCUS_AREAS) {
  test(`${key} public detail keeps existing content but does not mount field velocity or preview links`, async (t) => {
    offlineProviders(t)
    const route = key === 'economies-governance' ? 'app/areas/economies-governance/page.tsx' : 'app/areas/[slug]/page.tsx'
    const Page = source(route).default
    const nodes = elements(await Page({ params: Promise.resolve({ slug: key }) }))
    assert.ok(!nodes.some(node => node.type === Panel || node.type === Dashboard || node.type === Methodology), 'unreleased field velocity must not mount on public pages')
    assert.ok(!nodes.some(node => node.props.id === 'field-velocity'))
    assert.ok(!nodes.some(node => /impact-preview|#fv\/|#field-velocity|#methodology|#toolkit/.test(node.props.href ?? '')), 'no discovery links to the unlisted preview')
    assert.ok(nodes.some(node => node.props.id === 'opportunity-spaces'), 'original strategy remains')
    const existingLink = key === 'economies-governance' ? '/areas/economies-governance/projects/' : '/insights/'
    assert.ok(nodes.some(node => node.props.href === existingLink), 'original Explore/Insights content remains')
    assert.doesNotMatch(readFileSync(`src/${route}`, 'utf8'), /from ['"]@\/(?:components\/(?:AreaFieldVelocity|ImpactDashboardV2|MeasuringQuestionsV2)|lib\/field-velocity[^'"]*)['"]/, 'public routes must not load field-velocity modules')
  })
}

test('the exact unlisted overview retains all fields, charts, methodology and noindex metadata', async (t) => {
  offlineProviders(t)
  assert.equal(FIELD_VELOCITY_OVERVIEW, '/impact-preview-eb61fba1b98e/')
  const { default: Overview, metadata } = source(`app${FIELD_VELOCITY_OVERVIEW}page.tsx`)
  assert.deepEqual(metadata.robots, { index: false, follow: false, googleBot: { index: false, follow: false } })
  for (const { key } of FOCUS_AREAS) {
    const nodes = elements(await Overview({ searchParams: Promise.resolve({ area: key }) }))
    const dashboard = nodes.find(node => node.type === Dashboard)
    assert.ok(dashboard)
    assert.equal(dashboard.props.initialArea, key)
    assert.equal(dashboard.props.fixedArea, undefined)
    assert.deepEqual(Object.keys(dashboard.props.recordsByArea).sort(), FOCUS_AREAS.map(area => area.key).sort())
    assert.ok(nodes.some(node => node.type === Methodology))
    assert.ok(nodes.some(node => node.props.id === 'methodology'))
  }
})

test('the preview stays absent from public navigation, sitemap, search, RSS and robots discovery', () => {
  const sitemap = source('app/sitemap.ts').default()
  const { mainNav, footerNav } = source('lib/site-config.ts')
  for (const [label, value] of Object.entries({ sitemap, mainNav, footerNav })) {
    assert.doesNotMatch(JSON.stringify(value), /impact-preview|\/field-velocity\/|"[^" ]*\/impact\/"/, label)
  }
  for (const file of ['public/search-index.json', 'public/feed.xml', 'public/robots.txt']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /impact-preview-eb61fba1b98e|\/field-velocity\//, file)
  }
})
