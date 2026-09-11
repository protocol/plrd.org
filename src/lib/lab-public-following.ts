import { assertLabDid, createLabPublicReader, parseLabUri, type LabRecordView } from '@/lib/lab-protocol'

export const PUBLIC_FEED_KINDS = ['note', 'app', 'contribution', 'participation'] as const
export const PUBLIC_FEED_LIMITS = { people: 5, ideas: 10, pages: 2, pageSize: 10 } as const
export type PublicSourceStatus = { source: string; count: number; truncated?: boolean; error?: string }
export async function loadPublicFollowing(people: string[], ideas: string[], signal?: AbortSignal) {
  signal?.throwIfAborted()
  const reader = createLabPublicReader(undefined, signal)
  const records = new Map<string, LabRecordView>()
  const sources: PublicSourceStatus[] = []
  const omittedPeople = Math.max(0, people.length - PUBLIC_FEED_LIMITS.people)
  const publicIdeas = ideas.filter(id => id.startsWith('at://'))
  const omittedIdeas = Math.max(0, publicIdeas.length - PUBLIC_FEED_LIMITS.ideas)
  await Promise.all(people.slice(0, PUBLIC_FEED_LIMITS.people).map(async did => {
    try { assertLabDid(did) }
    catch { sources.push({ source: did, count: 0, error: 'Invalid person identifier. Not read; saved value is unchanged.' }); return }
    for (const kind of PUBLIC_FEED_KINDS) {
      const source = `${did} / ${kind}`
      try {
        let cursor: string | undefined
        const collected: LabRecordView[] = []
        const seen = new Set<string>()
        for (let index = 0; index < PUBLIC_FEED_LIMITS.pages; index++) {
          signal?.throwIfAborted()
          const page = await reader.listRecords(did, kind, { limit: PUBLIC_FEED_LIMITS.pageSize, cursor })
          if (cursor && page.cursor === cursor) throw Error('Repeated public cursor.')
          for (const record of page.records) {
            if (seen.has(record.uri)) throw Error('Public record repeated across pages.')
            seen.add(record.uri)
          }
          collected.push(...page.records)
          cursor = page.cursor
          if (!cursor) break
        }
        for (const record of collected) records.set(record.uri, record)
        sources.push({ source, count: collected.length, truncated: !!cursor })
      } catch { signal?.throwIfAborted(); sources.push({ source, count: 0, error: 'Source unavailable, invalid, or unsupported. This collection was not shown.' }) }
    }
  }))
  for (const uri of publicIdeas.slice(0, PUBLIC_FEED_LIMITS.ideas)) {
    try {
      signal?.throwIfAborted()
      if (parseLabUri(uri).kind === 'profile') throw Error('Profiles are not activity.')
      if (!records.has(uri)) records.set(uri, await reader.readRecord(uri))
      sources.push({ source: uri, count: 1 })
    } catch { signal?.throwIfAborted(); sources.push({ source: uri, count: 0, error: 'Idea unavailable, invalid, or unsupported. Saved URI is unchanged.' }) }
  }
  return {
    records: [...records.values()].sort((a, b) => Date.parse(b.record.createdAt) - Date.parse(a.record.createdAt) || a.uri.localeCompare(b.uri)),
    sources: sources.sort((a, b) => a.source.localeCompare(b.source)),
    truncated: !!(omittedPeople || omittedIdeas || sources.some(s => s.truncated)), omittedPeople, omittedIdeas,
  }
}
export type PublicFollowingFeed = Awaited<ReturnType<typeof loadPublicFollowing>>
