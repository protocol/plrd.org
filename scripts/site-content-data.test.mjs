import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const read = file => JSON.parse(readFileSync(file, 'utf8'))
const root = 'src/data/site-content/'
const archiveRoot = `${root}provenance/2026-11-19/`
const snapshot = read(`${archiveRoot}public-records.json`)
const manifest = read(`${archiveRoot}manifest.json`)
const receipt = read(`${root}migration-receipt.json`)
const sha = value => createHash('sha256').update(value).digest('hex')
const normalize = value => value.replace(/\s+/g, ' ').trim()

function leafletText(value, out = []) {
  if (Array.isArray(value)) value.forEach(item => leafletText(item, out))
  else if (value && typeof value === 'object') {
    if (typeof value.plaintext === 'string') out.push(value.plaintext)
    for (const [key, item] of Object.entries(value)) if (key !== 'plaintext') leafletText(item, out)
  }
  return out
}

test('immutable public archive has complete pagination, counts, identities, timestamps, and content hashes', () => {
  const bytes = readFileSync(`${archiveRoot}public-records.json`)
  assert.equal(sha(bytes), manifest.files['public-records.json'].sha256)
  assert.equal(bytes.length, manifest.files['public-records.json'].bytes)
  for (const [name, set] of Object.entries(snapshot.collections)) {
    const expected = manifest.collections[name]
    assert.equal(set.complete, true)
    assert.equal(set.records.length, expected.count)
    for (const direction of ['forward', 'reverse']) {
      assert.equal(set[direction].at(-1).body.cursor, undefined)
      assert.equal(set[direction].flatMap(page => page.body.records).length, expected.count)
      assert.equal(new Set(set[direction].flatMap(page => page.body.records.map(record => record.uri))).size, expected.count)
    }
    for (const record of set.records) {
      const entry = expected.records.find(entry => entry.uri === record.uri)
      assert.equal(record.cid, entry.cid)
      assert.equal(sha(JSON.stringify(record.value)), entry.valueSha256)
      for (const key of ['updatedAt', 'createdAt', 'publishedAt']) assert.equal(record.value[key] ?? null, entry[key])
    }
  }
  for (const [name, set] of Object.entries(snapshot.indexer)) {
    assert.equal(set.complete, true)
    assert.equal(set.nodes.length, set.totalCount)
    assert.equal(set.totalCount, manifest.indexer[name].totalCount)
    assert.equal(set.pages.at(-1).body.data[name].pageInfo.hasNextPage, false)
  }
  assert.match(JSON.stringify(snapshot.legacyBlogQuery.response), /Cannot query field.*records/)
})

test('every active page-field read retains its value and existing fallback decision', async () => {
  const adapter = source('lib/indexer.ts')
  assert.equal(receipt.pageFieldReads.length, receipt.counts.pageFieldReads)
  for (const field of receipt.pageFieldReads) {
    const page = await adapter.fetchPage(field.pageId)
    const section = adapter.getSection(page, field.sectionId)
    const value = section?.[field.field] ?? null
    assert.equal(sha(JSON.stringify(value)), field.valueSha256, `${field.route} ${field.sectionId}.${field.field}`)
    assert.equal(!!value, field.sourceValueUsed)
    assert.equal(!value, field.existingRendererFallbackUsed)
  }
})

test('all three Leaflet documents resolve once to unchanged approved repo bodies and visibility', async () => {
  const { blogPosts, listedBlogPosts } = source('lib/content.ts')
  const archived = snapshot.collections['site.standard.document'].records
  assert.equal(receipt.blogResolution.length, archived.length)
  for (const decision of receipt.blogResolution) {
    const record = archived.find(record => record.uri === decision.uri)
    assert.equal(record.cid, decision.cid)
    const matches = blogPosts.filter(post => `/blog/${post.slug}/` === decision.path)
    assert.equal(matches.length, 1)
    const post = matches[0]
    assert.equal(sha(readFileSync(decision.repoSource)), decision.repoSourceSha256, 'migration must not replace approved repo copy')
    assert.equal(sha(post.html), decision.repoHtmlSha256)
    assert.equal(post.unlisted ?? false, decision.unlisted)
    assert.equal(listedBlogPosts.filter(p => p.slug === post.slug).length, decision.unlisted ? 0 : 1)
    assert.equal(record.value.title, post.title)
    assert.equal(record.value.publishedAt, post.date)
    assert.equal(record.value.description, post.description || post.summary)
    assert.equal(record.value.content.$type, 'pub.leaflet.content', 'do not pretend the remote body is the obsolete custom markdown schema')
    const doc = new JSDOM(post.html).window.document
    // Case-study labels are visual table keys locally, but inline labels in Leaflet.
    doc.querySelectorAll('.cs-key').forEach(key => { key.textContent += ': ' })
    const text = normalize(doc.body.textContent)
    const blocks = leafletText(record.value.content)
    assert.equal(blocks.length, decision.remoteTextBlocks)
    assert.deepEqual(blocks.filter(block => !text.includes(normalize(block))), decision.remoteOnlyTextBlocks)
    assert.equal(blocks.length - decision.remoteOnlyTextBlocks.length, decision.matchedRemoteTextBlocks)
  }
  assert.deepEqual(await source('lib/indexer.ts').fetchAtproPosts(), [])
  assert.deepEqual(read(`${root}publication.json`), snapshot.collections['site.standard.publication'].records[0])
})
