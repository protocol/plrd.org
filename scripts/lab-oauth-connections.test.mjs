import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const configLib = source('lib/lab-oauth-config.ts')
const origin = 'https://lab.example.org', did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'

test('native connection capability is separate from custom publication and declares only follow create/delete', async () => {
  const config = configLib.getLabOAuthConfig({ LAB_PUBLIC_URL: origin })
  assert.equal(config.canConnect, true)
  assert.equal(config.canPublish, false)
  assert.ok(config.metadata.scope.split(' ').includes('repo:app.bsky.graph.follow?action=create&action=delete'))
  assert.doesNotMatch(config.metadata.scope, /transition:|rpc:|repo:\*/)
  assert.equal(configLib.getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_CONNECT: 'false' }).canConnect, false)
  assert.equal(configLib.getLabOAuthConfig({ LAB_PUBLIC_URL: '' }).canConnect, false)
  for (const flag of ['', 'TRUE', 'typo']) assert.equal(configLib.getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_CONNECT: flag }).canConnect, false)
  const calls = [], redirects = []
  let allow = true, deleted, resolve
  const runtime = source('lib/lab-auth.tsx').createLabAuthRuntime({
    loadConfig: async () => configLib.getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_CONNECT: allow ? 'true' : 'false' }),
    loadClient: async (_, cb) => { deleted = cb; return { init: async () => ({ session: { sub: did, did, signOut: async () => {} } }), authorize: async (actor, opts) => { calls.push([actor, opts]); return resolve ? new Promise(r => { resolve = r }) : new URL('https://auth.example.org/consent') } } },
    location: () => ({ origin, pathname: '/lab/profile/' }), replace: x => redirects.push(x),
  })
  await runtime.initialize()
  for (const action of ['create', 'delete']) {
    await runtime.authorizeConnection(action, '/lab/profile/#connections')
    assert.deepEqual(calls.at(-1), [did, { scope: `atproto repo:app.bsky.graph.follow?action=${action}`, state: '/lab/profile/#connections', prompt: 'consent' }])
  }
  await assert.rejects(() => runtime.authorizeConnection('update'), /permission/i)
  allow = false; await assert.rejects(() => runtime.authorizeConnection('create'), /disabled/i)
  allow = true; resolve = true
  const pending = runtime.authorizeConnection('create', '/lab/profile/#connections')
  await new Promise(r => setImmediate(r)); deleted(did)
  resolve(new URL('https://auth.example.org/consent')); await pending
  assert.equal(redirects.length, 2, 'invalidated authorization does not navigate')
})
