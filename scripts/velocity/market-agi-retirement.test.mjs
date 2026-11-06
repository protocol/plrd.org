import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

test('retired AGI forecast and 50/50 headline are absent from the assembled public data and UI', async () => {
  const { loadFieldVelocity, fieldVelocityForArea } = source('lib/field-velocity-data.ts')
  const { instrumentGallery } = source('lib/instrument-gallery.ts')
  const data = await loadFieldVelocity(async () => ({}))
  const record = data.recordsByArea['ai-robotics'].find(r => r.instrument === 'markets')
  assert.equal(record.series?.length ?? 0, 0, 'AGI primary forecast must be retired')
  assert.doesNotMatch(JSON.stringify(record), /AGI|50\/50|implied date/i)
  const { items } = instrumentGallery(record)
  assert.deepEqual(items.map(item => item.id), ['secondary'], 'retain automation under its existing link, never recycle the retired primary ID')
  assert.doesNotMatch(JSON.stringify(fieldVelocityForArea(data, 'ai-robotics').records), /AGI arrival|50\/50/i)
  const React = source('../node_modules/react/index.js')
  const { renderToStaticMarkup } = source('../node_modules/react-dom/server.node.js')
  const Dashboard = source('components/ImpactDashboardV2.tsx').default
  const html = renderToStaticMarkup(React.createElement(Dashboard, { ...data, fixedArea: 'ai-robotics', mode: 'charts' }))
  assert.doesNotMatch(html, /AGI arrival|50\/50|markets\/primary/i)
  assert.match(html, /Full automation of the economy/)
  assert.match(html, /Citation latency/)
  const { JSDOM } = source('../node_modules/jsdom/lib/api.js')
  const doc = new JSDOM(html).window.document
  assert.ok(doc.querySelector('[data-instrument="markets"] .instrument-preview-plot svg'), 'the retained economic-automation curve must remain visible even without live-market peers')
})

test('retiring AGI preserves every economic-automation observation and source date', async () => {
  const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
  const data = await loadFieldVelocity(async () => ({}))
  const record = data.recordsByArea['ai-robotics'].find(r => r.instrument === 'markets')
  const snapshot = JSON.parse(readFileSync('src/data/velocity/ftm-takeoff.json', 'utf8'))
  const automation = snapshot.series.find(s => s.key === 'ftm_full_auto')
  assert.deepEqual(record.series2, automation.points.map(p => ({ x: p.year, y: Number((p.prob * 100).toFixed(1)) })))
  assert.equal(record.series2Label, automation.label)
  assert.equal(record.measuredAt, snapshot._provenance.generatedAt.slice(0, 10))
})
