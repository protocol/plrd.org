import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contentVisibility } from './content-visibility.mjs'
import { source } from './velocity/test-source-loader.mjs'

const { aiRecords, buildAiRecords, aiContentSources, resolveAiAuthor } = source('lib/ai-content.ts')
const { createAiAccess } = source('lib/ai-access.ts')
const flags = [
  { unlisted: true }, { draft: true }, { preview: true }, { noindex: true },
  { unaffiliated: true }, { private: true }, { hidden: true }, { visibility: 'private' },
  { status: 'draft' }, { published: false }, { public: false }, { listed: false },
  { robots: 'noindex, nofollow' }, { robots: { index: false } }, { robots: { googleBot: { index: false } } },
  { robots: ['noindex'] }, { date: '2999-01-01' }, { publishDate: '2999-01-01' }, { date: 'invalid-date' },
]

test('synthetic hidden records fail closed in every collection, discovery and direct detail', async () => {
  const seed = aiRecords.find(r => r.kind === 'blog')
  for (const [i, flag] of flags.entries()) {
    const visibility = contentVisibility(flag)
    const slug = `synthetic-hidden-${i}`
    const url = `https://www.plrd.org/blog/${slug}/`
    const fixture = { ...seed, id: `blog/${slug}`, slug, sourceUrl: url, canonicalUrl: url, title: 'DO NOT EXPORT SYNTHETIC SENTINEL', visibility }
    assert.equal(createAiAccess([{ ...fixture, visibility: contentVisibility({}) }]).detail('blog', slug).status, 200, 'control must be eligible without the hidden flag')
    const api = createAiAccess([...aiRecords, fixture])
    assert.equal(api.detail('blog', slug).status, 404, JSON.stringify(flag))
    assert.ok(!(await api.index().text()).includes('SYNTHETIC SENTINEL'), JSON.stringify(flag))
    assert.equal((await api.search(new Request('https://www.plrd.org/api/ai/search/?q=SYNTHETIC')).json()).total, 0)
    for (const key of Object.keys(aiContentSources)) {
      const original = aiContentSources[key][0]
      const injected = { ...original, ...flag, slug, visibility, title: 'DO NOT EXPORT SYNTHETIC SENTINEL' }
      const records = buildAiRecords({ ...aiContentSources, [key]: [...aiContentSources[key], injected] })
      assert.ok(!records.some(r => r.slug === slug), `${key}: ${JSON.stringify(flag)}`)
    }
  }
  for (const slug of ['preview-synthetic', 'impact-preview-synthetic', 'open-lab', 'field-velocity', 'admin', 'account', 'edit', 'write']) {
    const url = `https://www.plrd.org/blog/${slug}/`
    const fixture = { ...seed, slug, id: `blog/${slug}`, sourceUrl: url, canonicalUrl: url }
    const api = createAiAccess([fixture])
    assert.equal(api.detail('blog', slug).status, 404, slug)
    assert.equal((await api.index().json()).coverage.total, 0)
  }
  for (const visibility of [undefined, {}, { version: 2, denied: false, notBefore: null }]) {
    assert.equal(createAiAccess([{ ...seed, visibility }]).detail(seed.kind, seed.slug).status, 404)
  }
})

for (const [word, prose] of [
  ['API', 'The published API supports reproducible research.'],
  ['preview', 'This is a preview of the published findings.'],
  ['edit', 'Researchers can edit a graph to compare hypotheses.'],
]) {
  test(`ordinary public prose containing ${word} remains discoverable and readable`, async () => {
    const seed = aiRecords.find(r => r.kind === 'blog' && r.canonicalKind === 'native')
    for (const field of ['title', 'summary', 'body']) {
      const fixture = { ...seed, [field]: prose }
      const api = createAiAccess([fixture])
      assert.equal(api.detail(seed.kind, seed.slug).status, 200, field)
      assert.equal((await api.detail(seed.kind, seed.slug).json()).record[field], prose)
      assert.equal((await api.index().json()).coverage.total, 1, field)
      assert.equal((await api.search(new Request(`https://www.plrd.org/api/ai/search/?q=${word}`)).json()).total, 1, field)
      const original = aiContentSources.blogPosts.find(r => r.slug === seed.slug)
      const mapped = buildAiRecords({ ...aiContentSources, blogPosts: [{ ...original, [field === 'body' ? 'markdown' : field]: prose }] })
      assert.equal(mapped.find(r => r.id === seed.id)?.[field], prose, `${field}: shared source mapper`)
    }
  })
}

test('private route references stay excluded from public prose and source links', async () => {
  const seed = aiRecords.find(r => r.kind === 'blog' && r.canonicalKind === 'native')
  for (const route of [
    '/admin/', '/account/', '/edit/', '/write/', '/api/', '/api/field-velocity/neurotech/',
    '/blog/preview-synthetic/', '/blog/example/?preview=true', '/blog/example/#noindex',
    '/lab/', '/open-lab/', '/blog/unlisted-example/',
  ]) {
    const url = `https://www.plrd.org${route}`
    const linked = { ...seed, sources: [...seed.sources, { label: 'Private source', url }] }
    assert.equal(createAiAccess([linked]).detail(seed.kind, seed.slug).status, 404, url)
    // /lab/ is denied by the existing local URL allowlist, not the prose blacklist.
    if (route === '/lab/') continue
    for (const field of ['title', 'summary', 'body']) {
      const api = createAiAccess([{ ...seed, [field]: `See [source](${url}) and ${route}` }])
      assert.equal(api.detail(seed.kind, seed.slug).status, 404, `${field}: ${route}`)
      assert.equal((await api.index().json()).coverage.total, 0, `${field}: ${route}`)
      assert.equal((await api.search(new Request('https://www.plrd.org/api/ai/search/?q=source')).json()).total, 0, `${field}: ${route}`)
    }
  }
})

test('direct detail cannot disclose private source links or unknown raw fields', async () => {
  const seed = aiRecords.find(r => r.kind === 'blog')
  for (const url of [
    'https://www.plrd.org/admin/', 'https://www.plrd.org/api/field-velocity/neurotech/',
    'https://www.plrd.org/blog/example/?preview=true', 'https://github.com/protocol/plrd.org/blob/main/AGENTS.md',
    'https://user:password@example.org/', 'javascript:alert(1)',
  ]) {
    const fixture = { ...seed, sources: [...seed.sources, { label: 'Private source', url }] }
    assert.equal(createAiAccess([fixture]).detail(seed.kind, seed.slug).status, 404, url)
  }
  const fixture = { ...seed, rawCmsSecret: 'DO_NOT_EXPORT_UNKNOWN_FIELDS' }
  assert.ok(!(await createAiAccess([fixture]).detail(seed.kind, seed.slug).text()).includes('DO_NOT_EXPORT_UNKNOWN_FIELDS'))
})

test('public bylines never leak broken author slugs as display names', () => {
  for (const [slug, name] of [['jbp-allison-duettmann', 'Allison Duettmann'], ['jbp-konrad-kording', 'Konrad Kording'], ['jbp-tom-oxley', 'Tom Oxley']]) {
    const talk = aiRecords.find(r => r.kind === 'talk' && r.slug === slug)
    assert.ok(talk.authors.some(a => a.name === name && a.url === null), slug)
  }
  assert.deepEqual(aiRecords.flatMap(r => r.authors).filter(a => a.url === null && /^[a-z]+(?:-[a-z]+)+$/.test(a.name)), [])
})

test('author resolution is exact, preserves display names, and never guesses an external identity', () => {
  const { authors } = aiContentSources
  assert.equal(resolveAiAuthor('david-markowitz').name, 'David A. Markowitz')
  assert.ok(resolveAiAuthor('David A. Markowitz').url.endsWith('/david-markowitz/'))
  assert.deepEqual(resolveAiAuthor('David Markowitz'), { name: 'David Markowitz', url: null })
  assert.deepEqual(resolveAiAuthor('Unknown External, Jr.'), { name: 'Unknown External, Jr.', url: null })
  assert.deepEqual(resolveAiAuthor('DAVID A. MARKOWITZ'), { name: 'DAVID A. MARKOWITZ', url: null })
  const person = authors.find(a => a.slug === 'david-markowitz')
  assert.equal(resolveAiAuthor(person.slug, [{ ...person, visibility: contentVisibility({ draft: true }) }]), null)
  assert.equal(resolveAiAuthor(person.name, [person, { ...person, slug: 'another' }]).url, null)
})
