import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server.js'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server.js'
import { source } from './velocity/test-source-loader.mjs'

const { middleware, config } = source('middleware.ts')
const { COOKIE_CONSENT_ENABLED } = source('lib/cookie-consent.ts')
// Next external rewrites match case-insensitively; isolation must cover that same set.
const atlasPaths = ['/neuro-atlas', '/neuro-atlas/', '/neuro-atlas/methods/', '/neuro-atlas/_next/static/chunks/app.js', '/neuro-atlas/fonts/test.woff2', '/neuro-atlas/data.csv', '/Neuro-Atlas/', '/NEURO-ATLAS/milestones', '/NeUrO-aTlAs/_next/static/chunks/app.js', '/NEURO-ATLAS/logos/test.png']

test('Atlas namespace strips inbound cookies but preserves Basic Authorization on every route and asset', () => {
  for (const path of atlasPaths) {
    const req = new NextRequest(`https://www.plrd.org${path}`, { headers: {
      cookie: 'pl-session=private; pl-consent-region=required',
      authorization: 'Basic dGVzdDp0ZXN0',
      'x-vercel-ip-country': 'DE',
    } })
    const res = middleware(req)
    assert.ok(res.headers.has('x-middleware-override-headers'), path)
    assert.equal(res.headers.get('x-middleware-request-cookie'), null, path)
    assert.equal(res.headers.get('x-middleware-request-authorization'), 'Basic dGVzdDp0ZXN0', path)
    assert.equal(res.headers.get('set-cookie'), null, 'Atlas must not trigger PLRD consent cookies')
    assert.equal(req.headers.get('cookie'), 'pl-session=private; pl-consent-region=required', 'clone, do not mutate input')
  }
})

test('Atlas pages and assets are noindex even before Basic auth succeeds', () => {
  for (const path of atlasPaths) {
    for (const authorization of [undefined, 'Basic invalid', 'Basic dGVzdDp0ZXN0']) {
      const req = new NextRequest(`https://www.plrd.org${path}`, {
        headers: authorization ? { authorization } : {},
      })
      const res = middleware(req)
      assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow', `${path}: ${authorization ?? 'unauthenticated'}`)
      // Let the upstream Basic gate decide 200/401, without removing its credentials.
      assert.equal(res.headers.get('x-middleware-request-authorization'), authorization ?? null)
    }
  }
  for (const path of ['/', '/areas/neurotech/', '/neuro-atlas-other/']) {
    assert.equal(middleware(new NextRequest(`https://www.plrd.org${path}`)).headers.get('x-robots-tag'), null, path)
  }
})

test('middleware explicitly matches Atlas static assets excluded from ordinary page matching', () => {
  for (const path of atlasPaths) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: `https://www.plrd.org${path}` }), true, path)
  }
})

test('PLRD routes including near-prefix names retain original consent and request behavior', () => {
  for (const path of ['/', '/areas/neurotech/', '/neuro-atlas-other/', '/api/auth/callback/', '/_next/static/app.js']) {
    const req = new NextRequest(`https://www.plrd.org${path}`, { headers: { cookie: 'pl-session=private', 'x-vercel-ip-country': 'DE' } })
    const res = middleware(req)
    assert.equal(res.headers.get('x-middleware-override-headers'), null, path)
    assert.equal(req.headers.get('cookie'), 'pl-session=private')
    if (COOKIE_CONSENT_ENABLED) assert.match(res.headers.get('set-cookie'), /pl-consent-region=required/)
    else assert.equal(res.headers.get('set-cookie'), null)
  }
  for (const path of ['/api/auth/callback/', '/_next/static/app.js', '/images/test.png']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: `https://www.plrd.org${path}` }), false, path)
  }
})
