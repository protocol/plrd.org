import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

// Evergreen authoring contracts: validate shape/references, never pin mutable copy to a snapshot.

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const uriPattern = /^at:\/\/did:[a-z0-9]+:[A-Za-z0-9._:%-]+\/[a-zA-Z0-9.]+\/[A-Za-z0-9._~:-]+$/
const object = (value, label) => assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
const array = (value, label) => assert.ok(Array.isArray(value), `${label} must be an array`)
const string = (value, label) => assert.equal(typeof value, 'string', `${label} must be a string`)
const optionalString = (value, label) => { if (value != null) string(value, label) }
const strings = (value, label, optional = false) => {
  if (optional && value == null) return
  array(value, label)
  value.forEach((item, i) => string(item, `${label}[${i}]`))
}
const timestamp = (value, label) => {
  string(value, label)
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)), `${label} must be an RFC3339 timestamp`)
  // Check calendar/time parts independently of the valid timezone offset.
  // Date.parse otherwise silently normalizes dates such as February 30.
  const localParts = value.replace(/(?:Z|[+-]\d{2}:\d{2})$/, 'Z')
  assert.equal(new Date(localParts).toISOString().slice(0, 19), value.slice(0, 19), `${label} must be a valid calendar timestamp`)
}
const slug = (value, label) => { string(value, label); assert.match(value, slugPattern, `${label} must be a stable slug`) }
const unique = (records, key, label) => {
  const values = records.map(key)
  assert.equal(new Set(values).size, values.length, `duplicate ${label}`)
}
function identity(record, collection, label) {
  assert.match(record.uri || '', uriPattern, `${label} uri must be an AT record URI`)
  const [uriCollection, rkey] = record.uri.split('/').slice(-2)
  assert.equal(uriCollection, collection, `${label} uri collection`)
  assert.equal(record.rkey, rkey, `${label} rkey must match uri`)
}

function assertCurrentSiteContent({ pages, opportunities, editEvents, publication }) {
  array(pages, 'pages')
  assert.ok(pages.length > 0, 'pages must not be empty')
  unique(pages, page => page.pageId, 'page ID')
  unique(pages, page => page.rkey, 'page rkey')
  unique(pages, page => page.uri, 'page uri')
  for (const page of pages) {
    object(page, 'page')
    slug(page.pageId, 'page ID')
    assert.notEqual(page.pageId, 'about', 'retired About must not replace repository-owned About')
    identity(page, 'org.plresearch.page', 'page')
    assert.equal(page.pageId, page.rkey, 'page ID must match rkey')
    timestamp(page.updatedAt, 'page updatedAt')
    optionalString(page.iconType, 'page iconType')
    strings(page.leads, 'page leads', true)
    strings(page.advisors, 'page advisors', true)
    array(page.sections, 'page sections')
    unique(page.sections, section => section.sectionId, 'section ID')
    for (const section of page.sections) {
      object(section, 'section')
      slug(section.sectionId, 'section ID')
      for (const field of ['label', 'title', 'subtitle', 'body']) optionalString(section[field], `section ${section.sectionId}.${field}`)
    }
  }
  assert.ok(pages.some(page => page.pageId === 'collaborate' && page.sections.some(section => section.sectionId === 'collaborations')), 'Collaboration alias requires its repository-owned section')
  array(opportunities, 'opportunities')
  unique(opportunities, item => item.rkey, 'opportunity rkey')
  unique(opportunities, item => item.uri, 'opportunity uri')
  unique(opportunities, item => `${item.areaSlug}/${item.id}`, 'opportunity area/slug')
  for (const item of opportunities) {
    object(item, 'opportunity')
    identity(item, 'org.plresearch.opportunitySpace', 'opportunity')
    slug(item.areaSlug, 'opportunity areaSlug')
    slug(item.id, 'opportunity ID')
    string(item.title, 'opportunity title')
    string(item.description, 'opportunity description')
    timestamp(item.updatedAt, 'opportunity updatedAt')
    for (const field of ['tagline', 'image', 'inflectionPoint', 'shift', 'theOpportunity']) optionalString(item[field], `opportunity ${field}`)
    strings(item.subfields, 'opportunity subfields')
    for (const field of ['tippingSignals', 'keyAssumptions', 'observations']) strings(item[field], `opportunity ${field}`, true)
    if (item.fieldSignals != null) {
      array(item.fieldSignals, 'opportunity fieldSignals')
      for (const signal of item.fieldSignals) {
        object(signal, 'opportunity fieldSignals item')
        string(signal.kpi, 'opportunity fieldSignals kpi')
        string(signal.measurement, 'opportunity fieldSignals measurement')
      }
    }
  }
  array(editEvents, 'edit events')
  unique(editEvents, event => event.uri, 'edit event uri')
  for (const event of editEvents) {
    object(event, 'edit event')
    assert.match(event.uri || '', uriPattern, 'edit event uri')
    assert.match(event.target || '', uriPattern, 'edit event target')
    string(event.editor, 'edit event editor')
    timestamp(event.editedAt, 'edit event editedAt')
    for (const field of ['did', 'targetCid', 'collection', 'editorHandle', 'note']) optionalString(event[field], `edit event ${field}`)
    strings(event.changedFields, 'edit event changedFields', true)
  }
  object(publication, 'publication')
  assert.match(publication.uri || '', uriPattern, 'publication uri')
  assert.equal(publication.uri.split('/').at(-2), 'site.standard.publication', 'publication uri collection')
  string(publication.cid, 'publication cid')
  object(publication.value, 'publication value')
  assert.equal(publication.value.$type, 'site.standard.publication')
  for (const field of ['url', 'name']) string(publication.value[field], `publication ${field}`)
  assert.ok(['https:', 'http:'].includes(new URL(publication.value.url).protocol), 'publication url must be a web URL')
  optionalString(publication.value.description, 'publication description')
}

const read = file => JSON.parse(readFileSync(file, 'utf8'))
const root = 'src/data/site-content/'
const archiveRoot = `${root}provenance/2026-11-19/`
const snapshot = read(`${archiveRoot}public-records.json`)
const manifest = read(`${archiveRoot}manifest.json`)
const receipt = read(`${root}migration-receipt.json`)
const sha = value => createHash('sha256').update(value).digest('hex')

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

test('current authoring JSON satisfies schema, unique identities/sections, and stable URI references', () => {
  assertCurrentSiteContent({
    pages: read(`${root}pages.json`), opportunities: read(`${root}opportunities.json`),
    editEvents: read(`${root}edit-events.json`), publication: read(`${root}publication.json`),
  })
})

test('current blog identity/visibility policy is independent of initial prose, metadata, and body hashes', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('CMS network is forbidden') })
  const current = read('src/data/generated/blog.json')
  const { blogPosts, listedBlogPosts } = source('lib/content.ts')
  assert.deepEqual(blogPosts, current)
  assert.equal(new Set(current.map(post => post.slug)).size, current.length, 'duplicate blog slug')
  for (const post of current) {
    assert.ok(post.unlisted === undefined || typeof post.unlisted === 'boolean', 'blog unlisted must be a boolean')
  }
  assert.deepEqual(listedBlogPosts, current.filter(post => !post.unlisted), 'unlisted article leaked into listedBlogPosts')
  for (const decision of receipt.blogResolution) {
    const matches = blogPosts.filter(post => `/blog/${post.slug}/` === decision.path)
    assert.equal(matches.length, 1, 'historical document retains exactly one canonical repository URL')
    assert.ok(readFileSync(decision.repoSource, 'utf8').length > 0, 'canonical blog source exists and stays editable')
  }
  const { generateMetadata } = source('app/blog/[slug]/page.tsx')
  const sitemap = source('app/sitemap.ts').default()
  for (const post of blogPosts) {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: post.slug }) })
    assert.equal(metadata.title, post.title)
    assert.equal(metadata.description, post.description || post.summary)
    assert.equal(metadata.openGraph.publishedTime, post.date || undefined)
    assert.equal(metadata.alternates.canonical, post.external_url || `/blog/${post.slug}/`)
    assert.deepEqual(metadata.robots, post.unlisted
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : undefined)
    const entries = sitemap.filter(entry => new URL(entry.url).pathname === `/blog/${post.slug}/`)
    assert.equal(entries.length, !post.unlisted && !post.external_url ? 1 : 0, 'sitemap visibility/duplicate policy')
  }
  assert.deepEqual(await source('lib/indexer.ts').fetchAtproPosts(), [], 'archived documents must not add duplicate or unlisted cards')
  assert.equal(network.mock.callCount(), 0)
})
