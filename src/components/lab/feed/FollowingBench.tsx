'use client'
import {useState} from 'react'
import {useLabFollowing} from '@/components/lab/social/useLabFollowing'
import {useDemoCommunity} from '@/components/lab/demo/DemoCommunityProvider'
import {useInventionBench} from '@/components/lab/feed/useInventionBench'
import {useLabSocial} from '@/components/lab/social/useLabSocial'
import {DISCIPLINES} from '@/lib/lab-following'
import {DEMO_PEOPLE,type DemoPerson} from '@/lib/lab-demo'
import {buildFeedRows} from '@/lib/lab-feed-model'
import PersonDetail from '@/components/lab/feed/PersonDetail'
import FeedDetail from '@/components/lab/feed/FeedDetail'
import type {FeedRow} from '@/lib/lab-feed-model'
import styles from '@/components/lab/feed/feed.module.css'
export default function FollowingBench(){const f=useLabFollowing();return <Following key={f.scope}/>}
function Following(){
 const f=useLabFollowing(),demo=useDemoCommunity(),bench=useInventionBench(),local=useLabSocial(f.owner)
 const [person,setPerson]=useState<DemoPerson|null>(null),[idea,setIdea]=useState<FeedRow|null>(null)
 const rows=buildFeedRows({isDemo:demo.isDemo,demo:demo.state,drafts:local.drafts,updates:bench.state?.updates})
 return <section className={`${styles.detail} ${styles.benchFollowing}`} aria-label="Your local follows"><h2>Your workshop follows</h2><p className={styles.meta}>{f.mode==='demo'?'Local demo follows':'Local follows for this identity'} · no cross-device sync; not public subscriptions or peer review.</p>
 <h3>Followed branches</h3><ul>{f.prefs.disciplines.map(id=><li key={id}><span>{DISCIPLINES.find(d=>d.id===id)?.label||id}</span><button onClick={()=>f.act({type:'toggle',kind:'disciplines',id})}>Unfollow branch</button></li>)}</ul>{!f.prefs.disciplines.length&&<p>No branches followed yet.</p>}
 <h3>Followed ideas</h3><ul>{f.prefs.ideas.map(id=>{const row=rows.find(r=>r.ideaId===id);return <li key={id}>{row?<button onClick={()=>setIdea(row)}>{row.title}</button>:<span>{id}</span>}<button aria-label={`Unfollow idea ${id}`} onClick={()=>f.act({type:'toggle',kind:'ideas',id})}>Unfollow</button></li>})}</ul>{!f.prefs.ideas.length&&<p>No ideas followed yet.</p>}
 <h3>Followed people</h3><ul>{f.prefs.people.map(id=>{const p=demo.isDemo?DEMO_PEOPLE.find(p=>p.id===id):undefined;return <li key={id}>{p?<button onClick={()=>setPerson(p)}>{p.name}</button>:<span>{id}</span>}<button aria-label={`Unfollow person ${id}`} onClick={()=>f.act({type:'toggle',kind:'people',id})}>Unfollow locally</button></li>})}</ul>{!f.prefs.people.length&&<p>No local people follows yet.</p>}
 <div className={styles.actions}><a href="/lab/feed/">Curate your feed →</a><a href="/lab/people/">Find collaborators →</a><a href="/lab/onboarding/#profile-completion">Edit profile links →</a></div>
 {f.error&&<p role="alert">{f.error}</p>}{person&&<PersonDetail person={person} onClose={()=>setPerson(null)}/>} {idea&&<FeedDetail row={idea} onClose={()=>setIdea(null)}/>}
 </section>
}
