import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const { default: AreaPage } = source('app/areas/[slug]/page.tsx')
const { default: BlogPage } = source('app/blog/page.tsx')
const { externalSourceLabel } = source('lib/format.ts')
const href = 'https://www.plneuro.xyz/insights/introducing-neuro-atlas/'
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes)
  if (!node || typeof node !== 'object') return []
  return [node, ...nodes(node.props?.children)]
}
function isolate(t) {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ data: {} }))
}

test('Neurotech launch-post row attributes the actual published source domain', async (t) => {
  isolate(t)
  const tree = await AreaPage({ params: Promise.resolve({ slug: 'neurotech' }) })
  const row = nodes(tree).find(node => node.type === 'div' && node.props.className === 'py-4' && nodes(node).some(child => child.props.href === href))
  assert.ok(row)
  const { document } = new JSDOM(renderToStaticMarkup(row)).window
  assert.match(document.body.textContent, /Blog · plneuro\.xyz · Nov 19, 2026/)
  assert.doesNotMatch(document.body.textContent, /protocol\.ai/)
  assert.equal(document.querySelector('a').href, href)
})

test('native Blog listing attributes the launch post to plneuro.xyz', async (t) => {
  isolate(t)
  const tree = await BlogPage()
  const listing = nodes(tree).find(node => Array.isArray(node.props.tiles))
  const tile = listing.props.tiles.find(tile => tile.key === 'introducing-neuro-atlas')
  assert.ok(tile)
  assert.equal(tile.eyebrow, 'plneuro.xyz · Nov 19, 2026')
  assert.equal(tile.href, href)
})

test('external publisher labels identify PL Neuro and preserve historical attribution', () => {
  assert.equal(externalSourceLabel(href), 'plneuro.xyz')
  assert.equal(externalSourceLabel('https://blog.cosmos-institute.org/example/'), 'protocol.ai')
  assert.equal(externalSourceLabel('https://protocol.ai/blog/example/'), 'protocol.ai')
  assert.equal(externalSourceLabel('https://www.protocol.ai/blog/example/'), 'protocol.ai')
  assert.equal(externalSourceLabel(''), '')
  assert.equal(externalSourceLabel('malformed'), '')
})
