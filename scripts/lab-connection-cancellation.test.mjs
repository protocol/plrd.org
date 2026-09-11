import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const dom = new JSDOM('<div id="root"></div>', { url: 'https://lab.example.org/lab/people/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Event', 'localStorage']) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
globalThis.IS_REACT_ACT_ENVIRONMENT = true
globalThis.fetch = async () => { throw Error('Live network forbidden in F1 local tests') }
const React = await import('react'), { createRoot } = await import('react-dom/client')
const req = createRequire(import.meta.url)
const sdk = createRequire(req.resolve('@atproto/oauth-client-browser'))
const { OAuthSession } = sdk('@atproto/oauth-client')
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', subject = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'
const origin = 'https://lab.example.org', collection = 'app.bsky.graph.follow'
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa'
const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin })
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve } }
const drain = () => new Promise(r => setImmediate(r))
function storage() { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,v), removeItem: k => m.delete(k) } }

// Portable version of the critic's installed-SDK F1 repro, first observed RED
// unchanged at the proof boundary. This fixture uses the REAL OAuthSession
// constructor (which installs the real dpopFetchWrapper), and the same supported
// fetch option supplied to BrowserOAuthClient.load by the app. Only keys/token
// storage/revocation and the final HTTP boundary are synthetic. A raw signal-blind
// stub bypassing that configured boundary is not the app's HTTP transport.
export async function sdkHarness({ stage = 'proof', action = 'create', store = storage() } = {}) {
  const gate = deferred(), entered = deferred(), panel = new AbortController()
  const calls = [], rows = new Map()
  const existing = { uri: `at://${did}/${collection}/3labexisting2a`, cid, value: { $type: collection, subject, createdAt: '2026-01-01T00:00:00Z' } }
  if (action === 'delete') rows.set(existing.uri, existing)
  let session, deleted, mutating = false, paused = false, requestSignal, refreshes = 0
  const posts = () => calls.filter(c => c.method === 'POST')
  async function pause(at) {
    if (stage === at && !paused) { paused = true; entered.resolve(); await gate.promise }
  }
  const rawFetch = async request => {
    assert.equal(new URL(request.url).origin, 'https://pds.example.org')
    calls.push({ method: request.method, path: new URL(request.url).pathname, aborted: request.signal.aborted })
    const path = new URL(request.url).pathname
    if (path.endsWith('listRecords')) return Response.json({ records: [...rows.values()] })
    if (path.endsWith(`${action}Record`)) {
      assert.ok(store.getItem(`open-lab:connection:v1:${did}:${subject}`), 'journal exists before transmission')
      if (posts().length === 1 && stage.startsWith('nonce-')) return Response.json({ error: 'use_dpop_nonce' }, { status: 401, headers: { 'WWW-Authenticate': 'DPoP error="use_dpop_nonce"', 'DPoP-Nonce': 'synthetic-next-nonce' } })
      if (posts().length === 1 && stage.startsWith('token-')) return Response.json({ error: 'invalid_token' }, { status: 401, headers: { 'WWW-Authenticate': 'DPoP error="invalid_token"' } })
      const body = await request.json(), uri = `at://${did}/${collection}/${body.rkey}`
      if (action === 'delete') { assert.equal(body.swapRecord, cid); rows.delete(uri) }
      else rows.set(uri, { uri, cid, value: body.record })
      await pause('transmitted')
      return Response.json(action === 'delete' ? {} : { uri, cid })
    }
    if (path.endsWith('getRecord')) {
      const uri = `at://${did}/${collection}/${new URL(request.url).searchParams.get('rkey')}`
      return rows.has(uri) ? Response.json(rows.get(uri)) : Response.json({ error: 'RecordNotFound' }, { status: 400 })
    }
    throw Error('Unexpected synthetic transport request')
  }
  const sessionGetter = {
    delStored: async () => deleted(did),
    getSession: async (_sub, refresh) => {
      if (mutating && refresh === 'auto') await pause('token')
      if (mutating && refresh === true) { refreshes++; await pause('token-refresh') }
      return { tokenSet: { sub: did, aud: 'https://pds.example.org', scope: `atproto repo:${collection}?action=${action}`, token_type: 'DPoP', access_token: 'SYNTHETIC-NON-CREDENTIAL' } }
    },
  }
  const server = {
    revoke: async () => {},
    dpopKey: { algorithms: ['ES256'], bareJwk: { kty: 'EC' }, createJwt: async (_header, payload) => {
      if (payload.htu.endsWith(`${action}Record`)) {
        await pause('proof')
        if (posts().length) { await pause('nonce-proof'); await pause('token-proof') }
      }
      return 'SYNTHETIC-PROOF'
    } },
    serverMetadata: { dpop_signing_alg_values_supported: ['ES256'] },
    runtime: { sha256: async () => { if (mutating) await pause('hash'); return new Uint8Array(32) } },
    dpopNonces: { get: async () => { if (mutating) await pause('nonce'); return undefined }, set: async () => pause('nonce-store') },
  }
  const oldFetch = globalThis.fetch
  // Exercise the actual runtime-supplied final transport, not a reimplementation
  // of its AbortSignal fence. This synthetic global is never a network client.
  globalThis.fetch = rawFetch
  const runtime = source('lib/lab-auth.tsx').createLabAuthRuntime({
    loadConfig: async () => config,
    loadClient: async (_config, onDeleted, fetcher) => {
      deleted = onDeleted
      session = new OAuthSession(server, did, sessionGetter, fetcher ?? rawFetch)
      const official = session.fetchHandler.bind(session)
      session.fetchHandler = (path, init) => { mutating = path.includes(`${action}Record`); requestSignal = init?.signal; return official(path, init) }
      return { init: async () => ({ session }) }
    },
    location: () => ({ origin, pathname: '/lab/' }), replace: () => { throw Error('Unexpected navigation') },
  })
  try { await runtime.initialize() } finally { globalThis.fetch = oldFetch }
  const deps = { isCurrent: () => runtime.isSessionCurrent(session), signal: panel.signal, loadConfig: async () => config, storage: store, lock: async (_key, work) => work(), transport: { timeoutMs: 1000 } }
  const client = source('lib/lab-connections.ts').createLabConnectionClient(session, deps)
  return { session, runtime, client, deps, panel, existing, calls, rows, posts, store, gate, entered, signal: () => requestSignal, refreshes: () => refreshes, invalidate: () => deleted(did) }
}
const consent = { public: true, did, subject, action: 'create' }

async function mountPanel(h, t) {
  localStorage.clear()
  const identityModule = source('lib/lab-identity.ts'), authModule = source('lib/lab-auth.tsx'), connectionModule = source('lib/lab-connections.ts')
  const originalIdentity = identityModule.useLabIdentity, originalProfile = authModule.createLabProfileReader, originalClient = connectionModule.createLabConnectionClient
  const profileSignals = []
  identityModule.useLabIdentity = () => ({ ...h.runtime.getSnapshot(), isSessionCurrent: h.runtime.isSessionCurrent })
  authModule.createLabProfileReader = (_fetcher, signal) => async actor => { profileSignals.push(signal); return { did: actor.startsWith('did:') ? actor : subject, handle: 'target.bsky.social' } }
  connectionModule.createLabConnectionClient = (session, deps) => originalClient(session, { ...h.deps, ...deps })
  const Component = source('components/lab/social/BlueskyConnections.tsx').default
  const root = createRoot(document.getElementById('root'))
  let unmounted = false
  const render = props => React.act(async () => root.render(React.createElement(Component, props)))
  const unmount = async () => { if (!unmounted) { unmounted = true; await React.act(async () => root.unmount()) } }
  t.after(async () => { await unmount(); await h.runtime.logout(); h.gate.resolve(); await drain(); await drain(); identityModule.useLabIdentity = originalIdentity; authModule.createLabProfileReader = originalProfile; connectionModule.createLabConnectionClient = originalClient })
  const click = async text => { const button = [...document.querySelectorAll('button')].find(b => b.textContent === text); assert.ok(button, `Missing ${text}`); await React.act(async () => button.click()) }
  return { render, unmount, click, profileSignals, agree: () => React.act(async () => document.querySelector('input[type=checkbox]').click()) }
}
for (const cancel of ['unmount', 'target-change', 'cancel-button']) {
  test(`F1 mounted panel: ${cancel} aborts installed SDK proof and preserves pending target`, { timeout: 5000 }, async t => {
    const h = await sdkHarness({ stage: 'proof' }), panel = await mountPanel(h, t)
    await panel.render({ personDid: subject })
    await panel.agree(); await panel.click('Confirm public follow'); await h.entered.promise
    const signal = h.signal()
    if (cancel === 'unmount') await panel.unmount()
    else if (cancel === 'target-change') await panel.render({ personDid: 'did:plc:cccccccccccccccccccccccc' })
    else await panel.click('Cancel pending work')
    assert.equal(signal.aborted, true, 'panel must cancel SDK work, not merely ignore its result')
    await React.act(async () => { h.gate.resolve(); await drain(); await drain() })
    assert.equal(h.posts().length, 0)
    assert.ok(h.store.getItem(`open-lab:connection:v1:${did}:${subject}`))
    assert.ok(localStorage.getItem(`open-lab:connection-draft:v1:${did}`))
    if (cancel === 'cancel-button') {
      assert.ok(document.body.textContent.includes('Only check the exact record'))
      assert.equal(document.querySelector('input[type=checkbox]'), null)
    }
  })
}
test('F1 mounted panel: editing the lookup target invalidates its lookup lifetime and confirmation', async t => {
  const h = await sdkHarness({ stage: 'ok' }), panel = await mountPanel(h, t)
  await panel.render({})
  const input = document.querySelector('[aria-label="Bluesky handle to find"]')
  const fill = value => React.act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })) })
  await fill('target.bsky.social'); await panel.click('Find person'); await panel.agree()
  const signal = panel.profileSignals.at(-1)
  assert.ok(signal, 'public profile reader needs the same target lifetime')
  await fill('other.bsky.social')
  assert.equal(signal.aborted, true)
  assert.equal(document.querySelector('input[type=checkbox]'), null)
  assert.equal(h.posts().length, 0)
})


for (const cancel of ['logout', 'sdk-invalidation', 'panel']) {
  for (const stage of ['proof', 'hash', 'nonce', 'token', 'nonce-store', 'nonce-proof', 'token-refresh', 'token-proof']) {
    test(`F1: ${cancel} during installed SDK ${stage} prevents later HTTP transmission/retry`, { timeout: 5000 }, async () => {
      const h = await sdkHarness({ stage })
      const outcome = h.client.follow(subject, consent).catch(e => e)
      await h.entered.promise
      const before = h.posts().length
      assert.equal(before, stage.includes('-') ? 1 : 0)
      if (cancel === 'logout') {
        const pendingLogout = h.runtime.logout()
        assert.equal(h.signal().aborted, true, 'abort precedes await/React notification')
        await pendingLogout
      } else if (cancel === 'sdk-invalidation') h.invalidate()
      else h.panel.abort(new DOMException('Panel canceled', 'AbortError'))
      assert.equal(h.signal().aborted, true)
      h.gate.resolve()
      const error = await outcome
      // Cancellation settles locally before SDK work necessarily unwinds. Drain
      // it before checking transmissions: no false green from early rejection.
      await drain(); await drain()
      assert.equal(error.name, 'LabConnectionUnknownError')
      assert.equal(h.posts().length, before, 'No subsequent public request after cancellation')
      assert.ok(h.store.getItem(`open-lab:connection:v1:${did}:${subject}`), 'recovery journal retained')
    })
  }
}
test('F1 cancel control is for connection work, not a false promise to cancel provider authorization', async t => {
  const h = await sdkHarness({ action: 'read' }), panel = await mountPanel(h, t)
  const authorization = deferred(), entered = deferred()
  source('lib/lab-identity.ts').useLabIdentity = () => ({ ...h.runtime.getSnapshot(), isSessionCurrent: h.runtime.isSessionCurrent, authorizeConnection: async () => { entered.resolve(); await authorization.promise } })
  await panel.render({ personDid: subject })
  await panel.agree(); await panel.click('Confirm public follow')
  await panel.click('Authorize follow permission'); await entered.promise
  const hasCancel = [...document.querySelectorAll('button')].some(b => b.textContent === 'Cancel pending work')
  await React.act(async () => authorization.resolve())
  assert.equal(hasCancel, false)
  assert.equal(h.posts().length, 0)
})

test('F1 mounted panel: logout aborts public lookup synchronously, before a React rerender', async t => {
  const h = await sdkHarness({ stage: 'ok' }), panel = await mountPanel(h, t)
  await panel.render({ personDid: subject })
  const signal = panel.profileSignals[0]
  const logout = h.runtime.logout()
  assert.equal(signal?.aborted, true)
  await logout
})
test('F1 init profile enrichment captures the account lifetime before its public reads', async () => {
  const gate = deferred(), entered = deferred(); let signal
  const session = { sub: did, signOut: async () => {} }
  const runtime = source('lib/lab-auth.tsx').createLabAuthRuntime({
    loadConfig: async () => config, loadClient: async () => ({ init: async () => ({ session }) }),
    location: () => ({ origin, pathname: '/lab/' }), replace: () => {},
    loadProfile: async (_did, captured) => { signal = captured; entered.resolve(); await gate.promise; return { did, handle: 'author.bsky.social' } },
  })
  const initializing = runtime.initialize()
  await entered.promise
  const logout = runtime.logout()
  const aborted = signal?.aborted
  gate.resolve(); await logout; await initializing
  assert.equal(aborted, true)
  assert.equal(runtime.getSnapshot().session, null)
})

test('F1 profile lookup: cancellation while resolving a handle prevents the subsequent profile request', async () => {
  const gate = deferred(), entered = deferred(), controller = new AbortController(), calls = []
  const reader = source('lib/lab-auth.tsx').createLabProfileReader(async (input, init) => {
    calls.push(new URL(input).pathname)
    if (calls.length === 1) { entered.resolve(); await gate.promise; return Response.json({ did: subject }) }
    return Response.json({ did: subject, handle: 'target.bsky.social' })
  }, controller.signal)
  const outcome = reader('target.bsky.social').catch(e => e)
  await entered.promise; controller.abort(); gate.resolve()
  assert.equal((await outcome).cause?.name, 'AbortError', 'official XRPCError retains the cancellation cause')
  await drain(); await drain()
  assert.equal(calls.length, 1)
})

test('F1: already-transmitted public write stays ambiguous and recovers read-only with no duplicate', async () => {
  const h = await sdkHarness({ stage: 'transmitted' })
  const outcome = h.client.follow(subject, consent).catch(e => e)
  await h.entered.promise
  assert.equal(h.posts().length, 1)
  h.panel.abort()
  h.gate.resolve()
  assert.equal((await outcome).name, 'LabConnectionUnknownError')
  await drain()
  const recoveredClient = source('lib/lab-connections.ts').createLabConnectionClient(h.session, { ...h.deps, signal: new AbortController().signal })
  await assert.rejects(() => recoveredClient.follow(subject, consent), e => e.name === 'LabConnectionUnknownError')
  const recovered = await recoveredClient.recover(subject)
  assert.equal(recovered.status, 'following')
  assert.equal(recoveredClient.pending(subject), null)
  assert.equal(h.posts().length, 1)
})
for (const stage of ['proof', 'token-proof', 'transmitted']) {
  test(`F1 unfollow: cancellation at ${stage} cannot dispatch a delete/retry or discard recovery`, async () => {
    const h = await sdkHarness({ stage, action: 'delete' })
    const consent = { public: true, did, subject, action: 'delete', uri: h.existing.uri, expectedCid: h.existing.cid }
    const outcome = h.client.unfollow(subject, consent).catch(e => e)
    await h.entered.promise
    const before = h.posts().length
    h.panel.abort(); h.gate.resolve()
    assert.equal((await outcome).name, 'LabConnectionUnknownError')
    await drain(); await drain()
    assert.equal(h.posts().length, before)
    const fresh = source('lib/lab-connections.ts').createLabConnectionClient(h.session, { ...h.deps, signal: new AbortController().signal })
    assert.equal(fresh.pending(subject).action, 'delete')
    await assert.rejects(() => fresh.unfollow(subject, consent), e => e.name === 'LabConnectionUnknownError')
    if (stage === 'transmitted') {
      assert.equal((await fresh.recover(subject)).status, 'not-following')
      assert.equal(fresh.pending(subject), null)
    }
    assert.equal(h.posts().length, before)
  })
}

for (const stage of ['ok', 'nonce-proof', 'token-proof']) {
  test(`F1 control: official SDK ${stage} completes when lifecycle stays valid`, async () => {
    const h = await sdkHarness({ stage }); h.gate.resolve()
    const receipt = await h.client.follow(subject, consent)
    assert.equal(receipt.status, 'following')
    assert.equal(receipt.verification, 'pds-readback')
    assert.equal(h.posts().length, stage === 'ok' ? 1 : 2)
    assert.ok(h.calls.every(c => !c.aborted))
  })
}
