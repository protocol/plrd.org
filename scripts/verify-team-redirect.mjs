// Read-only HTTP replay against a built local server or a hosted preview.
// No cookies, authorization headers or synthetic data are sent.
import assert from 'node:assert/strict'

const origin = new URL(process.argv[2] || 'http://127.0.0.1:38428')
assert.ok(['http:', 'https:'].includes(origin.protocol))
const query = '?source=bio&tag=one&tag=two&note=team%20page'
const results = []

for (const path of ['/team', '/team/', '/Team', '/TEAM/']) {
  const response = await fetch(new URL(path + query, origin), { redirect: 'manual' })
  assert.equal(response.status, 308, `${path} must redirect permanently`)
  const destination = new URL(response.headers.get('location'), origin)
  assert.equal(destination.origin, origin.origin, `${path} must remain on the same site`)
  assert.equal(destination.pathname, '/authors/')
  assert.deepEqual([...destination.searchParams], [...new URL(path + query, origin).searchParams])
  results.push({ path, status: response.status, destination: destination.pathname, queryPreserved: true })
}

for (const path of ['/authors/', '/authors/juan-benet/']) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual' })
  assert.equal(response.status, 200, `${path} must remain available without a redirect loop`)
  const html = await response.text()
  assert.match(html, /Juan Benet/)
  if (path.includes('juan-benet')) {
    assert.match(html, /Juan Benet is the founder of/)
    assert.ok(!html.includes('juan.benet.ai'), 'removed personal-website link must remain absent')
  }
  results.push({ path, status: response.status })
}

for (const path of ['/teamwork', '/teams/', '/team/juan-benet/', '/team/avatar.png']) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual' })
  assert.equal(response.status, 404, `${path} must not be swallowed by the exact Team alias`)
  results.push({ path, status: response.status })
}

console.log(JSON.stringify({ verdict: 'PASS', origin: origin.origin, results }, null, 2))
