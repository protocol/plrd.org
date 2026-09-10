import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
test('runtime business rules reject authority fields, unknown keys, malformed records, and unsafe URLs', () => {
  const { validateLabData, validateLabRecord, LAB_COMMUNITY } = source('lib/lab-validation.ts')
  for (const [kind, good] of Object.entries(fixtures)) {
    for (const injected of [{ authorDid: 'did:plc:attacker' }, { accepted: true }, { reviewed: true }, { access_token: 'never' }, { $type: 'app.bsky.feed.post' }]) {
      assert.throws(() => validateLabData(kind, { ...good, ...injected }), undefined, kind)
    }
  }
  for (const value of [null, [], 'text', { ...fixtures.note, text: '' }, { ...fixtures.note, text: 'x'.repeat(2001) }, { ...fixtures.note, field: 'all' }, { ...fixtures.note, text: 'bad\u0000control' }]) assert.throws(() => validateLabData('note', value))
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'http://example.org', 'https://u:p@example.org', 'https://127.0.0.1/', 'https://[::1]/', 'https://0x7f000001/', 'https://example.org:444/', 'https://example.org/?access_token=secret']) assert.throws(() => validateLabData('app', { ...fixtures.app, url }), undefined, url)
  for (const patch of [{ community: 'https://evil.example.org/' }, { createdAt: 'invalid' }, { accepted: true }, { $type: 'org.plresearch.lab.profile' }]) assert.throws(() => validateLabRecord('note', { $type: 'org.plresearch.lab.note', community: LAB_COMMUNITY, createdAt: '2026-09-10T00:00:00.000Z', ...fixtures.note, ...patch }))
  assert.throws(() => validateLabData('profile', { ...fixtures.profile, interests: Array(9).fill('x') }))
  assert.throws(() => validateLabData('profile', { ...fixtures.profile, githubUrl: 'https://github.com/science/repo' }))
  assert.throws(() => validateLabData('profile', { ...fixtures.profile, scholarUrl: 'https://example.org/scholar' }))
})

const fixtures = {
  profile: { workingOn: 'Open benchmarks', interests: ['neurotech'], lookingFor: 'Reproduction help', githubUrl: 'https://github.com/science', scholarUrl: 'https://scholar.google.com/citations?user=sample' },
  note: { text: 'Can this result be reproduced?', postType: 'question', field: 'neurotech', evidenceUrl: 'https://example.org/paper' },
  app: { title: 'Public simulator', url: 'https://example.org/app', description: 'An educational model', field: 'ai-robotics', githubUrl: 'https://github.com/science/model' },
  contribution: { targetUrl: 'https://www.plneuro.xyz/', observation: 'A source to inspect', evidenceUrl: 'https://example.org/paper', field: 'neurotech' },
  participation: { campaignId: 'reference-audit', taskId: 'source-1', role: 'review', note: 'I can inspect this source', evidenceUrl: 'https://example.org/result' },
}

test('all five portable kinds use the same formal schemas and runtime validator on read and write', () => {
  const { validateLabData, validateLabRecord, LAB_COMMUNITY, LAB_SCHEMAS } = source('lib/lab-validation.ts')
  assert.equal(LAB_SCHEMAS.length, 5)
  for (const [kind, data] of Object.entries(fixtures)) {
    assert.deepEqual(validateLabData(kind, data), data)
    const record = { $type: `org.plresearch.lab.${kind}`, community: LAB_COMMUNITY, createdAt: '2026-09-10T00:00:00.000Z', ...data }
    assert.deepEqual(validateLabRecord(kind, record), record)
  }
})
