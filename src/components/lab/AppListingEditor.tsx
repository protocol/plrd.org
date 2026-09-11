'use client'
import { useState } from 'react'
import LabDialog from '@/components/lab/LabDialog'
import { useAppShelf } from '@/components/lab/AppListing'
import type { AppListing } from '@/lib/lab-app-catalog'
import { fields } from '@/lib/lab-data'
import styles from '@/components/lab/AppListing.module.css'
export default function AppListingEditor({ app, onClose }: { app?: AppListing; onClose: () => void }) {
  const shelf = useAppShelf()
  return <Editor key={shelf.scope} app={app} shelf={shelf} onClose={onClose} />
}
function Editor({ app, shelf, onClose }: { app?: AppListing; shelf: ReturnType<typeof useAppShelf>; onClose: () => void }) {
  const [draft, setDraft] = useState<AppListing>(app || { id: '', origin: 'local', title: '', description: '', field: 'cross-field', maintainer: '', license: '', useCase: '', evidence: '', sourceUrl: '', launchUrl: '', codeUrl: '' })
  const [error, setError] = useState('')
  const inputs = [
    ['title','App name',200], ['description','Short description',2000], ['maintainer','Maintained by',200], ['license','License / terms',500],
    ['useCase','Use case',2000], ['evidence','Evidence and limitations',2000], ['launchUrl','App URL',2048], ['sourceUrl','Source / documentation URL',2048], ['codeUrl','GitHub source URL (optional)',2048],
  ] as const
  return <LabDialog title={app ? 'Edit your app listing' : 'Add your app'} onClose={onClose}>
    <form className={styles.listing} onSubmit={e => { e.preventDefault(); const result = shelf.act({ type: 'listing', listing: { ...draft, id: draft.id || `local:${crypto.randomUUID()}` } }); if (result.ok) onClose(); else setError(result.error || 'Not saved.') }}>
      <p>Prepare a source-linked listing, not an upload or installation. It stays unpublished in this browser and identity’s {shelf.mode === 'demo' ? 'Demo' : 'live'} shelf.</p>
      {inputs.map(([key,label,max]) => <label key={key}>{label}{['description','useCase','evidence'].includes(key) ? <textarea aria-label={label} rows={2} maxLength={max} required value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /> : <input aria-label={label} type={key.endsWith('Url') ? 'url' : 'text'} placeholder={key.endsWith('Url') ? 'https://…' : undefined} maxLength={max} required={key !== 'codeUrl'} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />}</label>)}
      <label>Field<select aria-label="App field" value={draft.field} onChange={e => setDraft({ ...draft, field: e.target.value })}>{fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
      <p className={styles.meta}>Use public, shareable URLs only. HTTPS required; source-code links must use github.com. Nothing is fetched or executed to validate these links.</p>
      <div className={styles.actions}><button className={styles.primary} disabled={!shelf.ready || !!shelf.error}>Save local listing</button><button type="button" onClick={onClose}>Cancel</button></div>
      {(error || shelf.error) && <p role="alert">{error || shelf.error}</p>}
    </form>
  </LabDialog>
}
