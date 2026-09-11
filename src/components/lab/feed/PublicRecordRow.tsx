'use client'
import { displayRecord, presentPdsRecord } from '@/lib/lab-record-display'
import { labInspectorHref } from '@/lib/lab-notebook'
import type { LabRecordView } from '@/lib/lab-protocol'
import { useLabFollowing } from '@/components/lab/social/useLabFollowing'
import styles from '@/components/lab/feed/feed.module.css'

export default function PublicRecordRow({ record }: { record: LabRecordView }) {
  const display = displayRecord(presentPdsRecord(record))
  const following = useLabFollowing(), followed = following.prefs.ideas.includes(record.uri)
  return <article className={styles.row} data-feed-row={record.uri} style={{ overflowWrap: 'anywhere' }}>
    <div className={styles.rowMeta}><span>Public Open Lab · {record.kind}</span><span>Author: {record.authorDid}</span></div>
    <h2><a href={labInspectorHref(record.uri)}>{display.title}</a></h2>
    {display.rows.map(row => <p key={row.label}><strong>{row.label}:</strong> {row.link ? <a href={row.value} target="_blank" rel="noopener noreferrer">{row.value}</a> : row.value}</p>)}
    <details className={styles.meta}><summary>Exact public source</summary><p>Record URI: {record.uri}</p><p>Version (CID): {record.cid}</p><p>Created: {record.record.createdAt}</p><p>Current PDS: {record.pds}</p><p>Source: {record.provenance} · Current-PDS HTTPS read, not a repository-signature proof or peer review.</p></details>
    <div className={styles.actions}><button aria-label={`${followed ? 'Unfollow' : 'Follow'} idea: ${record.uri}`} aria-pressed={followed} disabled={!following.ready} onClick={() => following.act({ type: 'toggle', kind: 'ideas', id: record.uri })}>{followed ? 'Following idea' : 'Follow idea'}</button><a href={labInspectorHref(record.uri)}>Inspect public record →</a></div>
  </article>
}
