import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

test('shared loader reproduces every existing preview merge without restamping observations', async () => {
  assert.ok(existsSync('src/lib/field-velocity-data.ts'), 'missing shared field-velocity loader')
  const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
  const { FOCUS_AREAS } = source('lib/inflection-points.ts')
  const { instrumentsForArea, withOpenAlex, withPatentVintage } = source('lib/velocity-instruments.ts')
  const { loadAllOpenAlex } = source('lib/velocity-openalex.ts')
  const { loadAllLatency, withLatency } = source('lib/velocity-latency.ts')
  const { loadMarketCurve, withMarketCurve } = source('lib/velocity-market-curve.ts')
  const openAlex = loadAllOpenAlex(), latency = loadAllLatency(), market = loadMarketCurve()
  const data = await loadFieldVelocity(async () => ({}))
  for (const { key } of FOCUS_AREAS) {
    const expected = withMarketCurve(withLatency(withOpenAlex(withPatentVintage(instrumentsForArea(key), key), openAlex[key]), latency[key]), market[key])
    assert.deepEqual(data.recordsByArea[key], expected, key)
  }
  assert.equal(data.ideaVintageExamples.length, 4)
  assert.ok(data.ideaVintageExamples.every(e => e.series.length > 1))
  assert.deepEqual(data.marketSignals, {})
})

test('observed velocity distinguishes attribution, comparable flows and different kinds of stocks', () => {
  const { FIELD_VELOCITY_METHODOLOGY: method } = source('lib/field-velocity.ts')
  assert.ok(method, 'missing shared methodology')
  assert.deepEqual(Object.keys(method).sort(), ['attribution', 'intro', 'observedVelocity', 'stocksAndFlows'])
  assert.match(method.attribution, /with or without PL/)
  assert.match(method.observedVelocity, /multiple field-specific measures/)
  assert.match(method.observedVelocity, /no single gating cost.*capability curve/)
  assert.match(method.stocksAndFlows, /Stocks are not velocity/)
  assert.match(method.stocksAndFlows, /annual additions.*comparable units.*windows/)
  assert.match(method.stocksAndFlows, /Mapped-volume frontiers.*capability/)
  assert.match(method.stocksAndFlows, /data-hours.*data resource stock/)
  assert.match(method.stocksAndFlows, /implants.*adoption.*commitment stock/)
  const React = source('../node_modules/react/index.js')
  const { renderToStaticMarkup } = source('../node_modules/react-dom/server.node.js')
  const Methodology = source('components/MeasuringQuestionsV2.tsx').default
  const html = renderToStaticMarkup(React.createElement(Methodology))
  assert.ok(html.includes('Stocks are not velocity'))
  assert.ok(html.includes('with or without PL'))
  assert.doesNotMatch(html, /whether they landed|has no performance curve/)
})
