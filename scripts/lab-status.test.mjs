import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
const sessionPath = path.resolve('src/lib/session.ts')
let current = {}
require.cache[sessionPath] = { id: sessionPath, filename: sessionPath, loaded: true, exports: { getSession: async () => {
  if (current instanceof Error) throw current
  return current
} } }

test('auth status returns only public identity fields, never serialized OAuth credentials or future private fields', async () => {
  current = { did: 'did:plc:jfhpnnst6flqway4eaeqzj2a', handle: 'test.bsky.social', displayName: 'Test', avatar: 'https://cdn.bsky.app/avatar/example', oauthSession: JSON.stringify({ refreshToken: 'MOCK_REFRESH_ONLY', dpopJwk: { d: 'MOCK_PRIVATE_KEY_ONLY' } }), futurePrivate: 'MOCK_FUTURE_SECRET' }
  const { GET } = source('app/api/status/route.ts')
  const response = await GET()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), { did: current.did, handle: current.handle, displayName: current.displayName, avatar: current.avatar })
})

test('signed-out status and session errors are not cacheable and leak no internals', async () => {
  const { GET } = source('app/api/status/route.ts')
  current = {}
  const anonymous = await GET()
  assert.deepEqual(await anonymous.json(), {})
  assert.equal(anonymous.headers.get('cache-control'), 'private, no-store')
  current = new Error('MOCK_DO_NOT_EXPOSE')
  const failed = await GET()
  assert.equal(failed.status, 500)
  assert.deepEqual(await failed.json(), {})
  assert.equal(failed.headers.get('cache-control'), 'private, no-store')
})
