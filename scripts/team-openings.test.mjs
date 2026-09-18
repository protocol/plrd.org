import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const { default: AuthorsPage } = source('app/authors/page.tsx')
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

test('team page offers both exact job listings after the profiles, outside the selected tab', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ data: { orgPlresearchPage: { edges: [] } } }))
  const nodes = elements(await AuthorsPage())
  const profiles = nodes.findIndex(node => node.type?.name === 'AuthorsTabs')
  const openings = nodes.findIndex(node => node.type?.name === 'TeamOpenings')
  assert.ok(openings > profiles && profiles >= 0, 'openings must be a sibling after the team profiles')
  const element = nodes[openings]
  const doc = new JSDOM(renderToStaticMarkup(element)).window.document
  const section = doc.querySelector('section')
  assert.equal(doc.getElementById(section.getAttribute('aria-labelledby')).textContent, 'Join our team')
  const cards = [...section.querySelectorAll('article')]
  assert.equal(cards.length, 2)
  const expected = [
    ['Philanthropic Fundraising Lead', 'manual-pl-philanthropic-fundraising-lead'],
    ['Program Manager, Neurotech', 'clneurotechpgm91537777x'],
  ]
  cards.forEach((card, index) => {
    assert.equal(card.querySelector('h3').textContent, expected[index][0])
    const link = card.querySelector('a')
    assert.equal(link.href, `https://os.pl.xyz/jobs/openings/${expected[index][1]}?utm_source=job_refer_share&utm_medium=copy_link`)
    assert.match(link.textContent, /View role and apply/)
    assert.ok(link.getAttribute('aria-label').includes(expected[index][0]))
    assert.ok(card.querySelector('p').textContent.length > 100)
  })
})
