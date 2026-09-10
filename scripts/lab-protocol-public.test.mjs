import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
const uri = `at://${did}/org.plresearch.lab.note/draft-1`
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa'
const value = { $type: 'org.plresearch.lab.note', community: 'https://www.plrd.org/lab/', createdAt: '2026-09-10T00:00:00.000Z', text: 'Public synthetic fixture', postType: 'question', field: 'neurotech' }
const pds = 'https://morel.us-east.host.bsky.network'
const doc = { id: did, service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: pds }] }

test('second visitor inspects an exact public AT URI with the official resolver and Agent, without login or local drafts', async () => {
  globalThis.window = {}
  const calls = []
  const fetcher = async (input, init) => {
    calls.push([String(input), init])
    return Response.json(String(input).startsWith('https://plc.directory/') ? doc : { uri, cid, value })
  }
  const reader = source('lib/lab-protocol.ts').createLabPublicReader(fetcher)
  const view = await reader.readRecord(uri)
  assert.equal(view.uri, uri)
  assert.equal(view.cid, cid)
  assert.equal(view.authorDid, did)
  assert.equal(view.kind, 'note')
  assert.equal(view.data.text, value.text)
  assert.equal(view.provenance, 'pds-https-unverified-signature')
  assert.equal(calls.length, 2)
  assert.match(calls[1][0], /com.atproto.repo.getRecord/)
  for (const [, init] of calls) { assert.equal(init.credentials, 'omit'); assert.equal(init.redirect, 'error'); assert.equal(new Headers(init.headers).has('authorization'), false) }
  delete globalThis.window
})

test('untrusted PDS payloads are size bounded before SDK JSON decoding', async () => {
  globalThis.window = {}
  const reader = source('lib/lab-protocol.ts').createLabPublicReader(async () => new Response(' '.repeat(1_048_577), { headers: { 'content-type': 'application/json' } }))
  await assert.rejects(() => reader.readRecord(uri), /exceeds/)
  delete globalThis.window
})

test('malformed identifiers, private endpoints, wrong DIDs and unexpected record fields fail closed', async () => {
  const { createLabPublicReader } = source('lib/lab-protocol.ts')
  globalThis.window = {}
  let calls = 0
  let body = doc
  const reader = createLabPublicReader(async input => { calls++; return Response.json(String(input).startsWith('https://plc.directory/') ? body : { uri, cid, value: { ...value, reviewed: true } }) })
  for (const bad of [uri + '?x=y', uri.replace(did, 'someone.bsky.social'), uri.replace('note', 'unknown'), uri.replace('draft-1', '..'), uri.replace(did, 'did:web:127.0.0.1'), uri.replace(did, 'did:web:example.org%3A443')]) await assert.rejects(() => reader.readRecord(bad))
  assert.equal(calls, 0)
  for (const endpoint of ['http://example.org', 'https://127.0.0.1', 'https://[::1]', 'https://example.local', 'https://example.org/proxy', 'https://u:p@example.org']) {
    body = { ...doc, service: [{ ...doc.service[0], serviceEndpoint: endpoint }] }
    await assert.rejects(() => reader.readRecord(uri))
  }
  body = { ...doc, id: 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb' }
  await assert.rejects(() => reader.readRecord(uri), /mismatch|does not match/)
  body = doc
  await assert.rejects(() => reader.readRecord(uri), /Unexpected/)
  delete globalThis.window
  await assert.rejects(() => reader.readRecord(uri), /browser/)
})

test('public notebook lists one bounded collection page with explicit cursor, no indexer', async () => {
  globalThis.window = {}
  const calls = []
  const reader = source('lib/lab-protocol.ts').createLabPublicReader(async (input) => {
    calls.push(String(input))
    return Response.json(String(input).startsWith('https://plc.directory/') ? doc : { records: [{ uri, cid, value }], cursor: 'next-page' })
  })
  const page = await reader.listRecords(did, 'note', { limit: 10, cursor: 'first-page' })
  assert.equal(page.records[0].uri, uri)
  assert.equal(page.cursor, 'next-page')
  assert.equal(page.authorDid, did)
  assert.equal(page.kind, 'note')
  const request = new URL(calls[1])
  assert.equal(request.pathname, '/xrpc/com.atproto.repo.listRecords')
  assert.equal(request.searchParams.get('cursor'), 'first-page')
  assert.equal(request.searchParams.get('limit'), '10')
  await assert.rejects(() => reader.listRecords(did, 'note', { limit: 101 }))
  assert.equal(calls.length, 2)
  delete globalThis.window
})
