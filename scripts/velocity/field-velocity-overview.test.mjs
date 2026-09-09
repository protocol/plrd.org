import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { source } from './test-source-loader.mjs'
function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}
test('impact overview accepts validated area deep links and uses exactly the central loader records', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  // The provider outage is intentional; collect its warnings instead of polluting test output.
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/impact-preview-eb61fba1b98e/page.tsx').default
  const Dashboard = source('components/ImpactDashboardV2.tsx').default
  const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
  const data = await loadFieldVelocity()
  for (const area of ['digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech', 'unknown', ['neurotech', 'ai-robotics'], undefined]) {
    const tree = await Page({ searchParams: Promise.resolve({ area }) })
    const children = elements(tree)
    const dashboard = children.find(el => el.type === Dashboard)
    assert.ok(dashboard)
    assert.equal(dashboard.props.initialArea, typeof area === 'string' && area !== 'unknown' ? area : 'digital-human-rights')
    assert.deepEqual(dashboard.props.recordsByArea, data.recordsByArea)
    assert.deepEqual(dashboard.props.ideaVintageExamples, data.ideaVintageExamples)
    assert.deepEqual(dashboard.props.marketSignals, data.marketSignals)
    assert.ok(children.some(el => el.props.id === 'field-velocity'))
    assert.ok(children.some(el => el.props.id === 'methodology'))
  }
})
