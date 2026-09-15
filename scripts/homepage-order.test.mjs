import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const { default: HomePage } = source('app/page.tsx')
const { default: InsightCarousel } = source('components/InsightCarousel.tsx')
const { default: RDPipeline } = source('components/RDPipeline.tsx')

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

test('homepage invites visitors to the standalone Open Lab between the hero and focus areas', async (t) => {
  // Only the remote editable-copy boundary is mocked; inspect the real homepage.
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  const nodes = elements(await HomePage())
  const banners = nodes.filter((node) => node.type === 'a' && text(node).includes('Introducing Open Lab'))
  assert.equal(banners.length, 1, 'render exactly one native Open Lab invitation link')
  const banner = banners[0]
  assert.equal(banner.props.href, 'https://open-lab-two.vercel.app/', 'navigate directly to the separate app origin')
  assert.equal(banner.props.onClick, undefined, 'preserve native navigation without JavaScript interception')
  assert.equal(banner.props.target, undefined, 'navigate in the current tab by default')
  assert.ok(text(banner).includes('Made something that makes science easier?'))
  assert.ok(text(banner).includes('Explore the lab →'))
  const heroIndex = nodes.findIndex((node) => node.type === 'h1')
  const focusIndex = nodes.findIndex((node) => node.props?.id === 'focus-areas')
  assert.ok(heroIndex >= 0 && nodes.indexOf(banner) > heroIndex, 'invitation follows the hero')
  assert.ok(focusIndex > nodes.indexOf(banner), 'invitation precedes focus areas')
})

test('homepage places the existing latest carousel between focus areas and the innovation-chasm graphic', async (t) => {
  // Only the remote editable-copy boundary is mocked; render the real homepage.
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  const nodes = elements(await HomePage())
  const carousel = nodes.filter((node) => node.type === InsightCarousel)
  const pipeline = nodes.filter((node) => node.type === RDPipeline)
  assert.equal(carousel.length, 1, 'keep exactly one carousel')
  assert.equal(pipeline.length, 1, 'keep exactly one pipeline graphic')
  assert.equal(carousel[0].props.items.length, 8, 'preserve the latest-eight feed')
  const focusIndex = nodes.findIndex((node) => node.props?.id === 'focus-areas')
  const latestIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'Latest from PL R&D')
  const chasmIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'PL R&D helps promising research cross the innovation chasm')
  const teamIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'Team')
  assert.ok(focusIndex >= 0 && latestIndex > focusIndex, 'latest stays below focus areas')
  assert.ok(nodes.indexOf(carousel[0]) > latestIndex, 'carousel follows its heading')
  assert.ok(chasmIndex > nodes.indexOf(carousel[0]), 'latest carousel must precede the innovation-chasm heading')
  assert.ok(nodes.indexOf(pipeline[0]) > chasmIndex, 'graphic stays with its heading')
  assert.ok(teamIndex > nodes.indexOf(pipeline[0]), 'team remains below both sections')
})
