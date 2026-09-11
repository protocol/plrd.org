import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const content = source('lib/content.ts')

test('public context maps native bodies, exact authors, external canonicals and shared area descriptors', () => {
  assert.ok(existsSync('src/lib/ai-content.ts'), 'typed public context layer is required')
  const { aiRecords } = source('lib/ai-content.ts')
  const post = aiRecords.find(r => r.id === 'blog/neurotech-frontier-human-flourishing')
  assert.ok(post)
  assert.equal(post.body, content.blogPosts.find(p => p.slug === post.slug).markdown)
  assert.deepEqual(post.authors.map(a => a.name), ['Sean Escola', 'David A. Markowitz'])
  assert.ok(post.authors.every(a => a.url.endsWith('/')))
  const external = aiRecords.find(r => r.kind === 'blog' && r.canonicalKind === 'external')
  assert.ok(external)
  assert.equal(external.body, '')
  assert.equal(external.canonicalUrl, content.blogPosts.find(p => p.slug === external.slug).external_url)
  const pub = aiRecords.find(r => r.id === 'publication/how-to-obtain-complete-human-connectome')
  assert.equal(pub.summary, content.publications.find(p => p.slug === pub.slug).abstract)
  assert.ok(pub.sources.some(s => s.label === 'DOI'))
  const talk = aiRecords.find(r => r.slug === 'jbp-adam-marblestone')
  assert.equal(talk.body, '')
  assert.ok(talk.sources.some(s => s.url === 'https://www.youtube.com/watch?v=X0B_GWTuEFo'))
  for (const area of aiRecords.filter(r => r.kind === 'area')) {
    assert.equal(area.body, '')
    assert.equal(area.date, null)
    assert.equal(area.summary, source('lib/focus-area-descriptions.ts').FOCUS_AREA_DESCRIPTIONS[area.slug])
  }
  for (const t of content.tutorials) assert.equal(typeof t.markdown, 'string')
  for (const items of [content.blogPosts.filter(p => p.unlisted)]) {
    for (const hidden of items) assert.ok(!aiRecords.some(r => r.slug === hidden.slug))
  }
})

test('coverage includes every public source record without lowercasing historical slugs', () => {
  const { aiRecords } = source('lib/ai-content.ts')
  for (const [key, kind] of [['publications','publication'], ['authors','author'], ['talks','talk'], ['tutorials','tutorial'], ['areas','area'], ['blogPosts','blog']]) {
    const expected = content[key].filter(r => !r.visibility.denied && (!r.visibility.notBefore || Date.parse(r.visibility.notBefore) <= Date.now())).map(r => r.slug).sort()
    assert.deepEqual(aiRecords.filter(r => r.kind === kind).map(r => r.slug).sort(), expected)
  }
  for (const slug of ['Azouvi2022', 'Azouvi2022a']) assert.ok(aiRecords.some(r => r.canonicalUrl.endsWith(`/publications/${slug}/`)))
})

test('visibility survives every shared mapper; unlisted content remains denied', () => {
  for (const items of [content.blogPosts, content.publications, content.talks, content.tutorials, content.authors, content.areas]) {
    for (const item of items) {
      assert.equal(typeof item.visibility, 'object', `${item.slug}: missing visibility metadata`)
      assert.equal(item.visibility.version, 1)
    }
  }
  const hidden = content.blogPosts.filter(p => p.unlisted)
  assert.ok(hidden.length)
  for (const p of hidden) assert.equal(p.visibility.denied, true)
})

test('shared mapper retains the native article as readable Markdown, including source links and disclosure', () => {
  const post = content.blogPosts.find(p => p.slug === 'neurotech-frontier-human-flourishing')
  assert.equal(typeof post.markdown, 'string', 'shared blog mapper must retain a readable body')
  assert.match(post.markdown, /Neural Augmentation/)
  assert.match(post.markdown, /https:\/\/paradromics.com\/news\//)
  assert.match(post.markdown, /financial interests in some of the companies mentioned/)
  assert.doesNotMatch(post.markdown, /<style|<svg|<script|class=/)
})
