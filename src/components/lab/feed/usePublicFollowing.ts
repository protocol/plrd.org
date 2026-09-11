'use client'
import { useEffect, useState } from 'react'
import { loadPublicFollowing, type PublicFollowingFeed } from '@/lib/lab-public-following'
import type { useLabFollowing } from '@/components/lab/social/useLabFollowing'

export function usePublicFollowing(following: ReturnType<typeof useLabFollowing>) {
  const [revision, setRevision] = useState(0)
  const enabled = following.ready && following.mode === 'live' && !following.error
  const people = JSON.stringify(enabled ? following.prefs.people : [])
  const ideas = JSON.stringify(enabled ? following.prefs.ideas.filter(id => id.startsWith('at://')) : [])
  const key = `${following.scope}:${enabled}:${people}:${ideas}:${revision}`
  const [loaded, setLoaded] = useState<{ key: string; feed: PublicFollowingFeed | null; error: string }>({ key: '', feed: null, error: '' })
  const requested = enabled && (people !== '[]' || ideas !== '[]')
  useEffect(() => {
    let active = true
    if (!requested) return
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)])
    loadPublicFollowing(JSON.parse(people), JSON.parse(ideas), signal)
      .then(feed => { if (active) setLoaded({ key, feed, error: '' }) })
      .catch(() => { if (active) setLoaded({ key, feed: null, error: 'Public records could not be read. Local subscriptions are unchanged.' }) })
    return () => { active = false; controller.abort() }
  }, [key, people, ideas, requested])
  const current = requested && loaded.key === key
  return { requested, loading: requested && !current, records: current ? loaded.feed?.records || [] : [], feed: current ? loaded.feed : null, error: current ? loaded.error : '', refresh: () => setRevision(n => n + 1) }
}
