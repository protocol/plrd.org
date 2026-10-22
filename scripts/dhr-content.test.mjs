import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { JSDOM } from 'jsdom'

import { source } from './velocity/test-source-loader.mjs'

const { default: AreaPage } = source('app/areas/[slug]/page.tsx')

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

test('DHR presents Open-Source Security Acceleration as its flagship before opportunity spaces', async () => {
  const page = await AreaPage({ params: Promise.resolve({ slug: 'digital-human-rights' }) })
  const nodes = elements(page)
  const section = nodes.find(node => node.type === 'section' && node.props.id === 'flagship-program')
  assert.ok(section, 'DHR needs a visible, directly linkable flagship program section')
  const contents = elements(section)
  assert.equal(text(contents.find(node => node.type === 'h2')), 'Open-Source Security Acceleration')
  assert.match(text(section), /A PL R&D flagship program, built with Public Goods Foundation/)
  assert.match(text(section), /POSSUM/)
  assert.match(text(section), /utilities, governments/)
  const links = contents.filter(node => node.type === 'a')
  assert.equal(links.length, 2)
  for (const link of links) {
    assert.equal(link.props.href, 'https://www.publicgoods.foundation/')
    assert.equal(link.props.target, '_blank')
    assert.equal(link.props.rel, 'noopener noreferrer')
  }
  assert.doesNotMatch(text(section), /OpenAI|seven.figure|\$20|98%/)
  assert.ok(nodes.indexOf(section) < nodes.findIndex(node => node.props?.id === 'opportunity-spaces'))
})

test('the DHR flagship does not appear on other focus-area pages', async () => {
  for (const slug of ['ai-robotics', 'neurotech']) {
    const nodes = elements(await AreaPage({ params: Promise.resolve({ slug }) }))
    assert.equal(nodes.some(node => node.props?.id === 'flagship-program'), false)
    assert.doesNotMatch(text(nodes[0]), /POSSUM|Open-Source Security Acceleration/)
  }
})

const slug = 'securing-fundamental-rights-in-the-digital-realm'
const { data, content } = matter(readFileSync(`content/blog/${slug}/index.md`, 'utf8'))
const html = remark().use(remarkHtml, { sanitize: false }).processSync(content).toString()
const document = new JSDOM(html).window.document

test('all four DHR inflections separate their observable criterion from the explanation and implication', () => {
  const cards = [...document.querySelectorAll('.inflection')]
  assert.equal(cards.length, 4)
  for (const card of cards) {
    assert.ok(card.querySelector('h3.inflection-title'), 'the inflection has a semantic title')
    const section = card.querySelector('.inflection-observable')
    assert.ok(section, 'the observable criterion has its own section')
    assert.equal(section.querySelector('h4')?.textContent, 'What we’re watching for')
    assert.equal(section.querySelectorAll('p').length, 1)
    assert.ok(section.querySelector('p').textContent.length > 50)
    assert.equal(section.previousElementSibling?.className, 'inflection-body')
    assert.equal(section.nextElementSibling?.className, 'inflection-body inflection-implication')
    assert.equal(card.textContent.match(/What we’re watching for/g)?.length, 1)
  }
})

test('Molly Mackinlay is the sole DHR article author', () => {
  assert.deepEqual(data.authors, ['molly-mackinlay'])
  const authors = JSON.parse(readFileSync('src/data/generated/authors.json', 'utf8'))
  assert.equal(authors.find(a => a.slug === data.authors[0])?.name, 'Molly Mackinlay')
})

test('the checked-in DHR rendering matches its Markdown source', () => {
  const post = JSON.parse(readFileSync('src/data/generated/blog.json', 'utf8')).find(p => p.slug === slug)
  assert.equal(post.html.trim(), html.trim())
  assert.deepEqual(post.authors, data.authors)
})
