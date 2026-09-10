import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

test('metadata and capabilities routes share a public identity without request-header authority', async () => {
  const before = process.env.LAB_PUBLIC_URL
  process.env.LAB_PUBLIC_URL = 'https://lab-preview.example.org'
  try {
    const caps = await source('app/api/lab/capabilities/route.ts').GET()
    assert.match(caps.headers.get('cache-control'), /no-store/)
    const c = await caps.json()
    const req = new Request(c.clientId, { headers: { 'x-forwarded-host': 'attacker.example.org' } })
    const res = await source('app/api/lab/oauth/client-metadata.json/route.ts').GET(req)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('location'), null)
    assert.deepEqual(await res.json(), c.metadata)
    const wrong = await source('app/api/lab/oauth/client-metadata.json/route.ts').GET(new Request('https://wrong.example.org/api/lab/oauth/client-metadata.json'))
    assert.equal(wrong.status, 404)
    const wrongCaps = await source('app/api/lab/capabilities/route.ts').GET(new Request('https://wrong.example.org/api/lab/capabilities/'))
    assert.equal((await wrongCaps.json()).canSignIn, false)
    // Official SDK metadata parser from the installed browser SDK dependency.
    const sdkRequire = createRequire(require.resolve('@atproto/oauth-client-browser'))
    const { clientMetadataSchema } = sdkRequire('@atproto/oauth-client')
    assert.equal(clientMetadataSchema.parse(c.metadata).token_endpoint_auth_method, 'none')
  } finally { if (before === undefined) delete process.env.LAB_PUBLIC_URL; else process.env.LAB_PUBLIC_URL = before }
})

test('explicit HTTPS public identity declares only the five exact collection write scopes', () => {
  const { getLabOAuthConfig } = source('lib/lab-oauth-config.ts')
  const result = getLabOAuthConfig({ LAB_PUBLIC_URL: 'https://lab-preview.example.org', LAB_ENABLE_PUBLISH: 'true' })
  assert.equal(result.mode, 'ready')
  assert.equal(result.oauthVerified, false)
  assert.equal(result.canPublish, true)
  const m = result.metadata
  assert.equal(m.client_id, 'https://lab-preview.example.org/api/lab/oauth/client-metadata.json')
  assert.deepEqual(m.redirect_uris, ['https://lab-preview.example.org/lab/oauth/return/'])
  assert.equal(m.token_endpoint_auth_method, 'none')
  assert.equal(m.dpop_bound_access_tokens, true)
  assert.equal(m.application_type, 'web')
  assert.deepEqual(m.scope.split(' '), ['atproto', ...['profile','note','app','contribution','participation'].map(k => `repo:org.plresearch.lab.${k}?action=create${k === 'profile' ? '&action=update' : ''}&action=delete`)])
  assert.equal(JSON.stringify(result).includes('secret'), false)
})

test('configuration fails closed, uses trusted Vercel origin, and refuses wrong browser alias', () => {
  const { getLabOAuthConfig, configForBrowser } = source('lib/lab-oauth-config.ts')
  for (const origin of [undefined, '', 'https://www.plrd.org/path', 'http://example.org', 'https://a:b@example.org', 'https://example.org:444', 'https://127.0.0.1', 'https://example.org?x=1']) {
    assert.equal(getLabOAuthConfig({ LAB_PUBLIC_URL: origin }).canSignIn, false, String(origin))
  }
  const c = getLabOAuthConfig({ VERCEL: '1', VERCEL_URL: 'plrd-branch.vercel.app' })
  assert.equal(c.origin, 'https://plrd-branch.vercel.app')
  assert.equal(c.canPublish, false)
  assert.equal(configForBrowser(c, 'https://plrd-branch.vercel.app').canSignIn, true)
  assert.equal(configForBrowser(c, 'https://www.plrd.org').canSignIn, false)
  assert.equal(getLabOAuthConfig({ VERCEL_URL: 'evil.test' }).canSignIn, false)
})

test('arbitrary Vercel previews refuse an inherited production origin; stale browser metadata fails closed', () => {
  const { getLabOAuthConfig, configForBrowser, labActionScope } = source('lib/lab-oauth-config.ts')
  assert.equal(getLabOAuthConfig({ VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_URL: 'branch.vercel.app', LAB_PUBLIC_URL: 'https://www.plrd.org' }).canSignIn, false)
  const c = getLabOAuthConfig({ LAB_PUBLIC_URL: 'https://lab.example.org' })
  for (const patch of [{ clientId: 'https://old.example.org/metadata' }, { redirectUri: 'https://old.example.org/callback' }, { metadata: { ...c.metadata, scope: 'atproto transition:generic' } }]) assert.equal(configForBrowser({ ...c, ...patch }, c.origin).canSignIn, false)
  assert.equal(labActionScope('note', 'delete'), 'repo:org.plresearch.lab.note?action=delete')
  assert.throws(() => labActionScope('note', 'update'))
  assert.throws(() => labActionScope('unknown', 'create'))
})

test('loopback config delegates special metadata to the official load helper', () => {
  const { getLabOAuthConfig } = source('lib/lab-oauth-config.ts')
  const c = getLabOAuthConfig({ LAB_PUBLIC_URL: 'http://127.0.0.1:3382', NODE_ENV: 'development' })
  assert.equal(c.canSignIn, true)
  const u = new URL(c.clientId)
  assert.equal(u.origin, 'http://localhost')
  assert.equal(u.searchParams.get('redirect_uri'), 'http://127.0.0.1:3382/lab/oauth/return/')
  assert.equal(c.metadata, undefined)
  assert.equal(getLabOAuthConfig({ LAB_PUBLIC_URL: 'http://127.0.0.1:3382', VERCEL: '1' }).canSignIn, false)
  assert.equal(getLabOAuthConfig({ LAB_PUBLIC_URL: 'http://localhost:3382' }).canSignIn, false)
})

test('return state permits only same-origin Lab UI destinations', () => {
  const { safeLabReturnTo } = source('lib/lab-oauth-config.ts')
  assert.equal(safeLabReturnTo('/lab/feed/?type=question#draft'), '/lab/feed/?type=question#draft')
  for (const path of ['//evil.test/lab/', 'https://evil.test/lab/', '/api/login/', '/lab/oauth/return/', '/lab/../admin/', '/lab/%2e%2e/admin/', '/lab/%252f%252fevil.test/', '/lab/feed/?next=https://evil.test']) {
    assert.equal(safeLabReturnTo(path), '/lab/', path)
  }
})
