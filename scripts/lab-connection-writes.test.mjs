import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', subject = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa'
const origin = 'https://lab.example.org', collection = 'app.bsky.graph.follow'
globalThis.window = { location: { origin } }
const consent = { public: true, did, subject, action: 'create' }
const storage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,v), removeItem: k => m.delete(k) } }
function harness(options = {}) {
  assert.ok(existsSync('src/lib/lab-connections.ts'), 'native Bluesky connection implementation missing')
  const api = source('lib/lab-connections.ts')
  const rows = new Map((options.initial ?? []).map(r => [r.uri,r]))
  const calls = [], store = options.storage ?? storage()
  let current = true, mode = options.mode
  const session = { sub: did, did, getTokenInfo: async () => ({ sub: did, aud: 'https://pds.example.org', scope: options.scope ?? 'atproto repo:app.bsky.graph.follow?action=create&action=delete' }), fetchHandler: async (path, init) => {
    const u = new URL(path, 'https://pds.example.org'), method = u.pathname.split('.').at(-1)
    const body = init?.body ? await new Response(init.body).json() : null
    calls.push({ u, method, init, body })
    if (method === 'listRecords') return Response.json({ records: [...rows.values()], ...(options.cursor ? { cursor: options.cursor } : {}) })
    const uri = `at://${did}/${collection}/${body?.rkey ?? u.searchParams.get('rkey')}`
    if (method === 'createRecord') {
      if (mode !== 'uncommitted') rows.set(uri, { uri, cid, value: body.record })
      if (mode === 'lost' || mode === 'uncommitted') throw Error('Synthetic lost response')
      if (mode === 'hanging') return new Promise(() => {})
      return Response.json({ uri, cid })
    }
    if (method === 'deleteRecord') { rows.delete(uri); return Response.json({}) }
    if (mode === 'read-outage' && calls.some(c => c.method === 'createRecord' || c.method === 'deleteRecord')) return Response.json({ error: 'InternalServerError' }, { status: 500 })
    const row = rows.get(uri)
    return row ? Response.json({ ...row, ...(options.readPatch ?? {}) }) : Response.json({ error: 'RecordNotFound' }, { status: 400 })
  } }
  // Leave room for cold SDK/body-reader scheduling under shared CI load; the
  // hanging-write fixture still exercises the real bounded deadline below.
  const deps = { loadConfig: async () => ({ ...source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin }), ...(options.configPatch ?? {}) }), storage: store, isCurrent: () => current, lock: async (_key, work) => work(), transport: { timeoutMs: 500 } }
  const client = api.createLabConnectionClient(session, deps)
  return { api, client, session, deps, calls, rows, store, setMode: m => { mode = m }, invalidate: () => { current = false } }
}
test('ambiguous create persists exact recovery across client recreation, never automatically retries or claims absence', async () => {
  for (const mode of ['lost', 'uncommitted', 'hanging', 'read-outage']) {
    const h = harness({ mode })
    await assert.rejects(() => h.client.follow(subject, consent), e => e.name === 'LabConnectionUnknownError')
    const pending = h.client.pending(subject)
    assert.equal(pending.action, 'create')
    const again = h.api.createLabConnectionClient(h.session, h.deps)
    await assert.rejects(() => again.follow(subject, consent), e => e.name === 'LabConnectionUnknownError')
    assert.equal(h.calls.filter(c => c.method === 'createRecord').length, 1)
    h.setMode('ok')
    if (mode === 'uncommitted') {
      await assert.rejects(() => again.recover(subject), e => e.name === 'LabConnectionUnknownError')
      assert.ok(again.pending(subject), 'absence is not proof a delayed create cannot commit')
    } else {
      const recovered = await again.recover(subject)
      assert.equal(recovered.status, 'following'); assert.equal(recovered.record.uri, pending.uri)
      assert.equal(again.pending(subject), null)
    }
    assert.equal(h.calls.filter(c => c.method === 'createRecord').length, 1)
  }
})

test('own unfollow checks reviewed URI/CID, CAS deletes, and exact not-found readback; never deletes others', async () => {
  const h = harness({ initial: [existing] })
  const reviewed = { public: true, did, subject, action: 'delete', uri: existing.uri, expectedCid: cid }
  for (const patch of [{ uri: existing.uri.replace(did,subject) }, { expectedCid: 'stale' }, { subject: did }]) {
    await assert.rejects(() => h.client.unfollow(subject, { ...reviewed, ...patch }))
    assert.equal(h.calls.filter(c => c.method === 'deleteRecord').length, 0)
  }
  const receipt = await h.client.unfollow(subject, reviewed)
  assert.equal(receipt.status, 'not-following')
  assert.equal(receipt.verification, 'pds-record-not-found')
  assert.equal(h.calls.find(c => c.method === 'deleteRecord').body.swapRecord, cid)
  const outage = harness({ initial: [existing], mode: 'read-outage' })
  await assert.rejects(() => outage.client.unfollow(subject, reviewed), e => e.name === 'LabConnectionUnknownError')
  await assert.rejects(() => outage.client.unfollow(subject, reviewed), e => e.name === 'LabConnectionUnknownError')
  outage.setMode('ok')
  assert.equal((await outage.client.recover(subject)).status, 'not-following')
  assert.equal(outage.calls.filter(c => c.method === 'deleteRecord').length, 1)
})

test('incomplete pagination, blocked recovery storage, lost identity and readback mismatch cannot produce a new success', async () => {
  const looping = harness({ cursor: 'same' }); await assert.rejects(() => looping.client.follow(subject, consent), /cursor/)
  assert.equal(looping.calls.filter(c => c.body).length, 0)
  const blocked = harness({ storage: { getItem: () => null, setItem: () => { throw Error('blocked') }, removeItem: () => {} } })
  await assert.rejects(() => blocked.client.follow(subject, consent), /storage|recovery/i)
  assert.equal(blocked.calls.filter(c => c.body).length, 0)
  const signedOut = harness(); signedOut.invalidate()
  await assert.rejects(() => signedOut.client.follow(subject, consent), /signed out/)
  assert.equal(signedOut.calls.length, 0)
  const mismatch = harness({ readPatch: { cid: 'bafyreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } })
  await assert.rejects(() => mismatch.client.follow(subject, consent), e => e.name === 'LabConnectionUnknownError')
  await assert.rejects(() => mismatch.client.recover(subject), e => e.name === 'LabConnectionUnknownError')
})

const existing = { uri: `at://${did}/${collection}/3labexisting2a`, cid, value: { $type: collection, subject, createdAt: '2026-01-01T00:00:00.000Z' } }

test('local security probes: oversized/mismatched readback, concurrent action, logout mid-preflight, and unavailable Web Lock fail safely', async () => {
  for (const readPatch of [{ uri: existing.uri.replace(did, subject) }, { value: { ...existing.value, subject: did } }, { value: { ...existing.value, extra: 'x'.repeat(1_048_576) } }]) {
    const h = harness({ readPatch }); await assert.rejects(() => h.client.follow(subject, consent), e => e.name === 'LabConnectionUnknownError')
    assert.ok(h.client.pending(subject)); assert.equal(h.calls.filter(c => c.method === 'createRecord').length, 1)
  }
  const concurrent = harness({ mode: 'hanging' })
  const first = assert.rejects(() => concurrent.client.follow(subject, consent), e => e.name === 'LabConnectionUnknownError')
  await new Promise(r => setImmediate(r))
  await assert.rejects(() => concurrent.client.follow(subject, consent), /already in progress/)
  await first
  assert.equal(concurrent.calls.filter(c => c.method === 'createRecord').length, 1)
  const logout = harness(), original = logout.session.fetchHandler
  logout.session.fetchHandler = async (...args) => { const response = await original(...args); logout.invalidate(); return response }
  await assert.rejects(() => logout.client.follow(subject, consent), /signed out/)
  assert.equal(logout.calls.filter(c => c.body).length, 0)
  const noLock = harness()
  const unlocked = noLock.api.createLabConnectionClient(noLock.session, { ...noLock.deps, lock: undefined })
  const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true })
  try { await assert.rejects(() => unlocked.follow(subject, consent), /browser|lock/i) }
  finally { if (nav) Object.defineProperty(globalThis, 'navigator', nav); else delete globalThis.navigator }
  assert.equal(noLock.calls.length, 0)
})

test('local official-SDK transport creates a native public follow only after consent and exact latest readback', async () => {
  const h = harness()
  const receipt = await h.client.follow(subject, consent)
  assert.equal(receipt.status, 'following')
  assert.equal(receipt.verification, 'pds-readback')
  assert.equal(receipt.record.value.subject, subject)
  const write = h.calls.find(c => c.method === 'createRecord')
  assert.equal(write.body.repo, did); assert.equal(write.body.collection, collection)
  assert.equal(write.body.validate, true)
  assert.match(write.body.rkey, /^[234567abcdefghijklmnopqrstuvwxyz]{13}$/)
  assert.deepEqual(Object.keys(write.body.record).sort(), ['$type','createdAt','subject'])
  assert.equal(h.calls.at(-1).method, 'getRecord')
  assert.equal(h.calls.at(-1).u.searchParams.has('cid'), false)
})

test('prior native follow detection returns exact existing own record without creating a duplicate', async () => {
  const h = harness({ initial: [existing] })
  const receipt = await h.client.follow(subject, consent)
  assert.equal(receipt.record.uri, existing.uri)
  assert.equal(h.calls.filter(c => c.body).length, 0)
})

test('missing exact consent, scope, own DID, origin or capability fails before any PDS mutation', async () => {
  for (const bad of [undefined, {}, { ...consent, public: false }, { ...consent, subject: did }, { ...consent, did: subject }, { ...consent, action: 'delete' }]) {
    const h = harness(); await assert.rejects(() => h.client.follow(subject, bad)); assert.equal(h.calls.length, 0)
  }
  for (const opts of [{ scope: 'atproto' }, { scope: 'atproto repo:app.bsky.feed.post?action=create' }, { configPatch: { canConnect: false } }, { configPatch: { origin: 'https://wrong.example.org' } }]) {
    const h = harness(opts); await assert.rejects(() => h.client.follow(subject, consent)); assert.equal(h.calls.length, 0)
  }
  const h = harness(); h.session.did = subject
  await assert.rejects(() => h.client.follow(subject, consent)); assert.equal(h.calls.length, 0)
  for (const target of [did, '@someone.bsky.social', 'https://pds.example.org', 'did:web:localhost', 'did:plc:short']) {
    const h = harness(); await assert.rejects(() => h.client.follow(target, { ...consent, subject: target })); assert.equal(h.calls.length, 0)
  }
})
