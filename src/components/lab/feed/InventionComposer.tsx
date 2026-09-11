'use client'
import {useState} from 'react'
import LabDialog from '@/components/lab/LabDialog'
import MediaPicker from '@/components/lab/feed/MediaPicker'
import {useInventionBench} from '@/components/lab/feed/useInventionBench'
import {DISCIPLINES} from '@/lib/lab-following'
import type {InventionUpdate} from '@/lib/lab-inventions'
import styles from '@/components/lab/feed/feed.module.css'
export default function InventionComposer({onClose}:{onClose:()=>void}){const bench=useInventionBench();return <Composer key={bench.scope} onClose={onClose}/>}
function Composer({onClose}:{onClose:()=>void}){
 const bench=useInventionBench(),[notice,setNotice]=useState(''),[saved,setSaved]=useState(false)
 const [value,setValue]=useState<Omit<InventionUpdate,'id'>>({kind:'prototype',stage:'idea',title:'',summary:'',artifactUrl:'',request:'',disciplines:[]})
 return <LabDialog title="What are you making?" onClose={onClose}><div className={styles.detail}>
 <p>Show a prototype, report a test, or ask someone to help build. An early idea is welcome—name what still needs to work.</p>
 <p className={styles.meta}>{bench.mode==='demo'?'Local demo build':'Your local build'} · text stays on this identity’s bench, not a public post.</p>
 <form onSubmit={e=>{e.preventDefault();const result=bench.act({type:'save-update',update:{...value,id:crypto.randomUUID()}});setNotice(result.ok?'Text saved locally on My bench. Media is not saved; keep originals or download captions.':result.error||'Not saved.');if(result.ok)setSaved(true)}}>
 <fieldset disabled={saved}><legend>Workshop update</legend><label>Kind<select aria-label="Build kind" value={value.kind} onChange={e=>setValue({...value,kind:e.target.value as InventionUpdate['kind']})}><option value="prototype">Prototype</option><option value="test-result">Test result</option><option value="help-wanted">Help wanted</option></select></label>
 <label>Stage<select aria-label="Build stage" value={value.stage} onChange={e=>setValue({...value,stage:e.target.value as InventionUpdate['stage']})}><option value="idea">Idea — not built yet</option><option value="prototype">Prototype — unfinished</option><option value="working">Working — self-reported</option><option value="tested">Tested — describe conditions</option></select></label><p className={styles.meta}>Working is not tested; tested is not externally validated. No stage here certifies an invention.</p>
 <label>Build title<input aria-label="Build title" required maxLength={200} value={value.title} onChange={e=>setValue({...value,title:e.target.value})}/></label>
 <label>What it does / what happened<textarea aria-label="What it does" required rows={3} maxLength={4000} value={value.summary} onChange={e=>setValue({...value,summary:e.target.value})}/></label>
 <label>Artifact URL<input aria-label="Artifact URL" type="url" maxLength={2048} placeholder="https://… (code, notebook, demo, or evidence; optional)" value={value.artifactUrl} onChange={e=>setValue({...value,artifactUrl:e.target.value})}/></label>
 <label>Next useful request<textarea aria-label="Next useful request" required rows={2} maxLength={2000} placeholder="What can someone build, test, or improve? Include a stopping point." value={value.request} onChange={e=>setValue({...value,request:e.target.value})}/></label>
 <div className={styles.chips}>{DISCIPLINES.map(d=><button type="button" key={d.id} aria-pressed={value.disciplines.includes(d.id)} onClick={()=>setValue({...value,disciplines:value.disciplines.includes(d.id)?value.disciplines.filter(x=>x!==d.id):[...value.disciplines,d.id]})}>{d.label}</button>)}</div></fieldset>
 <MediaPicker scope={bench.scope}/>
 <button className={styles.primary} disabled={!bench.ready||saved}>Save build to My bench</button>{saved&&<a href="/lab/profile/">Open My bench →</a>}
 </form>{notice&&<p role="status">{notice}</p>}{bench.error&&<p role="alert">{bench.error}</p>}
 </div></LabDialog>
}
