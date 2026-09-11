'use client'
import {useState} from 'react'
import type {BenchTask} from '@/lib/lab-inventions'
import styles from '@/components/lab/feed/feed.module.css'

export function TaskResult({task}:{task:BenchTask}) {
 if(!task.result)return null
 return <div className={styles.localNote}><strong>Self-reported: {task.result.outcome}</strong><p>{task.result.note}</p>{task.result.artifactUrl&&<a href={task.result.artifactUrl} target="_blank" rel="noopener noreferrer">Returned artifact ↗</a>}<p className={styles.meta}>A saved observation, not external validation.</p></div>
}
export default function SourceResults({sourceId,tasks}:{sourceId:string;tasks:BenchTask[]}) {
 const results=tasks.filter(t=>t.sourceId===sourceId&&t.result)
 const [expanded,setExpanded]=useState(false)
 if(!results.length)return null
 return <section aria-label="Results for this source"><h3>Results on this build / idea</h3>{results.map(t=><article key={t.id}><h4>{t.title}</h4><TaskResult task={t}/>{expanded&&<><p>Test as saved: {t.request}</p><p>Artifact: {t.artifact||'Not recorded on this older task'}</p>{t.artifactUrl&&<a href={t.artifactUrl} target="_blank" rel="noopener noreferrer">Original test artifact ↗</a>}</>}</article>)}<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Hide original test context':'Inspect original test context'}</button></section>
}
