import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
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
  const nodes = elements(AboutEditPage())
  assert.ok(nodes.some(node => node.props?.href === 'https://github.com/protocol/plrd.org/blob/main/src/data/about.json'))
  assert.match(text(nodes[0]), /pull request/i)
  assert.equal(nodes.some(node => ['form', 'textarea', 'input'].includes(node.type)), false)
})

test('CMS page list excludes About but preserves other editable pages', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: ['about', 'landing', 'area-neurotech'].map(rkey => ({
      node: { uri: `at://did:example:test/org.plresearch.page/${rkey}`, pageId: rkey, sections: [], updatedAt: '2026-01-01T00:00:00Z' },
    })) } },
  }))
  const { GET } = source('app/api/pages/route.ts')
  const result = await (await GET()).json()
  assert.deepEqual(result.pages.map(page => page.rkey), ['landing', 'area-neurotech'])
})
