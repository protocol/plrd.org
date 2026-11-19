import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

// A retired session must never authorize a visitor, even with a cookie claiming
// the former publishing identity. These are inert synthetic values, not secrets.
const cookies = [undefined, 'plrd_session=forged', `plrd_session=${encodeURIComponent(JSON.stringify({ did: 'did:plc:pgwr6hkosgznfl5nz7egajei', oauthSession: 'synthetic-access' }))}`]

test('status is always anonymous without reading cookies, creating a session, or fetching', async (t) => {
  delete process.env.COOKIE_SECRET
  const { GET } = source('app/api/status/route.ts')
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('No network allowed') })
  for (const cookie of cookies) {
    const request = new Request('https://example.invalid/api/status/', { headers: cookie ? { Cookie: cookie } : {} })
    const response = await GET(request)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { did: null, handle: null, loggedIn: false })
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal(response.headers.get('set-cookie'), null)
  }
  assert.equal(fetch.mock.callCount(), 0)
})

const retiredRoutes = {
  'login': ['POST'], 'logout': ['POST'],
  'oauth/callback': ['GET'], 'oauth/client-metadata.json': ['GET'],
  'oauth/jwks.json': ['GET'], 'pages': ['GET'],
  'pages/[rkey]': ['GET', 'PUT'], 'pages/about': ['GET', 'PUT'],
  'opportunity-spaces/[rkey]': ['GET', 'PUT'], 'posts': ['POST'],
  'hypercerts/delete-record': ['POST'], 'edit-history': ['GET'],
}

test('all retired APIs return 410 without secrets, cookie access, body parsing, redirects, or network writes', async (t) => {
  for (const key of ['COOKIE_SECRET', 'ATPROTO_HANDLE', 'ATPROTO_PASSWORD', 'ATPROTO_JWK_PRIVATE']) delete process.env[key]
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Retired routes must never contact a PDS or OAuth provider') })
  for (const [path, methods] of Object.entries(retiredRoutes)) {
    const route = source(`app/api/${path}/route.ts`)
    for (const method of methods) {
      for (const cookie of cookies) {
        const request = new Request(`https://example.invalid/api/${path}/?code=synthetic-code&state=synthetic-state`, {
          method, headers: cookie ? { Cookie: cookie } : {},
          ...(method === 'GET' ? {} : { body: 'malformed-json-that-must-not-be-parsed' }),
        })
        Object.defineProperty(request, 'cookies', { get() { throw new Error('Do not read request cookies') } })
        const response = await route[method](request, { params: Promise.resolve({ rkey: 'landing' }) })
        assert.equal(response.status, 410, `${method} ${path}`)
        assert.equal(response.headers.get('cache-control'), 'no-store', path)
        assert.equal(response.headers.get('set-cookie'), null, path)
        assert.equal(response.headers.get('location'), null, path)
        const body = await response.json()
        assert.equal(body.readOnly, true, path)
        assert.match(body.contentUrl, /^https:\/\/github\.com\/protocol\/plrd\.org\//)
        assert.doesNotMatch(JSON.stringify(body), /synthetic-access|synthetic-code|synthetic-state/)
      }
    }
  }
  assert.equal(fetch.mock.callCount(), 0)
})
