import { AtUri, isValidAtUri, isValidDid, isValidHandle } from '@atproto/syntax'

/** Public discovery, not an Open Lab membership index. Never accepts an upstream URL. */
export const LAB_SCIENCE_FEED = 'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science'
export const LAB_SCIENCE_SOURCE = 'https://bsky.app/profile/did:plc:jfhpnnst6flqway4eaeqzj2a/feed/for-science'

export interface LabPublicPost {
  uri: string
  cid?: string
  text: string
  author: { did: string; handle: string; displayName?: string; avatar?: string }
  createdAt: string
  url: string
}
export interface LabPublicFeed {
  items: LabPublicPost[]
  sourceLabel: string
  sourceUrl: string
  fetchedAt: string | null
  status: 'live' | 'empty' | 'unavailable'
  message: string
}

type FeedOptions = { fetcher?: typeof fetch; now?: () => Date }

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max
const hasLabels = (value: unknown) => Array.isArray(value) && value.some(label => object(label).neg !== true)

function publicPost(entry: unknown): LabPublicPost | null {
  const post = object(object(entry).post)
  const record = object(post.record)
  const author = object(post.author)
  if (post.notFound || post.blocked || author.blocked || hasLabels(post.labels) || hasLabels(author.labels)) return null
  if (!text(post.uri, 2048) || !isValidAtUri(post.uri) || !text(author.did, 2048) || !isValidDid(author.did)) return null
  const uri = new AtUri(post.uri)
  if (uri.host !== author.did || uri.collection !== 'app.bsky.feed.post' || !uri.rkey || uri.hash || uri.searchParams.size) return null
  if (!text(author.handle, 253) || !isValidHandle(author.handle)) return null
  if (record.$type !== 'app.bsky.feed.post' || !text(record.text, 3000) || !text(record.createdAt, 80) || !Number.isFinite(Date.parse(record.createdAt))) return null
  const identity: LabPublicPost['author'] = { did: author.did, handle: author.handle }
  if (text(author.displayName, 640)) identity.displayName = author.displayName
  if (text(author.avatar, 2048)) {
    try {
      const avatar = new URL(author.avatar)
      if (avatar.origin === 'https://cdn.bsky.app' && !avatar.username && !avatar.password) identity.avatar = avatar.href
    } catch { /* Optional untrusted media never changes a post's identity. */ }
  }
  return {
    uri: post.uri,
    ...(text(post.cid, 200) ? { cid: post.cid } : {}),
    text: record.text,
    author: identity,
    createdAt: record.createdAt,
    url: `https://bsky.app/profile/${author.did}/post/${encodeURIComponent(uri.rkey)}`,
  }
}

async function boundedJson(response: Response): Promise<unknown> {
  const limit = 512_000
  if (Number(response.headers.get('content-length')) > limit) throw new Error('body too large')
  const reader = response.body?.getReader()
  if (!reader) throw new Error('missing body')
  const decoder = new TextDecoder()
  let bytes = 0
  let value = ''
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > limit) { await reader.cancel(); throw new Error('body too large') }
      value += decoder.decode(chunk.value, { stream: true })
    }
    return JSON.parse(value + decoder.decode())
  } finally { reader.releaseLock() }
}

export async function loadLabPublicFeed({ fetcher = fetch, now = () => new Date() }: FeedOptions = {}): Promise<LabPublicFeed> {
  const url = new URL('https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed')
  url.searchParams.set('feed', LAB_SCIENCE_FEED)
  url.searchParams.set('limit', '30')
  const base = { sourceLabel: 'From the Science feed on Bluesky', sourceUrl: LAB_SCIENCE_SOURCE }
  try {
    const response = await fetcher(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) })
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('unavailable')
    const body = object(await boundedJson(response))
    if (!Array.isArray(body.feed)) throw new Error('invalid feed')
    const seen = new Set<string>()
    const items: LabPublicPost[] = []
    for (const entry of body.feed.slice(0, 30)) {
      const item = publicPost(entry)
      if (item && !seen.has(item.uri)) { seen.add(item.uri); items.push(item) }
    }
    return {
      ...base, items,
      fetchedAt: now().toISOString(),
      status: items.length ? 'live' : 'empty',
      message: items.length
        ? 'Public posts curated by the Science feed. These authors are not Open Lab members by virtue of appearing here.'
        : 'No eligible posts in the current source batch. Malformed or labeled posts are filtered; this is not an Open Lab membership count.',
    }
  } catch {
    return { ...base, items: [], fetchedAt: null, status: 'unavailable', message: 'Bluesky could not be reached. Your drafts and the editorial collection are still available.' }
  }
}
