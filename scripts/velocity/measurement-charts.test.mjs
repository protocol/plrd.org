import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { existsSync, readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'
import { fixture } from './measurement-fixture.mjs'

const render = series => {
  assert.ok(existsSync('src/components/MeasurementSeriesCharts.tsx'), 'missing sourced measurement charts')
  return renderToStaticMarkup(React.createElement(source('components/MeasurementSeriesCharts.tsx').default, { series }))
}

test('measurement axes use power-of-ten tissue ticks and round linear participant/hour ticks', () => {
  const { measurementTicks } = source('components/MeasurementSeriesCharts.tsx')
  assert.equal(typeof measurementTicks, 'function', 'missing readable tick geometry')
  assert.deepEqual(measurementTicks([0.00095, 1], 'log'), [0.0001, 0.001, 0.01, 0.1, 1])
  assert.deepEqual(measurementTicks([1, 67], 'linear'), [0, 20, 40, 60, 80])
  assert.deepEqual(measurementTicks([100, 1280], 'linear'), [0, 500, 1000, 1500])
  assert.deepEqual(measurementTicks([1], 'linear'), [0, 1])
  assert.deepEqual(measurementTicks([1], 'log'), [1, 10])
})

test('near-coincident tissue tracks can be isolated without moving dates or dropping source evidence', () => {
  const { NEURO_MEASUREMENT_SERIES } = source('lib/measurement-series.ts')
  const { visibleMeasurementTracks } = source('components/MeasurementSeriesCharts.tsx')
  assert.equal(typeof visibleMeasurementTracks, 'function', 'missing track isolation')
  const tissue = NEURO_MEASUREMENT_SERIES[0]
  for (const id of ['h01-human-imaged', 'microns-mouse-imaged']) {
    assert.deepEqual(visibleMeasurementTracks(tissue, id), tissue.tracks.filter(t => t.id === id))
  }
  assert.deepEqual(visibleMeasurementTracks(tissue, null), tissue.tracks)
  const html = render([tissue])
  assert.match(html, /Some markers overlap/)
  for (const track of tissue.tracks) assert.ok(html.includes(`aria-label="Isolate ${track.label}"`))
  assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, tissue.tracks.length)
  const trackColors = [...html.matchAll(/data-track="[^"]+" style="color:([^";]+)/g)].map(m => m[1])
  assert.equal(new Set(trackColors).size, tissue.tracks.length, 'every tissue track has a distinct marker color')
})

test('selected Neuro renders every real sourced measurement on the existing dashboard, other areas none', async () => {
  const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
  const Dashboard = source('components/ImpactDashboardV2.tsx').default
  const data = await loadFieldVelocity(async () => ({}))
  for (const initialArea of ['neurotech', 'ai-robotics', 'economies-governance', 'digital-human-rights']) {
    const html = renderToStaticMarkup(React.createElement(Dashboard, { ...data, initialArea }))
    assert.equal((html.match(/data-measurement=/g) ?? []).length, initialArea === 'neurotech' ? 3 : 0)
    if (initialArea === 'neurotech') {
      assert.equal((html.match(/data-point=/g) ?? []).length, data.measurementSeriesByArea.neurotech.flatMap(s => s.tracks.flatMap(t => t.points)).length)
      for (const series of data.measurementSeriesByArea.neurotech) {
        assert.ok(html.includes(series.title))
        assert.ok(html.includes(series.coverage))
        for (const track of series.tracks) for (const point of track.points) assert.ok(html.includes(point.sourceUrl.replaceAll('&', '&amp;')))
      }
      assert.equal((html.match(/data-line=/g) ?? []).length, 1, 'only Neuralink has a compatible multi-point history')
      assert.doesNotMatch(html, /NaN|Infinity/)
    }
  }
  const css = readFileSync('src/app/globals.css', 'utf8')
  assert.match(css, /grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 20rem\), 1fr\)\)/)
  assert.match(css, /\.measurement-data[\s\S]*overflow-wrap: anywhere/)
})

test('only compatible within-track implant histories are connected, with qualifiers and precision retained', () => {
  const series = fixture()
  Object.assign(series[0], { id: 'bci-implants', instrument: 'revealed_commitments', lens: 'adoption', unit: 'participants', chartKind: 'line', scale: 'linear' })
  series[0].tracks[0].points.push({ ...series[0].tracks[0].points[0], date: '2025-09-01', datePrecision: 'month', value: 2, qualifier: 'at-least' })
  series[0].tracks.push({ ...structuredClone(series[0].tracks[0]), id: 'different-cohort', label: 'Different cohort' })
  const html = render(series)
  assert.equal((html.match(/<polyline/g) ?? []).length, 2, 'one line per compatible track, never one across cohorts')
  assert.match(html, /data-line="test-track"/)
  assert.match(html, /<text[^>]*>0<\/text>/, 'linear baseline is labeled zero, not scientific notation')
  assert.match(html, /data-line="different-cohort"/)
  assert.equal((html.match(/data-point=/g) ?? []).length, 4)
  assert.match(html, /≥ 2 participants/)
  assert.match(html, /Sep 2025 \(month precision; publication\)/)
  series[0].chartKind = 'scatter'
  assert.doesNotMatch(render(series), /<polyline/)
})

test('a single sourced tissue point remains visible on a log chart with precision, coverage and native source disclosure', () => {
  const html = render(fixture())
  assert.match(html, /data-measurement="tissue-mapped"/)
  assert.match(html, /data-scale="log"/)
  assert.match(html, /<svg[^>]*role="img"/)
  assert.match(html, /data-point="test-track"/)
  assert.doesNotMatch(html, /NaN|Infinity|<polyline/)
  for (const copy of ['Test coverage', 'Test caveat', 'Performance curves', 'capability', 'mm³', 'Log scale', 'Test definition']) assert.ok(html.includes(copy), copy)
  assert.match(html, /<details/)
  assert.match(html, /<table/)
  assert.match(html, /<a[^>]*href="https:\/\/example.org\/test"/)
  assert.match(html, /2024 \(year precision; publication\)/)
  assert.doesNotMatch(html, /2024-01-01/)
  assert.equal(render([]), '')
})
