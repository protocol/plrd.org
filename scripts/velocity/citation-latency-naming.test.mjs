import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'

// The public label matches Neuro Atlas; source schema and legacy links stay stable.
test('OpenAlex reference age is Citation latency, separately from translation latency', async () => {
  const { INSTRUMENT_BY_ID } = source('lib/velocity-instruments.ts')
  assert.equal(INSTRUMENT_BY_ID.idea_vintage.label, 'Citation latency')
  assert.equal(INSTRUMENT_BY_ID.latency_compression.label, 'Latency compression')
  const { VELOCITY_SIGNALS } = source('lib/velocity-signals.ts')
  assert.equal(VELOCITY_SIGNALS.flatMap(s => s.instruments).find(i => i.id === 'idea_vintage').title, 'Citation latency')
  const { chartHash, parseChartHash } = source('lib/chart-selection.ts')
  assert.equal(chartHash('neurotech', 'idea_vintage', 'primary'), '#fv/neurotech/idea_vintage/primary')
  assert.deepEqual(parseChartHash('#fv/neurotech/idea_vintage/primary'), { area: 'neurotech', instrument: 'idea_vintage', itemId: 'primary' })
})

test('every area renders a real citation chart using unchanged source identities', async () => {
  const React = source('../node_modules/react/index.js')
  const { renderToStaticMarkup } = source('../node_modules/react-dom/server.node.js')
  const Dashboard = source('components/ImpactDashboardV2.tsx').default
  const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
  const data = await loadFieldVelocity(async () => ({}))
  for (const area of ['digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech']) {
    const html = renderToStaticMarkup(React.createElement(Dashboard, { ...data, fixedArea: area, mode: 'charts' }))
    assert.match(html, /Citation latency/, area)
    assert.doesNotMatch(html, /Idea vintage|paper vintage|Paper vintage/, area)
    assert.match(html, /data-instrument="idea_vintage"/, area)
    assert.ok(data.recordsByArea[area].find(r => r.instrument === 'idea_vintage').series.length > 1, area)
  }
})
