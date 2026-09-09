import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'
import { readFileSync } from 'node:fs'

test('deck layers fan on hover and keyboard focus, with all motion disabled for reduced motion', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  assert.match(css, /\.instrument-stack-layer\s*\{[^}]*transition:[^}]*transform/s)
  assert.match(css, /\.instrument-preview:is\(:hover, :focus-visible\) \.instrument-stack-layer\s*\{[^}]*rotate\(/s)
  assert.match(css, /\.instrument-preview:is\(:hover, :focus-visible\) \.instrument-preview-face\s*\{[^}]*border-color:/s)
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('.instrument-previews')))
  assert.match(reduced, /\.instrument-stack-layer[^}]*transition:\s*none/s)
  assert.match(reduced, /\.instrument-preview:is\(:hover, :focus-visible\) \.instrument-stack-layer[^}]*transform:/s)
})

test('Revealed commitments keeps the historical reading beside the cohort chart without calling it a time series', async () => {
  const data = await source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
  const record = data.recordsByArea.neurotech.find(r => r.instrument === 'revealed_commitments')
  const { instrumentGallery } = source('lib/instrument-gallery.ts')
  const gallery = instrumentGallery(record, data.measurementSeriesByArea.neurotech)
  assert.equal(gallery.chartCount, 1, 'the historical scalar reading is not a second chart')
  assert.equal(gallery.items.length, 2, 'the reading and the cohort plot are two contact-sheet views')
  assert.equal(gallery.items[0].kind, 'reading')
  assert.equal(gallery.items[1].kind, 'measurement')
  assert.equal(record.series, undefined, 'no fabricated historical series')
})
