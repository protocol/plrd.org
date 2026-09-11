import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { source } from './velocity/test-source-loader.mjs'
import { readableMarkdown } from './readable-markdown.mjs'

const { buildAiRecords } = source('lib/ai-content.ts')

test('real build pipeline preserves source IDs and rejects hidden frontmatter before public serialization', () => {
  mkdirSync('.next', { recursive: true })
  const sandbox = mkdtempSync(path.resolve('.next/ai-fixtures-'))
  const flags = [{ unlisted: true }, { draft: true }, { preview: true }, { noindex: true }, { unaffiliated: true }, { robots: ['noindex'] }, { status: 'draft' }, { date: '2999-01-01' }]
  try {
    mkdirSync(path.join(sandbox, 'public'))
    for (const collection of ['publications', 'talks', 'blog', 'tutorials', 'authors', 'areas']) {
      mkdirSync(path.join(sandbox, 'content', collection), { recursive: true })
      const entries = [
        { slug: 'source-id', data: { slug: 'must-not-override-source' }, body: 'Real native body with [source](https://example.org/paper).' },
        ...flags.map((flag, i) => ({ slug: `hidden-${i}`, data: flag, body: 'SYNTHETIC_HIDDEN_BODY' })),
      ]
      for (const item of entries) {
        const data = { title: item.slug, name: item.slug, date: '2020-01-01', summary: 'Fixture summary', abstract: 'Fixture abstract', internalSecret: 'DO_NOT_COPY_RAW_KEYS', ...item.data }
        writeFileSync(path.join(sandbox, 'content', collection, `${item.slug}.md`), `---\n${JSON.stringify(data)}\n---\n${item.body}\n`)
      }
    }
    const build = () => execFileSync(process.execPath, [path.resolve('scripts/build-content.mjs')], { cwd: sandbox, timeout: 30000, stdio: 'pipe' })
    build()
    const read = name => JSON.parse(readFileSync(path.join(sandbox, `src/data/generated/${name}.json`), 'utf8'))
    const input = { publications: read('publications'), talks: read('talks'), blogPosts: read('blog'), tutorials: read('tutorials'), authors: read('authors'), areas: read('areas') }
    for (const [key, records] of Object.entries(input)) {
      assert.ok(records.some(r => r.slug === 'source-id'), `${key}: frontmatter must not override source ID`)
      assert.ok(!JSON.stringify(records).includes('DO_NOT_COPY_RAW_KEYS'))
    }
    for (const item of [...input.blogPosts, ...input.tutorials].filter(r => r.slug.startsWith('hidden-'))) {
      assert.equal(item.markdown, '', 'do not add readable copies of withheld bodies to generated JSON')
    }
    const records = buildAiRecords(input)
    assert.equal(records.length, 5, 'five public records; unrecognized focus areas are never auto-published')
    assert.ok(records.every(r => r.slug === 'source-id'))
    assert.ok(!JSON.stringify(records).includes('SYNTHETIC_HIDDEN_BODY'))
    const before = JSON.stringify(input)
    build()
    assert.equal(JSON.stringify({ publications: read('publications'), talks: read('talks'), blogPosts: read('blog'), tutorials: read('tutorials'), authors: read('authors'), areas: read('areas') }), before)
  } finally { rmSync(sandbox, { recursive: true, force: true }) }
})

test('Markdown conversion preserves readable content, code and canonical internal slashes without executable markup', () => {
  const body = readableMarkdown('<h2>Heading</h2><p>A <strong>claim</strong> &amp; <a href="/about">source</a>.</p><ul><li>One</li></ul><pre>const x = 1;\nprint(x)</pre><svg aria-label="Source diagram description"></svg><script>SECRET</script><p hidden>HIDDEN</p><style>.STYLE { color: red }</style>', 'https://www.plrd.org/blog/example/')
  assert.match(body, /## Heading/)
  assert.match(body, /\*\*claim\*\*/)
  assert.match(body, /https:\/\/www.plrd.org\/about\//)
  assert.match(body, /const x = 1;\nprint\(x\)/)
  assert.match(body, /Source diagram description/)
  assert.doesNotMatch(body, /SECRET|HIDDEN|STYLE|<svg/)
})
