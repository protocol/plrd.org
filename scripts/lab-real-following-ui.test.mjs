import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
require.extensions['.css'] = m => { m.exports = new Proxy({}, { get: (_, p) => p === '__esModule' ? false : String(p) }) }
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/lab/feed/' })
for (const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLDialogElement','Event','StorageEvent','localStorage']) Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true })
globalThis.self = window
HTMLDialogElement.prototype.showModal = function() { this.open = true }
HTMLDialogElement.prototype.close = function() { this.open = false }
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const React = await import('react'), { createRoot } = await import('react-dom/client')
const A = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', B = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'
const owner = 'did:plc:cccccccccccccccccccccccc'
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa'
const pds = 'https://pds.example.org'
const note = (did, text) => ({ uri: `at://${did}/org.plresearch.lab.note/example`, cid, value: { $type: 'org.plresearch.lab.note', community: 'https://www.plrd.org/lab/', createdAt: '2026-09-10T00:00:00.000Z', text, field: 'neurotech', postType: 'question' } })
let identity, calls, pages, boundary
const failNative = () => { throw Error('Native follow permission or authenticated write must never run') }
function reset() {
 localStorage.clear(); calls = []; pages = new Map([[A, [note(A, 'Synthetic A research question')]], [B, [note(B, 'Synthetic B research question')]]]); boundary = null
 identity = { isLoading: false, isAuthenticated: true, session: { did: owner, handle: 'owner.example.org' }, oauthSession: null, capabilities: { canConnect: false, canSignIn: true }, authorizeConnection: failNative, isSessionCurrent: () => true }
}
reset()
// Only the fetch boundary is synthetic; profile validation, DID resolution, PDS
// reader, local stores, hooks and both rendered consumers are real.
globalThis.fetch = async (input, init) => {
 const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin)
 calls.push({ url, init })
 assert.equal(init?.method || 'GET', 'GET', 'No write request')
 assert.equal(new Headers(init?.headers).has('authorization'), false)
 if (boundary) { const result = await boundary(url, init); if (result) return result }
 if (url.pathname.endsWith('resolveHandle')) return Response.json({ did: url.searchParams.get('handle').startsWith('a.') ? A : B })
 if (url.pathname.endsWith('getProfile')) { const did = url.searchParams.get('actor'); return Response.json({ did, handle: did === A ? 'a.example.org' : 'b.example.org', displayName: did === A ? 'Synthetic Person A' : 'Synthetic Person B' }) }
 if (url.hostname === 'plc.directory') { const did = decodeURIComponent(url.pathname.slice(1)); return Response.json({ id: did, service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: pds }] }) }
 if (url.pathname.endsWith('listRecords')) return Response.json({ records: (pages.get(url.searchParams.get('repo')) || []).filter(r => r.value.$type === url.searchParams.get('collection')) })
 if (url.pathname.endsWith('getRecord')) {
  const uri = `at://${url.searchParams.get('repo')}/${url.searchParams.get('collection')}/${url.searchParams.get('rkey')}`
  const record = [...pages.values()].flat().find(r => r.uri === uri)
  return record ? Response.json(record) : Response.json({ error: 'RecordNotFound' }, { status: 404 })
 }
 throw Error('Unexpected public read: ' + url)
}
source('lib/lab-identity.ts').useLabIdentity = () => identity
const realConnectionFactory = source('lib/lab-connections.ts').createLabConnectionClient
source('lib/lab-connections.ts').createLabConnectionClient = failNative
const D = source('components/lab/demo/DemoCommunityProvider.tsx')
const Connections = source('components/lab/social/BlueskyConnections.tsx').default
const Feed = source('components/lab/FeedWorkbench.tsx').default
const F = source('lib/lab-following.ts')
function Mode() { const demo = D.useDemoCommunity(); return React.createElement('button', { onClick: () => demo.setMode(demo.isDemo ? 'live' : 'demo') }, 'Test mode switch') }
const rows = () => [...document.querySelectorAll('[data-feed-row]')]
const publicRows = () => rows().filter(r => r.getAttribute('data-feed-row').startsWith('at://'))
const button = label => [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent.trim() === label)
const click = async label => { const b = button(label); assert.ok(b, 'Missing action: ' + label); assert.equal(b.disabled, false, 'Disabled action: ' + label); await React.act(async () => b.click()) }
const fill = async (label, value) => { const e = document.querySelector(`[aria-label="${label}"]`); assert.ok(e); await React.act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, value); e.dispatchEvent(new Event('input', { bubbles: true })) }) }
async function mount() {
 let root = createRoot(document.getElementById('root'))
 const render = () => React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(D.DemoCommunityProvider, { initialMode: 'live', storageScope: identity.session?.did || 'browser' }, React.createElement(Mode), React.createElement(Connections), React.createElement(Feed)))))
 await render()
 return { render, reload: async () => { await React.act(async () => root.unmount()); root = createRoot(document.getElementById('root')); await render() }, close: () => React.act(async () => root.unmount()) }
}
async function findA() { await fill('Bluesky handle to find', 'a.example.org'); await click('Find person'); assert.match(document.querySelector('#bluesky-connections').textContent, /Synthetic Person A/) }

test('real lookup → local follow A → default and Following show only A public records; unfollow survives reload without native permission', async () => {
 reset(); const h = await mount()
 try {
  assert.equal(publicRows().length, 0)
  await findA(); await click('Follow in Open Lab')
  assert.deepEqual(F.loadFollowing(localStorage, owner, 'live').state.people, [A])
  assert.equal(publicRows().length, 1, 'A must enter the default science feed, not a separate source tab')
  assert.match(publicRows()[0].textContent, /Synthetic A research question/)
  await click('Following'); assert.equal(rows().length, 1); assert.doesNotMatch(document.querySelector('[aria-label="Mixed science feed"]').textContent, /Synthetic B research question/)
  await h.reload(); assert.equal(publicRows().length, 1)
  await findA(); await click('Unfollow in Open Lab'); assert.equal(rows().length, 0)
  await h.reload(); assert.equal(rows().length, 0)
  assert.deepEqual(F.loadFollowing(localStorage, owner, 'live').state.people, [])
  assert.ok(calls.every(c => !c.url.pathname.includes('app.bsky.graph.follow')))
  assert.ok(calls.filter(c => c.url.origin === pds).every(c => c.init.credentials === 'omit' && c.init.redirect === 'error'))
 } finally { await h.close() }
})

test('supported public activity keeps exact provenance and fields; following an exact idea survives person unfollow', async () => {
 reset()
 const record = (kind, data) => ({ uri: `at://${A}/org.plresearch.lab.${kind}/sample`, cid, value: { $type: `org.plresearch.lab.${kind}`, community: 'https://www.plrd.org/lab/', createdAt: '2026-09-09T00:00:00.000Z', ...data } })
 const app = record('app', { title: 'Synthetic A instrument', description: 'A described public tool.', url: 'https://example.org/instrument', field: 'cross-field' })
 const contribution = record('contribution', { targetUrl: 'https://example.org/target', observation: 'Synthetic A negative observation', evidenceUrl: 'https://example.org/evidence', field: 'neurotech' })
 const participation = record('participation', { campaignId: 'synthetic-campaign', taskId: 'synthetic-task', role: 'review', note: 'Synthetic A self-reported participation' })
 pages.get(A).push(app, contribution, participation)
 const h = await mount()
 try {
  await findA(); await click('Follow in Open Lab'); await click('Following')
  assert.equal(publicRows().length, 4, 'Supported activity kinds must not disappear into the source tab')
  for (const expected of pages.get(A)) {
   const row = publicRows().find(r => r.getAttribute('data-feed-row') === expected.uri); assert.ok(row)
   for (const exact of [A, expected.uri, expected.cid, pds, expected.value.createdAt, 'pds-https-unverified-signature']) assert.ok(row.textContent.includes(exact), 'Missing exact provenance ' + exact)
   assert.ok(row.querySelector(`a[href="${source('lib/lab-notebook.ts').labInspectorHref(expected.uri)}"]`))
   assert.doesNotMatch(row.textContent, /Editorial|Synthetic Person B|Ada Lovelace|peer reviewed|verified release/i)
  }
  const untagged = publicRows().find(r => r.getAttribute('data-feed-row') === participation.uri)
  assert.doesNotMatch(untagged.textContent, /Field:|Neuroscience|Mathematics|cross-field|Cross-disciplinary/)
  assert.match(publicRows().find(r => r.getAttribute('data-feed-row') === app.uri).textContent, /Field: cross-field/)
  await click('Follow idea: ' + app.uri)
  await click('Unfollow in Open Lab'); assert.equal(publicRows().length, 1); assert.equal(publicRows()[0].getAttribute('data-feed-row'), app.uri)
  await h.reload(); assert.equal(publicRows().length, 1)
  await click('Unfollow idea: ' + app.uri); await h.reload(); assert.equal(publicRows().length, 0)
 } finally { await h.close() }
})

async function setPrefs(state) {
 await React.act(async () => { localStorage.setItem(F.followingKey(owner, 'live'), JSON.stringify(state)); window.dispatchEvent(new StorageEvent('storage', { key: F.followingKey(owner, 'live') })) })
}
test('bounded public scan stops after two pages and five people and names truncation instead of claiming completeness', async () => {
 reset(); const h = await mount()
 try {
  boundary = (url) => {
   if (!url.pathname.endsWith('listRecords') || !url.searchParams.get('collection').endsWith('.note')) return
   const did = url.searchParams.get('repo'), second = url.searchParams.get('cursor') === 'page2'
   const r = note(did, 'Bounded synthetic note ' + (second ? 'two' : 'one')); r.uri += second ? '-two' : '-one'
   return Response.json({ records: [r], cursor: second ? 'page3' : 'page2' })
  }
  const people = [A, B, owner, 'did:plc:dddddddddddddddddddddddd', 'did:plc:eeeeeeeeeeeeeeeeeeeeeeee', 'did:plc:ffffffffffffffffffffffff']
  await setPrefs({ ...F.emptyFollowing(owner, 'live'), people, filter: { feed: 'following', disciplines: [] } })
  assert.equal(publicRows().length, 10, 'Exactly two pages for each of five people')
  const requests = calls.filter(c => c.url.pathname.endsWith('listRecords'))
  assert.deepEqual([...new Set(requests.map(c => c.url.searchParams.get('repo')))].sort(), people.slice(0, 5).sort())
  assert.ok(requests.every(c => c.url.searchParams.get('limit') === '10' && c.url.searchParams.get('cursor') !== 'page3'))
  assert.equal(requests.filter(c => c.url.searchParams.get('collection').endsWith('.note')).length, 10)
  const status = document.querySelector('[data-public-feed-status]'); assert.ok(status)
  assert.match(status.textContent, /truncated/i); assert.match(status.textContent, /1 person.*not read/i); assert.match(status.textContent, /2 pages/)
 } finally { await h.close() }
})

test('unreadable/unsupported public sources are isolated, named and never replaced with activity or rewritten storage', async () => {
 reset(); const h = await mount()
 try {
  const invalid = note(A, 'Rejected synthetic body'); invalid.value.schemaVersion = 999
  pages.set(A, [invalid]); const rawSource = JSON.stringify(invalid)
  const state = { ...F.emptyFollowing(owner, 'live'), people: [A, B, 'https://127.0.0.1'], filter: { feed: 'following', disciplines: [] } }
  await setPrefs(state)
  assert.equal(publicRows().length, 1, 'A rejected source must not hide valid B')
  assert.match(publicRows()[0].textContent, /Synthetic B research question/)
  const status = document.querySelector('[data-public-feed-status]'); assert.ok(status)
  assert.match(status.textContent, /unavailable|invalid|unsupported/i); assert.ok(status.textContent.includes(A)); assert.ok(status.textContent.includes('https://127.0.0.1'))
  assert.doesNotMatch(document.querySelector('[aria-label="Mixed science feed"]').textContent, /Rejected synthetic body/)
  assert.equal(localStorage.getItem(F.followingKey(owner, 'live')), JSON.stringify(state)); assert.equal(JSON.stringify(invalid), rawSource)
  assert.ok(calls.every(c => !['127.0.0.1', 'localhost'].includes(c.url.hostname)))
 } finally { await h.close() }
})

test('no supported records is explicit even when editorial rows remain; retry changes only the public read', async () => {
 reset(); pages.set(A, []); const h = await mount()
 try {
  await findA(); await click('Follow in Open Lab')
  assert.equal(publicRows().length, 0); assert.equal(rows().length, 3)
  assert.match(document.querySelector('[data-public-feed-status]').textContent, /No supported public records/)
  const raw = localStorage.getItem(F.followingKey(owner, 'live'))
  pages.set(A, [note(A, 'Synthetic A after retry')]); await click('Refresh public subscriptions')
  assert.equal(publicRows().length, 1); assert.equal(localStorage.getItem(F.followingKey(owner, 'live')), raw)
 } finally { await h.close() }
})

for (const change of ['account', 'mode', 'restoring', 'unfollow']) test(`slow public response is aborted and cannot leak after ${change} changes`, async () => {
 reset(); const h = await mount(); let resolve, pendingSignal
 try {
  boundary = (url, init) => {
   if (url.pathname.endsWith('listRecords') && url.searchParams.get('repo') === A && url.searchParams.get('collection').endsWith('.note')) {
    pendingSignal = init.signal
    return new Promise(r => { resolve = r })
   }
  }
  await findA(); await click('Follow in Open Lab'); assert.ok(resolve, 'Deferred real reader request reached fetch boundary')
  assert.equal(publicRows().length, 0)
  assert.match(document.querySelector('[data-public-feed-status]').textContent, /Reading public subscriptions/)
  if (change === 'mode') await click('Test mode switch')
  else if (change === 'unfollow') await click('Unfollow in Open Lab')
  else { identity = change === 'account' ? { ...identity, session: { did: B, handle: 'b.example.org' } } : { ...identity, isLoading: true }; await h.render() }
  assert.equal(pendingSignal.aborted, true, 'Old public read must be canceled, not just visually hidden')
  const callsAfterSwitch = calls.length
  await React.act(async () => resolve(Response.json({ records: [note(A, 'Late A must never leak')], cursor: 'next-page' })))
  assert.equal(publicRows().length, 0); assert.doesNotMatch(document.body.textContent, /Late A must never leak/)
  assert.equal(calls.length, callsAfterSwitch, 'No old-account pagination or later collections after cancellation')
  if (change === 'mode') assert.equal(button('Follow in Open Lab'), undefined)
 } finally { await h.close(); if (resolve) await React.act(async () => resolve(Response.json({ records: [] }))) }
})

for (const scenario of ['malformed JSON', 'unknown version', 'storage unavailable']) test(`local follow preserves ${scenario} and all unrelated originals`, async () => {
 reset(); const key = F.followingKey(owner, 'live')
 const raw = scenario === 'unknown version' ? JSON.stringify({ ...F.emptyFollowing(owner, 'live'), version: 999 }) : '{broken original'
 localStorage.setItem(key, raw); localStorage.setItem('untouched-private-draft', 'local original')
 const get = window.Storage.prototype.getItem
 if (scenario === 'storage unavailable') window.Storage.prototype.getItem = function(k) { if (k === key) throw Error('read blocked'); return get.call(this, k) }
 let h
 try {
  h = await mount(); await findA()
  assert.equal(button('Follow in Open Lab').disabled, true)
  assert.match(document.body.textContent, /original is preserved|storage is unavailable/i)
  assert.equal(publicRows().length, 0)
  assert.equal(get.call(localStorage, key), raw); assert.equal(get.call(localStorage, 'untouched-private-draft'), 'local original')
  assert.ok(calls.every(c => !c.url.pathname.endsWith('listRecords')))
 } finally { if (h) await h.close(); window.Storage.prototype.getItem = get }
})

for (const scenario of ['unsupported type', 'wrong author', 'bad CID', 'oversized page', 'network error']) test(`mounted science feed reports ${scenario} honestly`, async () => {
 reset(); const h = await mount()
 try {
  boundary = url => {
   if (!url.pathname.endsWith('listRecords') || !url.searchParams.get('collection').endsWith('.note')) return
   const r = note(A, 'Rejected public content')
   if (scenario === 'unsupported type') r.value.$type = 'app.bsky.feed.post'
   if (scenario === 'wrong author') r.uri = note(B, '').uri
   if (scenario === 'bad CID') r.cid = 'invented-version'
   if (scenario === 'network error') return Response.json({ error: 'Unavailable' }, { status: 503 })
   return Response.json({ records: scenario === 'oversized page' ? Array.from({ length: 11 }, (_, i) => ({ ...r, uri: r.uri + i })) : [r] })
  }
  await findA(); await click('Follow in Open Lab'); await click('Following')
  assert.equal(publicRows().length, 0); assert.equal(rows().length, 0)
  assert.match(document.querySelector('[data-public-feed-status]').textContent, /source errors.*Source unavailable, invalid, or unsupported/s)
  assert.doesNotMatch(document.body.textContent, /Rejected public content/)
  assert.deepEqual(F.loadFollowing(localStorage, owner, 'live').state.people, [A])
 } finally { await h.close() }
})

test('repeated cursor or cross-page record identity is an error, not a second version or inflated activity count', async () => {
 reset(); const h = await mount()
 try {
  boundary = url => url.pathname.endsWith('listRecords') && url.searchParams.get('collection').endsWith('.note') ? Response.json({ records: [note(A, 'Repeated page must not claim activity')], cursor: 'same-cursor' }) : undefined
  await findA(); await click('Follow in Open Lab'); await click('Following')
  assert.equal(publicRows().length, 0)
  assert.match(document.querySelector('[data-public-feed-status]').textContent, /source errors/)
 } finally { await h.close() }
})

test('a followed person with no supported records can be unfollowed locally from feed curation without looking up again', async () => {
 reset(); pages.set(A, []); const h = await mount()
 try {
  await findA(); await click('Follow in Open Lab'); await click('Following')
  await h.reload(); await click('Curate the feed')
  await click('Unfollow person: ' + A)
  assert.deepEqual(F.loadFollowing(localStorage, owner, 'live').state.people, [])
  await h.reload(); assert.equal(publicRows().length, 0); assert.equal(rows().length, 0)
 } finally { await h.close() }
})

test('complete A results are identity scoped; B and guest do not inherit them or demo personas', async () => {
 reset(); const h = await mount()
 try {
  await findA(); await click('Follow in Open Lab'); await click('Following'); assert.equal(publicRows().length, 1)
  identity = { ...identity, session: { did: B, handle: 'b.example.org' } }; await h.render(); assert.equal(publicRows().length, 0)
  await fill('Bluesky handle to find', 'b.example.org'); await click('Find person'); await click('Follow in Open Lab'); await click('Following')
  assert.equal(publicRows().length, 1); assert.match(publicRows()[0].textContent, /Synthetic B research question/); assert.doesNotMatch(document.body.textContent, /Synthetic A research question|Ada Lovelace/)
  identity = { ...identity, isAuthenticated: false, session: null }; await h.render(); assert.equal(publicRows().length, 0)
  await findA(); await click('Follow in Open Lab'); await click('Following'); assert.equal(publicRows().length, 1)
  assert.deepEqual(F.loadFollowing(localStorage, 'guest', 'live').state.people, [A])
  assert.deepEqual(F.loadFollowing(localStorage, owner, 'live').state.people, [A]); assert.deepEqual(F.loadFollowing(localStorage, B, 'live').state.people, [B])
 } finally { await h.close() }
})

test('exact-idea reads are capped at ten; malformed and unsupported stored URIs remain untouched and cannot fetch arbitrary URLs', async () => {
 reset(); const h = await mount()
 try {
  const notes = Array.from({ length: 11 }, (_, i) => { const r = note(A, 'Synthetic bounded idea ' + i); r.uri += '-' + i; return r }); pages.set(A, notes)
  const state = { ...F.emptyFollowing(owner, 'live'), ideas: notes.map(r => r.uri), filter: { feed: 'following', disciplines: [] } }
  await setPrefs(state); assert.equal(publicRows().length, 10)
  assert.equal(calls.filter(c => c.url.pathname.endsWith('getRecord')).length, 10)
  assert.match(document.querySelector('[data-public-feed-status]').textContent, /1 idea subscriptions not read/)
  const invalid = { ...state, ideas: [`at://${A}/org.plresearch.lab.profile/self`, 'at://did:web:127.0.0.1/org.plresearch.lab.note/no', 'at://a.example.org/org.plresearch.lab.note/no', `at://${A}/app.bsky.feed.post/no`] }
  const before = calls.length; await setPrefs(invalid); assert.equal(publicRows().length, 0); assert.equal(calls.length, before)
  assert.equal(localStorage.getItem(F.followingKey(owner, 'live')), JSON.stringify(invalid))
  assert.match(document.querySelector('[data-public-feed-status]').textContent, /Idea unavailable, invalid, or unsupported/)
 } finally { await h.close() }
})

test('an identity-only SDK session can subscribe without token permission inspection or authenticated transport', async () => {
 reset()
 identity.oauthSession = { sub: owner, did: owner, getTokenInfo: failNative, fetchHandler: failNative }
 source('lib/lab-connections.ts').createLabConnectionClient = realConnectionFactory
 let h
 try {
  h = await mount(); await findA(); await click('Follow in Open Lab'); await click('Following')
  assert.equal(publicRows().length, 1)
  assert.deepEqual(F.loadFollowing(localStorage, owner, 'live').state.people, [A])
  assert.equal(button('Authorize follow permission'), undefined)
  assert.equal(button('Confirm public follow'), undefined)
 } finally { if (h) await h.close(); source('lib/lab-connections.ts').createLabConnectionClient = failNative }
})
