import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const routes = [
 'app/llms.txt/route.ts', 'app/llms-full.txt/route.ts', 'app/ai/index.json/route.ts',
 'app/api/ai/search/route.ts', 'app/ai/records/[kind]/[slug]/route.ts',
 'app/ai/markdown/[kind]/[slug]/route.ts', 'app/ai/topics/[slug]/route.ts',
]
test('HTTP routes deliver plain text, focused Markdown, bounded JSON and exact 404s without JS', async () => {
  for (const route of routes) assert.ok(existsSync(`src/${route}`), `missing ${route}`)
  for (const route of routes) {
    const mod = source(route)
    assert.equal(typeof mod.GET, 'function')
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.equal(mod[method], undefined)
  }
  const { aiRecords } = source('lib/ai-content.ts')
  const index = source(routes[0]).GET()
  assert.match(index.headers.get('content-type'), /^text\/plain; charset=utf-8$/)
  const text = await index.text()
  assert.ok(text.length < 6000)
  assert.match(text, /https:\/\/www.plrd.org\/ai\/index.json/)
  const full = source(routes[1]).GET()
  assert.match(full.headers.get('content-disposition'), /attachment/)
  const context = await full.text()
  assert.match(context, /David A. Markowitz/)
  assert.match(context, /No transcript provided/)
  assert.doesNotMatch(context, /class=|<script|<svg|<style/)
  const indexJson = await source(routes[2]).GET().json()
  assert.equal(indexJson.records.length, aiRecords.length)
  const first = aiRecords.find(r => r.kind === 'blog' && r.canonicalKind === 'native' && r.areas.includes('neurotech'))
  const request = new Request('https://www.plrd.org/ai/')
  const params = { params: Promise.resolve({ kind: first.kind, slug: first.slug }) }
  const markdown = await source(routes[5]).GET(request, params)
  assert.match(markdown.headers.get('content-type'), /^text\/markdown/)
  assert.ok((await markdown.text()).includes(first.body))
  const detail = await source(routes[4]).GET(request, params)
  assert.equal((await detail.json()).record.id, first.id)
  const topic = await source(routes[6]).GET(request, { params: Promise.resolve({ slug: 'neurotech' }) })
  assert.equal(topic.status, 200)
  assert.ok((await topic.text()).includes(first.canonicalUrl))
  for (const route of [routes[4], routes[5]]) {
    for (const slug of ['does-not-exist', 'preview-synthetic', 'open-lab', '../about']) {
      assert.equal((await source(route).GET(request, { params: Promise.resolve({ kind: 'blog', slug }) })).status, 404)
    }
  }
  assert.equal((await source(routes[6]).GET(request, { params: Promise.resolve({ slug: 'bogus' }) })).status, 404)
})

test('guide is additive, has accessible copyable prompt, source/scope links and HTML discovery', async () => {
  assert.ok(existsSync('src/app/ai/page.tsx'), 'human guide is required')
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const html = renderToStaticMarkup(React.createElement(source('app/ai/page.tsx').default))
  for (const text of ['llms.txt', 'llms-full.txt', 'ai/index.json', 'api/ai/search/', 'snapshot', 'Copy prompt']) assert.ok(html.includes(text), text)
  assert.ok(readFileSync('src/components/SiteFooter.tsx', 'utf8').includes('href="/ai/"'))
  assert.match(readFileSync('src/app/layout.tsx', 'utf8'), /<link rel="describedby"[^>]+href="\/llms.txt"/)
})
