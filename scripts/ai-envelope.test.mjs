import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const content = source('lib/ai-content.ts')
const { createAiAccess } = source('lib/ai-access.ts')
const markdown = source('app/ai/markdown/[kind]/[slug]/route.ts')
const full = source('app/llms-full.txt/route.ts')

test('supported source metadata cannot disclose private references in any export', async () => {
  const original = [...content.aiRecords]
  try {
    for (const [collection, field, kind] of [['talks', 'venue_location', 'talk'], ['publications', 'venue', 'publication']]) {
      const seed = content.aiContentSources[collection][0]
      for (const hidden of [false, true]) {
        const text = hidden ? 'Venue notes: https://www.plrd.org/lab/PRIVATE_METADATA_SENTINEL' : 'Public venue notes'
        const input = { ...content.aiContentSources, [collection]: [{ ...seed, [field]: text }] }
        const records = content.buildAiRecords(input)
        content.aiRecords.splice(0, content.aiRecords.length, ...records)
        const api = createAiAccess()
        const detail = api.detail(kind, seed.slug)
        const md = await markdown.GET(new Request('https://www.plrd.org/'), { params: Promise.resolve({ kind, slug: seed.slug }) })
        assert.equal(detail.status, hidden ? 404 : 200, `${collection}: JSON detail`)
        assert.equal(md.status, hidden ? 404 : 200, `${collection}: Markdown detail`)
        const bodies = await Promise.all([
          api.index().text(), api.search(new Request('https://www.plrd.org/api/ai/search/')).text(),
          detail.text(), md.text(), full.GET().text(),
        ])
        for (const body of bodies) assert.doesNotMatch(body, /PRIVATE_METADATA_SENTINEL/)
        if (!hidden) for (const body of [bodies[2], bodies[3], bodies[4]]) assert.ok(body.includes(text))
      }
    }
  } finally { content.aiRecords.splice(0, content.aiRecords.length, ...original) }
})

test('technical slash prose and external public API links remain eligible', async () => {
  const seed = content.aiContentSources.blogPosts.find(r => !r.external_url && r.markdown)
  for (const body of ['We analyze read/write performance.', 'Read https://example.org/api/docs/ for public documentation.', 'Read https://example.org/preview/ for public research.']) {
    const records = content.buildAiRecords({ ...content.aiContentSources, blogPosts: [{ ...seed, markdown: body }] })
    const detail = createAiAccess(records).detail('blog', seed.slug)
    assert.equal(detail.status, 200, body)
    assert.equal((await detail.json()).record.body, body)
  }
  const external = content.buildAiRecords({ ...content.aiContentSources, blogPosts: [{ ...seed, external_url: 'https://example.org/api/docs/' }] })
  assert.equal(createAiAccess(external).detail('blog', seed.slug).status, 200)
  for (const body of ['See /api/.', 'See /write/.', 'See /lab/.', 'See https://plrd.org/%6cab/.', 'See https://www.plresearch.org/blog/example/?preview=true.']) {
    const records = content.buildAiRecords({ ...content.aiContentSources, blogPosts: [{ ...seed, markdown: body }] })
    assert.equal(createAiAccess(records).detail('blog', seed.slug).status, 404, body)
  }
})
