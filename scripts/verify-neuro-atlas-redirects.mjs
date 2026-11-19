// Run after `pnpm run build` and `pnpm start --hostname 127.0.0.1 --port 3492`:
// node scripts/verify-neuro-atlas-redirects.mjs http://127.0.0.1:3492
// Only loopback is accepted; redirects are never followed and no password is needed.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const origin = new URL(process.argv[2] || 'http://127.0.0.1:3492')
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname), 'local QA only')
assert.equal(origin.protocol, 'http:')
assert.equal(origin.username + origin.password + origin.search + origin.hash, '')
assert.equal(origin.pathname, '/')

const request = (path, options = {}) => fetch(new URL(path, origin), {
  ...options,
  redirect: 'manual',
  signal: AbortSignal.timeout(15000),
})

const cases = [
  ['/neuro-atlas', '/neuro-atlas'],
  ['/neuro-atlas/', '/neuro-atlas'],
  ['/neuro-atlas?view=table&tag=one&tag=two', '/neuro-atlas?view=table&tag=one&tag=two'],
  ['/neuro-atlas/methods', '/neuro-atlas/methods'],
  ['/neuro-atlas/methods/?q=brain%20data&tag=a&tag=b', '/neuro-atlas/methods?q=brain%20data&tag=a&tag=b'],
  ['/neuro-atlas/projects/Example%20Project?next=https%3A%2F%2Fexample.com', '/neuro-atlas/projects/Example%20Project?next=https%3A%2F%2Fexample.com'],
  ['/neuro-atlas/_next/static/chunks/app.js?v=1', '/neuro-atlas/_next/static/chunks/app.js?v=1'],
  ['/neuro-atlas/fonts/test.woff2', '/neuro-atlas/fonts/test.woff2'],
  ['/neuro-atlas/data.csv?download=1', '/neuro-atlas/data.csv?download=1'],
  ['/Neuro-Atlas', '/neuro-atlas'],
  ['/NEURO-ATLAS/', '/neuro-atlas'],
  ['/NeUrO-aTlAs/Methods?view=table', '/neuro-atlas/Methods?view=table'],
  ['/NEURO-ATLAS/_next/static/chunks/App.js', '/neuro-atlas/_next/static/chunks/App.js'],
  ['/NEURO-ATLAS/logos/test.png', '/neuro-atlas/logos/test.png'],
]

for (const [path, target] of cases) {
  test(`production HTTP redirect: ${path}`, async () => {
    const response = await request(path)
    assert.equal(response.status, 307)
    const location = response.headers.get('location')
    assert.ok(location)
    const actual = new URL(location)
    const expected = new URL(target, 'https://www.plneuro.xyz')
    assert.equal(actual.origin, expected.origin)
    assert.equal(actual.pathname, expected.pathname)
    // Next may encode a query-space as '+' instead of '%20'. Preserve values,
    // repeated keys and their order, rather than demanding one space spelling.
    assert.deepEqual([...actual.searchParams], [...expected.searchParams])
    assert.equal(actual.hash, '', 'no replacement fragment: browsers inherit the source fragment')
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
    assert.equal(response.headers.get('x-middleware-rewrite'), null)
    assert.equal(response.headers.get('set-cookie'), null)
    assert.equal(response.headers.get('www-authenticate'), null, 'PLRD redirects; the destination owns authentication')
    await response.body?.cancel()
  })
}

for (const method of ['HEAD', 'POST']) {
  test(`${method} remains a temporary 307 even with invalid auth and a PLRD cookie`, async () => {
    const response = await request('/Neuro-Atlas/methods?view=table', {
      method,
      headers: { authorization: 'Basic invalid', cookie: 'pl-session=local-qa' },
    })
    assert.equal(response.status, 307)
    assert.equal(response.headers.get('location'), 'https://www.plneuro.xyz/neuro-atlas/methods?view=table')
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
    assert.equal(response.headers.get('set-cookie'), null)
    await response.body?.cancel()
  })
}

for (const path of ['/neuro-atlas-other/', '/neuro-atlasfoo/', '/NEURO-ATLAS-other/', '/neuro-atlas.json']) {
  test(`near-prefix is not redirected or marked noindex: ${path}`, async () => {
    const response = await request(path)
    assert.equal(response.status, 404)
    assert.equal(response.headers.get('location'), null)
    assert.equal(response.headers.get('x-robots-tag'), null)
    await response.body?.cancel()
  })
}

for (const path of ['/', '/about/', '/areas/neurotech/']) {
  test(`ordinary PLRD page is unchanged: ${path}`, async () => {
    const response = await request(path)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('location'), null)
    assert.equal(response.headers.get('x-robots-tag'), null)
    assert.match(response.headers.get('content-type'), /text\/html/)
    await response.body?.cancel()
  })
}

test('existing PLRD research redirect remains unchanged', async () => {
  const response = await request('/research/test?view=table')
  assert.equal(response.status, 308)
  assert.equal(response.headers.get('location'), '/insights/test?view=table')
  await response.body?.cancel()
})
