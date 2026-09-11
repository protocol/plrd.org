'use client'
import {useEffect,useRef,useState} from 'react'
import LabDialog from '@/components/lab/LabDialog'
import {useInventionBench} from '@/components/lab/feed/useInventionBench'
import type {BenchResult,BenchTask} from '@/lib/lab-inventions'
import styles from '@/components/lab/feed/feed.module.css'

// One context-carrying drawer, used by both the originating detail and My bench.
// It resolves an exact ID from the current scoped store, never from query text or title.
export default function ReturnResult({taskId,scope,onClose}:{taskId:string;scope:string;onClose:()=>void}) {
 const bench=useInventionBench()
 const task=bench.ready&&bench.scope===scope?bench.state?.tasks.find(t=>t.id===taskId):undefined
 if(!task)return <LabDialog title="Return a result" onClose={onClose}><p role={bench.ready||bench.error?'alert':'status'}>{bench.error||(bench.ready?'Unknown task or changed identity. Reopen the exact task from your bench; nothing was saved.':'Restoring this identity’s task…')}</p></LabDialog>
 return <Editor key={`${scope}:${taskId}`} task={task} bench={bench} onClose={onClose}/>
}
function Editor({task,bench,onClose}:{task:BenchTask;bench:ReturnType<typeof useInventionBench>;onClose:()=>void}) {
 const [result,setResult]=useState<BenchResult>(task.result||{note:'',artifactUrl:'',outcome:'uncertain'}),[error,setError]=useState('')
 const active=useRef(true)
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[])
 return <LabDialog title={`Return a result: ${task.title}`} onClose={onClose}><form className={styles.detail} onSubmit={e=>{e.preventDefault();if(!active.current)return;const saved=bench.act({type:'return-result',id:task.id,result});if(saved.ok)onClose();else setError(saved.error||'Not saved.')}}>
 <p>{task.request}</p><p><strong>Artifact:</strong> {task.artifact||'Not recorded on this older task'}</p>{task.artifactUrl&&<a href={task.artifactUrl} target="_blank" rel="noopener noreferrer">Original task artifact ↗</a>}
 {!task.sourceId&&<p className={styles.meta}>This older task has no recorded source association. Its result stays on this task; no build or idea will be guessed from its title.</p>}
 <p>Keep the conditions, the failure, and the artifact someone can inspect. This updates only your personal bench.</p>
 <label>Result note<textarea aria-label="Result note" rows={4} required maxLength={4000} value={result.note} onChange={e=>setResult({...result,note:e.target.value})}/></label>
 <label>Result artifact URL<input aria-label="Result artifact URL" type="url" placeholder="https://… (optional)" maxLength={2048} value={result.artifactUrl} onChange={e=>setResult({...result,artifactUrl:e.target.value})}/></label>
 <div className={styles.chips}>{(['worked','did-not-work','uncertain'] as const).map(o=><button type="button" key={o} aria-label={`Outcome: ${o}`} aria-pressed={result.outcome===o} onClick={()=>setResult({...result,outcome:o})}>{o}</button>)}</div>
 <p className={styles.meta}>“Worked” means your reported test, not reproducibility or scientific validation.</p><button className={styles.primary} disabled={!bench.ready}>Save result to My bench</button>{error&&<p role="alert">{error}</p>}</form></LabDialog>
}
