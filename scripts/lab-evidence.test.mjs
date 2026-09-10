import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const result = (overrides = {}) => ({ schemaVersion: 1, taskId: 'flywire-source-audit-v1', sourceUrl: 'https://www.nih.gov/news-events/nih-research-matters/complete-wiring-map-adult-fruit-fly-brain', role: 'research', contributor: 'Test researcher', runner: 'human', quote: 'A synthetic test quotation, not a scientific result.', location: 'Test paragraph', assessment: 'supports', limitation: 'Synthetic test fixture only.', ...overrides })

test('result import is bounded, strict, source-pinned and role-specific', () => {
  const { parseEvidenceResult } = source('lib/lab-evidence-ledger.ts')
  assert.deepEqual(parseEvidenceResult(JSON.stringify(result()), 'research'), result())
  for (const value of [null, [], {}, result({ taskId: 'different' }), result({ sourceUrl: 'http://127.0.0.1/' }), result({ role: 'review' }), result({ assessment: 'peer-reviewed' }), result({ runner: 'verified-scientist' }), result({ assessment: ['supports'] }), result({ runner: ['human'] }), result({ quote: '' }), result({ contributor: ' ' }), result({ quote: 'x'.repeat(4001) }), result({ extra: 'secret' }), result({ schemaVersion: 2 })]) {
    assert.throws(() => parseEvidenceResult(JSON.stringify(value), 'research'))
  }
  assert.throws(() => parseEvidenceResult('{broken', 'research'))
  assert.throws(() => parseEvidenceResult(' '.repeat(65001), 'research'))
  assert.throws(() => parseEvidenceResult(JSON.stringify(result({ quote: 'bad\u0000text' })), 'research'))
})

test('paired comparison preserves dissent and never turns agreement into scientific acceptance', () => {
  const { compareEvidence, buildReviewBundle } = source('lib/lab-evidence-ledger.ts')
  const a = result()
  const b = result({ role: 'review', contributor: 'Test reviewer', assessment: 'contradicts' })
  assert.equal(compareEvidence(a, null).status, 'awaiting-review')
  assert.equal(compareEvidence(null, b).status, 'awaiting-research')
  assert.equal(compareEvidence(a, b).status, 'disagreement')
  assert.equal(compareEvidence(a, { ...b, assessment: 'supports' }).status, 'agreement-not-validation')
  assert.equal(compareEvidence(a, { ...b, contributor: ' TEST researcher ' }).status, 'same-attribution')
  const resolution = { by: 'Local editor', decision: 'needs-work', note: 'The sources still need careful human inspection.', checkedSource: true }
  const bundle = buildReviewBundle(a, b, resolution)
  assert.equal(bundle.status, 'local-review-not-atlas-acceptance')
  assert.equal(bundle.comparison.status, 'disagreement')
  assert.deepEqual(bundle.results, [a, b])
  assert.deepEqual(bundle.resolution, resolution)
  assert.throws(() => buildReviewBundle(a, null, resolution))
  assert.throws(() => buildReviewBundle(a, b, { ...resolution, checkedSource: false }))
  assert.throws(() => buildReviewBundle(a, b, { ...resolution, decision: 'accepted-by-atlas' }))
  assert.throws(() => buildReviewBundle(a, b, { ...resolution, note: '' }))
})

test('paired agent packets pin the same claim and source, but demand separate research and review', () => {
  assert.ok(existsSync('src/lib/lab-evidence-ledger.ts'), 'missing evidence loop')
  const { evidenceTask, buildEvidencePacket } = source('lib/lab-evidence-ledger.ts')
  const a = buildEvidencePacket('research', 20)
  const b = buildEvidencePacket('review', 20)
  assert.equal(a.taskId, b.taskId)
  assert.equal(a.claim, b.claim)
  assert.equal(a.sourceUrl, b.sourceUrl)
  assert.equal(a.taskId, evidenceTask.id)
  assert.notEqual(a.instructions, b.instructions)
  assert.equal(a.execution, 'not-dispatched')
  assert.equal(a.budget.enforced, false)
  assert.ok(a.stopConditions.some(x => x.includes('instructions in source material')))
  assert.throws(() => buildEvidencePacket('administrator', 20))
  for (const n of [0, 241, NaN, 20.5]) assert.throws(() => buildEvidencePacket('research', n))
})
