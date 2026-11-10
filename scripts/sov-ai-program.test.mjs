import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const { default: config } = source('../next.config.ts')
const file = (name) => readFileSync(`public/sov-ai/${name}`)
const html = () => file('index.html').toString()
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

test('the SovAI namespace retains noindex and its standalone security policy', async () => {
  const rule = (await config.headers()).find(rule => rule.source === '/sov-ai/:path*')
  assert.ok(rule, 'scoped SovAI headers are missing')
  const headers = Object.fromEntries(rule.headers.map(h => [h.key.toLowerCase(), h.value]))
  assert.equal(headers['x-robots-tag'], 'noindex, nofollow, noarchive')
  assert.equal(headers['x-content-type-options'], 'nosniff')
  assert.equal(headers['referrer-policy'], 'no-referrer')
  assert.equal(headers['x-frame-options'], 'DENY')
  assert.match(headers['content-security-policy'], /connect-src 'none'/)
  assert.match(headers['content-security-policy'], /script-src 'self'/)
})

test('both SovAI entry paths serve the repository-owned page, not an external proxy', async () => {
  const rules = await config.rewrites?.()
  for (const path of ['/sov-ai', '/sov-ai/']) {
    assert.ok(rules?.beforeFiles?.some(rule => rule.source === path && rule.destination === '/sov-ai/index.html'), path)
  }
})

test('the migrated document contains the approved copy and all local resources work from either entry URL', () => {
  assert.ok(existsSync('public/sov-ai/index.html'), 'repository-owned HTML is missing')
  const doc = new JSDOM(html()).window.document
  const description = 'Sovereign AI is a Protocol Labs R&D program helping countries build the technological and institutional capacity to shape their own AI futures.'
  assert.equal(doc.title, 'Sovereign AI — A Protocol Labs R&D program')
  assert.equal(doc.querySelector('meta[name="description"]').content, description)
  assert.equal(doc.querySelector('.overview-copy .lead').textContent, description)
  assert.equal(doc.querySelector('.hero-deck').textContent, description)
  assert.equal(doc.querySelector('link[rel="canonical"]').href, 'https://www.plrd.org/sov-ai')
  assert.doesNotMatch(doc.body.textContent, /Website preview/)
  for (const entry of ['https://www.plrd.org/sov-ai', 'https://www.plrd.org/sov-ai/']) {
    for (const element of doc.querySelectorAll('img[src], script[src], link[href], a[href]')) {
      const raw = element.getAttribute('src') || element.getAttribute('href')
      if (raw.startsWith('#') || /^(https:|mailto:)/.test(raw)) continue
      const url = new URL(raw, entry)
      assert.ok(url.pathname.startsWith('/sov-ai/'), raw)
      assert.ok(existsSync(`public${url.pathname}`), raw)
    }
  }
})


test('the exact import allowlist preserves original assets, code and all five PDFs', () => {
  const manifest = JSON.parse(readFileSync('docs/sov-ai/import-manifest.json', 'utf8'))
  assert.match(manifest.upstreamRevision, /^[a-f0-9]{40}$/)
  assert.equal(manifest.files.length, 18)
  assert.equal(manifest.files.filter(row => row.path.endsWith('.pdf')).length, 5)
  for (const row of manifest.files) {
    assert.equal(sha256(file(row.path)), row.mountedSha256, row.path)
    if (row.path !== 'index.html') assert.equal(row.mountedSha256, row.upstreamSha256, row.path)
    if (row.path.endsWith('.pdf')) assert.equal(file(row.path).subarray(0, 5).toString(), '%PDF-')
  }
})

test('the main site does not advertise this unlisted route through navigation, search or sitemap', () => {
  for (const path of ['src/lib/site-config.ts', 'src/app/sitemap.ts', 'public/search-index.json']) {
    assert.doesNotMatch(readFileSync(path, 'utf8'), /[\/"']sov-ai(?:[\/"'#?]|$)/, path)
  }
  assert.match(html(), /name="robots" content="noindex, nofollow, noarchive"/)
  const doc = new JSDOM(html()).window.document
  assert.equal(doc.querySelectorAll('form, iframe').length, 0)
  assert.equal(doc.querySelectorAll('script').length, 1)
  assert.equal(doc.querySelector('script').getAttribute('src'), '/sov-ai/app.js')
  assert.equal(doc.querySelectorAll('.brief-preview').length, 5)
  assert.equal(doc.querySelectorAll('[data-audience-panel][hidden]').length, 0, 'both audiences work without JS')
})
