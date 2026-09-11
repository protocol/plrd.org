'use client'
import { useEffect, useRef, useState } from 'react'
import { useLabFollowing } from '@/components/lab/social/useLabFollowing'
import { useLabSocial } from '@/components/lab/social/useLabSocial'
import { useDemoCommunity } from '@/components/lab/demo/DemoCommunityProvider'
import { useInventionBench } from '@/components/lab/feed/useInventionBench'
import PersonDetail from '@/components/lab/feed/PersonDetail'
import FeedDetail from '@/components/lab/feed/FeedDetail'
import { buildFeedRows, filterFeedRows, CASE_DISCIPLINES, type FeedRow } from '@/lib/lab-feed-model'
import { DISCIPLINES as fields } from '@/lib/lab-following'
import { DEMO_PEOPLE, emptyDemoState, type DemoPerson } from '@/lib/lab-demo'
import styles from '@/components/lab/feed/feed.module.css'
import curationStyles from '@/components/lab/feed/curation.module.css'
import LabDialog from '@/components/lab/LabDialog'
import { usePublicFollowing } from '@/components/lab/feed/usePublicFollowing'
import PublicRecordRow from '@/components/lab/feed/PublicRecordRow'
import PublicFollowingStatus from '@/components/lab/feed/PublicFollowingStatus'
export default function MixedScienceFeed() {
  const following = useLabFollowing()
  return <ScienceFeed key={following.scope} />
}
function ScienceFeed() {
  const demo = useDemoCommunity(), following = useLabFollowing(), local = useLabSocial(following.owner)
  const [query, setQuery] = useState(''), [name, setName] = useState(''), [notice, setNotice] = useState('')
  const refinement = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const readSearch = () => {
      const value = (new URLSearchParams(window.location.search).get('q') || '').slice(0, 200)
      setQuery(value); if (refinement.current) refinement.current.open = Boolean(value)
    }
    readSearch(); window.addEventListener('popstate', readSearch)
    return () => window.removeEventListener('popstate', readSearch)
  }, [])
  const [curationOpen, setCurationOpen] = useState(false)
  const [selected, setSelected] = useState<FeedRow | null>(null), [person, setPerson] = useState<DemoPerson | null>(null)
  const bench=useInventionBench()
  const { prefs } = following
  const publicFeed = usePublicFollowing(following)
  const rows = buildFeedRows({ isDemo: demo.isDemo, demo: following.ready ? demo.state : emptyDemoState(), drafts: following.ready ? local.drafts : [], updates: following.ready ? bench.state?.updates : [], publicRecords: publicFeed.records })
  const filtered = filterFeedRows(rows, prefs, query)
  const chooseDiscipline = (id: string) => following.act({ type: 'filter', feed: prefs.filter.feed, disciplines: prefs.filter.disciplines.includes(id) ? prefs.filter.disciplines.filter(v => v !== id) : [...prefs.filter.disciplines, id] })
  const reset = () => { setQuery(''); if (refinement.current) refinement.current.open = false; following.act({ type: 'filter', feed: 'discover', disciplines: [] }) }
  const suggestions = DEMO_PEOPLE.filter(p => !prefs.people.includes(p.id) && (!prefs.filter.disciplines.length || p.caseIds.some(c => CASE_DISCIPLINES[c].some(t => prefs.filter.disciplines.includes(t))))).slice(0, 3)
  const curation = (
    <aside className={`${styles.context} ${curationOpen ? curationStyles.drawer : curationStyles.desktop}`} aria-label="Curate your science feed">
      {!demo.isDemo && <section><h2>People you follow locally</h2><p>Real-account subscriptions for this identity and browser. No native Bluesky follow is changed.</p><a href="/lab/people/">Find a public profile →</a>{prefs.people.length ? <ul className={styles.followList}>{prefs.people.map(did => <li key={did}><span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{did}</span><button disabled={!following.ready} aria-label={`Unfollow person: ${did}`} onClick={() => following.act({ type: 'toggle', kind: 'people', id: did })}>Unfollow</button></li>)}</ul> : <p>No local person subscriptions yet.</p>}</section>}
      <section><h2>Your branches</h2><p>Choose more than one branch of the tech tree. A shared method can connect distant fields.</p><ul className={styles.followList}>{fields.map(f=><li key={f.id}><span>{f.label}</span><button aria-label={`${prefs.disciplines.includes(f.id)?'Unfollow':'Follow'} branch: ${f.label}`} aria-pressed={prefs.disciplines.includes(f.id)} disabled={!following.ready} onClick={()=>following.act({type:'toggle',kind:'disciplines',id:f.id})}>{prefs.disciplines.includes(f.id)?'Following':'+ Follow'}</button></li>)}</ul><button disabled={!following.ready || !prefs.disciplines.length} onClick={()=>following.act({type:'filter',feed:'discover',disciplines:prefs.disciplines})}>Use followed branches as filters</button></section>
      <section><h2>Curated views</h2><p>Views save your selected branch filters, not the branches you follow or your search text. They stay in this browser.</p><form onSubmit={e=>{e.preventDefault();const result=following.act({type:'save-view',name:name.trim(),disciplines:prefs.filter.disciplines});setNotice(result.ok?'View saved in this browser.':result.error||'Not saved.');if(result.ok)setName('')}}><label>Name this view<input aria-label="Name this view" placeholder="e.g. Minds × methods" maxLength={60} value={name} onChange={e=>setName(e.target.value)} /></label><button disabled={!following.ready||!name.trim()||!prefs.filter.disciplines.length}>Save view</button></form><ul className={styles.views}>{prefs.views.map(v=><li key={v.name}><button onClick={()=>following.act({type:'filter',feed:'discover',disciplines:v.disciplines})}>{v.name} <small>{v.disciplines.length} branches</small></button><button aria-label={`Remove view ${v.name}`} onClick={()=>following.act({type:'remove-view',name:v.name})}>×</button></li>)}</ul>{notice&&<p role="status">{notice}</p>}</section>
      {!curationOpen && demo.isDemo && suggestions.length>0 && <section><h2>People around these ideas</h2>{suggestions.map(p=><button className={styles.personSuggestion} key={p.id} aria-label={`View ${p.name}’s profile`} onClick={()=>setPerson(p)}><strong>{p.name}</strong><span>{p.lookingFor}</span></button>)}<a href="/lab/people/">Find people →</a></section>}
      <section><h2>Make curation useful</h2><p>Open an idea to add tech-tree branch tags or name a missing source. Cross-field readers can challenge the test before a result travels.</p><a href="/lab/collaborate/">Take a bounded task →</a><p className={styles.meta}>Views and tags are local until a public curation protocol exists. No cross-device sync.</p></section>
    </aside>
  )
  return <div className={styles.layout}>
    <section className={styles.stream} aria-label="Mixed science feed">
      <div className={styles.toolbar}><div className={styles.tabs} aria-label="Feed audience">{(['discover','following'] as const).map(view => <button key={view} disabled={!following.ready} aria-pressed={prefs.filter.feed===view} onClick={() => following.act({type:'filter',feed:view,disciplines:prefs.filter.disciplines})}>{view==='discover'?'Discover':'Following'}</button>)}</div><button className={curationStyles.trigger} aria-label="Curate the feed" onClick={()=>setCurationOpen(true)}>Curate</button><a href="/lab/profile/">My bench →</a></div>
      <details ref={refinement} className={styles.refinement}><summary aria-label="Refine the feed">{prefs.filter.disciplines.length ? `${prefs.filter.disciplines.length} branches selected` : "All branches"}<span>Refine feed</span></summary>
      <label className={styles.search}>Search the feed<input type="search" aria-label="Search the feed" placeholder="A question, tool, or useful request…" value={query} onChange={e=>setQuery(e.target.value)} /></label>
      <div className={styles.chips} aria-label="Filter by branches">{fields.map(f => <button key={f.id} disabled={!following.ready} aria-label={`Branch: ${f.label}`} aria-pressed={prefs.filter.disciplines.includes(f.id)} onClick={()=>chooseDiscipline(f.id)}>{f.label}</button>)}</div>
      </details>
      <div className={styles.feedSummary}><span role="status">{filtered.length} activities{prefs.filter.disciplines.length > 1 ? ' · matching any selected branch' : ''}</span><button onClick={reset}>Reset filters</button></div>
      {prefs.filter.feed==='following' && <p className={styles.meta}>Ideas, people, or tech-tree branches you follow, combined without repeats. Follows stay in this browser.</p>}
      {(following.error || local.error) && <p role="alert" className={styles.error}>{following.error || local.error}</p>}
      {publicFeed.error && <p role="alert" className={styles.error}>{publicFeed.error}</p>}
      <PublicFollowingStatus feed={publicFeed} />
      {!following.ready && <p role="status">Restoring your identity; samples are available while personal controls wait.</p>}{filtered.map(row => {
        if (row.publicRecord) return <PublicRecordRow key={row.id} record={row.publicRecord} />
        const author = DEMO_PEOPLE.find(p=>p.id===row.authorId), followed=prefs.ideas.includes(row.ideaId)
        const tags=prefs.ideaTags[row.ideaId]??row.disciplines
        return <article className={styles.row} key={row.id} data-feed-row={row.id}>
          <div className={styles.rowMeta}>{author ? <button aria-label={`View ${author.name}’s profile`} onClick={()=>setPerson(author)}><span className={styles.avatar} aria-hidden="true">{author.initials}</span>{author.name}</button> : <span>{row.author}</span>}<span>{row.kind}</span>{row.origin==='editorial'&&<span>Editorial</span>}</div>
          <h2><button aria-label={`Open details: ${row.title}`} onClick={()=>setSelected(row)}>{row.title}</button></h2>
          <p>{row.text}</p><p className={styles.meta}>{row.stage}</p><p className={styles.artifactLine}><strong>Artifact:</strong> {row.artifact}</p><p className={styles.request}><strong>Next:</strong> {row.request}</p>
          <div className={styles.tags}>{tags.map(t=><button key={t} onClick={()=>chooseDiscipline(t)}>{fields.find(f=>f.id===t)?.label||t}</button>)}{tags.length>1&&<span>Cross-disciplinary</span>}</div>
          <div className={styles.actions}><button aria-label={`${followed?'Unfollow':'Follow'} idea: ${row.title}`} aria-pressed={followed} disabled={!following.ready} onClick={()=>following.act({type:'toggle',kind:'ideas',id:row.ideaId})}>{followed?'Following idea':'Follow idea'}</button><button className={styles.contribute} aria-label={`Contribute: ${row.title}`} onClick={()=>setSelected(row)}>{row.action} →</button></div>
        </article>
      })}
      {following.ready && !filtered.length && <div className={styles.empty}><h2>No builds in this view yet.</h2><p>{prefs.filter.feed==='following'?'Follow an idea, person, or branch in Discover to start your own feed.':'There are no samples matching these branches and this search. Try another view or bring a first idea.'}</p><button className={styles.primary} onClick={reset}>Reset filters</button></div>}
    </section>
    {curationOpen ? <LabDialog title="Curate your feed" onClose={()=>setCurationOpen(false)}>{curation}</LabDialog> : curation}
    {selected&&<FeedDetail key={selected.id} row={selected} onClose={()=>setSelected(null)} />}{person&&<PersonDetail person={person} onClose={()=>setPerson(null)} />}
  </div>
}
