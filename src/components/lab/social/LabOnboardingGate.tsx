'use client'
import { useState } from 'react'
import { useLabIdentity } from '@/lib/lab-identity'
import { PROFILE_LINKS, profileInterests, validProfileLink } from '@/lib/lab-social'
import { LOCAL_INTERESTS, MAX_LOCAL_INTERESTS, localInterestChoices, toggleLocalInterest, localInterestLimitMessage } from '@/lib/lab-interest-taxonomy'
import { useLabSocial } from '@/components/lab/social/useLabSocial'
import LabDialog from '@/components/lab/LabDialog'
import styles from '@/components/lab/feed/feed.module.css'
export default function LabOnboardingGate() {
  const identity = useLabIdentity()
  if (identity.isLoading || !identity.isAuthenticated || !identity.session?.did) return null
  return <Onboarding key={identity.session.did} owner={identity.session.did} importedName={identity.session.displayName || identity.session.handle} />
}
function Onboarding({ owner, importedName }: { owner: string; importedName: string }) {
  const local = useLabSocial(owner)
  const [edits, setEdits] = useState<Record<string, string>>({}), [interests, setInterests] = useState<string[] | null>(null)
  const [name, setName] = useState<string | null>(null), [error, setError] = useState(''), [deferred, setDeferred] = useState(false)
  if (!local.ready || local.meta.onboardingSkipped || local.meta.onboardingCompleted || deferred) return null
  const chosen = interests ?? profileInterests(local.profile.interests)
  const choices = localInterestChoices([...profileInterests(local.profile.interests), ...chosen])
  const display = name ?? (local.meta.localDisplayName || importedName)
  function skip() { const result = local.saveMeta({ onboardingSkipped: true }); if (!result.ok) setError(result.error || 'Not saved.') }
  function save() {
    if (!display.trim()) { setError('Add a display name, or skip for now.'); return }
    if (local.readError) { setError(local.readError); return }
    for (const l of PROFILE_LINKS) if (edits[l.key] && !validProfileLink(l.key, edits[l.key])) { setError(`Check the ${l.label} URL, or leave it blank.`); return }
    const profile = local.saveProfile({ ...edits, ...(interests !== null ? { interests: chosen } : {}) })
    if (!profile.ok) { setError(profile.error || 'Not saved.'); return }
    const result = local.saveMeta({ onboardingCompleted: true, localDisplayName: display.trim() })
    if (!result.ok) setError(result.error || 'Profile saved, but completion could not be saved. Retry.')
  }
  return <LabDialog title="Set up your workshop bench" onClose={skip}><div className={styles.detail}>
    <p>Signed in as {importedName}. <code>{owner}</code></p><p>Your display info, interests, and optional links stay in this browser for this identity. Nothing is automatically published. Feed follows are a separate choice; saving interests does not subscribe you to the science feed.</p>
    <form onSubmit={e => { e.preventDefault(); save() }}>
      <label>Display name<input aria-label="Display name" maxLength={80} value={display} onChange={e=>setName(e.target.value)} /></label>
      <label>What are you making?<textarea aria-label="What are you making?" rows={2} maxLength={1200} value={edits.workingOn ?? String(local.profile.workingOn || '')} onChange={e=>setEdits({...edits,workingOn:e.target.value})} /></label>
      <p>Interests</p>
      <p id="lab-first-interest-limit" role="status">{localInterestLimitMessage(chosen.length)}</p>
      <div className={styles.chips}>{choices.map(f=><button key={f.id} type="button" aria-label={`Interest: ${f.label}`} aria-pressed={chosen.includes(f.id)} aria-describedby="lab-first-interest-limit" disabled={!chosen.includes(f.id) && chosen.length >= MAX_LOCAL_INTERESTS} onClick={()=>setInterests(current => toggleLocalInterest(current ?? profileInterests(local.profile.interests), f.id))}>{f.label}</button>)}</div>
      {choices.length > LOCAL_INTERESTS.length && <p className={styles.meta}>Saved interests outside the current taxonomy are shown by their original name. Deselect to remove them when you save; nothing is removed automatically.</p>}
      <details><summary>Optional Scholar, GitHub, and LinkedIn links</summary>{PROFILE_LINKS.map(l=><label key={l.key}>{l.label} URL<input type="url" aria-label={`${l.label} URL`} maxLength={2048} value={edits[l.key] ?? String(local.profile[l.key] || '')} onChange={e=>setEdits({...edits,[l.key]:e.target.value})} /></label>)}<p className={styles.meta}>Self-supplied links, not verified credentials or OAuth connections.</p></details>
      <div className={styles.actions}><button className={styles.primary} disabled={chosen.length > MAX_LOCAL_INTERESTS}>Save and continue</button><button type="button" onClick={skip}>Skip for now</button></div>
    </form>{(error || local.error) && <><p role="alert">{error || local.error}</p><button onClick={()=>setDeferred(true)}>Continue for this visit without saving</button></>}
  </div></LabDialog>
}
