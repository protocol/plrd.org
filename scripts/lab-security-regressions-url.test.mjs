import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const { safeLabHttpsUrl, validateLabData } = source('lib/lab-validation.ts')
const { createLabRecordWriter } = source('lib/lab-records.ts')
globalThis.fetch = async () => { throw new Error('Live network forbidden') }
const origin = 'https://lab.example.org'
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
globalThis.window = { location: { origin } }
const note = { text: 'Synthetic research link', field: 'neurotech', postType: 'question' }
const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: 'true' })

test('F1: credential fragments and encoded hash-router parameter names fail before any writer transport', async () => {
  for (const fragment of ['access_token=MOCK', '/return?access_token=MOCK', '/return?%61ccess%5ftoken=MOCK', '?refresh_token=MOCK', 'methods&api_key=MOCK', '/route?topic=neuro&%73ignature=MOCK', 'id_token=MOCK']) {
    const url = `https://example.org/#${fragment}`
    let requests = 0
    const session = { sub: did, did, getTokenInfo: async () => ({ sub: did, aud: 'https://pds.example.org', scope: 'atproto repo:org.plresearch.lab.note?action=create' }), fetchHandler: async () => { requests++; throw new Error('Unexpected transport') } }
    assert.throws(() => safeLabHttpsUrl(url), /credential-bearing/, fragment)
    assert.throws(() => validateLabData('note', { ...note, evidenceUrl: url }), /credential-bearing/)
    await assert.rejects(createLabRecordWriter(session, async () => config).publish('note', { ...note, evidenceUrl: url }, { public: true, experimental: true, did, action: 'create' }), /credential-bearing/)
    assert.equal(requests, 0, fragment)
  }
})

test('F1: harmless research anchors and query links remain byte-for-byte intact', () => {
  for (const url of ['https://example.org/paper#methods', 'https://example.org/paper#:~:text=neural%20recording', 'https://example.org/#/paper?section=methods', 'https://scholar.google.com/citations?user=Researcher&hl=en', 'https://doi.org/10.1000/example#section-2']) {
    assert.equal(safeLabHttpsUrl(url), url)
    assert.equal(validateLabData('note', { ...note, evidenceUrl: url }).evidenceUrl, url)
  }
})
