import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const { createLabRecordWriter } = source('lib/lab-records.ts')
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', origin = 'https://lab.example.org'
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa'
const note = { text: 'Synthetic test only', field: 'neurotech', postType: 'question' }
const profile = { workingOn: 'Synthetic', lookingFor: 'Review', interests: [] }
const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: 'true' })
globalThis.window = { location: { origin } }
globalThis.fetch = async () => { throw new Error('Live network forbidden') }
function harness({ action = 'create', override, timeoutMs = 30 } = {}) {
  const kind = action === 'update' ? 'profile' : 'note'
  const initialUri = `at://${did}/org.plresearch.lab.${kind}/${kind === 'profile' ? 'self' : 'synthetic'}`
  let stored = { uri: initialUri, cid, value: { ...(kind === 'profile' ? profile : note), $type: `org.plresearch.lab.${kind}`, community: 'https://www.plrd.org/lab/', createdAt: '2025-01-01T00:00:00.000Z' } }
  let committed = false, target = initialUri
  const calls = []
  const session = { sub: did, did, getTokenInfo: async () => ({ sub: did, aud: 'https://pds.example.org', scope: `atproto repo:org.plresearch.lab.${kind}?action=${action}` }), async fetchHandler(path, init) {
    assert.equal(this, session, 'official session method receiver retained')
    calls.push({ path, init })
    const mutation = !path.includes('getRecord')
    if (mutation) {
      const body = await new Response(init.body).json()
      target = `at://${did}/${body.collection}/${body.rkey}`
      if (action !== 'create') assert.equal(body.swapRecord, cid)
      if (action !== 'delete') stored = { uri: target, cid, value: body.record }
      committed = true
    }
    const context = { path, init, mutation, committed, stored, target }
    const custom = override?.(context)
    if (custom !== undefined) return custom
    if (mutation) return Response.json(action === 'delete' ? {} : { uri: target, cid })
    if (committed && action === 'delete') return Response.json({ error: 'RecordNotFound' }, { status: 400 })
    return Response.json(stored)
  } }
  const writer = createLabRecordWriter(session, async () => config, { timeoutMs })
  const consent = { public: true, experimental: true, did, action, ...(action !== 'create' ? { expectedCid: cid } : {}) }
  return { calls, session, writer, target: () => target, run: () => action === 'delete' ? writer.delete(initialUri, consent) : writer.publish(kind, action === 'update' ? { ...profile, workingOn: 'Updated' } : note, consent) }
}



test('F3: normal create/update/delete keep CAS, latest readback and finite signals', async () => {
  for (const action of ['create', 'update', 'delete']) {
    const h = harness({ action, timeoutMs: 100 })
    const receipt = await h.run()
    assert.equal(receipt.verified, true)
    assert.equal(receipt.uri, h.target())
    assert.equal(h.calls.length, action === 'create' ? 2 : 3)
    assert.ok(h.calls.every(c => c.init.signal instanceof AbortSignal))
    for (const call of h.calls.filter(c => c.path.includes('getRecord'))) assert.equal(new URL(call.path, origin).searchParams.has('cid'), false)
    if (action === 'update') assert.equal(receipt.record.createdAt, '2025-01-01T00:00:00.000Z')
  }
})

test('F3: postcommit update/delete timeout returns only the exact ambiguous target and never retries', async () => {
  for (const action of ['update', 'delete']) {
    const h = harness({ action, override: ({ committed, mutation }) => committed && !mutation ? new Promise(() => {}) : undefined })
    const result = await settles(h.run())
    assert.equal(result.error?.name, 'LabWriteVerificationError')
    assert.equal(result.error.uri, h.target())
    assert.equal(h.calls.length, 3)
    assert.equal(h.calls.filter(c => !c.path.includes('getRecord')).length, 1)
  }
})

test('F3: precommit verification timeout never attempts an update/delete', async () => {
  for (const action of ['update', 'delete']) {
    const h = harness({ action, override: ({ committed }) => !committed ? new Promise(() => {}) : undefined })
    const result = await settles(h.run())
    assert.ok(result.error)
    assert.notEqual(result.error.name, 'LabWriteVerificationError', 'no mutation was attempted')
    assert.equal(h.calls.length, 1)
    assert.ok(h.calls.every(c => c.path.includes('getRecord')))
  }
})

test('F3: bad authority, consent and session actor make zero transport requests', async () => {
  for (const bad of ['authority', 'consent', 'actor']) {
    const h = harness()
    if (bad === 'actor') h.session.did = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'
    await assert.rejects(h.writer.publish('note', { ...note, ...(bad === 'authority' ? { authorDid: did } : {}) }, { public: bad !== 'consent', experimental: true, did, action: 'create' }))
    assert.equal(h.calls.length, 0)
  }
})

test('F3: bounds run before SDK buffering, cancel overflow and dispose late responses', async () => {
  const { boundedLabFetch, LAB_AUTH_MAX_RESPONSE_BYTES } = source('lib/lab-bounded-transport.ts')
  let chunks = 0, canceled = 0
  const fetchBounded = boundedLabFetch({ fetchHandler: async () => {
    const response = new Response(new ReadableStream({ pull(controller) { chunks++; controller.enqueue(new Uint8Array(262144)); }, cancel() { canceled++ } }), { headers: { 'content-type': 'application/json', 'content-length': '10' } })
    response.arrayBuffer = () => { throw new Error('Original unbounded buffer must not be called') }
    return response
  } }, { timeoutMs: 100 })
  await assert.rejects(fetchBounded('/synthetic', {}), /1 MiB/)
  assert.equal(canceled, 1)
  assert.ok(chunks <= 6, 'stream stops at the cap with at most one prefetched chunk')
  const exact = boundedLabFetch({ fetchHandler: async () => new Response(new Uint8Array(LAB_AUTH_MAX_RESPONSE_BYTES)) })
  assert.equal((await (await exact('/synthetic', {})).arrayBuffer()).byteLength, LAB_AUTH_MAX_RESPONSE_BYTES)
  let release
  const late = boundedLabFetch({ fetchHandler: () => new Promise(resolve => { release = resolve }) }, { timeoutMs: 10 })
  await assert.rejects(late('/synthetic', {}), /deadline/)
  release(new Response(new ReadableStream({ cancel() { canceled++ } })))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(canceled, 2)
})

test('F3: caller abort is preserved and invalid deadline options cannot remove bounds', async () => {
  const { boundedLabFetch } = source('lib/lab-bounded-transport.ts')
  let requests = 0
  const session = { fetchHandler: async () => { requests++; return new Response('{}') } }
  for (const timeoutMs of [0, -1, Infinity, NaN, 12001]) assert.throws(() => boundedLabFetch(session, { timeoutMs }), /deadline/)
  const controller = new AbortController()
  controller.abort(new Error('caller canceled'))
  await assert.rejects(boundedLabFetch(session)('/synthetic', { signal: controller.signal }), /caller canceled/)
  assert.equal(requests, 0)
})

async function settles(promise) {
  let timer
  try { return await Promise.race([promise.then(receipt => ({ receipt }), error => ({ error })), new Promise(resolve => { timer = setTimeout(() => resolve({ stalled: true }), 250) })]) }
  finally { clearTimeout(timer) }
}

test('F3: stalled responses and nonending streams terminate despite transports ignoring abort', async () => {
  for (const stage of ['mutation', 'readback']) {
    for (const mode of ['response', 'stream']) {
      let canceled = 0
      const h = harness({ override: ({ mutation }) => {
        if (mutation !== (stage === 'mutation')) return undefined
        if (mode === 'response') return new Promise(() => {})
        return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); }, cancel() { canceled++; return new Promise(() => {}) } }), { headers: { 'content-type': 'application/json' } })
      } })
      const result = await settles(h.run())
      assert.equal(result.error?.name, 'LabWriteVerificationError', `${stage}/${mode} must settle as ambiguous, not stall or succeed`)
      assert.equal(result.error.uri, h.target())
      assert.equal(h.calls.filter(c => !c.path.includes('getRecord')).length, 1)
      assert.equal(h.calls.at(-1).init.signal.aborted, true)
      if (mode === 'stream') assert.equal(canceled, 1)
    }
  }
})

test('F3: >1 MiB success-looking mutation and readback envelopes cannot produce verified receipts', async () => {
  for (const stage of ['mutation', 'readback']) {
    const h = harness({ override: ({ mutation, stored, target }) => mutation === (stage === 'mutation') ? Response.json({ ...(mutation ? { uri: target, cid } : stored), padding: 'x'.repeat(1_100_000) }) : undefined })
    await assert.rejects(h.run(), error => error.name === 'LabWriteVerificationError' && error.uri === h.target())
    assert.equal(h.calls.filter(c => !c.path.includes('getRecord')).length, 1, 'no duplicate write')
    assert.ok(h.calls.every(c => c.init.signal instanceof AbortSignal))
  }
})
