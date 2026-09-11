import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const dom = new JSDOM('<div id="root"></div>', { url: 'https://lab.example.org/lab/profile/' })
for (const key of ['window','document','navigator','HTMLElement','HTMLInputElement','Event','localStorage']) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
globalThis.IS_REACT_ACT_ENVIRONMENT = true
globalThis.fetch = async () => { throw Error('Live network forbidden in local UI tests') }
const React = await import('react'), { createRoot } = await import('react-dom/client')
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', subject = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'
const target = { did: subject, handle: 'target.bsky.social', displayName: 'Public Target' }
const follow = { uri: `at://${did}/app.bsky.graph.follow/3labexisting2a`, cid: 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa', value: { $type: 'app.bsky.graph.follow', subject, createdAt: '2026-01-01T00:00:00Z' } }
const noFollow = { status: 'not-following', verification: 'pds-scan' }, following = { status: 'following', record: follow, verification: 'pds-readback' }
let identity, calls, client, profileRead
function setup() {
  localStorage.clear(); calls = []
  identity = { session: { did, handle: 'author.bsky.social', displayName: 'Public Author' }, oauthSession: { sub: did, did }, isAuthenticated: true, isLoading: false, capabilities: source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: window.location.origin }), authorizeConnection: async (...args) => calls.push(['authorize', ...args]), login: async (...args) => calls.push(['login', ...args]) }
  client = { inspect: async () => noFollow, pending: () => null, follow: async (...args) => { calls.push(['follow', ...args]); return following }, unfollow: async (...args) => { calls.push(['unfollow', ...args]); return noFollow }, recover: async (...args) => { calls.push(['recover', ...args]); return following } }
  profileRead = async () => target
  source('lib/lab-identity.ts').useLabIdentity = () => identity
  source('lib/lab-auth.tsx').createLabProfileReader = () => (...args) => profileRead(...args)
  source('lib/lab-connections.ts').createLabConnectionClient = () => client
}
const button = name => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === name)
const click = async name => { const el = button(name); assert.ok(el, `Missing ${name}`); await React.act(async () => el.click()) }
const agree = async () => { const el = document.querySelector('input[type=checkbox]'); assert.ok(el); await React.act(async () => el.click()) }
async function mount(props = {}) {
  assert.ok(existsSync('src/components/lab/social/BlueskyConnections.tsx'), 'real connection component missing')
  const Component = source('components/lab/social/BlueskyConnections.tsx').default
  const root = createRoot(document.getElementById('root'))
  await React.act(async () => root.render(React.createElement(Component, props)))
  return { unmount: () => React.act(async () => root.unmount()), render: () => React.act(async () => root.render(React.createElement(Component, props))) }
}
test('local injected UI finds a real-profile-shaped result, identifies both DIDs, and requires exact public confirmation', async () => {
  setup(); const h = await mount()
  const input = document.querySelector('[aria-label="Bluesky handle to find"]'); assert.ok(input)
  await React.act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input, target.handle); input.dispatchEvent(new Event('input',{bubbles:true})) })
  await click('Find person')
  assert.match(document.body.textContent, /Public Target/); assert.match(document.body.textContent, /author.bsky.social/)
  assert.ok(document.body.textContent.includes(did) && document.body.textContent.includes(subject))
  assert.match(document.body.textContent, /one-way/)
  assert.equal(button('Confirm public follow').disabled, true)
  assert.equal(calls.length, 0)
  await agree(); await click('Confirm public follow')
  assert.deepEqual(calls[0], ['follow', subject, { public: true, did, subject, action: 'create' }])
  assert.match(document.body.textContent, /Following on Bluesky/)
  await h.unmount()
})
test('changing a lookup handle discards the old profile and public confirmation', async () => {
  setup(); const h = await mount()
  const input = document.querySelector('[aria-label="Bluesky handle to find"]')
  const fill = value => React.act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true})) })
  await fill(target.handle); await click('Find person'); await agree()
  assert.equal(button('Confirm public follow').disabled, false)
  await fill('other.bsky.social')
  assert.equal(Boolean(button('Confirm public follow')), false)
  assert.equal(calls.length, 0)
  await h.unmount()
})

test('scope escalation saves this target, returns to the draft and requires confirmation again; never auto-follows', async () => {
  setup()
  client.follow = async () => { throw new (source('lib/lab-connections.ts').LabConnectionPermissionError)('create') }
  let h = await mount({ personDid: subject })
  await agree(); await click('Confirm public follow')
  await click('Authorize follow permission')
  assert.deepEqual(calls, [['authorize','create','/lab/profile/#bluesky-connections']])
  await h.unmount()
  client.follow = async (...args) => { calls.push(['follow',...args]); return following }
  h = await mount()
  assert.match(document.body.textContent, /Public Target/)
  assert.equal(button('Confirm public follow').disabled, true)
  assert.equal(calls.length, 1)
  await agree(); await click('Confirm public follow'); assert.equal(calls.length, 2)
  await h.unmount()
})
test('an already-authorized ambiguous follow restores its exact target after reload and offers recovery only', async () => {
  setup()
  client.follow = async () => { client.pending = () => ({ uri: follow.uri, subject, action: 'create' }); throw new (source('lib/lab-connections.ts').LabConnectionUnknownError)(follow.uri) }
  let h = await mount({ personDid: subject })
  await agree(); await click('Confirm public follow'); await h.unmount()
  h = await mount()
  assert.ok(button('Check exact public outcome'), 'lost-response target must survive reload even without scope escalation')
  assert.equal(Boolean(button('Confirm public follow')), false)
  assert.equal(calls.length, 0)
  await h.unmount()
})

test('unknown outcome offers read-only recovery, and unfollow passes exact reviewed CID', async () => {
  setup(); client.pending = () => ({ uri: follow.uri, subject, action: 'create' })
  let h = await mount({ personDid: subject })
  assert.equal(Boolean(button('Confirm public follow')), false)
  await click('Check exact public outcome')
  assert.equal(calls[0][0], 'recover')
  await h.unmount()
  setup(); client.inspect = async () => following
  h = await mount({ personDid: subject })
  await agree(); await click('Confirm public unfollow')
  assert.deepEqual(calls[0], ['unfollow', subject, { public: true, did, subject, action: 'delete', uri: follow.uri, expectedCid: follow.cid }])
  await h.unmount()
})
test('sign-out resets confirmation and a late public lookup cannot install a profile after unmount', async () => {
  setup(); let resolve
  profileRead = () => new Promise(r => { resolve = r })
  const h = await mount({ personDid: subject })
  await h.unmount(); await React.act(async () => resolve(target))
  assert.equal(document.body.textContent, '')
  profileRead = async () => target
  const next = await mount({ personDid: subject })
  await agree()
  identity = { ...identity, session: null, oauthSession: null, isAuthenticated: false }
  await next.render()
  assert.equal(Boolean(button('Confirm public follow')), false)
  assert.equal(calls.length, 0)
  await next.unmount()
})
