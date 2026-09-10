import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa'
const origin = 'https://lab.example.org'
const note = { text: 'Synthetic test, not a live publication.', postType: 'question', field: 'neurotech' }
const consent = { public: true, experimental: true, did, action: 'create' }
function harness({ scope = 'atproto repo:org.plresearch.lab.note?action=create', readPatch = {}, configPatch = {}, initial, deleteMode = 'ok' } = {}) {
  globalThis.window = { location: { origin } }
  const calls = []
  let stored = initial
  let deleted = false
  const session = { sub: did, did, getTokenInfo: async () => ({ sub: did, scope, aud: 'https://pds.example.org' }), fetchHandler: async (path, init) => {
    calls.push([path, init])
    if (path.includes('createRecord') || path.includes('putRecord')) {
      const body = await new Response(init.body).json()
      stored = { uri: `at://${did}/${body.collection}/${body.rkey}`, cid, value: body.record }
      return Response.json({ uri: stored.uri, cid })
    }
    if (path.includes('deleteRecord')) { deleted = true; return Response.json({}) }
    if (deleted && deleteMode === 'ok') return Response.json({ error: 'RecordNotFound', message: 'Record not found' }, { status: 400 })
    if (deleted && deleteMode === 'outage') return Response.json({ error: 'InternalServerError' }, { status: 500 })
    return Response.json({ ...stored, ...readPatch })
  } }
  const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: 'true' })
  const writer = source('lib/lab-records.ts').createLabRecordWriter(session, async () => ({ ...config, ...configPatch }))
  return { writer, calls, session }
}

test('own deletion requires exact DID/CID consent and confirms RecordNotFound, not an outage', async () => {
  const initial = { uri: `at://${did}/org.plresearch.lab.note/test`, cid, value: { ...note, $type: 'org.plresearch.lab.note', community: 'https://www.plrd.org/lab/', createdAt: '2026-01-01T00:00:00.000Z' } }
  const scope = 'atproto repo:org.plresearch.lab.note?action=delete'
  const deleteConsent = { ...consent, action: 'delete', expectedCid: cid }
  const { writer, calls } = harness({ scope, initial })
  await assert.rejects(() => writer.delete(initial.uri.replace(did, 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'), deleteConsent), /own/)
  assert.equal(calls.length, 0)
  await assert.rejects(() => writer.delete(initial.uri, { ...deleteConsent, expectedCid: 'stale' }), /changed/)
  assert.equal(calls.length, 1)
  const receipt = await writer.delete(initial.uri, deleteConsent)
  assert.equal(receipt.deleted, true)
  assert.equal(receipt.uri, initial.uri)
  assert.equal(receipt.verified, true)
  const request = calls.find(([path]) => path.includes('deleteRecord'))
  assert.equal((await new Response(request[1].body).json()).swapRecord, cid)
  for (const deleteMode of ['outage', 'still-present']) {
    const h = harness({ scope, initial, deleteMode })
    await assert.rejects(() => h.writer.delete(initial.uri, deleteConsent), error => error.name === 'LabWriteVerificationError')
  }
})

test('profile update preserves creation date, checks editor CID and uses an atomic swap', async () => {
  const profile = { workingOn: 'Test', lookingFor: 'Test', interests: [] }
  const initial = { uri: `at://${did}/org.plresearch.lab.profile/self`, cid, value: { ...profile, $type: 'org.plresearch.lab.profile', community: 'https://www.plrd.org/lab/', createdAt: '2025-01-01T00:00:00.000Z' } }
  const { writer, calls } = harness({ scope: 'atproto repo:org.plresearch.lab.profile?action=update', initial })
  const receipt = await writer.publish('profile', { ...profile, workingOn: 'Updated' }, { ...consent, action: 'update', expectedCid: cid })
  assert.equal(receipt.record.workingOn, 'Updated')
  assert.equal(receipt.record.createdAt, initial.value.createdAt)
  assert.equal(receipt.uri, initial.uri)
  assert.equal(calls.length, 3)
  assert.match(calls[1][0], /putRecord/)
  assert.equal((await new Response(calls[1][1].body).json()).swapRecord, cid)
})

test('malformed input, absent consent, stale origin, disabled publication and absent grant make no PDS writes', async () => {
  for (const bad of [undefined, {}, { ...consent, did: 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb' }, { ...consent, public: false }, { ...consent, experimental: false }]) {
    const { writer, calls } = harness()
    await assert.rejects(() => writer.publish('note', note, bad), /consent/)
    assert.equal(calls.length, 0)
  }
  for (const opts of [{ scope: 'atproto' }, { scope: 'atproto repo:org.plresearch.lab.app?action=create' }, { configPatch: { canPublish: false } }, { configPatch: { origin: 'https://other.example.org' } }]) {
    const { writer, calls } = harness(opts)
    await assert.rejects(() => writer.publish('note', note, consent))
    assert.equal(calls.length, 0)
  }
  const { writer, calls } = harness()
  await assert.rejects(() => writer.publish('note', { ...note, authorDid: did }, consent), /Unexpected/)
  assert.equal(calls.length, 0)
})

test('URI, CID and record-content readback mismatches never return a success receipt', async () => {
  for (const readPatch of [{ cid: 'bafyreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, { uri: `at://${did}/org.plresearch.lab.note/wrong` }, { value: { ...note, text: 'Different', $type: 'org.plresearch.lab.note', community: 'https://www.plrd.org/lab/', createdAt: '2026-01-01T00:00:00.000Z' } }]) {
    const { writer } = harness({ readPatch })
    await assert.rejects(() => writer.publish('note', note, consent), error => error.name === 'LabWriteVerificationError' && error.uri.startsWith(`at://${did}/`))
  }
})

test('explicit public create returns exact current PDS readback, not just a successful write response', async () => {
  const { writer, calls } = harness()
  const receipt = await writer.publish('note', note, consent)
  assert.equal(receipt.verified, true)
  assert.equal(receipt.verification, 'pds-readback')
  assert.equal(receipt.record.text, note.text)
  assert.equal(receipt.cid, cid)
  assert.equal(calls.length, 2)
  assert.match(calls[1][0], /getRecord/)
  assert.equal(new URL(calls[1][0], origin).searchParams.has('cid'), false)
  const body = await new Response(calls[0][1].body).json()
  assert.equal(body.repo, did)
  assert.equal(body.validate, false) // locally validated experimental lexicons
  assert.equal(body.record.$type, 'org.plresearch.lab.note')
})
