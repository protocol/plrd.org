import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

test('every instrument counts actual charts, including secondary, patent, examples and sourced market probabilities', () => {
  const { VELOCITY_INSTRUMENTS } = source('lib/velocity-instruments.ts')
  const measure = source('lib/measurement-series.ts').NEURO_MEASUREMENT_SERIES[0]
  const market = { prob: 0.4, platform: 'polymarket', question: 'A sourced question?', resolutionDate: '2027-01-01', url: 'https://polymarket.com/test' }
  for (const { id } of VELOCITY_INSTRUMENTS) {
    const record = { instrument: id, state: 'reading', series: line, series2: line, patentVintage: { state: 'reading', series: line } }
    const measures = [{ ...measure, instrument: id }]
    const examples = [{ label: 'Current', series: line, scale: 'linear' }, { label: 'Comparison', series: line, scale: 'linear' }]
    const g = gallery(record, measures, [market, { ...market, url: 'https://polymarket.com/second' }, { prob: 0.5 }], examples, 'Current')
    assert.equal(g.chartCount, id === 'idea_vintage' || id === 'markets' ? 5 : 3, id)
    assert.equal(new Set(g.items.map(i => i.id)).size, g.items.length)
    for (const state of ['unwired', 'not_applicable']) assert.equal(gallery({ ...record, state }, measures, [market], examples).chartCount, 0, `${id}: ${state} overrides retained values`)
    assert.equal(gallery({ instrument: id, state: 'reading' }, [{ ...measure, instrument: id, tracks: [] }]).chartCount, 0)
  }
  const readout = gallery({ instrument: 'markets', state: 'reading' }, [], [{ ...market, prob: null, readout: '2040' }])
  assert.equal(readout.chartCount, 0, 'a text-only forecast is evidence, not a chart')
  assert.equal(readout.items.length, 1, 'retain sourced non-probability readouts')
})

test('a current-area example is only deduplicated when the primary chart actually renders', () => {
  const record = { instrument: 'idea_vintage', state: 'reading', series: [line[0]] }
  const examples = [{ label: 'Current', series: line, scale: 'linear' }]
  assert.equal(gallery(record, [], [], examples, 'Current').chartCount, 1)
  assert.equal(gallery({ ...record, series: line }, [], [], examples, 'Current').chartCount, 1)
})

const line = [{ x: 2023, y: 1 }, { x: 2024, y: 2 }]

const gallery = (...args) => {
  assert.ok(existsSync('src/lib/instrument-gallery.ts'), 'missing shared instrument gallery grouping')
  return source('lib/instrument-gallery.ts').instrumentGallery(...args)
}

test('Neuro galleries use declared instrument attribution and retain every augmentation exactly once', async () => {
  const data = await source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
  const records = data.recordsByArea.neurotech
  const measures = data.measurementSeriesByArea.neurotech
  const groups = records.map(record => gallery(record, measures, [], data.ideaVintageExamples, 'Neurotech'))
  assert.deepEqual(groups.map(g => g.chartCount), [3, 1, 4, 1, 0])
  const mapped = groups.flatMap(g => g.items.filter(i => i.kind === 'measurement').map(i => i.measure))
  assert.deepEqual(mapped.map(m => m.id).sort(), measures.map(m => m.id).sort())
  assert.equal(mapped.flatMap(m => m.tracks.flatMap(t => t.points)).length, 27)
  assert.ok(groups[0].items.some(i => i.measure?.lens === 'data-supply'), 'retain source classification; do not relabel as capability')
  assert.equal(groups[3].items.find(i => i.kind === 'measurement').measure.lens, 'adoption')
})
