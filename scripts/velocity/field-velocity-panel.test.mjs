import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { existsSync, readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

const Dashboard = source('components/ImpactDashboardV2.tsx').default
const { FOCUS_AREAS, INFLECTION_POINTS } = source('lib/field-velocity.ts')
const text = s => s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')

test('fixed-area dashboard keeps rich field charts and only that area’s inflections, without misleading area tabs', async () => {
  const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
  const data = await loadFieldVelocity(async () => ({}))
  for (const { key } of FOCUS_AREAS) {
    const html = text(renderToStaticMarkup(React.createElement(Dashboard, { ...data, fixedArea: key })))
    assert.doesNotMatch(html, /role="tablist"/, key)
    for (const point of INFLECTION_POINTS) assert.equal(html.includes(point.title), point.area === key, `${key}: ${point.title}`)
    assert.match(html, /<svg/, 'existing chart/icon rendering retained')
    assert.match(html, /Performance curves/)
    assert.match(html, /aria-haspopup="dialog"/)
  }
})

test('overview dashboard initially selects the requested area while retaining every tab', () => {
  for (const { key, label } of FOCUS_AREAS) {
    const html = text(renderToStaticMarkup(React.createElement(Dashboard, { initialArea: key })))
    const selectedTab = html.match(/<button[^>]*role="tab"[^>]*aria-selected="true"[\s\S]*?<\/button>/)?.[0]
    assert.ok(selectedTab?.includes(label), `${key} must be the selected tab`)
    assert.equal((html.match(/role="tab"/g) ?? []).length, 4)
    for (const point of INFLECTION_POINTS) assert.equal(html.includes(point.title), point.area === key)
  }
})

test('hover-only role tooltips are hidden on narrow screens to prevent page overflow', () => {
  const html = renderToStaticMarkup(React.createElement(Dashboard, { fixedArea: 'neurotech' }))
  const tips = [...html.matchAll(/<span[^>]*class="([^"]*group-hover\/role:opacity-100[^"]*)"/g)]
  assert.ok(tips.length > 0)
  assert.ok(tips.every(m => m[1].includes('hidden sm:block')), 'off-screen hover tooltip boxes must not widen mobile layout')
})

function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}

for (const { key, label } of FOCUS_AREAS) {
  test(`${key} staged panel retains charts and selected-area methodology/toolkit links without public route wiring`, async (t) => {
    assert.ok(existsSync('src/components/AreaFieldVelocity.tsx'), 'missing reusable area panel')
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
    t.mock.method(console, 'warn', () => {})
    const Panel = source('components/AreaFieldVelocity.tsx').default
    // The component is retained for a later launch, but no public page mounts it.
    // Public-route absence is covered separately by preview-only.test.mjs.
    const panelTree = await Panel({ area: key })
    if (key === 'economies-governance') {
      assert.deepEqual(elements(panelTree).find(el => el.type === Dashboard).props.liveOutputs, {}, 'area panel must retain the overview live-output channel even when providers are unavailable')
    }
    const html = text(renderToStaticMarkup(panelTree))
    const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
    const data = await loadFieldVelocity(async () => ({}))
    assert.deepEqual(elements(panelTree).find(el => el.type === Dashboard).props.measurementSeriesByArea, { [key]: data.measurementSeriesByArea[key] })
    assert.equal((html.match(/data-measurement=/g) ?? []).length, 0, 'area panel uses preview triggers, not inline detailed measurements')

    assert.match(html, /id="field-velocity"/)
    assert.ok(html.includes(`${label} field velocity</h2>`))

    assert.ok(panelTree.props.className.includes('area-field-velocity'))
    assert.ok(panelTree.props.className.includes(key === 'neurotech' ? 'bg-gray-100' : 'bg-gray-200'))
    assert.doesNotMatch(panelTree.props.className, /border-y|px-4|bg-gray-50/)
    const css = readFileSync('src/app/globals.css', 'utf8')
    assert.match(css, /\.area-overview\s*\{[^}]*grid-template-columns:\s*minmax\(1\.5rem, 1fr\) minmax\(0, 69rem\) minmax\(1\.5rem, 1fr\)/)
    assert.match(css, /\.area-overview > \.area-field-velocity\s*\{[^}]*grid-column:\s*1 \/ -1/)
    assert.match(css, /--color-gray-200: #F6F9FD/)
    assert.match(css, /--color-gray-200: #21242c/)

    assert.ok(html.includes(`/impact-preview-eb61fba1b98e/?area=${key}#field-velocity`))
    assert.ok(html.includes(`/impact-preview-eb61fba1b98e/?area=${key}#methodology`))
    assert.ok(html.includes(`/impact-preview-eb61fba1b98e/?area=${key}#toolkit`))
    assert.doesNotMatch(html, /role="tablist"/)
    for (const point of INFLECTION_POINTS) assert.equal(html.includes(point.title), point.area === key)
  })
}
