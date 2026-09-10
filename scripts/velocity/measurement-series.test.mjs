import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'

import { fixture } from './measurement-fixture.mjs'

test('Neuro publishes exactly three sourced, nonempty measures while keeping five instruments', async () => {
  const { loadFieldVelocity, fieldVelocityForArea } = source('lib/field-velocity-data.ts')
  const { parseMeasurementSeries } = source('lib/measurement-series.ts')
  const data = await loadFieldVelocity(async () => ({}))
  const feed = fieldVelocityForArea(data, 'neurotech')
  assert.deepEqual(feed.measurementSeries.map(series => series.id), ['tissue-mapped', 'bci-implants', 'neural-recording-hours'])
  assert.equal(feed.instruments.length, 5)
  assert.deepEqual(parseMeasurementSeries(feed.measurementSeries), feed.measurementSeries)
  for (const series of feed.measurementSeries) {
    assert.ok(series.tracks.length > 0)
    for (const track of series.tracks) for (const point of track.points) {
      assert.ok(Number.isFinite(point.value) && point.value > 0)
      assert.doesNotMatch(point.sourceUrl, /example\.(org|com)/)
      assert.ok(point.sourceLabel && point.note)
    }
  }
})

test('canonical measurement parser accepts the additive empty state and a complete sourced series', () => {
  const { parseMeasurementSeries } = source('lib/measurement-series.ts')
  assert.equal(typeof parseMeasurementSeries, 'function', 'missing canonical parser')
  assert.deepEqual(parseMeasurementSeries([]), [])
  assert.deepEqual(parseMeasurementSeries(fixture()), fixture())
})

test('canonical measurement parser fails closed on malformed provenance, values, dates and duplicate identities', () => {
  const { parseMeasurementSeries } = source('lib/measurement-series.ts')
  assert.equal(typeof parseMeasurementSeries, 'function', 'missing canonical parser')
  const changes = [
    s => { s[0].id = 'unknown' },
    s => { s.push(structuredClone(s[0])) },
    s => { s[0].tracks.push(structuredClone(s[0].tracks[0])) },
    s => { s[0].tracks[0].points.push(structuredClone(s[0].tracks[0].points[0])) },
    s => { s[0].checkedAt = '2026-02-30' },
    s => { s[0].coverage = '' },
    s => { s[0].instrument = 'markets' },
    s => { s[0].lens = 'adoption' },
    s => { s[0].scale = 'linear' },
    s => { s[0].chartKind = 'line' },
    s => { s[0].tracks = [] },
    s => { s[0].tracks[0].points = [] },
    ...['2024-02-30', '2024-1-01', '2024', 'not-a-date'].map(date => s => { s[0].tracks[0].points[0].date = date }),
    ...[0, -1, NaN, Infinity, '12'].map(value => s => { s[0].tracks[0].points[0].value = value }),
    ...['http://example.org', 'javascript:alert(1)', '/relative', 'https://', 'https://user:pass@example.org'].map(url => s => { s[0].tracks[0].points[0].sourceUrl = url }),
    s => { s[0].tracks[0].points[0].datePrecision = 'quarter' },
    s => { s[0].tracks[0].points[0].dateBasis = 'estimate' },
    s => { s[0].tracks[0].points[0].qualifier = 'exact-ish' },
    s => { s[0].tracks[0].points.push({ ...s[0].tracks[0].points[0], date: '2023-01-01' }) },
  ]
  for (const change of changes) {
    const input = fixture()
    change(input)
    assert.throws(() => parseMeasurementSeries(input), /Invalid measurement/, String(change))
  }
})
