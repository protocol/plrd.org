'use client'
import { useEffect, useId, useState } from 'react'
import { PROFILE_LINKS, profileCompletion, validProfileLink } from '@/lib/lab-social'
import { useLabSocial } from '@/components/lab/social/useLabSocial'
import '@/components/lab/social/social.css'

export type ProfileCompletionProps = { ownerId?: string }
export function ProfileCompletion({ ownerId = 'guest' }: ProfileCompletionProps) {
  return <CompletionForm key={ownerId} ownerId={ownerId} />
}
function CompletionForm({ ownerId }: { ownerId: string }) {
  const local = useLabSocial(ownerId)
  const id = useId()
  const [values, setValues] = useState<Record<string, string>>({})
  const [changed, setChanged] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const serialized = JSON.stringify(local.profile)
  useEffect(() => {
    if (!changed.length) setValues(Object.fromEntries(Object.entries(JSON.parse(serialized)).filter(([, v]) => typeof v === 'string')) as Record<string, string>)
  }, [serialized, changed.length])
  const completion = profileCompletion(local.profile, local.meta.skippedLinks)
  function update(key: string, value: string) {
    setValues(current => ({ ...current, [key]: value })); setChanged(current => [...new Set([...current, key])]); setMessage('')
  }
  function save() {
    const result = local.saveProfile(Object.fromEntries(changed.map(key => [key, values[key]])))
    if (!result.ok) return
    const unskip = local.meta.skippedLinks.filter(key => !changed.includes(key) || !values[key])
    const metaResult = local.saveMeta({ skippedLinks: unskip })
    setChanged([])
    setMessage(metaResult.ok ? 'Saved in this browser. Not published. Review any public profile change separately in My bench.' : 'Profile saved locally, but link preferences could not be saved. Retry before leaving.')
  }
  function skip(key: string) {
    if (!local.saveProfile({ [key]: '' }).ok) return
    if (!local.saveMeta({ skippedLinks: [...new Set([...local.meta.skippedLinks, key])] }).ok) return
    setValues(current => ({ ...current, [key]: '' })); setChanged(current => current.filter(k => k !== key)); setMessage('Optional link skipped. Nothing was published; contribution access is unchanged.')
  }
  return <section className="lab-social lab-social-completion" aria-labelledby={`${id}-title`}>
    <p className="lab-social-kicker">PROFILE DRAFT / ONLY IN THIS BROWSER</p>
    <h2 id={`${id}-title`}>Make your work easier to find.</h2>
    <div className="lab-social-progress-heading"><strong>{completion.completed} of {completion.total} useful fields</strong><span>{completion.percent}%</span></div>
    <progress max={completion.total} value={completion.completed} aria-label="Local profile completeness" />
    <p className="lab-social-muted">Three useful basics, plus any links you choose to add. Omitted or skipped links do not lower your score. This is not an expertise rating or a requirement to contribute.</p>
    <ul className="lab-social-checklist">{completion.fields.map(f => <li key={f.key}><span aria-hidden="true">{f.done ? '✓' : '○'}</span> {f.label} — {f.done ? 'added' : 'needs attention'}</li>)}</ul>
    <form noValidate onSubmit={e => { e.preventDefault(); save() }}>
      <fieldset disabled={!local.ready}>
        <legend>The useful basics</legend>
        {[['workingOn', 'What are you working on?'], ['lookingFor', 'What help are you looking for?']].map(([key, label]) => <label key={key} className="lab-social-field">{label}<textarea aria-label={label} maxLength={1200} value={values[key] || ''} onChange={e => update(key, e.target.value)} rows={2} /></label>)}
        <a href="/lab/onboarding/">Choose or edit your starting interests →</a>
      </fieldset>
      <fieldset disabled={!local.ready}>
        <legend>Optional links, not credentials</legend>
        <p className="lab-social-muted">LinkedIn gives work context; Google Scholar points to publications. GitHub can make code easier to inspect. These are self-supplied links, not verified identities or OAuth connections. We do not scrape or sync them.</p>
        {PROFILE_LINKS.map(link => {
          const invalid = !!values[link.key] && !validProfileLink(link.key, values[link.key])
          const skipped = local.meta.skippedLinks.includes(link.key)
          return <div className="lab-social-link-field" key={link.key}>
            <label className="lab-social-field" htmlFor={`${id}-${link.key}`}>{link.label} URL <span className="lab-social-muted">{skipped ? 'Skipped / not applicable' : 'Optional'}</span>
              <input id={`${id}-${link.key}`} aria-label={`${link.label} URL`} type="url" maxLength={2048} autoComplete="off" spellCheck={false} placeholder={link.example} value={values[link.key] || ''} onChange={e => update(link.key, e.target.value)} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-${link.key}-error` : undefined} />
            </label>
            <p className="lab-social-muted">{link.why}</p>
            {invalid && <p id={`${id}-${link.key}-error`} className="lab-social-error">Check this {link.label} profile URL. It may be kept as an unfinished local draft, but does not count as complete.</p>}
            <button type="button" onClick={() => skip(link.key)}>Skip {link.label}</button>
          </div>
        })}
      </fieldset>
      <div className="lab-social-controls"><button className="lab-social-primary" type="submit" disabled={!local.ready}>Save profile locally</button><a href="/lab/profile/">My bench →</a></div>
      {changed.length > 0 && <p className="lab-social-muted">Unsaved edits. The score above reflects the saved draft.</p>}
    </form>
    {message && <p role="status">{message}</p>}
    {local.error && <p className="lab-social-error" role="alert">{local.error}</p>}
  </section>
}
