'use client'
import {useEffect,useState} from 'react'
import {useInventionBench} from '@/components/lab/feed/useInventionBench'
import ReturnResult from '@/components/lab/feed/ReturnResult'
import SourceResults, {TaskResult} from '@/components/lab/feed/SourceResults'
import InventionComposer from '@/components/lab/feed/InventionComposer'
import {InventionMediaPreview} from '@/components/lab/feed/InventionMediaEditor'
import type {BenchTask} from '@/lib/lab-inventions'
import styles from '@/components/lab/feed/feed.module.css'
export default function InventionBench(){const bench=useInventionBench();return <Bench key={bench.scope}/>}
function Bench(){
 const bench=useInventionBench(),[task,setTask]=useState<BenchTask|null>(null),[edit,setEdit]=useState<string>(),[draft,setDraft]=useState<string>(),[queryError,setQueryError]=useState('')
 useEffect(()=>{
   const read=()=>{const p=new URLSearchParams(window.location.search);setQueryError(p.has('task')||p.has('taskId')?'Task query links are not supported here. Return from the original build or choose an exact saved task below; no task was selected or created.':'')}
   read();window.addEventListener('popstate',read);return()=>window.removeEventListener('popstate',read)
 },[])
 return <section className={`${styles.detail} ${styles.benchFollowing}`} aria-label="Personal invention bench"><h2>Builds &amp; tests on My bench</h2><p className={styles.meta}>{bench.mode==='demo'?'Local demo bench':'Your local bench'} · personal commitments, not task reservations or messages sent to anyone.</p>
 {!bench.ready?<p role="status">Loading your bench…</p>:<>
 {queryError&&<p role="alert">{queryError}</p>}
 {bench.state?.drafts.filter(d=>!bench.state?.updates.some(u=>u.id===d.id)).map(d=><article className={styles.benchTask} key={d.id}><h3>{d.title||'Untitled build'}</h3><p>Unfinished local draft</p><button aria-label={`Resume draft: ${d.title||'Untitled build'}`} onClick={()=>setDraft(d.id)}>Resume draft</button></article>)}
 {bench.state?.tasks.map(t=><article className={styles.benchTask} key={t.id}><h3>{t.title}</h3><p>{t.request}</p>{t.artifactUrl&&<a href={t.artifactUrl} target="_blank" rel="noopener noreferrer">Artifact / source ↗</a>}<TaskResult task={t}/><button onClick={()=>setTask(t)}>{t.result?'Revise result note':'Return a result'}</button></article>)}
 {!bench.state?.tasks.length&&<p>No personal tests yet. <a href="/lab/feed/">Choose a bounded test in the workshop →</a></p>}
 {bench.state?.updates.map(u=><article className={styles.benchTask} key={u.id}><h3>{u.title}</h3><p className={styles.meta}>{u.kind} · {u.stage} · self-reported, not externally validated</p><p>{u.summary}</p><p><strong>Next useful request:</strong> {u.request}</p>{u.artifactUrl&&<a href={u.artifactUrl} target="_blank" rel="noopener noreferrer">Artifact ↗</a>}<InventionMediaPreview items={u.media||[]}/><SourceResults sourceId={`invention:${u.id}`} tasks={bench.state?.tasks||[]}/><button aria-label={`Edit build: ${u.title}`} onClick={()=>setEdit(u.id)}>Edit build</button></article>)}
 {edit&&<InventionComposer updateId={edit} onClose={()=>setEdit(undefined)}/>}
 {draft&&<InventionComposer draftId={draft} onClose={()=>setDraft(undefined)}/>}
 </>}{bench.error&&<p role="alert">{bench.error}</p>}{task&&<ReturnResult key={task.id} taskId={task.id} scope={bench.scope} onClose={()=>setTask(null)}/>}</section>
}
