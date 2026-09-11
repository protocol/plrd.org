import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const auth = source('lib/lab-auth.tsx')
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', other = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'
const origin = 'https://lab.example.org'
const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin })
const profile = { did, handle: 'science.bsky.social', displayName: 'Public Scientist', avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/bafkreia@jpeg' }
const tick = () => new Promise(r => setImmediate(r))
function harness(loadProfile) {
  let deleted
  const redirects = [], session = { sub: did, did, signOut: async () => {} }
  const runtime = auth.createLabAuthRuntime({ loadProfile, loadConfig: async () => config, loadClient: async (_c, cb) => { deleted = cb; return { init: async () => ({ session, state: '/lab/profile/' }) } }, location: () => ({ origin, pathname: '/lab/oauth/return/' }), replace: x => redirects.push(x) })
  return { runtime, redirects, deleted: () => deleted(did) }
}

test('synchronous runtime session guard rejects old work immediately on logout, before any React render', async () => {
  const h = harness(async () => profile)
  await h.runtime.initialize()
  const sdk = h.runtime.getSnapshot().oauthSession
  assert.equal(h.runtime.isSessionCurrent(sdk), true)
  const logout = h.runtime.logout()
  assert.equal(h.runtime.isSessionCurrent(sdk), false)
  await logout
})

test('local injected profile enrichment follows SDK identity without any writes', async () => {
  let lookedUp
  const h = harness(async x => { lookedUp = x; return profile })
  await h.runtime.initialize()
  assert.equal(lookedUp, did)
  assert.deepEqual(h.runtime.getSnapshot().session, profile)
  assert.deepEqual(h.redirects, ['/lab/profile/'])
})

test('profile outage/mismatched DID keep authenticated DID fallback; late lookup cannot undo logout/invalidation', async () => {
  for (const load of [async () => { throw Error('private detail') }, async () => ({ ...profile, did: other })]) {
    const h = harness(load); await h.runtime.initialize()
    assert.deepEqual(h.runtime.getSnapshot().session, { did, handle: did })
    assert.equal(h.runtime.getSnapshot().isAuthenticated, true)
    assert.equal(h.runtime.getSnapshot().error, null)
  }
  for (const cancel of ['logout', 'deleted']) {
    let resolve
    const h = harness(() => new Promise(r => { resolve = r }))
    const pending = h.runtime.initialize(); await tick()
    if (cancel === 'logout') await h.runtime.logout(); else h.deleted()
    resolve(profile); await pending
    assert.equal(h.runtime.getSnapshot().session, null)
    assert.deepEqual(h.redirects, [])
  }
})

test('official public profile reader binds exact DID and forward handle, dropping unsafe avatar URLs', async () => {
  const calls = []
  let data = profile, resolved = did
  const read = auth.createLabProfileReader(async (url, init) => {
    const u = new URL(url); calls.push([u, init])
    return Response.json(u.pathname.endsWith('resolveHandle') ? { did: resolved } : data)
  })
  assert.deepEqual(await read(did), profile)
  assert.deepEqual(calls.map(([u]) => u.hostname), ['public.api.bsky.app','public.api.bsky.app'])
  assert.ok(calls.every(([, init]) => init.method === 'GET' && init.credentials === 'omit' && init.redirect === 'error'))
  data = { ...profile, did: other }; await assert.rejects(() => read(did), /identity/i)
  data = profile; resolved = other; await assert.rejects(() => read(did), /handle/i)
  resolved = did
  for (const avatar of ['javascript:alert(1)', 'http://cdn.bsky.app/a', 'https://evil.example.org/a', 'https://cdn.bsky.app@evil.example.org/a', 'https://cdn.bsky.app/a?token=private', 'https://cdn.bsky.app:444/a']) {
    data = { ...profile, avatar }; assert.equal((await read(did)).avatar, undefined)
  }
})
