import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server.js'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server.js'
import { source } from './velocity/test-source-loader.mjs'

const { middleware, config } = source('middleware.ts')
const { COOKIE_CONSENT_ENABLED } = source('lib/cookie-consent.ts')

test('Atlas redirects cover assets excluded from ordinary PLRD middleware', () => {
  // Middleware owns the redirect response so noindex survives; its matcher must
  // include the whole case-insensitive namespace, including static assets.
  for (const path of ['/neuro-atlas', '/Neuro-Atlas/', '/neuro-atlas/_next/static/chunks/app.js', '/neuro-atlas/fonts/test.woff2', '/NeUrO-aTlAs/data.csv', '/NEURO-ATLAS/logos/test.png']) {
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
