import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const read = (file) => readFileSync(new URL(file, root), 'utf8')
const slug = 'neurotech-frontier-human-flourishing'
const path = `/blog/${slug}/`

test('approved Neuro article is public and discoverable at one clean URL', () => {
  const posts = JSON.parse(read('src/data/generated/blog.json'))
  const article = posts.find((post) => post.slug === slug)
  assert.ok(article, 'The approved Neuro article must have its public slug')
  assert.equal(article.unlisted, false)
  assert.equal(article.title, 'Neurotech as a Frontier for Human Flourishing')
  assert.deepEqual(article.authors, ['sean-escola', 'david-markowitz'])
  assert.equal(posts.filter((post) => post.slug.startsWith('preview-neurotech-')).length, 0)
  const search = JSON.parse(read('public/search-index.json'))
  assert.equal(search.filter((item) => item.relpermalink === path).length, 1)
  assert.ok(read('public/feed.xml').includes(`<link>https://www.plrd.org${path}</link>`))
  assert.ok(!read('public/search-index.json').includes('/blog/preview-neurotech-'))
  assert.ok(!read('public/feed.xml').includes('/blog/preview-neurotech-'))
})

test('both shared Neuro preview URLs permanently redirect to the published article', async () => {
  const { outputText } = ts.transpileModule(read('next.config.ts'), {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  })
  const { default: config } = await import(`data:text/javascript,${encodeURIComponent(outputText)}`)
  const redirects = await config.redirects()
  for (const preview of ['preview-neurotech-ea88a298', 'preview-neurotech-4972678300d0a37a2a1e0b9d1b40e852']) {
    assert.ok(redirects.some((rule) => rule.source === `/blog/${preview}/` && rule.destination === path && rule.permanent === true), `${preview} must redirect permanently`)
  }
})
