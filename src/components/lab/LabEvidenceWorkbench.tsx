'use client'

import { useEffect, useState } from 'react'
import { buildEvidencePacket, buildReviewBundle, compareEvidence, evidenceTask, parseEvidenceResult, type EvidenceResult, type EvidenceRole, type EvidenceResolution } from '@/lib/lab-evidence-ledger'
import { EVIDENCE_DRAFT_LIMITS, evidenceRecoveryRaw, parseEvidenceDraft, serializeEvidenceDraft } from '@/lib/lab-evidence-draft'
import './LabEvidenceWorkbench.css'

const storageKey = 'plrd-open-lab:evidence-pilot:v1'
type Bundle = ReturnType<typeof buildReviewBundle>
function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Local inspectable coordination pilot; never dispatches or publishes. */
export default function LabEvidenceWorkbench({ onExport, onPropose }: { onExport?: (bundle: Bundle) => void; onPropose?: (bundle: Bundle) => void }) {
  const [minutes, setMinutes] = useState('20')
  const [researchText, setResearchText] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [research, setResearch] = useState<EvidenceResult | null>(null)
  const [review, setReview] = useState<EvidenceResult | null>(null)
  const [by, setBy] = useState('')
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<EvidenceResolution['decision']>('needs-work')
  const [checkedSource, setCheckedSource] = useState(false)
  const [notice, setNotice] = useState('')
  const [storageNotice, setStorageNotice] = useState('')
  const [storageState, setStorageState] = useState<'loading' | 'ready' | 'invalid' | 'unavailable'>('loading')
  const [recovery, setRecovery] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [replaceConfirmed, setReplaceConfirmed] = useState(false)
  const comparison = compareEvidence(research, review)

  useEffect(() => {
    let raw: string | null
    try { raw = localStorage.getItem(storageKey) }
    catch {
      setStorageState('unavailable')
      setStorageNotice('Browser storage is unavailable for reading. Autosave is paused; no saved original was overwritten. Retry by reloading when storage access is restored, or deliberately replace this one draft below. Current edits are not saved.')
      return
    }
    if (raw !== null) {
      try {
        const saved = parseEvidenceDraft(raw)
        setResearchText(saved.researchText); setReviewText(saved.reviewText); setBy(saved.by); setNote(saved.note)
        setNotice('Recovered your local draft. Import the returns again before making a review bundle.')
      } catch (error) {
        const copy = evidenceRecoveryRaw(raw)
        setRecovery(copy)
        setStorageState('invalid')
        setStorageNotice(`${error instanceof Error ? error.message : 'Saved evidence could not be restored.'} The original is preserved, not overwritten. Autosave is paused; current edits are not saved. ${copy !== null ? 'Download the saved original before reconciling or replacing it.' : `Exact-raw download is unavailable within safe size/encoding limits. Back up the value of ${storageKey} from browser developer tools → Application/Storage → Local Storage before replacing it.`}`)
        return
      }
    }
    setStorageState('ready')
  }, [])
  useEffect(() => {
    if (storageState !== 'ready' || !dirty) return
    try {
      localStorage.setItem(storageKey, serializeEvidenceDraft({ version: 1, researchText, reviewText, by, note }))
      setDirty(false); setStorageNotice('')
    } catch { setStorageNotice('Could not save locally. The previous saved draft was not replaced. Keep copies of your current returns and notes before leaving.') }
  }, [storageState, dirty, researchText, reviewText, by, note])
  useEffect(() => { setReplaceConfirmed(false) }, [researchText, reviewText, by, note])

  function downloadOriginal() {
    if (recovery === null) return
    let url: string | undefined
    let link: HTMLAnchorElement | undefined
    try {
      url = URL.createObjectURL(new Blob([recovery], { type: 'text/plain;charset=utf-8' }))
      link = document.createElement('a'); link.href = url; link.download = 'open-lab-evidence-original.txt'
      document.body.appendChild(link); link.click()
      setNotice('Saved original prepared for download, unchanged and unvalidated. Check the downloaded file before replacing saved evidence. Autosave remains paused.')
    } catch { setNotice('Could not prepare the saved-original download. The original is still preserved; autosave remains paused. Use browser developer tools to back it up before replacing it.') }
    finally { link?.remove(); if (url) { const downloadUrl = url; setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000) } }
  }
  function replaceSavedEvidence() {
    if (!replaceConfirmed || (storageState !== 'invalid' && storageState !== 'unavailable')) return
    try {
      const raw = serializeEvidenceDraft({ version: 1, researchText, reviewText, by, note })
      localStorage.setItem(storageKey, raw)
      setStorageState('ready'); setDirty(false); setRecovery(null); setReplaceConfirmed(false); setStorageNotice('')
      setNotice('Replaced only this browser’s saved evidence draft with the current fields. Autosave resumed. Nothing was published.')
    } catch { setNotice('Could not replace the saved evidence. The original was not overwritten; autosave remains paused. Keep your backup and current edits.') }
  }

  function importReturn(role: EvidenceRole) {
    try {
      const result = parseEvidenceResult(role === 'research' ? researchText : reviewText, role)
      if (role === 'research') setResearch(result); else setReview(result)
      setCheckedSource(false)
      setNotice(`${role === 'research' ? 'Research' : 'Review'} return imported locally. Its shape was checked, not its scientific validity. Not published.`)
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not import this return.') }
  }
  async function loadFile(role: EvidenceRole, file?: File) {
    if (!file) return
    if (file.size > EVIDENCE_DRAFT_LIMITS.researchText) { setNotice('Keep a result below 64 KB.'); return }
    try {
      const text = await file.text()
      if (text.length > EVIDENCE_DRAFT_LIMITS[`${role}Text`]) { setNotice('Keep a result below 64 KB.'); return }
      setDirty(true)
      if (role === 'research') { setResearchText(text); setResearch(null) } else { setReviewText(text); setReview(null) }
      setCheckedSource(false)
      setNotice('File loaded into the draft. Use Import to check its fields.')
    } catch { setNotice('Could not read the file. Paste its JSON instead.') }
  }
  function packet(role: EvidenceRole) {
    try { downloadJson(`${evidenceTask.id}-${role}.json`, buildEvidencePacket(role, Number(minutes))); setNotice('Packet prepared for download. No task was reserved, no agent was launched, and no money was spent.') }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Could not prepare the packet.') }
  }
  function exportBundle(propose = false) {
    try {
      const bundle = buildReviewBundle(research, review, { by, decision, note, checkedSource })
      if (propose && onPropose) onPropose(bundle)
      else if (onExport) onExport(bundle)
      else downloadJson(`${evidenceTask.id}-review.json`, bundle)
      setNotice(propose ? 'Proposal draft prepared. Review it before any public publish.' : 'Review bundle prepared for download. Not published and not accepted into the Atlas.')
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not prepare the review.') }
  }

  return <section id="evidence-pilot" className="lab-evidence" aria-labelledby="evidence-heading">
    <div className="lab-evidence-heading"><div><p className="lab-eyebrow">A COMPLETE LOOP / TWO RETURNS, ONE QUESTION</p><h2 id="evidence-heading">Don’t just send an agent.<br /><em>Bring the evidence back.</em></h2></div><p>A small coordination experiment you can actually finish: one person or agent traces a source, another checks it, and you compare what came back. Nothing runs on our servers.</p></div>
    {(storageState === 'invalid' || storageState === 'unavailable') && <div className="lab-evidence-brief" aria-label="Saved evidence recovery">
      <h3>Saved evidence needs recovery</h3>
      <p role="alert">{storageNotice}</p>
      {recovery !== null && <button type="button" className="lab-button lab-quiet" onClick={downloadOriginal}>Download saved original</button>}
      <p>Reconcile any backup into the fields below, then explicitly replace this draft. Leaving the fields empty resets only <code>{storageKey}</code>. Other saved work is untouched. Editing, importing, or exporting does not authorize replacement.</p>
      <label className="lab-evidence-check"><input type="checkbox" aria-label="Confirm replacement of saved evidence" checked={replaceConfirmed} onChange={e => setReplaceConfirmed(e.target.checked)} />I have backed up what I need and understand that replacement discards the saved original for this evidence draft only.</label>
      <button type="button" className="lab-button lab-quiet" disabled={!replaceConfirmed} onClick={replaceSavedEvidence}>Replace saved evidence with current draft</button>
    </div>}
    <div className="lab-evidence-brief"><span className="lab-eyebrow">PROPOSED PILOT · NOT A STAFFED CAMPAIGN</span><h3>{evidenceTask.title}</h3><p className="lab-evidence-claim">“{evidenceTask.claim}”</p><dl><div><dt>The opening</dt><dd>{evidenceTask.opening}</dd></div><div><dt>A useful return</dt><dd>{evidenceTask.usefulContribution}</dd></div></dl><div className="lab-evidence-sources"><a href={evidenceTask.sourceUrl} target="_blank" rel="noopener noreferrer">Read the pinned NIH source ↗</a><a href={evidenceTask.primarySourceUrl} target="_blank" rel="noopener noreferrer">Trace to the original study ↗</a></div><small>This is an Open Lab exercise, not a request from FlyWire or an accepted Neuro Atlas contribution. Source excerpts and judgments below come only from what you import.</small></div>
    <div className="lab-evidence-packets"><label className="lab-field">Local time hint (minutes)<input type="number" min="5" max="240" step="1" value={minutes} onChange={e => setMinutes(e.target.value)} /><small>Not an enforced spending limit.</small></label><button type="button" className="lab-button lab-quiet" onClick={() => packet('research')}>Take the research packet ↓</button><button type="button" className="lab-button lab-quiet" onClick={() => packet('review')}>Take the review packet ↓</button></div>
    <p className="lab-evidence-instruction">Run these yourself, or give one to someone else’s agent. Keep credentials in your own environment. Return the filled <code>returnTemplate</code>, not an entire agent transcript. Only public source material belongs here.</p>
    <div className="lab-evidence-columns">{(['research', 'review'] as const).map(role => {
      const title = role === 'research' ? 'Research' : 'Review'
      const result = role === 'research' ? research : review
      return <section className="lab-evidence-slot" key={role} aria-label={`${title} return`}><div className="lab-evidence-slot-heading"><span>{role === 'research' ? '01' : '02'}</span><h3>{title} return</h3><small>{result ? 'IMPORTED LOCALLY' : 'AWAITING YOUR RESULT'}</small></div>
        <label className="lab-field">Paste the return JSON<textarea aria-label={`${title} return JSON`} rows={5} maxLength={EVIDENCE_DRAFT_LIMITS[`${role}Text`]} value={role === 'research' ? researchText : reviewText} placeholder="Your result goes here. No sample result has been invented." onChange={e => { setDirty(true); if (role === 'research') { setResearchText(e.target.value); setResearch(null) } else { setReviewText(e.target.value); setReview(null) }; setCheckedSource(false) }} /></label>
        <div className="lab-evidence-import"><label className="lab-evidence-file">Or open a JSON file<input aria-label={`${title} return file`} type="file" accept="application/json,.json" onChange={e => { void loadFile(role, e.target.files?.[0]); e.target.value = '' }} /></label><button type="button" className="lab-button lab-quiet" onClick={() => importReturn(role)}>Import {role}</button></div>
        {result && <div className="lab-evidence-result"><p><strong>{result.contributor}</strong> · {result.runner} <span>(self-reported)</span></p><p className="lab-evidence-assessment">{result.assessment === 'supports' ? 'Supports the claim' : result.assessment === 'contradicts' ? 'Contradicts the claim' : 'Unclear'}</p><blockquote>{result.quote}</blockquote><p><strong>Location:</strong> {result.location}</p><p><strong>Limitation:</strong> {result.limitation}</p></div>}
      </section>
    })}</div>
    <div className={`lab-evidence-comparison lab-evidence-comparison-${comparison.status}`} role="status"><span>COMPARISON</span><strong>{comparison.label}</strong><p>Different contributor labels do not prove independence. Agreement is not peer review. Inspect the actual source and keep dissent in the record.</p></div>
    <form className="lab-evidence-resolution" onSubmit={e => { e.preventDefault(); exportBundle() }}><div><p className="lab-eyebrow">03 / THE HUMAN CHECK</p><h3>What should happen next?</h3><p>Record your assessment without erasing either return. This creates a local review bundle, not scientific certification or an Atlas edit.</p></div><div className="lab-evidence-resolution-fields"><label className="lab-field">Your name for this local review<input aria-label="Local reviewer name" maxLength={EVIDENCE_DRAFT_LIMITS.by} value={by} onChange={e => { setBy(e.target.value); setDirty(true) }} required /></label><label className="lab-field">Next step<select value={decision} onChange={e => setDecision(e.target.value as EvidenceResolution['decision'])}><option value="needs-work">Needs more work</option><option value="ready-to-propose">Ready to propose for curator review</option></select></label><label className="lab-field lab-evidence-full">Your note<textarea aria-label="Resolution note" rows={3} maxLength={EVIDENCE_DRAFT_LIMITS.note} value={note} onChange={e => { setNote(e.target.value); setDirty(true) }} required /></label><label className="lab-evidence-check"><input aria-label="I inspected the source evidence" type="checkbox" checked={checkedSource} onChange={e => setCheckedSource(e.target.checked)} />I inspected the source evidence. I understand this is my self-reported review, not Atlas acceptance.</label><div className="lab-evidence-actions"><button type="submit" className="lab-button">Export review bundle</button>{onPropose && <button type="button" className="lab-button lab-quiet" onClick={() => exportBundle(true)}>Draft an Atlas proposal +</button>}</div></div></form>
    {notice && <p className="lab-evidence-notice" role="status">{notice}</p>}{storageNotice && storageState === 'ready' && <p role="alert">{storageNotice}</p>}<p className="lab-evidence-privacy">Draft editing is local to this browser. Storage status above reports any recovery or save failure. Not published. A file export can be sent to a collaborator by you; Open Lab does not send it or authenticate the names in it.</p>
  </section>
}
