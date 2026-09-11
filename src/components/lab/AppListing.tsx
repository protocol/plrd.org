'use client'
import { useCallback, useEffect, useState } from 'react'
import LabDialog from '@/components/lab/LabDialog'
import { useLabFollowing } from '@/components/lab/social/useLabFollowing'
import { loadAppShelf, changeAppShelf, type AppListing as Listing, type AppShelf, type AppShelfAction } from '@/lib/lab-app-catalog'
import { fieldLabel } from '@/lib/lab-data'
import styles from '@/components/lab/AppListing.module.css'
const CHANGED = 'open-lab:app-shelf-changed'
export function useAppShelf() {
  const following = useLabFollowing(), { owner, mode, scope } = following
  const [loaded, setLoaded] = useState<{ scope: string; state: AppShelf; error: string } | null>(null)
  const [error, setError] = useState('')
  const refresh = useCallback(() => {
    try { setLoaded({ scope, ...loadAppShelf(window.localStorage, owner, mode) }) }
    catch { setLoaded(null); setError('Browser storage is unavailable. App changes cannot be saved.') }
  }, [owner, mode, scope])
  useEffect(() => { setError(''); refresh(); window.addEventListener(CHANGED, refresh); window.addEventListener('storage', refresh); return () => { window.removeEventListener(CHANGED, refresh); window.removeEventListener('storage', refresh) } }, [refresh])
  const current = following.ready && loaded?.scope === scope ? loaded : null
  const ready = !!current
  function act(action: AppShelfAction) {
    if (!ready) return { ok: false, error: 'Wait for this identity’s app shelf to load.' }
    let result
    try { result = changeAppShelf(window.localStorage, owner, mode, action) }
    catch { result = { ok: false, error: 'Browser storage is unavailable. Nothing was saved.' } }
    // Action validation errors belong to the form/status that invoked them.
    // Do not turn a correctable field error into a shelf-wide write lock.
    if (result.ok) { refresh(); window.dispatchEvent(new Event(CHANGED)) }
    return result
  }
  return { state: current?.state, ready, scope, mode, error: error || current?.error || '', act, following }
}
export default function AppListing({ app, onClose, onEdit }: { app: Listing; onClose: () => void; onEdit?: () => void }) {
  return <LabDialog title={app.title} onClose={onClose}><AppListingContent app={app} onEdit={onEdit} /></LabDialog>
}
export function AppListingContent({ app, onEdit }: { app: Listing; onEdit?: () => void }) {
  const shelf = useAppShelf()
  return <ListingBody key={`${shelf.scope}:${app.id}`} app={app} shelf={shelf} onEdit={onEdit} />
}
function ListingBody({ app, shelf, onEdit }: { app: Listing; shelf: ReturnType<typeof useAppShelf>; onEdit?: () => void }) {
  const [review, setReview] = useState<string | null>(null), [notice, setNotice] = useState('')
  const ideaId = app.origin === 'editorial' ? `artifact:${app.id}` : `app:${app.id}`
  const saved = shelf.state?.saved.includes(app.id), followed = shelf.following.prefs.ideas.includes(ideaId)
  function message(result: { ok: boolean; error?: string }, success: string) { setNotice(result.ok ? success : result.error || 'Not saved.') }
  return <div className={styles.listing}>
    <p className={styles.meta}>{fieldLabel(app.field)} · {app.origin === 'local' ? 'Your unpublished listing · claims supplied by you' : 'Editorial listing · not a member submission'}</p>
    <p className={styles.description}>{app.description}</p>
    <div className={styles.preview} aria-label="App use-case preview"><span className={styles.icon} aria-hidden="true">{app.title.slice(0,2).toUpperCase()}</span><div><span className={styles.eyebrow}>WHAT YOU CAN DO</span><p>{app.useCase}</p></div></div>
    <div className={styles.actions}>
      <a className={styles.primary} data-app-launch href={app.launchUrl} target="_blank" rel="noopener noreferrer">Open app externally ↗</a>
      <button aria-label={saved ? 'Unsave app' : 'Save app'} aria-pressed={!!saved} disabled={!shelf.ready || !!shelf.error} onClick={() => message(shelf.act({ type: 'save', id: app.id }), saved ? 'Removed from your saved apps.' : 'App saved in this browser.')}>{saved ? 'Saved ✓' : 'Save app'}</button>
      <button aria-label={followed ? 'Unfollow app' : 'Follow app'} aria-pressed={followed} disabled={!shelf.following.ready || !!shelf.following.error} onClick={() => message(shelf.following.act({ type: 'toggle', kind: 'ideas', id: ideaId }), 'App follow updated locally. No external account was followed.')}>{followed ? 'Following ✓' : 'Follow app'}</button>
    </div>
    <p className={styles.meta}>Opens a separate site with its own terms. No app runs inside Open Lab. Local follows are not release monitoring or project membership.</p>
    <dl className={styles.facts}>
      <dt>Maintained by</dt><dd>{app.maintainer}<small>Source attribution, not a maintenance-status check.</small></dd>
      <dt>License / terms</dt><dd>{app.license}{app.licenseUrl && <small><a data-license-source href={app.licenseUrl} target="_blank" rel="noopener noreferrer">Inspect license ↗</a> · Code terms do not automatically cover datasets or hosted services.</small>}</dd>
      <dt>Source</dt><dd><a href={app.sourceUrl} target="_blank" rel="noopener noreferrer">Project / documentation ↗</a>{app.codeUrl && <> · <a href={app.codeUrl} target="_blank" rel="noopener noreferrer">GitHub source ↗</a></>}</dd>
      <dt>Evidence &amp; limits</dt><dd>{app.evidence}</dd>
    </dl>
    <section className={styles.reviews}><h3>Reviews</h3><p>No community reviews are loaded. No rating or usage count is inferred.</p>
      <form onSubmit={e => { e.preventDefault(); message(shelf.act({ type: 'review', id: app.id, text: review ?? shelf.state?.reviews[app.id] ?? '' }), 'Review draft saved locally, not published.') }}>
        <label>Your review draft<textarea aria-label="Your review draft" placeholder="What did you try? What worked, failed, or remains untested?" rows={3} maxLength={4000} required disabled={!shelf.ready} value={review ?? shelf.state?.reviews[app.id] ?? ''} onChange={e => setReview(e.target.value)} /></label>
        <button disabled={!shelf.ready || !!shelf.error}>Save review draft</button>
      </form>
      <p className={styles.meta}>Only this browser, this identity, and {shelf.mode === 'demo' ? 'Demo mode' : 'live mode'}. No cross-device sync or public review submission.</p>
    </section>
    {onEdit && <button onClick={onEdit}>Edit local listing</button>}
    {notice && <p role="status">{notice}</p>}{(shelf.error || shelf.following.error) && <p role="alert">{shelf.error || shelf.following.error}</p>}
  </div>
}
