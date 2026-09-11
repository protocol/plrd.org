'use client'

import { useEffect, useState } from 'react'
import { checkedRecordUri, displayRecord, readRecordLocation, recordPermalink, type PublicLabDocument } from '@/lib/lab-record-display'
import './LabPublicInspector.css'

type Props = { loadRecord: (uri: string) => Promise<PublicLabDocument>; onPropose?: (record: PublicLabDocument) => void }
function RecordBody({ record }: { record: PublicLabDocument }) {
  const view = displayRecord(record)
  return <article className="lab-record-body"><p className="lab-eyebrow">AUTHOR-OWNED PUBLIC RECORD</p><h2>{view.title}</h2><p className="lab-record-author">Author DID from record location: <code>{record.did}</code></p><dl>{view.rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.link ? <a href={row.value} target="_blank" rel="noopener noreferrer">{row.value} ↗</a> : row.value}</dd></div>)}</dl><details><summary>Record provenance</summary><p><strong>AT URI</strong><br /><code>{record.uri}</code></p><p><strong>Content identifier</strong><br /><code>{record.cid}</code></p>{record.createdAt && <p><strong>Author-declared date</strong><br />{record.createdAt}</p>}<p>Read directly from the author’s current personal data server over HTTPS. The repository signature is not independently checked by this viewer. This is record retrieval, not scientific verification. Content may change or be withdrawn; downstream copies can survive.</p></details></article>
}

/** Direct, explicit inclusion—not a global index or a claim that someone joined. */
export default function LabPublicInspector({ loadRecord, onPropose }: Props) {
  const [input, setInput] = useState('')
  const [replyInput, setReplyInput] = useState('')
  const [target, setTarget] = useState<{uri:string|null; response:string|null}>({uri:null,response:null})
  const [record, setRecord] = useState<PublicLabDocument|null>(null)
  const [response, setResponse] = useState<PublicLabDocument|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [responseError, setResponseError] = useState('')
  const [notice, setNotice] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  useEffect(() => {
    function restore() {
      try { const next = readRecordLocation(window.location.search); setInput(next.uri || ''); setReplyInput(next.response || ''); setTarget(next); setError('') }
      catch (e) { setTarget({uri:null,response:null}); setRecord(null); setResponse(null); setError(e instanceof Error ? e.message : 'Invalid record link.') }
    }
    restore(); window.addEventListener('popstate',restore)
    return () => window.removeEventListener('popstate',restore)
  }, [])
  useEffect(() => {
    let active = true
    setRecord(null); setResponse(null); setResponseError(''); setShareUrl('')
    if (!target.uri) { setLoading(false); return }
    setLoading(true); setError('')
    loadRecord(target.uri).then(value => { if (active) setRecord(value) }).catch(() => { if (active) setError('This record could not be read. It may be unavailable, withdrawn, unsupported, or blocked by its data server. No content has been invented.') }).finally(() => { if (active) setLoading(false) })
    if (target.response) loadRecord(target.response).then(value => { if(active)setResponse(value) }).catch(() => { if(active)setResponseError('The comparison record could not be read. The main record remains independently readable.') })
    return () => { active = false }
  }, [target.uri, target.response, loadRecord])
  function open(compare = false) {
    try {
      const uri = checkedRecordUri(input)
      const response = compare && replyInput ? checkedRecordUri(replyInput) : null
      const link = recordPermalink(window.location.origin,uri,response)
      window.history.pushState(null,'',link); setTarget({uri,response}); setError(''); setNotice('')
    } catch(e) {setError(e instanceof Error ? e.message : 'Invalid record URI.')}
  }
  async function share() {
    if(!target.uri)return
    const url=recordPermalink(window.location.origin,target.uri,target.response)
    setShareUrl(url)
    try { await navigator.clipboard.writeText(url); setNotice('Link copied. Anyone with access to this app can inspect the public record without signing in.') }
    catch { setNotice('Copy was unavailable. Select and copy the link below.') }
  }
  return <div className="lab-public-inspector">
    <header><p className="lab-eyebrow">THE WORK, NOT JUST THE POST</p><h1>An open record.<br /><em>A place to build on it.</em></h1><p>Inspect a contribution without an account. Bring another record alongside it, or add evidence with your own identity. Only the records you explicitly open are fetched—this is not an all-community index.</p></header>
    <form className="lab-record-open" onSubmit={e=>{e.preventDefault();open()}}><label className="lab-field">Open Lab AT URI<input value={input} onChange={e=>setInput(e.target.value)} maxLength={2048} placeholder="at://did:…/org.plresearch.lab.note/…" required /></label><button className="lab-button" type="submit">Read public record</button></form>
    {loading && <p role="status">Reading the author’s public record…</p>}{error && <p className="lab-record-alert" role="alert">{error}</p>}
    <div className={response ? 'lab-record-pair' : ''}>{record && <RecordBody record={record} />}{response && <div><p className="lab-record-compare-label">SUPPLIED FOR COMPARISON · NOT AN AUTOMATICALLY VERIFIED REPLY</p><RecordBody record={response} /></div>}</div>
    {record && <><div className="lab-record-actions">{onPropose && <button className="lab-button" type="button" onClick={()=>onPropose(record)}>Add evidence to this work</button>}<button className="lab-button lab-quiet" type="button" onClick={()=>void share()}>Copy this view’s link</button></div><p className="lab-record-disclaimer">Evidence is a proposal, not peer review or an accepted Atlas edit. Open Lab does not publish or send anything when you open this page.</p><form className="lab-record-compare" onSubmit={e=>{e.preventDefault();open(true)}}><h3>Put another contribution alongside it</h3><p>Paste a second author’s Open Lab record URI. Both identities and both records remain visible; you decide whether they address the same work.</p><label className="lab-field">Comparison record AT URI<input aria-label="Comparison record AT URI" maxLength={2048} value={replyInput} onChange={e=>setReplyInput(e.target.value)} required /></label><button className="lab-button lab-quiet" type="submit">Inspect together</button></form></>}
    {responseError && <p role="alert">{responseError}</p>}{notice && <p role="status">{notice}</p>}{shareUrl && <label className="lab-field">Shareable public-record view<input aria-label="Shareable public-record view" value={shareUrl} readOnly onFocus={e=>e.target.select()} /></label>}
    {!target.uri && !error && <div className="lab-record-empty"><h2>A record does not have to be featured to be readable.</h2><p>After publishing, Open Lab gives its author an exact record link. Paste its AT URI above to read the current version directly. A private deployment may still require access to the app itself.</p><a href="/lab/feed/">Explore work and draft a contribution →</a></div>}
  </div>
}
