import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { existsSync } from 'node:fs'
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

function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}

for (const { key } of FOCUS_AREAS) {
  test(`${key} overview includes the shared panel, original strategy and selected-area methodology/toolkit links`, async (t) => {
    assert.ok(existsSync('src/components/AreaFieldVelocity.tsx'), 'missing reusable area panel')
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
    t.mock.method(console, 'warn', () => {})
    const Panel = source('components/AreaFieldVelocity.tsx').default
    const Page = source(key === 'economies-governance' ? 'app/areas/economies-governance/page.tsx' : 'app/areas/[slug]/page.tsx').default
    const tree = await Page({ params: Promise.resolve({ slug: key }) })
    const children = elements(tree)
    const panel = children.find(el => el.type === Panel)
    assert.ok(panel, `${key} page does not mount shared panel`)
    assert.equal(panel.props.area, key)
    assert.ok(children.some(el => el.props.id === 'opportunity-spaces'), 'existing strategy preserved')
    const panelTree = await Panel(panel.props)
    if (key === 'economies-governance') {
      assert.deepEqual(elements(panelTree).find(el => el.type === Dashboard).props.liveOutputs, {}, 'area panel must retain the overview live-output channel even when providers are unavailable')
    }
    const html = text(renderToStaticMarkup(panelTree))
    assert.match(html, /id="field-velocity"/)
    assert.ok(html.includes(`/impact-preview-eb61fba1b98e/?area=${key}#field-velocity`))
    assert.ok(html.includes(`/impact-preview-eb61fba1b98e/?area=${key}#methodology`))
    assert.ok(html.includes(`/impact-preview-eb61fba1b98e/?area=${key}#toolkit`))
    assert.doesNotMatch(html, /role="tablist"/)
    for (const point of INFLECTION_POINTS) assert.equal(html.includes(point.title), point.area === key)
  })
}
