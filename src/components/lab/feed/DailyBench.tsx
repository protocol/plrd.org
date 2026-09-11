'use client'
import { useState } from 'react'
import { useInventionBench } from '@/components/lab/feed/useInventionBench'
import ReturnResult from '@/components/lab/feed/ReturnResult'
import styles from '@/components/lab/feed/feed.module.css'

/** Reopen the stored task snapshot, never substitute a similarly named recipe. */
export default function DailyBench() {
  const bench = useInventionBench()
  const [returning, setReturning] = useState<{ scope: string; id: string } | null>(null)
  const tasks = bench.ready ? bench.state?.tasks.filter(task => !task.result) ?? [] : []
  if (!tasks.length && !bench.error) return null
  return <section className={styles.dailyBench} aria-label="Continue your work">
    <div><strong>On your bench</strong><a href="/lab/profile/">My bench →</a></div>
    {tasks.slice(0, 3).map(task => <div key={task.id} className={styles.dailyTask}><span><strong>{task.title}</strong><small>{task.request}</small></span><button aria-label={`Return a result: ${task.title}`} onClick={() => setReturning({ scope: bench.scope, id: task.id })}>Return a result →</button></div>)}
    {tasks.length > 3 && <a href="/lab/profile/">See all {tasks.length} saved tasks →</a>}
    {bench.error && <p role="alert" className={styles.error}>{bench.error}</p>}
    {returning && returning.scope === bench.scope && <ReturnResult key={`${returning.scope}:${returning.id}`} taskId={returning.id} scope={returning.scope} onClose={() => setReturning(null)} />}
  </section>
}
