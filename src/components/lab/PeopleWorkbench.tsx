'use client'
import {useState} from 'react'
import BlueskyConnections from '@/components/lab/social/BlueskyConnections'
import {useDemoCommunity} from '@/components/lab/demo/DemoCommunityProvider'
import {DEMO_PEOPLE,type DemoPerson} from '@/lib/lab-demo'
import PersonDetail from '@/components/lab/feed/PersonDetail'
import styles from '@/components/lab/feed/feed.module.css'
export default function PeopleWorkbench(){
 const demo=useDemoCommunity(),[person,setPerson]=useState<DemoPerson|null>(null)
 return <div className={styles.root}><header><h1>Find someone to build with.</h1><p>Offer a second pair of hands, a different method, or an independent test.</p></header>
 <BlueskyConnections/>
 {demo.isDemo&&<section><h2>At the workshop benches</h2><div className={styles.peopleGrid}>{DEMO_PEOPLE.map(p=><button key={p.id} aria-label={`View ${p.name}’s profile`} onClick={()=>setPerson(p)}><span className={styles.avatar} aria-hidden="true">{p.initials}</span><span><strong>{p.name}</strong><small>{p.role}</small><p>{p.lookingFor}</p></span></button>)}</div></section>}
 {person&&demo.isDemo&&<PersonDetail person={person} onClose={()=>setPerson(null)}/>}
 </div>
}
