'use client'
import {useState} from 'react'
import {useInventionBench} from '@/components/lab/feed/useInventionBench'
import LabDialog from '@/components/lab/LabDialog'
import type {BenchResult,BenchTask} from '@/lib/lab-inventions'
import styles from '@/components/lab/feed/feed.module.css'
export default function InventionBench(){const bench=useInventionBench();return <Bench key={bench.scope}/>}
function Bench(){
 const bench=useInventionBench(),[task,setTask]=useState<BenchTask|null>(null)
 return <section className={`${styles.detail} ${styles.benchFollowing}`} aria-label="Personal invention bench"><h2>Builds &amp; tests on My bench</h2><p className={styles.meta}>{bench.mode==='demo'?'Local demo bench':'Your local bench'} · personal commitments, not task reservations or messages sent to anyone.</p>
 {!bench.ready?<p role="status">Loading your bench…</p>:<>
 {bench.state?.tasks.map(t=><article className={styles.benchTask} key={t.id}><h3>{t.title}</h3><p>{t.request}</p>{t.artifactUrl&&<a href={t.artifactUrl} target="_blank" rel="noopener noreferrer">Artifact / source ↗</a>}{t.result&&<div className={styles.localNote}><strong>Self-reported: {t.result.outcome}</strong><p>{t.result.note}</p>{t.result.artifactUrl&&<a href={t.result.artifactUrl} target="_blank" rel="noopener noreferrer">Returned artifact ↗</a>}<p className={styles.meta}>A saved observation, not external validation.</p></div>}<button onClick={()=>setTask(t)}>{t.result?'Revise result note':'Return a result'}</button></article>)}
 {!bench.state?.tasks.length&&<p>No personal tests yet. <a href="/lab/feed/">Choose a bounded test in the workshop →</a></p>}
 {bench.state?.updates.map(u=><article className={styles.benchTask} key={u.id}><h3>{u.title}</h3><p className={styles.meta}>{u.kind} · {u.stage} · self-reported, not externally validated</p><p>{u.summary}</p><p><strong>Next useful request:</strong> {u.request}</p>{u.artifactUrl&&<a href={u.artifactUrl} target="_blank" rel="noopener noreferrer">Artifact ↗</a>}</article>)}
 </>}{bench.error&&<p role="alert">{bench.error}</p>}{task&&<ReturnResult key={task.id} task={task} onClose={()=>setTask(null)}/>}</section>
}
function ReturnResult({task,onClose}:{task:BenchTask;onClose:()=>void}){
 const bench=useInventionBench(),[result,setResult]=useState<BenchResult>(task.result||{note:'',artifactUrl:'',outcome:'uncertain'}),[error,setError]=useState('')
 return <LabDialog title={`Return a result: ${task.title}`} onClose={onClose}><form className={styles.detail} onSubmit={e=>{e.preventDefault();const saved=bench.act({type:'return-result',id:task.id,result});if(saved.ok)onClose();else setError(saved.error||'Not saved.')}}><p>{task.request}</p><p>Keep the conditions, the failure, and the artifact someone can inspect. This updates only your personal bench.</p><label>Result note<textarea aria-label="Result note" rows={4} required maxLength={4000} value={result.note} onChange={e=>setResult({...result,note:e.target.value})}/></label><label>Result artifact URL<input aria-label="Result artifact URL" type="url" placeholder="https://… (optional)" maxLength={2048} value={result.artifactUrl} onChange={e=>setResult({...result,artifactUrl:e.target.value})}/></label><div className={styles.chips}>{(['worked','did-not-work','uncertain'] as const).map(o=><button type="button" key={o} aria-label={`Outcome: ${o}`} aria-pressed={result.outcome===o} onClick={()=>setResult({...result,outcome:o})}>{o}</button>)}</div><p className={styles.meta}>“Worked” means your reported test, not reproducibility or scientific validation.</p><button className={styles.primary} disabled={!bench.ready}>Save result to My bench</button>{error&&<p role="alert">{error}</p>}</form></LabDialog>
}
