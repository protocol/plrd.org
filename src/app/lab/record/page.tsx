'use client'

import { useState } from 'react'
import LabPublicInspector from '@/components/lab/LabPublicInspector'
import RecordEditor from '@/components/lab/RecordEditor'
import { readLabRecord } from '@/lib/lab-protocol'
import { displayRecord, presentPdsRecord, recordPermalink, type PublicLabDocument } from '@/lib/lab-record-display'

const loadRecord = async (uri: string) => presentPdsRecord(await readLabRecord(uri))

export default function Page() {
  const [proposal, setProposal] = useState<{ record: PublicLabDocument; targetUrl: string } | null>(null)
  const title = proposal ? `Evidence for: ${displayRecord(proposal.record).title}`.slice(0, 160) : ''
  return <>
    <LabPublicInspector loadRecord={loadRecord} onPropose={record => setProposal({ record, targetUrl: recordPermalink(window.location.origin, record.uri) })} />
    {proposal && <RecordEditor kind="contribution" initial={{ title, targetUrl: proposal.targetUrl, field: typeof proposal.record.data.field === 'string' ? proposal.record.data.field : 'cross-field', observation: '', evidenceUrl: '' }} onClose={() => setProposal(null)} />}
  </>
}
