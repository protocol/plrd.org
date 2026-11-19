// Subprocess-only controls: change in-memory current authoring inputs, never files or provenance.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import { pathToFileURL } from 'node:url'
import { source } from '../velocity/test-source-loader.mjs'

const require = createRequire(import.meta.url)
const mode = process.argv[2] || 'unchanged'
const originals = fs.readFileSync
const replacements = new Map()
const replace = (file, value) => replacements.set(path.resolve(file), value)
const readJson = file => JSON.parse(originals(file, 'utf8'))
const pagesFile = 'src/data/site-content/pages.json'
const opportunitiesFile = 'src/data/site-content/opportunities.json'
const blogFile = 'src/data/generated/blog.json'
const pages = readJson(pagesFile)
const opportunities = readJson(opportunitiesFile)
const blog = readJson(blogFile)
const page = pages.find(page => page.pageId === 'blog')
const opportunity = opportunities.find(item => item.rkey === 'eg--public-goods-funding')
const post = blog.find(post => post.slug === 'how-pl-rd-accelerates-breakthroughs')
assert.ok(page && opportunity && post, 'controls must exercise existing migrated content')

switch (mode) {
  case 'unchanged': break
  case 'page':
    page.sections.find(section => section.sectionId === 'hero').subtitle += ' Editorial clarification.'
    page.updatedAt = '2026-11-20T01:00:00.000+01:00'
    break
  case 'opportunity':
    opportunity.description += ' Editorial clarification.'
    opportunity.updatedAt = '2026-11-20T00:00:00.000Z'
    break
  case 'blog': {
    const file = `content/blog/${post.slug}/index.md`
    replace(file, `${originals(file, 'utf8')}\n\nEditorial clarification.\n`)
    post.html += '\n<p>Editorial clarification.</p>'
    break
  }
  case 'blog-metadata': case 'unlisted': {
    const file = `content/blog/${post.slug}/index.md`
    const matter = require('gray-matter')
    const parsed = matter(originals(file, 'utf8'))
    const changes = mode === 'unlisted' ? { unlisted: true } : {
      title: 'An edited article title', date: '2026-11-20T00:00:00.000Z',
      summary: 'Edited summary.', description: 'Edited dedicated description.',
    }
    Object.assign(post, changes)
    Object.assign(parsed.data, changes)
    replace(file, matter.stringify(parsed.content, parsed.data))
    break
  }
  case 'duplicate-card': break
  case 'bad-section': page.sections[0].subtitle = { malformed: true }; break
  case 'bad-timestamp': page.updatedAt = 'not-a-timestamp'; break
  case 'duplicate-section': page.sections.push(structuredClone(page.sections[0])); break
  case 'duplicate-page': pages.push(structuredClone(page)); break
  case 'bad-uri': opportunity.uri = 'https://example.invalid/remote'; break
  case 'bad-signals': opportunity.fieldSignals = [{ kpi: 42, measurement: 'invalid signal' }]; break
  case 'duplicate-opportunity': opportunities.push(structuredClone(opportunity)); break
  case 'duplicate-blog': blog.push(structuredClone(post)); break
  case 'bad-visibility': post.unlisted = 'false'; break
  case 'remote-fallback': case 'unlisted-leak': break
  default: throw new Error(`Unknown control: ${mode}`)
}
replace(pagesFile, JSON.stringify(pages))
replace(opportunitiesFile, JSON.stringify(opportunities))
replace(blogFile, JSON.stringify(blog))
fs.readFileSync = (file, options) => {
  const replacement = replacements.get(path.resolve(String(file)))
  if (replacement === undefined) return originals(file, options)
  const encoding = typeof options === 'string' ? options : options?.encoding
  return encoding ? replacement : Buffer.from(replacement)
}
syncBuiltinESMExports()
// JSON modules read the same edited inputs as filesystem-based contract assertions.
for (const file of [pagesFile, opportunitiesFile, blogFile]) {
  const filename = require.resolve(path.resolve(file))
  require.cache[filename] = { id: filename, filename, loaded: true, exports: JSON.parse(replacements.get(filename)) }
}
if (mode === 'remote-fallback') {
  const adapter = source('lib/indexer.ts')
  const local = adapter.fetchPage
  adapter.fetchPage = async key => (await local(key)) || fetch('https://cms.example.invalid/fallback')
}
if (mode === 'duplicate-card') {
  source('lib/indexer.ts').fetchAtproPosts = async () => [{
    rkey: 'archived-copy', uri: 'at://did:example:public/site.standard.document/archived-copy',
    title: post.title, publishedAt: post.date, path: `/blog/${post.slug}/`,
  }]
}
if (mode === 'unlisted-leak') {
  const content = source('lib/content.ts')
  const hidden = content.blogPosts.find(post => post.unlisted)
  assert.ok(hidden, 'negative visibility control needs a current unlisted article')
  content.listedBlogPosts.push(hidden)
}
for (const file of ['site-content.test.mjs', 'site-content-data.test.mjs', 'site-content-render.test.mjs', 'site-content-publication.test.mjs']) {
  await import(pathToFileURL(path.resolve('scripts', file)))
}
