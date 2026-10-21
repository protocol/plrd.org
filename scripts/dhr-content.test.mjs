import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { JSDOM } from 'jsdom'

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
