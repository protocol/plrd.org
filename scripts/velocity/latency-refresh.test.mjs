import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { source } from './test-source-loader.mjs'

const { loadAllLatency, withLatency } = source('lib/velocity-latency.ts')
const { instrumentsForArea } = source('lib/velocity-instruments.ts')
const readCorpus = (file) => JSON.parse(fs.readFileSync(`src/data/velocity/corpora/${file}`, 'utf8'))

test('a held evidence corpus cannot produce a chart even with parseable legacy dates', () => {
  const original = fs.readFileSync
  fs.readFileSync = function(file, ...args) {
    const text = original.call(this, file, ...args)
    if (String(file).endsWith('dhr-latency-crypto.json')) {
      const corpus = JSON.parse(text)
      corpus.meta.approvedForPlot = false
      return JSON.stringify(corpus)
    }
    return text
  }
  try { assert.equal(loadAllLatency()['digital-human-rights'], undefined) }
  finally { fs.readFileSync = original }
})


test('Neurotech review preserves corrected evidence without inventing a comparable latency plot', () => {
  assert.equal(loadAllLatency().neurotech, undefined)
  const corpus = readCorpus('neuro-latency-modalities.json')
  assert.equal(corpus.meta.approvedForPlot, false)
  assert.equal(corpus.entries.length, 4)
  assert.equal(corpus.entries[0].humanImplant.date, '1996-12-04')
  assert.equal(corpus.entries[0].selectedPreclinicalDisclosure.date, '1992-07')
  assert.equal(corpus.entries[2].humanImplant.date, '2019-08')
  for (const row of corpus.entries) {
    assert.equal(row.animalEventDate, null)
    assert.equal(row.approvedForPlot, false)
  }
  const record = withLatency(instrumentsForArea('neurotech'), loadAllLatency().neurotech).find(r => r.instrument === 'latency_compression')
  assert.equal(record.state, 'unwired')
  assert.equal(record.series, undefined)
  assert.equal(record.direction, undefined)
  assert.equal(record.measuredAt, undefined)
  assert.match(record.blocker, /publication dates/)
  assert.ok(record.sources.length)
})

test('AI and governance retain honest evidence gaps rather than claiming a run will make a trend', () => {
  const eg = instrumentsForArea('economies-governance').find(r => r.instrument === 'latency_compression')
  const ai = instrumentsForArea('ai-robotics').find(r => r.instrument === 'latency_compression')
  for (const r of [eg, ai]) {
    assert.equal(r.state, 'unwired')
    assert.equal(r.series, undefined)
    assert.equal(r.checkedAt, '2026-10-28')
    assert.ok(r.sources.length)
  }
  assert.match(eg.blocker, /comparable pilot and production boundaries/)
  assert.doesNotMatch(eg.blocker, /Too few completed/)
  assert.match(ai.blocker, /first commit does not establish/)
  assert.doesNotMatch(ai.blocker, /awaiting a run/)
})

test('DHR refresh includes verified stable 2026 releases and preserves the OpenSSL endpoint', () => {
  const data = loadAllLatency()['digital-human-rights']
  assert.equal(data.n, 22)
  assert.equal(data.lastToDate, '2026-10-23')
  assert.equal(data.overallMedianYears, 1.75)
  assert.deepEqual(data.series.at(-1), { x: 2026, y: 0.12 })
  const corpus = readCorpus('dhr-latency-crypto.json')
  assert.equal(corpus.entries.find(e => e.primitive === 'SHA-3 / SHAKE').standardDate, '2015-08-04')
  assert.equal(new Set(corpus.entries.map(e => e.primitive)).size, 22)
  for (const row of corpus.entries) {
    assert.match(row.impl, /^OpenSSL /)
    assert.ok(Date.parse(row.implDate) >= Date.parse(row.standardDate))
    assert.ok(Date.parse(row.implDate) <= Date.parse('2026-10-28'))
    assert.match(row.standardEvidenceUrl, /^https:\/\//)
    assert.match(row.implEvidenceUrl, /^https:\/\//)
    assert.equal(row.checkedAt, '2026-10-28')
  }
  const record = withLatency(instrumentsForArea('digital-human-rights'), data).find(r => r.instrument === 'latency_compression')
  assert.match(record.metric, /^Years /)
  assert.match(record.trend, /selected sample/)
  assert.match(record.trend, /month/)
  assert.doesNotMatch(record.trend, /means the field/)
})
