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

test('homepage previews the three field-building steps above the four focus areas', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  const nodes = elements(await HomePage())
  const isLink = (node) => node.type === 'a' || node.type?.render?.name === 'LinkComponent'
  const invitations = nodes.filter((node) => isLink(node) && text(node).includes('Explore how we build fields'))
  assert.equal(invitations.length, 1, 'one methodology invitation, not a second hero tease')
  const invitation = invitations[0]
  assert.equal(invitation.props.href, '/methodology/')
  const copy = text(invitation)
  assert.ok(copy.includes('Methodology'))
  assert.ok(copy.includes('Learn about our methodology →'))
  assert.equal(copy.includes('Read the methodology'), false)
  for (const step of ['01Diagnose', '02Intervene', '03Learn']) {
    assert.ok(copy.includes(step), `teaser previews ${step}`)
  }
  assert.ok(copy.includes('Name the binding constraint.'))
  const label = elements(invitation).find((node) => node.type === 'span' && text(node) === 'Methodology')
  assert.equal(label.props.className.includes('text-[12px]'), true)
  assert.equal(label.props.className.includes('text-dark-blue'), true, '12px label uses the contrast-safe token')
  const focusIndex = nodes.findIndex((node) => node.props?.id === 'focus-areas')
  const latestIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'Latest from PL R&D')
  const heroIndex = nodes.findIndex((node) => node.type === 'h1')
  const invitationIndex = nodes.indexOf(invitation)
  assert.ok(invitationIndex > heroIndex && focusIndex > invitationIndex, 'invitation sits above the four focus areas')
  assert.ok(latestIndex > focusIndex, 'news stays below the focus areas')
})
