'use client'
import { useCallback, useEffect, useState } from 'react'
import { catchupKey, catchupReceipt, emptyCatchup, isCaughtUp, loadCatchup, markCaughtUp, type CatchupReceipt, type CatchupState } from '@/lib/lab-catchup'
import type { FeedRow } from '@/lib/lab-feed-model'
import type { FollowingMode } from '@/lib/lab-following'
import styles from '@/components/lab/feed/feed.module.css'

const CHANGED = 'open-lab:catchup-changed'
type Scope = { owner: string; mode: FollowingMode; scope: string; ready: boolean }
export type DailyView = 'unread' | 'help' | 'all'
export function useDailyCatchup(scope: Scope) {
  const { owner, mode, ready, scope: key } = scope
  const [loaded, setLoaded] = useState<{ scope: string; state: CatchupState; error: string } | null>(null)
  const [reviewed, setReviewed] = useState<CatchupReceipt[]>([])
  const [notice, setNotice] = useState(''), [saveError, setSaveError] = useState('')
  const refresh = useCallback(() => {
    try { setLoaded({ scope: key, ...loadCatchup(window.localStorage, owner, mode) }) }
    catch { setLoaded({ scope: key, state: emptyCatchup(owner, mode), error: 'Browser storage is unavailable. Catch-up history cannot be saved.' }) }
  }, [key, owner, mode])
  useEffect(() => {
    refresh(); setReviewed([]); setNotice(''); setSaveError('')
    const storage = (event: StorageEvent) => { if (event.key === null || event.key === catchupKey(owner, mode)) refresh() }
    window.addEventListener('storage', storage); window.addEventListener(CHANGED, refresh)
    return () => { window.removeEventListener('storage', storage); window.removeEventListener(CHANGED, refresh) }
  }, [refresh, owner, mode])
  const current = loaded?.scope === key ? loaded : null
  const state = current?.state ?? emptyCatchup(owner, mode)
  const enabled = ready && !!current && !current.error
  function review(row: FeedRow) {
    if (!enabled) return
    const receipt = catchupReceipt(row)
    setReviewed(previous => [...previous.filter(r => r.id !== receipt.id), receipt])
  }
  function isReviewed(row: FeedRow) {
    const receipt = catchupReceipt(row)
    return reviewed.some(r => r.id === receipt.id && r.revision === receipt.revision)
  }
  function acknowledge(rows: FeedRow[]) {
    if (!enabled) return
    setNotice('')
    try {
      const result = markCaughtUp(window.localStorage, owner, mode, rows, reviewed)
      setSaveError(result.error)
      if (result.ok) {
        setNotice(`${result.count} update${result.count === 1 ? '' : 's'} marked caught up in this browser.`)
        refresh(); window.dispatchEvent(new Event(CHANGED))
      }
    } catch { setSaveError('Browser storage is unavailable. Catch-up history was not saved.') }
  }
  return { state, ready: enabled, review, isReviewed, acknowledge, notice, error: saveError || current?.error || '' }
}
export default function DailyCatchup({ daily, rows, view, setView, hasFollows, isDemo, status, followedCount, onFollowing }: {
  daily: ReturnType<typeof useDailyCatchup>; rows: FeedRow[]; view: DailyView; setView: (view: DailyView) => void; hasFollows: boolean; isDemo: boolean;
  status: 'ready' | 'loading' | 'incomplete'; followedCount: number; onFollowing: () => void
}) {
  const pending = rows.filter(row => !isCaughtUp(daily.state, row))
  const eligible = pending.filter(daily.isReviewed)
  return <section className={styles.daily} aria-label="Daily catch-up">
    <div className={styles.dailyHeading}><strong>{status === 'loading' ? 'Restoring your catch-up…' : status === 'incomplete' ? 'Catch-up is incomplete' : pending.length ? `${pending.length} not caught up in this view` : 'Nothing unread in this view'}</strong><span className={styles.meta}>{isDemo ? 'Demo' : 'Personal'} · this browser only</span></div>
    {status === 'incomplete' && <p>Some history or sources could not be fully read. Shown updates remain available; this is not an all-caught-up check.</p>}
    {hasFollows && status !== 'loading' && <button className={styles.followedShortcut} aria-label="Catch up on followed work" disabled={!daily.ready} onClick={onFollowing}>{followedCount} unread from your follows →</button>}
    {!hasFollows && <p>Follow an idea, person, or branch to shape your daily reading. These are {isDemo ? 'illustrative stories and editorial starters' : 'editorial starters and your local work'}, not a live activity timeline.</p>}
    {hasFollows && <p>Unread means not yet acknowledged here, not necessarily new today. Open the source, take one useful next step, then clear only what you reviewed.</p>}
    <div className={styles.dailyActions}><div className={styles.tabs} aria-label="Catch-up view">
      <button aria-pressed={view === 'unread'} onClick={() => setView('unread')}>Not caught up</button>
      <button aria-pressed={view === 'help'} onClick={() => setView('help')}>Needs a hand</button>
      <button aria-pressed={view === 'all'} onClick={() => setView('all')}>All activity</button>
    </div><button aria-label="Mark reviewed caught up" disabled={!daily.ready || !eligible.length} onClick={() => daily.acknowledge(rows)}>Mark reviewed caught up{eligible.length ? ` (${eligible.length})` : ''}</button></div>
    <details className={styles.dailyExplanation}><summary>What gets marked?</summary><p>Only updates you opened or explicitly marked Reviewed in this view. Hidden updates and changed source versions stay unread. Nothing is published or synced. No dates or community activity are inferred.</p></details>
    {daily.notice && <p role="status">{daily.notice}</p>}{daily.error && <p role="alert" className={styles.error}>{daily.error}</p>}
  </section>
}
