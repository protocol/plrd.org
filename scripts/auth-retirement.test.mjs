import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

const legacyPages = {
  'admin': 'CONTRIBUTING.md', 'write': 'content/blog', 'edit': 'src/data/site-content/pages.json',
  'about/edit': 'src/data/about.json', 'authors/edit': 'src/data/site-content/pages.json',
  'areas/edit': 'src/data/site-content/pages.json',
  'blog/edit': 'src/data/site-content/pages.json', 'insights/edit': 'src/data/site-content/pages.json',
  'publications/edit': 'src/data/site-content/pages.json', 'talks/edit': 'src/data/site-content/pages.json',
  'tutorials/edit': 'src/data/site-content/pages.json',
  'outreach/collaboration/edit': 'src/data/site-content/pages.json',
  'areas/[slug]/edit': 'content/areas/neurotech/_index.md',
  'areas/ai-robotics/edit': 'content/areas/ai-robotics/_index.md',
  'areas/digital-human-rights/edit': 'content/areas/digital-human-rights/_index.md',
  'areas/neurotech/edit': 'content/areas/neurotech/_index.md',
  'areas/economies-governance/edit': 'src/data/site-content/pages.json',
  'areas/economies-governance/subareas/edit': 'src/data/site-content/pages.json',
  'areas/economies-governance/impact/edit': 'src/data/site-content/pages.json',
  'areas/ai-robotics/[slug]/edit': 'src/data/fa2/ai-opportunityspaces.json',
  'areas/digital-human-rights/[slug]/edit': 'src/data/fa2/dhr-opportunityspaces.json',
  'areas/neurotech/[slug]/edit': 'src/data/fa2/neuro-opportunityspaces.json',
  'areas/economies-governance/[slug]/edit': 'src/data/site-content/opportunities.json',
}

test('every legacy editor renders honest GitHub PR guidance, real canonical source links, and no form or login', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('No CMS reads on retired editors') })
  for (const [route, path] of Object.entries(legacyPages)) {
    assert.ok(existsSync(path), path)
    const { default: Page, metadata } = source(`app/${route}/page.tsx`)
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'neurotech' }) }))
    assert.match(html, /pull request/i, route)
    assert.ok(html.includes(`https://github.com/protocol/plrd.org/${path.includes('.') ? 'blob' : 'tree'}/main/${path}`), `${route} -> ${path}`)
    assert.doesNotMatch(html, /<(form|input|textarea|button)\b|Sign in|Log in|Save changes|Publish post/i, route)
    assert.deepEqual(metadata.robots, { index: false, follow: false }, route)
  }
  assert.equal(fetch.mock.callCount(), 0)
})


function codeFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = `${dir}/${entry.name}`
    return entry.isDirectory() ? codeFiles(path) : /\.(?:ts|tsx|mjs|js)$/.test(path) ? [path] : []
  })
}

test('runtime contains no session/auth/allowlist, editor controls, or PDS write capabilities', () => {
  for (const file of codeFiles('src')) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /useAuth|AuthProvider|ADMIN_DID|useRequireAdmin|usePageEdit|EditPageButton|EditHistoryByline|deleteOwnRecord|COOKIE_SECRET|ATPROTO_(?:PASSWORD|HANDLE|JWK_PRIVATE)|iron-session|@atproto\/(?:oauth-client-node|jwk-jose)|\.repo\.(?:putRecord|createRecord|deleteRecord|applyWrites)|getAuthenticatedAgent/, file)
  }
})

test('legacy credential-based maintenance writers and key generator are absent', () => {
  for (const file of ['generate-jwk.js', 'create-publication.mjs', 'sync-pages.mjs', 'publish-hypercerts.mjs']) {
    assert.equal(existsSync(`scripts/${file}`), false, file)
  }
  for (const file of codeFiles('scripts').filter(path => !path.endsWith('.test.mjs'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /ATPROTO_PASSWORD|\.repo\.(?:putRecord|createRecord|deleteRecord|applyWrites)/, file)
  }
})


test('community comments remain visible read-only and management uses only a record-provided sourceURL', () => {
  const { CommentsSection } = source('components/hypercerts/HypercertCommunity.tsx')
  const comment = { uri: 'at://did:example:author/org.simocracy.feed.post/test', did: 'did:example:author', text: 'Public comment preserved', createdAt: '2026-11-01T00:00:00Z', author: { did: 'did:example:author', handle: 'example.invalid', displayName: null, avatar: null } }
  const render = sourceURL => renderToStaticMarkup(CommentsSection({ cert: { rkey: 'test' }, activity: { evidence: [], comments: [{ ...comment, sourceURL }] }, loading: false }))
  const linked = render('https://example.invalid/records/current')
  assert.match(linked, /Public comment preserved/)
  assert.match(linked, /href="https:\/\/example.invalid\/records\/current"/)
  assert.match(linked, /Manage at source/)
  assert.doesNotMatch(linked, /<button|Delete/)
  for (const unsafe of [undefined, '', 'javascript:alert(1)', 'https://user:pass@example.invalid', '/invented']) {
    assert.doesNotMatch(render(unsafe), /Manage at source|href="javascript:/)
    assert.match(render(unsafe), /where you created/)
  }
})


test('source management links reject repaired or relative authority forms and preserve valid exact HTTPS URLs', () => {
  const { publicSourceURL } = source('lib/hypercerts-live.ts')
  for (const value of [
    'https:example.invalid/current', 'https:/example.invalid/current',
    'https:///example.invalid/current', 'https:////example.invalid/current',
    'https:\\example.invalid/current', 'https://example.invalid\\current',
    ' https://example.invalid/current', 'https://example.invalid/current\n',
    'https://user:pass@example.invalid/current', '//example.invalid/current',
    'javascript:alert(1)', 'http://example.invalid/current',
  ]) assert.equal(publicSourceURL(value), undefined, value)
  for (const value of ['https://example.invalid/current?record=one#details', 'HTTPS://example.invalid/current']) {
    assert.equal(publicSourceURL(value), value)
  }
})

test('public community discovery preserves DID/profile/evidence reads and current sourceURL without any write', async (t) => {
  const { fetchLiveActivity } = source('lib/hypercerts-live.ts')
  const did = 'did:plc:syntheticreader'
  const collections = ['org.hypercerts.context.attachment', 'org.simocracy.feed.post']
  const fetch = t.mock.method(globalThis, 'fetch', async (input, init) => {
    assert.ok(!init?.method || init.method === 'GET', 'community data is read-only')
    const url = new URL(String(input))
    if (url.pathname === '/links/all') return Response.json({ links: Object.fromEntries(collections.map(c => [c, { subject: { records: 1 } }])) })
    if (url.pathname === '/links') return Response.json({ linking_records: [{ did, collection: url.searchParams.get('collection'), rkey: 'current' }] })
    if (url.hostname === 'plc.directory') return Response.json({ service: [{ id: '#atproto_pds', serviceEndpoint: 'https://pds.example.invalid' }] })
    if (url.pathname.endsWith('getRecord')) return Response.json({ value: {
      title: 'Public evidence', text: 'Public comment', createdAt: '2026-11-01T00:00:00Z', sourceURL: 'https://source.example.invalid/current',
    } })
    if (url.pathname.endsWith('getProfiles')) return Response.json({ profiles: [{ did, handle: 'public.example.invalid', displayName: 'Public Reader' }] })
    throw new Error(`Unexpected endpoint ${url}`)
  })
  const activity = await fetchLiveActivity(['https://example.invalid/claim'])
  assert.equal(activity.evidence.length, 1)
  assert.equal(activity.comments.length, 1)
  for (const record of [...activity.evidence, ...activity.comments]) {
    assert.equal(record.sourceURL, 'https://source.example.invalid/current')
    assert.equal(record.author.displayName, 'Public Reader')
    assert.equal(record.did, did)
  }
  assert.ok(fetch.mock.callCount() > 0)
})


test('OAuth/session-only dependencies are gone while the public ATProto API reader stays available', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const name of ['@atproto/common-web', '@atproto/jwk-jose', '@atproto/oauth-client-node', '@atproto/syntax', 'envalid', 'iron-session']) {
    assert.equal(pkg.dependencies[name], undefined, name)
  }
  assert.ok(pkg.dependencies['@atproto/api'])
  assert.equal(pkg.scripts['generate-jwk'], undefined)
  const npmLock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
  const pnpmLock = readFileSync('pnpm-lock.yaml', 'utf8')
  for (const name of ['@atproto/oauth-client-node', '@atproto/jwk-jose', 'iron-session', 'envalid']) {
    assert.equal(npmLock.packages[`node_modules/${name}`], undefined, name)
    assert.equal(pnpmLock.includes(`${name}@`), false, name)
  }
  // pnpm's existing jsdom dev graph retains undici 8; the retired OAuth
  // runtime used undici 6. Do not confuse dev tooling with deployed readers.
  assert.doesNotMatch(pnpmLock, /^\s+undici@6\./m)
  const undici = npmLock.packages['node_modules/undici']
  assert.ok(!undici || undici.dev === true)
})
