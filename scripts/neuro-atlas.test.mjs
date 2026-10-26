import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server.js'
import { source } from './velocity/test-source-loader.mjs'

const { default: config } = source('../next.config.ts')

const { middleware } = source('middleware.ts')
const responseFor = (path) => middleware(new NextRequest(`https://www.plrd.org${path}`))

test('legacy Atlas root temporarily redirects to the canonical PL Neuro mount', async () => {
  const response = await responseFor('/neuro-atlas')
  assert.equal(response.status, 307)
  assert.equal(response.headers.get('location'), 'https://www.plneuro.xyz/neuro-atlas')
  assert.equal(response.headers.get('x-middleware-rewrite'), null)
})

test('legacy Atlas deep links and assets retain their path and query on PL Neuro', async () => {
  for (const [path, destination] of [
    ['/neuro-atlas/', '/neuro-atlas'],
    ['/neuro-atlas/methods?view=table&tag=one&tag=two', '/neuro-atlas/methods?view=table&tag=one&tag=two'],
    ['/NeUrO-aTlAs/Methods?view=table', '/neuro-atlas/Methods?view=table'],
    ['/neuro-atlas/methods/', '/neuro-atlas/methods'],
    ['/neuro-atlas/_next/static/chunks/app.js?v=1', '/neuro-atlas/_next/static/chunks/app.js?v=1'],
    ['/neuro-atlas/fonts/test.woff2', '/neuro-atlas/fonts/test.woff2'],
    ['/neuro-atlas/data.csv?download=1', '/neuro-atlas/data.csv?download=1'],
  ]) {
    const response = await responseFor(path)
    assert.equal(response.status, 307, path)
    assert.equal(response.headers.get('location'), `https://www.plneuro.xyz${destination}`, path)
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow', path)
    assert.equal(response.headers.get('x-middleware-rewrite'), null, path)
  }
})

test('near-prefix and ordinary PLRD routes do not enter the Atlas namespace', async () => {
  for (const path of ['/', '/areas/neurotech/', '/neuro-atlas-other/', '/neuro-atlasfoo/', '/neuro-atlas.json']) {
    const response = await responseFor(path)
    assert.equal(response.headers.get('location'), null, path)
    assert.equal(response.headers.get('x-middleware-rewrite'), null, path)
    assert.equal(response.headers.get('x-robots-tag'), null, path)
  }
})

test('retired proxy environment cannot change the redirect target', async (t) => {
  const key = 'NEURO_ATLAS_ORIGIN'
  const previous = process.env[key]
  t.after(() => {
    if (previous === undefined) delete process.env[key]
    else process.env[key] = previous
  })
  process.env[key] = 'https://obsolete-preview.example'
  const response = await responseFor('/neuro-atlas')
  assert.equal(response.headers.get('location'), 'https://www.plneuro.xyz/neuro-atlas')
  assert.equal(config.rewrites, undefined, 'the retired external proxy is removed')
})

test('Atlas declares noindex without config redirects bypassing middleware', async () => {
  assert.deepEqual((await config.redirects()).filter(rule => /neuro-atlas/i.test(rule.source)), [])
  assert.deepEqual((await config.headers()).filter(rule => rule.source === '/neuro-atlas/:path*'), [{
    source: '/neuro-atlas/:path*',
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  }])
})
