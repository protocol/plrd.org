import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

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

// Public detail mounting is covered by field-velocity-panel.test.mjs.
// The cross-field overview itself keeps its existing unlisted route.

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
