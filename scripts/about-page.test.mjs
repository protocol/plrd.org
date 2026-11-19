import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

const { default: AboutPage } = source('app/about/page.tsx')
const { default: MarkdownContent } = source('components/MarkdownContent.tsx')
const { markdownToHtml } = source('lib/markdown.ts')

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  return node && typeof node === 'object' ? text(node.props?.children) : ''
}

test('About renders its approved copy without fetching CMS content', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  const nodes = elements(await AboutPage())
  assert.equal(fetch.mock.callCount(), 0, 'About must not read the ATProto indexer')
  assert.equal(text(nodes.find(node => node.type === 'h1')),
    'PL R&D is the research + field-building arm of the Protocol Labs innovation network.')
  const hero = nodes.find(node => node.type === MarkdownContent)
  const html = markdownToHtml(hero.props.content)
  assert.equal((html.match(/<p>/g) || []).length, 2)
  assert.match(html, /support alone\.<\/p>\s*<p>We help promising fields/)
  const { aboutContent } = source('lib/about.ts')
  const renderedBodies = nodes.filter(node => node.type === MarkdownContent).map(node => node.props.content)
  assert.deepEqual(renderedBodies, Object.values(aboutContent).map(section => section.body), 'all six migrated bodies retain their order')
  assert.ok(nodes.some(node => node.props?.slug === 'juan-benet'))
  assert.ok(nodes.some(node => node.props?.slug === 'will-scott'))
  assert.equal(nodes.filter(node => node.props?.description).length, 4, 'retain the four focus-area cards')
  assert.ok(nodes.every(node => node.props?.rkey !== 'about'), 'no stale CMS edit/history controls')
})

test('retired About CMS API refuses both stale reads and writes without any fetch', async (t) => {
  assert.ok(existsSync('src/app/api/pages/about/route.ts'), 'About needs its own retired-CMS endpoint')
  const { GET, PUT } = source('app/api/pages/about/route.ts')
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('No CMS calls allowed') })
  for (const method of [GET, PUT]) {
    const response = await method()
    assert.equal(response.status, 410)
    const body = await response.json()
    assert.equal(body.readOnly, true)
    assert.equal(body.contentUrl, 'https://github.com/protocol/plrd.org/blob/main/src/data/about.json')
  }
  assert.equal(fetch.mock.callCount(), 0)
})

test('legacy About editor guides contributors to PRs instead of offering a CMS save', () => {
  assert.doesNotMatch(readFileSync('src/app/about/edit/page.tsx', 'utf8'), /useRequireAdmin|usePageEdit/, 'the retired editor must not require ATProto authentication')
  const { default: AboutEditPage } = source('app/about/edit/page.tsx')
  const html = renderToStaticMarkup(AboutEditPage())
  assert.ok(html.includes('https://github.com/protocol/plrd.org/blob/main/src/data/about.json'))
  assert.match(html, /pull request/i)
  assert.doesNotMatch(html, /<(form|textarea|input)\b/)
})

test('the entire obsolete CMS list and generic read/write API is now retired', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('No CMS calls allowed') })
  const list = source('app/api/pages/route.ts')
  const detail = source('app/api/pages/[rkey]/route.ts')
  for (const method of [list.GET, detail.GET, detail.PUT]) {
    const response = await method(new Request('http://localhost/api/pages/landing/'), { params: Promise.resolve({ rkey: 'landing' }) })
    assert.equal(response.status, 410)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal((await response.json()).readOnly, true)
  }
  assert.equal(fetch.mock.callCount(), 0)
})

test('decoded About rkeys cannot reach the generic CMS read or write paths', async (t) => {
  const require = createRequire(import.meta.url)
  const { getRouteMatcher } = require('next/dist/shared/lib/router/utils/route-matcher')
  const { getRouteRegex } = require('next/dist/shared/lib/router/utils/route-regex')
  const match = getRouteMatcher(getRouteRegex('/api/pages/[rkey]'))
  const { GET, PUT } = source('app/api/pages/[rkey]/route.ts')
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [{node: {pageId: 'about', sections: []}}] } },
  }))
  for (const path of ['/api/pages/about', '/api/pages/%61bout', '/api/pages/ab%6fut']) {
    const params = match(path)
    assert.equal(params.rkey, 'about')
    for (const method of [GET, PUT]) {
      const response = await method(new Request(`http://localhost${path}`), { params: Promise.resolve(params) })
      assert.equal(response.status, 410, path)
    }
  }
  assert.equal(fetch.mock.callCount(), 0)
})
