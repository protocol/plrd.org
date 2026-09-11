'use client'
import { useState } from 'react'
import LabDialog from '@/components/lab/LabDialog'
import { useInventionBench } from '@/components/lab/feed/useInventionBench'
import ReturnResult from '@/components/lab/feed/ReturnResult'
import SourceResults from '@/components/lab/feed/SourceResults'
import InventionComposer from '@/components/lab/feed/InventionComposer'
import {InventionMediaPreview} from '@/components/lab/feed/InventionMediaEditor'
import RecordEditor from '@/components/lab/RecordEditor'
import { useDemoCommunity } from '@/components/lab/demo/DemoCommunityProvider'
import { useLabFollowing } from '@/components/lab/social/useLabFollowing'
import { LAB_SOCIAL_CHANGED } from '@/components/lab/social/useLabSocial'
import { DEMO_PEOPLE, DEMO_PROPOSALS, DEMO_THREADS, demoPointsRemaining, demoThreadHref } from '@/lib/lab-demo'
import { artifacts } from '@/lib/lab-data'
import { DISCIPLINES as fields } from '@/lib/lab-following'
import type { FeedRow } from '@/lib/lab-feed-model'
import styles from '@/components/lab/feed/feed.module.css'
export default function FeedDetail(props: { row: FeedRow; onClose: () => void }) {
  const bench=useInventionBench()
  return <Detail key={bench.scope} {...props}/>
}
function Detail({ row: originalRow, onClose }: { row: FeedRow; onClose: () => void }) {
  const demo = useDemoCommunity(), following = useLabFollowing(), bench = useInventionBench()
  const update=bench.ready?bench.state?.updates.find(u=>`invention:${u.id}`===originalRow.ideaId):undefined
  const row=update?{...originalRow,title:update.title,text:update.summary,artifactUrl:update.artifactUrl,request:update.request,artifact:update.artifactUrl?'Linked artifact':'Artifact not linked yet',stage:`${update.stage} · self-reported, not externally validated`}:originalRow
  const thread = DEMO_THREADS.find(t => t.id === row.threadId), proposal = DEMO_PROPOSALS.find(p => p.id === thread?.proposalId)
  const artifact = artifacts.find(a => a.id === row.artifactId)
  const [text, setText] = useState(''), [notice, setNotice] = useState(''), [editor, setEditor] = useState(false)
  const [tags, setTags] = useState(following.prefs.ideaTags[row.ideaId] ?? row.disciplines)
  const [returning,setReturning]=useState(false),[editingBuild,setEditingBuild]=useState(false)
  function takeTask(openResult=false){
    const result=bench.act({type:'take-task',task:{id:row.ideaId,sourceId:row.ideaId,title:row.title,request:row.request,artifact:row.artifact,artifactUrl:row.artifactUrl||''}})
    setNotice(result.ok?'Saved as a personal bench item. No reservation or notification was sent. Return an artifact or result in My bench.':result.error||'Not saved.')
    if(result.ok&&openResult)setReturning(true)
  }
  if (row.origin === 'demo' && !demo.isDemo) return null
  if(row.ideaId.startsWith('invention:')&&!update)return <LabDialog title="Build unavailable" onClose={onClose}><p role={bench.ready?'alert':'status'}>{bench.error||(bench.ready?'Unknown build in this identity’s bench. Nothing was changed.':'Restoring your build…')}</p></LabDialog>
  if(editingBuild&&update)return <InventionComposer updateId={update.id} onClose={()=>setEditingBuild(false)}/>
  if(returning)return <ReturnResult taskId={row.ideaId} scope={bench.scope} onClose={()=>setReturning(false)}/>
  if (editor) return <RecordEditor kind={row.draftSlot ? 'note' : 'contribution'} draftId={row.draftSlot} initial={artifact ? {targetUrl: artifact.url, field: artifact.field} : {}} onSaved={() => window.dispatchEvent(new Event(LAB_SOCIAL_CHANGED))} onClose={() => { setEditor(false); window.dispatchEvent(new Event(LAB_SOCIAL_CHANGED)) }} />
  return <LabDialog title={row.title} onClose={onClose}><div className={styles.detail}>
    <p className={styles.meta}>{row.origin === 'demo' ? 'Illustrative community story. Invented people and outcomes; not research evidence.' : row.origin === 'local' ? 'Your unpublished local idea. No public record has changed.' : `Editorial selection · ${artifact?.source}`}</p>
    <p><strong>{row.stage}</strong></p><p><strong>Artifact:</strong> {row.artifact}</p><p><strong>Bounded next step:</strong> {row.request}</p>
    <div className={styles.actions}><button className={styles.primary} disabled={!bench.ready} onClick={()=>takeTask()}>Save this test to My bench</button><button disabled={!bench.ready} onClick={()=>takeTask(true)}>Return a result →</button><a href="/lab/collaborate/">Browse other task recipes →</a>{update&&<button aria-label={`Edit build: ${row.title}`} onClick={()=>setEditingBuild(true)}>Edit build</button>}</div>
    <p className={styles.meta}>No matching run-packet recipe is registered for this test. Other recipes are separate tasks, not a packet for this build.</p>
    {update&&<InventionMediaPreview items={update.media||[]}/>}
    <SourceResults sourceId={row.ideaId} tasks={bench.ready?bench.state?.tasks||[]:[]}/>
    {proposal ? <><p>{proposal.hypothesis}</p><dl><dt>Useful contribution</dt><dd>{proposal.help}</dd><dt>Outcome and uncertainty</dt><dd>{proposal.outcome}</dd><dt>Stop condition</dt><dd>{proposal.stop}</dd></dl>
      <details><summary>Read the discussion and design revision</summary><ol className={styles.discussion}>{thread!.messages.map(m => <li key={m.id}><strong>{DEMO_PEOPLE.find(p => p.id === m.authorId)?.name}</strong><span className={styles.meta}> · {m.kind}</span><p>{m.text}</p></li>)}</ol><p>{proposal.revision}</p><a href={demoThreadHref(thread!.id)}>Stable discussion link →</a></details>
      <form onSubmit={e => { e.preventDefault(); const result = demo.act({ type: 'reply', threadId: thread!.id, text }); if (result.ok) { setText(''); setNotice('Saved in this browser as your demo contribution. Nothing was publicly posted.') } else setNotice(result.error || 'Not saved.') }}>
        <label>Your contribution<textarea aria-label="Your contribution" placeholder="Offer a bounded test, name a missing source, or challenge an assumption…" rows={3} required maxLength={2000} value={text} onChange={e => setText(e.target.value)} /></label>
        <button className={styles.primary} disabled={!text.trim()}>Save demo contribution</button>
      </form>
      {demo.state.replies.filter(r => r.threadId === thread!.id).map(r => <p className={styles.localNote} key={r.id}><strong>Your local demo note</strong><br />{r.text}</p>)}
      <details><summary>Signal interest with your demo point budget</summary><p>{demoPointsRemaining(demo.state)} points remaining. Not money, peer review, or impact certification.</p><div className={styles.actions}><button disabled={!demoPointsRemaining(demo.state)} onClick={() => demo.act({type:'allocate',proposalId:proposal.id,delta:1})}>Allocate 1 demo point</button><button disabled={!demo.state.allocations[proposal.id]} onClick={() => demo.act({type:'allocate',proposalId:proposal.id,delta:-1})}>Reclaim 1 point</button></div></details>
    </> : <><p>{row.text}</p>{artifact && <><p>{artifact.prompt}</p><div className={styles.actions}><a href={artifact.url} target="_blank" rel="noopener noreferrer">Open source ↗</a>{artifact.codeUrl && <a href={artifact.codeUrl} target="_blank" rel="noopener noreferrer">Source code ↗</a>}<a href="/lab/apps/">Useful tools →</a></div></>}
      {row.artifactUrl && !artifact && <a href={row.artifactUrl} target="_blank" rel="noopener noreferrer">Open artifact ↗</a>}
      {(artifact || row.draftSlot) && <button className={styles.primary} onClick={() => setEditor(true)}>{row.draftSlot ? 'Continue idea draft' : 'Draft an evidence contribution'}</button>}
    </>}
    <details><summary>Curate discipline tags locally</summary><p>Connect this idea to more than one discipline. Your tags shape your feed and saved views; they do not relabel a public source or publish a community taxonomy.</p><div className={styles.chips}>{fields.map(f => <button key={f.id} aria-pressed={tags.includes(f.id)} onClick={() => setTags(tags.includes(f.id) ? tags.filter(t => t !== f.id) : [...tags, f.id])}>{f.label}</button>)}</div><button onClick={() => { const result=following.act({type:'tag-idea',id:row.ideaId,disciplines:tags}); setNotice(result.ok ? 'Discipline tags saved locally for this idea.' : result.error || 'Not saved.') }}>Save idea tags</button></details>
    {notice && <p role="status">{notice}</p>}{(bench.error || following.error || demo.error) && <p role="alert">{bench.error || following.error || demo.error}</p>}
  </div></LabDialog>
}
