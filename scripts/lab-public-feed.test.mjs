import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const did = 'did:plc:jfhpnnst6flqway4eaeqzj2a'
const fixture = (overrides = {}) => ({ post: {
  uri: `at://${did}/app.bsky.feed.post/3testrecord`, cid: 'bafyreitest',
  author: { did, handle: 'example.bsky.social', displayName: 'Example source author' },
  record: { $type: 'app.bsky.feed.post', text: '<script>not executable</script> A source-linked finding.', createdAt: '2026-09-01T12:00:00Z' },
  ...overrides,
} })

test('Open Lab reads a bounded attributed science feed, never calling it a member feed', async (t) => {
  assert.ok(existsSync('src/lib/lab-public-feed.ts'), 'public science feed adapter is missing')
  const adapter = source('lib/lab-public-feed.ts')
  const calls = []
  const fetcher = async (url, options) => {
    calls.push({ url: String(url), options })
    return Response.json({ feed: [fixture()] })
  }
  const data = await adapter.loadLabPublicFeed({ fetcher, now: () => new Date('2026-09-10T12:00:00Z') })
  assert.equal(calls.length, 1)
  const target = new URL(calls[0].url)
  assert.equal(target.origin, 'https://public.api.bsky.app')
  assert.equal(target.pathname, '/xrpc/app.bsky.feed.getFeed')
  assert.equal(target.searchParams.get('feed'), 'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science')
  assert.equal(calls[0].options.redirect, 'error')
  assert.equal(calls[0].options.cache, 'no-store')
  assert.ok(calls[0].options.signal instanceof AbortSignal)
  assert.equal(data.status, 'live')
  assert.equal(data.fetchedAt, '2026-09-10T12:00:00.000Z')
  assert.match(data.sourceLabel, /Science feed on Bluesky/)
  assert.match(data.message, /not Open Lab members/i)
  assert.equal(data.items.length, 1)
  assert.equal(data.items[0].uri, fixture().post.uri)
  assert.equal(data.items[0].text, fixture().post.record.text)
  assert.equal(data.items[0].author.did, did)
  assert.equal(data.items[0].url, `https://bsky.app/profile/${did}/post/3testrecord`)
  assert.equal(data.items[0].createdAt, fixture().post.record.createdAt)
})

test('malformed, labeled, deleted, mismatched and duplicate posts never render as valid science items', async () => {
  const { loadLabPublicFeed } = source('lib/lab-public-feed.ts')
  const entries = [
    fixture(), fixture(),
    { post: { ...fixture().post, uri: 'javascript:alert(1)' } },
    fixture({ author: { did: 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', handle: 'other.bsky.social' } }),
    fixture({ labels: [{ val: 'porn' }] }),
    fixture({ notFound: true }),
    fixture({ record: { text: 'x'.repeat(3001), createdAt: '2026-09-01T12:00:00Z' } }),
    fixture({ record: { text: 'wrong type', createdAt: 'never' } }),
    null, {},
  ]
  const data = await loadLabPublicFeed({ fetcher: async () => Response.json({ feed: entries }) })
  assert.equal(data.status, 'live')
  assert.equal(data.items.length, 1)
  assert.deepEqual(Object.keys(data.items[0].author).sort(), ['did', 'displayName', 'handle'])
  const allInvalid = await loadLabPublicFeed({ fetcher: async () => Response.json({ feed: [fixture({ labels: [{ val: 'sexual' }] })] }) })
  assert.equal(allInvalid.status, 'empty')
  assert.match(allInvalid.message, /filtered|eligible/i)
  const badAvatar = await loadLabPublicFeed({ fetcher: async () => Response.json({ feed: [fixture({ author: { ...fixture().post.author, avatar: 'https://evil.example/track', extra: 'private' } })] }) })
  assert.equal(badAvatar.items[0].author.avatar, undefined)
  assert.equal(badAvatar.items[0].author.extra, undefined)
})

test('oversized provider bodies fail closed before parsing and batches are bounded', async () => {
  const { loadLabPublicFeed } = source('lib/lab-public-feed.ts')
  const oversized = await loadLabPublicFeed({ fetcher: async () => Response.json({ feed: [fixture()], padding: 'x'.repeat(600000) }) })
  assert.equal(oversized.status, 'unavailable')
  const items = Array.from({ length: 70 }, (_, i) => fixture({ uri: `at://${did}/app.bsky.feed.post/item${i}` }))
  const bounded = await loadLabPublicFeed({ fetcher: async () => Response.json({ feed: items }) })
  assert.equal(bounded.items.length, 30)
})

test('public feed route remains read-only and never caches an outage as a healthy response', async (t) => {
  assert.ok(existsSync('src/app/api/lab/feed/route.ts'), 'public feed route missing')
  const route = source('app/api/lab/feed/route.ts')
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ feed: [fixture()] }))
  const response = await route.GET(new Request('https://example.org/api/lab/feed/?url=http://127.0.0.1/secret'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.match(response.headers.get('cache-control'), /s-maxage=60/)
  assert.equal((await response.json()).items.length, 1)
  assert.ok(String(mock.mock.calls[0].arguments[0]).startsWith('https://public.api.bsky.app/'))
  assert.equal(route.POST, undefined)
  mock.mock.mockImplementation(async () => new Response(null, { status: 503 }))
  const failed = await route.GET(new Request('https://example.org/api/lab/feed/'))
  assert.equal(failed.status, 503)
  assert.equal(failed.headers.get('cache-control'), 'no-store')
  assert.equal((await failed.json()).status, 'unavailable')
})

test('outages and malformed upstream responses are unavailable, never successful empty feeds', async () => {
  const { loadLabPublicFeed } = source('lib/lab-public-feed.ts')
  for (const fetcher of [
    async () => { throw new Error('sensitive-provider-message') },
    async () => Response.json({ feed: [] }, { status: 503 }),
    async () => Response.json({ error: 'upstream auth denied' }),
    async () => new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } }),
    async () => Response.json({ feed: null }),
  ]) {
    const data = await loadLabPublicFeed({ fetcher })
    assert.equal(data.status, 'unavailable')
    assert.equal(data.fetchedAt, null)
    assert.deepEqual(data.items, [])
    assert.doesNotMatch(JSON.stringify(data), /sensitive-provider-message|upstream auth denied|<html>/)
  }
  const empty = await loadLabPublicFeed({ fetcher: async () => Response.json({ feed: [] }) })
  assert.equal(empty.status, 'empty')
  assert.ok(empty.fetchedAt)
})
