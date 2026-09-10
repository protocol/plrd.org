import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

test('F4: local cleanup failure leaves runtime signed out and offers account-side recovery without remote claims', async () => {
  const h = harness({ signOutError: true })
  await h.runtime.initialize()
  await assert.rejects(h.runtime.logout(), /local session cleanup/i)
  assert.equal(h.runtime.getSnapshot().isAuthenticated, false)
  assert.equal(h.runtime.getSnapshot().oauthSession, null)
  assert.match(h.runtime.getSnapshot().error, /account settings/)
  assert.doesNotMatch(h.runtime.getSnapshot().error, /private SDK/)
  const docs = fs.readFileSync('docs/open-lab/protocol-runbook.md', 'utf8')
  assert.match(docs, /best-effort remote revocation/)
  assert.doesNotMatch(docs, /a revocation failure is displayed/)
})

test('F4: installed SDK can suppress a remote revocation failure while still deleting local storage', async () => {
  const require = createRequire(import.meta.url)
  const sdk = createRequire(require.resolve('@atproto/oauth-client-browser'))
  const { OAuthSession } = sdk('@atproto/oauth-client')
  const { OAuthServerAgent } = await import(pathToFileURL(path.join(path.dirname(sdk.resolve('@atproto/oauth-client')), 'oauth-server-agent.js')))
  let requests = 0, removed = 0
  const h = harness()
  h.session.signOut = () => OAuthSession.prototype.signOut.call({ sub: did, getTokenSet: async () => ({ access_token: 'MOCK_TOKEN_ONLY' }), server: { revoke: token => OAuthServerAgent.prototype.revoke.call({ request: async () => { requests++; throw new Error('Synthetic offline'); } }, token) }, sessionGetter: { delStored: async () => { removed++; } } })
  await h.runtime.initialize()
  await h.runtime.logout()
  assert.equal(requests, 1)
  assert.equal(removed, 1)
  assert.equal(h.runtime.getSnapshot().isAuthenticated, false)
  assert.equal(h.runtime.getSnapshot().error, null, 'SDK success is not remote-revocation confirmation')
})
const { createLabAuthRuntime } = source('lib/lab-auth.tsx')
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
const origin = 'https://lab.example.org'
const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: 'true' })
globalThis.fetch = async () => { throw new Error('Live network forbidden') }
function deferred() { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

test('F2: logout or invalidation cancels an already-pending authorization before navigation', async () => {
  for (const action of ['login', 'authorizeWrite']) {
    for (const cancel of ['logout', 'deleted']) {
      const authorize = deferred(), h = harness({ authorize })
      await h.runtime.initialize()
      const pending = action === 'login' ? h.runtime.login('science.bsky.social', '/lab/') : h.runtime.authorizeWrite('note', 'create', '/lab/')
      await tick()
      if (cancel === 'logout') await h.runtime.logout(); else h.deleted()
      authorize.resolve(new URL('https://auth.example.org/authorize'))
      await pending
      assert.deepEqual(h.redirects, [], `${action}/${cancel}`)
      assert.equal(h.runtime.getSnapshot().isAuthenticated, false)
      assert.equal(h.runtime.getSnapshot().isLoading, false)
    }
  }
})

const tick = () => new Promise(r => setImmediate(r))
function harness({ init, signOutError = false, authorize } = {}) {
  let deleted, signs = 0
  const redirects = []
  const session = { sub: did, did, signOut: async () => { signs++; if (signOutError) throw new Error('private SDK failure'); deleted(did) } }
  const runtime = createLabAuthRuntime({ loadConfig: async () => config, loadClient: async (_config, onDeleted) => { deleted = onDeleted; return { init: async () => init ? init.promise : { session }, authorize: async () => authorize ? authorize.promise : new URL('https://auth.example.org/authorize'), signInRedirect: async () => { const url = authorize ? await authorize.promise : new URL('https://auth.example.org/authorize'); redirects.push(url.href) } } }, location: () => ({ origin, pathname: '/lab/' }), replace: path => redirects.push(path) })
  return { runtime, session, redirects, deleted: () => deleted(did), signs: () => signs }
}

test('F2: awaited logout invalidates pending restore/callback and signs out the late session', async () => {
  for (const signOutError of [false, true]) {
    const init = deferred(), h = harness({ init, signOutError })
    const pending = h.runtime.initialize()
    await tick()
    await h.runtime.logout()
    assert.equal(h.runtime.getSnapshot().isAuthenticated, false)
    init.resolve({ session: h.session, state: '/lab/profile/#draft' })
    await pending
    assert.equal(h.runtime.getSnapshot().isAuthenticated, false)
    assert.equal(h.runtime.getSnapshot().oauthSession, null)
    assert.equal(h.runtime.getSnapshot().isLoading, false)
    assert.equal(h.signs(), 1)
    assert.deepEqual(h.redirects, [])
  }
})

test('F2: logout from a session subscriber also cancels the callback navigation', async () => {
  const init = deferred(), h = harness({ init })
  let logout
  h.runtime.subscribe(() => { if (h.runtime.getSnapshot().isAuthenticated) logout = h.runtime.logout() })
  const pending = h.runtime.initialize()
  await tick()
  init.resolve({ session: h.session, state: '/lab/profile/' })
  await pending
  await logout
  assert.equal(h.runtime.getSnapshot().isAuthenticated, false)
  assert.deepEqual(h.redirects, [])
})

test('F2: SDK invalidation during pending initialization prevents late authentication and callback redirect', async () => {
  const init = deferred(), h = harness({ init })
  const pending = h.runtime.initialize()
  await tick()
  h.deleted()
  init.resolve({ session: h.session, state: '/lab/profile/' })
  await pending
  assert.equal(h.runtime.getSnapshot().isAuthenticated, false)
  assert.equal(h.runtime.getSnapshot().oauthSession, null)
  assert.equal(h.signs(), 1)
  assert.deepEqual(h.redirects, [])
})
