import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { source } from './test-source-loader.mjs'

// Approved methodology-card wording supplied September 16, 2026.
// Preserve the supplied spelling, capitalization, and punctuation verbatim.
const expected = [
  ['legibility', 'Legibility', 'field building communications', 'Maps, roadmaps, benchmarks, and tutorials that make a field navigable'],
  ['connection', 'Connection', 'convenings & talent attraction', 'Forums that bring the right people together and keep them in contact over time'],
  ['funding', 'Funding', 'grants, prizes & fellowships', 'Early money and prizes where small amounts unlock outsized efforts'],
  ['policy', 'Policy', 'standards & experimentation rights', 'Shape adoption paths for working tech, and room to experiment'],
  ['infrastructure', 'Infrastructure', 'primitives, rails & tooling', 'Open protocols and tool that collapse the cost of trying new things'],
  ['translation', 'Translation', 'venture conversion & visibility', 'Routing validated work to pilots, production, and capital'],
  ['culture', 'Culture', 'Celebrating the improving and acceleration mentality', 'Open-ended creative interventions that celebrate techno optimism'],
]

test('all seven methodology cards match the supplied wording and retain their stable IDs', () => {
  const { TOOLKIT_V2 } = source('lib/field-velocity.ts')
  assert.deepEqual(TOOLKIT_V2.map(({ id, title, subtitle, oneLiner }) => [id, title, subtitle, oneLiner]), expected)
})

test('the actual methodology grid renders the supplied copy with existing modal triggers', () => {
  const React = source('../node_modules/react/index.js')
  const { renderToStaticMarkup } = source('../node_modules/react-dom/server.node.js')
  const Methodology = source('components/MeasuringQuestionsV2.tsx').default
  const { document } = new JSDOM(renderToStaticMarkup(React.createElement(Methodology))).window
  const cards = [...document.querySelectorAll('#toolkit button[data-impact-trigger]')]
  assert.equal(cards.length, expected.length)
  cards.forEach((card, i) => {
    const [id, title, subtitle, oneLiner] = expected[i]
    assert.equal(card.dataset.impactTrigger, `#intervention/${id}`)
    assert.equal(card.getAttribute('aria-haspopup'), 'dialog')
    assert.equal(card.querySelector('div > span:first-child').textContent, title)
    assert.equal(card.querySelector('div > span:nth-child(2)').textContent, `· ${subtitle}`)
    assert.equal(card.querySelector('p').textContent, oneLiner)
  })
})
