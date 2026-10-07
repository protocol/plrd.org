import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'
import { readFileSync } from 'node:fs'

test('selectable preview cards animate from a stack, with reduced-motion support', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  assert.match(css, /\.chart-fan-card\s*\{[^}]*transition:[^}]*transform/s)
  assert.doesNotMatch(css, /\.chart-fan-card\s*\{[^}]*rotate\(/s, 'sideways previews do not rotate or scale')
  assert.match(css, /\.chart-deck\[data-expanded="true"\] \.chart-fan-card[^}]*transform: translateX\(calc\(var\(--fan-index\) \* var\(--gallery-step\)\)\)/s)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.chart-fan-card[^}]*transition: none/s)
})

test('Revealed commitments keeps a historical reading and a cohort chart without inventing a time series', async () => {
  const data = await source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
  const record = data.recordsByArea.neurotech.find(r => r.instrument === 'revealed_commitments')
  const gallery = source('lib/instrument-gallery.ts').instrumentGallery(record, data.measurementSeriesByArea.neurotech)
  assert.equal(gallery.chartCount, 1)
  assert.equal(gallery.items.length, 2)
  assert.equal(gallery.items[0].kind, 'reading')
  assert.equal(gallery.items[1].kind, 'measurement')
  assert.equal(record.series, undefined)
})
