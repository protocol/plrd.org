'use client'
import { useEffect, useRef, useState } from 'react'
import { useInventionBench } from '@/components/lab/feed/useInventionBench'
import { loadBench } from '@/lib/lab-inventions'
import { createWorkHandoff, formatWorkHandoff, type WorkDestination } from '@/lib/lab-work-handoff'
import { safeAppUrl } from '@/lib/lab-app-catalog'
import type { FeedRow } from '@/lib/lab-feed-model'
import styles from '@/components/lab/WorkHandoff.module.css'
export default function WorkHandoff({ row, onTake }: { row: FeedRow; onTake: (openResult?: boolean) => void }) {
  const bench = useInventionBench()
  return <Handoff key={`${bench.scope}:${row.ideaId}`} row={row} onTake={onTake} bench={bench} />
}
function Handoff({ row, onTake, bench }: { row: FeedRow; onTake: (openResult?: boolean) => void; bench: ReturnType<typeof useInventionBench> }) {
  const [destination, setDestination] = useState<WorkDestination>('here'), [githubUrl, setGithubUrl] = useState(''), [notice, setNotice] = useState(''), [error, setError] = useState('')
  const active = useRef(true)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const savedTask = bench.state?.tasks.find(t => t.id === row.ideaId)
  let preview = '', previewError = ''
  try { preview = formatWorkHandoff(createWorkHandoff({ row, destination, mode: bench.mode, githubUrl: destination === 'github' ? githubUrl : '', savedTask })) }
  catch (error) { previewError = error instanceof Error ? error.message : 'Brief unavailable.' }
  function prepare() {
    if (!bench.ready || bench.error) throw Error(bench.error || 'Wait for this identity’s bench to load.')
    // Re-read at the click, not from an older render. Existing snapshots/results win.
    const latest = loadBench(window.localStorage, bench.owner, bench.mode)
    if (latest.error) throw Error(latest.error)
    const packet = createWorkHandoff({ row, destination, mode: bench.mode, githubUrl: destination === 'github' ? githubUrl : '', savedTask: latest.state.tasks.find(t => t.id === row.ideaId) })
    const saved = bench.act({ type: 'take-task', task: packet.task })
    if (!saved.ok) throw Error(saved.error || 'The exact task could not be saved. No brief was exported.')
    return formatWorkHandoff(packet)
  }
  async function copy() {
    setError(''); setNotice('')
    try { const text = prepare(); if (!navigator.clipboard?.writeText) throw Error('Clipboard is unavailable. Use Download brief or select the brief text below. The task remains on My bench.'); await navigator.clipboard.writeText(text); if (active.current) setNotice('Brief copied; the exact task is on My bench. Nothing was sent or run.') }
    catch (error) { if (active.current) setError(error instanceof Error ? error.message : 'Copy failed. Use Download brief or select the text below.') }
  }
  function download() {
    setError(''); setNotice(''); let url: string | undefined
    try {
      const text = prepare(); url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
      const a = document.createElement('a'); a.href = url; a.download = 'open-lab-work-brief.txt'; document.body.append(a); a.click(); a.remove()
      setNotice('Brief download requested; the exact task is on My bench. No GitHub issue, PR, or agent was created.')
    } catch (error) { setError(error instanceof Error ? error.message : 'Download failed. Select the brief text below.') }
    finally { if (url) { const used = url; setTimeout(() => URL.revokeObjectURL(used),1000) } }
  }
  return <section className={styles.handoff} data-work-handoff aria-label="Work on this exact task">
    <div className={styles.heading}><h3>Choose where to work</h3><span>Same task. Your tools.</span></div>
    <div className={styles.destinations} aria-label="Work destination">{([['here','Work here'],['github','Work on GitHub'],['agent','Use my agent']] as const).map(([id,label]) => <button type="button" key={id} aria-pressed={destination === id} onClick={() => { setDestination(id); setError(''); setNotice('') }}>{label}</button>)}</div>
    {destination === 'here' ? <p>Keep the focused next step on My bench, then return a result, failure, or evidence link to this same source.</p> : destination === 'github' ? <div className={styles.external}>
      <p>Copy the task into your own repository workflow. Open Lab does not create issues or PRs, check access, or sync status.</p>
      <label>GitHub destination URL <span>(optional; chosen by you)</span><input aria-label="GitHub destination URL" type="url" maxLength={2048} placeholder="https://github.com/owner/repo/issues/123" value={githubUrl} onChange={e => { setGithubUrl(e.target.value); setError('') }} /></label>
      {githubUrl && safeAppUrl(githubUrl,true) && <a href={githubUrl} target="_blank" rel="noopener noreferrer">Open your selected GitHub destination ↗</a>}
    </div> : <p>Give the brief to your own agent after reviewing its sources and limits. This is a manual handoff, not an integration; Open Lab cannot launch, observe, or authorize the agent.</p>}
    <div className={styles.actions}><button className={styles.primary} disabled={!bench.ready || !!bench.error} onClick={() => onTake()}>Save this test to My bench</button><button disabled={!bench.ready || !!bench.error} onClick={() => onTake(true)}>Return a result →</button></div>
    {savedTask && <p className={styles.note}>Already on My bench. Exports keep that saved task snapshot and do not overwrite its result.{savedTask.request !== row.request && ' The source has changed since you saved it; the original goal remains in the brief.'}</p>}
    <div className={styles.export}><button disabled={!bench.ready || !!bench.error || !!previewError} onClick={copy}>Copy brief</button><button disabled={!bench.ready || !!bench.error || !!previewError} onClick={download}>Download brief</button><a href="/lab/profile/">My bench →</a></div>
    <details><summary>Inspect the source-bound brief</summary><textarea aria-label="Source-bound work brief" readOnly rows={14} value={preview} onFocus={e => e.currentTarget.select()} /></details>
    <p className={styles.note}>Local to this browser, identity, and {bench.mode === 'demo' ? 'Demo mode' : 'live mode'}. Export saves the exact task first; returning is manual and self-reported.</p>
    <a className={styles.other} href="/lab/collaborate/">Browse other task recipes →</a>
    <p className={styles.note}>Those recipes are separate tasks. This brief above is for this source only.</p>
    {notice && <p role="status">{notice}</p>}{(error || previewError || bench.error) && <p role="alert">{error || previewError || bench.error}</p>}
  </section>
}
