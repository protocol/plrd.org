'use client'
import type { usePublicFollowing } from '@/components/lab/feed/usePublicFollowing'
import { PUBLIC_FEED_LIMITS } from '@/lib/lab-public-following'
import styles from '@/components/lab/feed/feed.module.css'

export default function PublicFollowingStatus({ feed }: { feed: ReturnType<typeof usePublicFollowing> }) {
  if (!feed.requested) return null
  const errors = feed.feed?.sources.some(s => s.error)
  return <details data-public-feed-status className={styles.meta} style={{ overflowWrap: 'anywhere' }}>
    <summary role="status">{feed.loading ? 'Reading public subscriptions…' : <>{feed.records.length ? `${feed.records.length} public records` : 'No supported public records shown'}{errors || feed.error ? ' · source errors' : ''}{feed.feed?.truncated ? ' · truncated' : ''}</>}</summary>
    <p>Supported: notes, apps, contributions, and participation. Profiles and other collections are not activity. At most {PUBLIC_FEED_LIMITS.people} people, {PUBLIC_FEED_LIMITS.pages} pages per collection, {PUBLIC_FEED_LIMITS.pageSize} records per page, and {PUBLIC_FEED_LIMITS.ideas} exact followed ideas. Not an indexed or complete network feed.</p>
    <p>Only source-authored fields classify these records; participation has no field. Authors are exact DIDs, not verified names or affiliations. Your unpublished drafts are separate.</p>
    {!!feed.feed?.omittedPeople && <p>{feed.feed.omittedPeople} person subscriptions not read due to the limit.</p>}
    {!!feed.feed?.omittedIdeas && <p>{feed.feed.omittedIdeas} idea subscriptions not read due to the limit.</p>}
    {feed.feed?.sources.map(s => <p key={s.source}><strong>{s.source}</strong>: {s.error || (s.count ? `${s.count} records returned${s.truncated ? ' · truncated; more records exist' : ''}` : 'No supported public records returned in this collection.')}</p>)}
    <button disabled={feed.loading} onClick={feed.refresh}>Refresh public subscriptions</button>
  </details>
}
