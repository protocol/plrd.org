'use client'
import { useEffect, useState } from 'react'
import { CONTRIBUTION_MODES, SOCIAL_INTERESTS, profileInterests, recommendStartingPlaces, type ContributionMode } from '@/lib/lab-social'
import { useLabSocial } from '@/components/lab/social/useLabSocial'
import '@/components/lab/social/social.css'

export type InterestOnboardingProps = { ownerId?: string }
export function InterestOnboarding({ ownerId = 'guest' }: InterestOnboardingProps) {
  return <OnboardingForm key={ownerId} ownerId={ownerId} />
}
function OnboardingForm({ ownerId }: { ownerId: string }) {
  const local = useLabSocial(ownerId)
  const [interests, setInterests] = useState<string[]>([])
  const [mode, setMode] = useState<ContributionMode>('')
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState('')
  const storedInterests = JSON.stringify(profileInterests(local.profile.interests))
  useEffect(() => {
    if (!dirty && local.ready) { setInterests(JSON.parse(storedInterests)); setMode(local.meta.mode) }
  }, [local.ready, storedInterests, local.meta.mode, dirty])
  const places = recommendStartingPlaces(interests, mode)
  function save() {
    const p = local.saveProfile({ interests })
    if (!p.ok) return
    const m = local.saveMeta({ mode, onboardingSkipped: false })
    if (!m.ok) { setMessage('Interests saved, but contribution mode could not be saved. Retry before leaving.'); return }
    setDirty(false); setMessage('Saved in this browser. Your profile draft is updated; nothing was published.')
  }
  return <section className="lab-social lab-social-onboarding" aria-labelledby="lab-onboarding-title">
    <p className="lab-social-kicker">YOUR STARTING POINT / LOCAL CHOICES</p>
    <h1 id="lab-onboarding-title">Start with a constraint.<br /><em>Find your way to useful work.</em></h1>
    <p>Explore a bottleneck, help design a responsible collective intervention, then ask what outcome evidence would show it worked. Tools and experiments support that work.</p>
    <p className="lab-social-muted">No matching algorithm or implied community activity. These starting places follow directly from your choices. Everything is optional, editable, and open without a profile.</p>
    <fieldset disabled={!local.ready}>
      <legend>1. What are you curious about?</legend>
      <div className="lab-social-choices">{SOCIAL_INTERESTS.map(i => <button type="button" key={i.id} aria-pressed={interests.includes(i.id)} onClick={() => { setDirty(true); setMessage(''); setInterests(current => current.includes(i.id) ? current.filter(v => v !== i.id) : [...current, i.id]) }}>{i.label}</button>)}</div>
      {interests.some(i => !SOCIAL_INTERESTS.some(s => s.id === i)) && <p className="lab-social-muted">Existing profile interests are kept: {interests.filter(i => !SOCIAL_INTERESTS.some(s => s.id === i)).join(', ')}. Edit them in My bench.</p>}
    </fieldset>
    <fieldset disabled={!local.ready}>
      <legend>2. How would you like to contribute?</legend>
      <div className="lab-social-choices">{CONTRIBUTION_MODES.map(m => <button type="button" key={m.id} aria-pressed={mode === m.id} onClick={() => { setDirty(true); setMessage(''); setMode(mode === m.id ? '' : m.id) }}>{m.label}</button>)}</div>
    </fieldset>
    <div className="lab-social-controls">
      <button type="button" className="lab-social-primary" disabled={!local.ready} onClick={save}>Save starting choices</button>
      <button type="button" disabled={!local.ready} onClick={() => { if (local.saveMeta({ onboardingSkipped: true }).ok) { setMessage('Skipped. Your saved profile is unchanged. Come back whenever you like.'); setDirty(false) } }}>Skip for now</button>
      <a href="/lab/bottlenecks/">Explore without saving →</a>
    </div>
    <p className="lab-social-muted">{dirty ? 'Unsaved choices. Save to resume in this browser.' : local.meta.onboardingSkipped ? 'You skipped onboarding. You can still edit and save choices here.' : 'Local draft only. Saving does not publish a profile or contact anyone.'}</p>
    {message && <p role="status">{message}</p>}
    {local.error && <p role="alert" className="lab-social-error">{local.error}</p>}
    <section className="lab-social-recommendations" aria-label="Recommended starting places" aria-live="polite">
      <p className="lab-social-kicker">{dirty ? 'PREVIEW BASED ON UNSAVED CHOICES' : 'A FEW CONCRETE WAYS IN'}</p>
      {places.map((place, i) => <article key={place.id}>
        <span className="lab-social-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <div><h2><a href={place.href}>{place.title} →</a></h2><p>{place.why}</p><p className="lab-social-muted">Next: {place.next}</p></div>
      </article>)}
    </section>
    <a className="lab-social-bench" href="/lab/profile/">Your profile and drafts live in My bench →</a>
  </section>
}
