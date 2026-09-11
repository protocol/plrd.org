'use client'
import {useEffect,useRef,useState} from 'react'
import LabDialog from '@/components/lab/LabDialog'
import InventionMediaEditor from '@/components/lab/feed/InventionMediaEditor'
import {useInventionBench} from '@/components/lab/feed/useInventionBench'
import {DISCIPLINES} from '@/lib/lab-following'
import type {InventionUpdate} from '@/lib/lab-inventions'
import styles from '@/components/lab/feed/feed.module.css'
type Props={onClose:()=>void;updateId?:string;draftId?:string}
export default function InventionComposer({onClose,updateId,draftId}:Props){
 const bench=useInventionBench()
 const missing=bench.ready && ((updateId!==undefined&&!bench.state?.updates.some(u=>u.id===updateId))||(draftId!==undefined&&!bench.state?.drafts.some(u=>u.id===draftId)&&!bench.state?.updates.some(u=>u.id===draftId)))
 return bench.ready&&!missing?<Composer key={`${bench.scope}:${updateId??draftId??'new'}`} bench={bench} onClose={onClose} updateId={updateId} draftId={draftId}/>:<LabDialog title="What are you making?" onClose={onClose}><p role={bench.error||missing?'alert':'status'}>{bench.error||(missing?'Unknown build or draft in this identity’s bench. Nothing was changed.':'Restoring your scoped bench…')}</p></LabDialog>
}
function Composer({onClose,bench,updateId,draftId}:Props&{bench:ReturnType<typeof useInventionBench>}){
 const [notice,setNotice]=useState(''),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[discard,setDiscard]=useState(false)
 const [value,setValue]=useState<InventionUpdate>(()=>bench.state?.drafts.find(d=>updateId?d.id===updateId:draftId?d.id===draftId:!bench.state?.updates.some(u=>u.id===d.id))||bench.state?.updates.find(u=>u.id===updateId)||{id:crypto.randomUUID(),kind:'prototype',stage:'idea',title:'',summary:'',artifactUrl:'',request:'',disciplines:[]})
 const active=useRef(true),dirty=useRef(false)
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[])
 function change(next:InventionUpdate){if(!active.current)return;setValue(next);dirty.current=true;const r=bench.act({type:'save-draft',draft:next});if(r.ok)dirty.current=false;setNotice(r.ok?'Incomplete draft saved locally. Close and resume any time.':r.error||'Draft not saved.')}
 function close(){if(busy){setNotice('Wait for the local files to finish reading before closing.');return}if(dirty.current){const r=bench.act({type:'save-draft',draft:value});if(!r.ok){setNotice(r.error||'Draft not saved. Keep this editor open.');return}}onClose()}
 return <LabDialog title="What are you making?" onClose={close}><div className={styles.detail}>
 <p>Show a prototype, report a test, or ask someone to help build. An early idea is welcome—name what still needs to work.</p>
 <p className={styles.meta}>{bench.mode==='demo'?'Local demo build':'Your local build'} · text stays on this identity’s bench, not a public post.</p>
 <form onSubmit={e=>{e.preventDefault();if(!active.current||busy)return;const result=bench.act({type:'save-update',update:value,requireExisting:!!updateId});setNotice(result.ok?"Yay — this is a new beginning of infinity. Let's go explore it. Text saved locally on My bench, together with selected media and captions. Media is not stored on a server; nothing was uploaded.":result.error||'Not saved.');if(result.ok){dirty.current=false;setSaved(true)}}}>
 <fieldset disabled={saved}><legend>Workshop update</legend><label>Kind<select aria-label="Build kind" value={value.kind} onChange={e=>change({...value,kind:e.target.value as InventionUpdate['kind']})}><option value="prototype">Prototype</option><option value="test-result">Test result</option><option value="help-wanted">Help wanted</option></select></label>
 <label>Stage<select aria-label="Build stage" value={value.stage} onChange={e=>change({...value,stage:e.target.value as InventionUpdate['stage']})}><option value="idea">Idea — not built yet</option><option value="prototype">Prototype — unfinished</option><option value="working">Working — self-reported</option><option value="tested">Tested — describe conditions</option></select></label><p className={styles.meta}>Working is not tested; tested is not externally validated. No stage here certifies an invention.</p>
 <label>Build title<input aria-label="Build title" required maxLength={200} value={value.title} onChange={e=>change({...value,title:e.target.value})}/></label>
 <label>What it does / what happened<textarea aria-label="What it does" required rows={3} maxLength={4000} value={value.summary} onChange={e=>change({...value,summary:e.target.value})}/></label>
 <label>Artifact URL<input aria-label="Artifact URL" type="url" maxLength={2048} placeholder="https://… (code, notebook, demo, or evidence; optional)" value={value.artifactUrl} onChange={e=>change({...value,artifactUrl:e.target.value})}/></label>
 <label>Next useful request<textarea aria-label="Next useful request" required rows={2} maxLength={2000} placeholder="What can someone build, test, or improve? Include a stopping point." value={value.request} onChange={e=>change({...value,request:e.target.value})}/></label>
 <div className={styles.chips}>{DISCIPLINES.map(d=><button type="button" key={d.id} aria-pressed={value.disciplines.includes(d.id)} onClick={()=>change({...value,disciplines:value.disciplines.includes(d.id)?value.disciplines.filter(x=>x!==d.id):[...value.disciplines,d.id]})}>{d.label}</button>)}</div></fieldset>
 <InventionMediaEditor items={value.media||[]} onChange={media=>change({...value,media})} onBusy={setBusy} disabled={saved}/>
 <button className={styles.primary} disabled={!bench.ready||saved||busy}>Save build to My bench</button>{saved&&<a href="/lab/profile/">Open My bench →</a>}
 {!saved&&<button type="button" disabled={busy} onClick={()=>setDiscard(true)}>Discard this draft…</button>}
 {discard&&<section aria-label="Confirm selected draft discard"><p>Discard only the unfinished changes to “{value.title||'Untitled build'}”? Any saved build and every other draft remain.</p><button type="button" disabled={busy} onClick={()=>{if(!active.current)return;const r=bench.act({type:'discard-draft',id:value.id});if(r.ok){dirty.current=false;onClose()}else setNotice(r.error||'Draft was not discarded.')}}>Confirm discard this draft</button><button type="button" onClick={()=>setDiscard(false)}>Keep editing</button></section>}
 </form>{notice&&<p role="status">{notice}</p>}{bench.error&&<p role="alert">{bench.error}</p>}
 </div></LabDialog>
}
