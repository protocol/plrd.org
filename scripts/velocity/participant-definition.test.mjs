import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'

test('67-participant observation is the study-defined implantable BCI stock through December 2023, not a current rate', () => {
  const { instrumentsForArea, INSTRUMENT_BY_ID } = source('lib/velocity-instruments.ts')
  const record = instrumentsForArea('neurotech').find(r => r.instrument === 'revealed_commitments')
  assert.match(record.metric, /implantable BCI/)
  assert.doesNotMatch(record.metric, /long-term|intracortical/)
  assert.match(record.trend, /communication, motor or sensory restoration/)
  assert.match(record.trend, /excludes short-term diagnostic ECoG/)
  assert.match(record.value, /67.*December 2023/)
  assert.equal(record.measuredAt, '2023-12-31')
  assert.match(record.window, /December 2023/)
  assert.match(record.trend, /endovascular.*ECoG/)
  assert.doesNotMatch(record.trend, /now accelerating|Neuralink 21|150×/)
  assert.equal(record.direction, undefined)
  assert.equal(record.series, undefined)
  assert.match(INSTRUMENT_BY_ID.performance_curves.description, /Multiple.*capability/)
  assert.doesNotMatch(INSTRUMENT_BY_ID.performance_curves.description, /single cost that everything downstream waits on/)
})

test('absence of one gating cost leaves governance performance measures unwired, not impossible', () => {
  const { instrumentsForArea } = source('lib/velocity-instruments.ts')
  const record = instrumentsForArea('economies-governance').find(r => r.instrument === 'performance_curves')
  assert.equal(record.state, 'unwired')
  assert.match(record.candidateMetric, /cost|capability/i)
  assert.match(record.blocker, /units.*windows/)
  assert.equal(record.value, undefined)
})
