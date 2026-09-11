'use client';
import { useEffect, useState } from 'react';
import { useLabIdentity } from '@/lib/lab-identity';
import BottleneckWorkbench from '@/components/lab/BottleneckWorkbench';
import RecordEditor from '@/components/lab/RecordEditor';
import { DemoCommunityPanel } from '@/components/lab/demo';
import type { DemoCaseId } from '@/lib/lab-demo';

export default function LabBottleneckExperience() {
  const { session, isLoading } = useLabIdentity();
  if (isLoading) return <p className="lab-wrap" role="status">Restoring your identity before opening local proposals…</p>;
  return <OwnedBottleneck key={session?.did || 'guest'} owner={session?.did || 'guest'} />;
}
function OwnedBottleneck({ owner }: { owner: string }) {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [initial, setInitial] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    const read = () => setCaseId(new URLSearchParams(window.location.search).get('case') ?? 'reproducibility');
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  const known = ['reproducibility', 'neural-measurement', 'open-artifacts'].includes(caseId || '');
  const storyOnly = caseId === 'neural-measurement' || caseId === 'open-artifacts';
  // Exact sorted payload identity, not a lossy hash. Re-preparing the same excerpt
  // recovers its edits; a different proposal cannot overwrite an earlier draft.
  const draftId = initial ? `contribution:bottleneck:${encodeURIComponent(JSON.stringify(Object.entries(initial).sort(([a], [b]) => a.localeCompare(b))))}` : undefined;
  return <>
    {known && <div className="lab-wrap"><details className="bottleneck-community-drawer" open={storyOnly}><summary>Discussion and collaborators <small>Illustrative community story</small></summary><DemoCommunityPanel className="lab-community-supplement" context="bottleneck" caseId={caseId as DemoCaseId} showPeople /></details></div>}
    {storyOnly ? <section className="lab-wrap lab-composition-prompt"><h1>A demo discussion, not a canonical case.</h1><p>This fictional case has no source-backed proposal workbench yet. Only reproducibility is available in the canonical source workbench. No draft target has been substituted.</p><a href="/lab/bottlenecks/?case=reproducibility">Open the canonical reproducibility source workbench →</a></section> : caseId !== null && <BottleneckWorkbench owner={owner} onPrepareContribution={setInitial} />}
    {initial && <RecordEditor kind="contribution" initial={initial} draftId={draftId} onClose={() => setInitial(null)} />}
  </>;
}
