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

test('team page offers one generic job-board link after the profiles, outside the selected tab', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ data: { orgPlresearchPage: { edges: [] } } }))
  const nodes = elements(await AuthorsPage())
  const profiles = nodes.findIndex(node => node.type?.name === 'AuthorsTabs')
  const openings = nodes.findIndex(node => node.type?.name === 'TeamOpenings')
  assert.ok(openings > profiles && profiles >= 0, 'openings must be a sibling after the team profiles')
  const element = nodes[openings]
  const doc = new JSDOM(renderToStaticMarkup(element)).window.document
  const section = doc.querySelector('section')
  assert.equal(doc.getElementById(section.getAttribute('aria-labelledby')).textContent, 'Join our team')
  assert.equal(section.querySelectorAll('article').length, 0)
  const links = [...section.querySelectorAll('a')]
  assert.equal(links.length, 1)
  assert.equal(links[0].href, 'https://os.pl.xyz/jobs')
  assert.equal(links[0].textContent.trim(), 'See open roles →')
  assert.match(section.querySelector('p').textContent, /Protocol Labs/)
  assert.doesNotMatch(section.textContent, /Philanthropic Fundraising Lead|Program Manager|funding and programs/)
  assert.equal(links[0].querySelector('span').getAttribute('aria-hidden'), 'true')
})
