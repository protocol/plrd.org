// Read-only HTTP replay against a built local server or a hosted preview.
// No cookies, authorization headers or synthetic data are sent.
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const origin = new URL(process.argv[2] || 'http://127.0.0.1:38428')
assert.ok(['http:', 'https:'].includes(origin.protocol))
const canonicalTeam = 'https://www.plrd.org/team/'
const query = '?source=bio&tag=one&tag=two&note=team%20page'
const results = []
const request = path => fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(20000) })

for (const path of ['/authors', '/authors/', '/Authors', '/AUTHORS/']) {
  const response = await request(path + query)
  assert.equal(response.status, 308, `${path} must redirect permanently`)
  assert.ok(response.headers.get('location'), `${path} needs a Location header`)
  const destination = new URL(response.headers.get('location'), origin)
  assert.equal(destination.origin, origin.origin, `${path} must remain on the same site`)
  assert.equal(destination.pathname, '/team/')
  assert.deepEqual([...destination.searchParams], [...new URL(path + query, origin).searchParams])
  results.push({ path, status: response.status, destination: destination.pathname, queryPreserved: true })
}

for (const path of ['/team', '/team/']) {
  const response = await request(path)
  assert.equal(response.status, 200, `${path} must be the actual page, not a redirect`)
  const doc = new JSDOM(await response.text()).window.document
  assert.equal(doc.querySelector('h1')?.textContent, 'Our team')
  assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), canonicalTeam)
  assert.equal(doc.querySelector('meta[property="og:url"]')?.getAttribute('content'), canonicalTeam)
  assert.match(doc.body.textContent, /Juan Benet is the founder of/)
  assert.ok(!doc.querySelector('meta[name="robots"]')?.content.includes('noindex'), 'the public page must not add a noindex meta tag')
  results.push({ path, status: response.status, canonical: canonicalTeam })
}

for (const path of ['/', '/about/', '/authors/juan-benet/']) {
  const response = await request(path)
  assert.equal(response.status, 200)
  const doc = new JSDOM(await response.text()).window.document
  const hrefs = [...doc.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
  assert.ok(hrefs.includes('/team/'), `${path} must link directly to the Team page`)
  assert.ok(!hrefs.some(href => /^\/authors\/?(?:[?#]|$)/.test(href)), `${path} must not advertise the old Team index`)
  if (path.includes('juan-benet')) {
    assert.ok(!hrefs.some(href => href.includes('juan.benet.ai')))
    assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), `https://www.plrd.org${path}`)
  }
  results.push({ path, status: response.status, teamLinksUpdated: true })
}

const sitemapResponse = await request('/sitemap.xml')
assert.equal(sitemapResponse.status, 200)
const sitemap = new JSDOM(await sitemapResponse.text(), { contentType: 'application/xml' }).window.document
const urls = [...sitemap.querySelectorAll('loc')].map(node => node.textContent)
assert.ok(urls.includes(canonicalTeam))
assert.ok(!urls.includes('https://www.plrd.org/authors/'))
const searchResponse = await request('/search-index.json')
assert.equal(searchResponse.status, 200)
const search = await searchResponse.json()
assert.equal(search.find(item => item.type === 'page' && item.title === 'Team').relpermalink, '/team/')
for (const author of search.filter(item => item.type === 'author')) {
  assert.ok(author.relpermalink.startsWith('/authors/'), 'profile routes must not migrate')
  assert.ok(urls.includes(`https://www.plrd.org${author.relpermalink}`))
}
results.push({ path: '/sitemap.xml', status: 200, teamCanonical: true, profileUrlsRetained: true })
results.push({ path: '/search-index.json', status: 200, teamCanonical: true, profileUrlsRetained: true })

for (const path of ['/teamwork', '/teams/', '/team/juan-benet/', '/team/avatar.png']) {
  const response = await request(path)
  assert.equal(response.status, 404, `${path} must not be swallowed by the Team route`)
  results.push({ path, status: response.status })
}

console.log(JSON.stringify({ verdict: 'PASS', origin: origin.origin, checks: results.length, results }, null, 2))
