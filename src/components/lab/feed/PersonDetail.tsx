'use client'
import LabDialog from '@/components/lab/LabDialog'
import { useDemoCommunity } from '@/components/lab/demo/DemoCommunityProvider'
import { useLabFollowing } from '@/components/lab/social/useLabFollowing'
import { DEMO_THREADS, demoThreadHref, type DemoPerson } from '@/lib/lab-demo'
import styles from '@/components/lab/feed/feed.module.css'
export default function PersonDetail({ person, onClose }: { person: DemoPerson; onClose: () => void }) {
  const demo = useDemoCommunity(), following = useLabFollowing()
  if (!demo.isDemo) return null
  const followed = following.prefs.people.includes(person.id)
  return <LabDialog title={person.name} onClose={onClose}><div className={styles.detail}>
    <p className={styles.meta}>Fictional inventor-inspired persona · local demo. Not this historical person’s statements, endorsement, or actual account.</p>
    <h3>{person.role}</h3><p>{person.bio}</p><h3>Looking for</h3><p>{person.lookingFor}</p>
    <button className={styles.primary} disabled={!following.ready} aria-pressed={followed} onClick={() => following.act({ type: 'toggle', kind: 'people', id: person.id })}>{followed ? 'Following in demo' : 'Follow in demo'}</button>
    <p className={styles.meta}>A bookmark in this browser, not a public Bluesky follow or a message to this person.</p>
    <h3>Ideas on their bench</h3><ul>{DEMO_THREADS.filter(t => person.caseIds.includes(t.caseId)).map(t => <li key={t.id}><a href={demoThreadHref(t.id)}>{t.title} →</a></li>)}</ul>
    {following.error && <p role="alert">{following.error}</p>}
  </div></LabDialog>
}
