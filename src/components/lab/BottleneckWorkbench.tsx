'use client';

import { useEffect, useState } from 'react';
import {
  BOTTLENECK_CASES, BOTTLENECK_FIELDS, PROPOSAL_FIELDS, MAX_BOTTLENECK_BYTES,
  createBottleneckDraft, bottleneckDraftKey, parseBottleneckDraft, exportBottleneckDraft, prepareBottleneckContribution,
  type BottleneckCase, type ProposalKind,
} from '@/lib/lab-bottlenecks';

export interface BottleneckWorkbenchProps {
  owner?: string;
  onPrepareContribution?: (initial: Record<string, string>) => void;
}
const message = (error: unknown) => error instanceof Error ? error.message : 'That action could not be completed.';

function ProposalEditor({ item, owner, kind, onPrepareContribution }: { item: BottleneckCase; owner: string; kind: ProposalKind; onPrepareContribution?: BottleneckWorkbenchProps['onPrepareContribution'] }) {
  const [draft, setDraft] = useState(() => createBottleneckDraft(item.id, owner, kind));
  const [notice, setNotice] = useState('Local draft. Save before leaving this page.');
  const [error, setError] = useState('');
  const [recovery, setRecovery] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    try {
      const initial = createBottleneckDraft(item.id, owner, kind);
      const raw = window.localStorage.getItem(bottleneckDraftKey(initial));
      if (raw !== null) {
        try { setDraft(parseBottleneckDraft(raw, initial)); setNotice('Recovered local draft. Nothing has been published.'); }
        catch (e) {
          setBlocked(true);
          const oversized = new TextEncoder().encode(raw).length > MAX_BOTTLENECK_BYTES;
          setRecovery(oversized ? null : raw);
          setError(`Saved draft needs recovery: ${message(e)} The original was not overwritten. ${oversized ? 'Oversized data remains in browser storage.' : 'Copy the recovery text below before reconciling manually.'}`);
        }
      }
    } catch { setNotice('Browser storage is unavailable. Your work is not saved; export before leaving.'); }
  }, [item.id, owner, kind]);
  function save(next = draft) {
    try {
      if (blocked) throw new Error('The saved original is preserved. Reconcile the recovery copy before replacing it outside this workbench.');
      const valid = parseBottleneckDraft(JSON.stringify(next), next);
      window.localStorage.setItem(bottleneckDraftKey(valid), JSON.stringify(valid));
      setNotice('Saved on this device. Not published or accepted.'); setError('');
    } catch (e) { setNotice('Current changes are not saved. Export before leaving.'); setError(`Not saved. ${message(e)}`); }
  }
  function download() {
    let url: string | undefined;
    try {
      const content = exportBottleneckDraft(draft, window.location.href);
      url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `open-lab-${item.id}-${kind}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setNotice('Proposal JSON prepared for download. Not executed or published.'); setError('');
    } catch (e) { setError(message(e)); }
    finally { if (url) URL.revokeObjectURL(url); }
  }
  return <section className="bottleneck-proposal" aria-labelledby="bottleneck-proposal-title">
    <p className="bottleneck-kicker">Your proposal · separate from the baseline</p>
    <h2 id="bottleneck-proposal-title">{kind === 'refinement' ? 'Refine the diagnosis' : 'Design the smallest useful intervention'}</h2>
    <p>A proposal is a testable invitation, not an assignment. All eight fields are required for export; incomplete drafts can be saved.</p>
    <p className="bottleneck-small">Target: {item.id} · {item.source.revision}</p>
    <form onSubmit={event => { event.preventDefault(); save(); }}>
      <div className="bottleneck-fields">
        {PROPOSAL_FIELDS.map(field => <label key={field.key} htmlFor={`bottleneck-${field.key}`}>
          <span>{field.label}</span>
          <small id={`bottleneck-${field.key}-hint`}>{field.hint}</small>
          <textarea id={`bottleneck-${field.key}`} aria-describedby={`bottleneck-${field.key}-hint`} maxLength={1000} rows={3}
            value={draft.fields[field.key]} onChange={event => {
              const next = { ...draft, fields: { ...draft.fields, [field.key]: event.target.value } };
              setDraft(next); save(next);
            }} />
        </label>)}
      </div>
      <p className="bottleneck-small">Keep sensitive data out. Device storage is not encrypted; a guest draft is shared by visitors using this browser profile. No funds, assignments, author approval, or actual execution.</p>
      <div className="bottleneck-actions">
        <button type="submit" disabled={blocked}>Save local draft</button>
        <button type="button" onClick={download}>Export proposal JSON</button>
        {onPrepareContribution && <button type="button" onClick={() => {
          try {
            const initial = prepareBottleneckContribution(draft, window.location.href);
            onPrepareContribution(initial);
            setNotice('Contribution draft prepared for review. Nothing has been published.'); setError('');
          } catch (e) { setError(message(e)); }
        }}>Prepare contribution draft</button>}
      </div>
      <p className="bottleneck-small">{onPrepareContribution ? 'Contribution preparation opens a short excerpt for review, not a public write. Export the full JSON separately; it is not attached automatically.' : 'Contribution publishing is not connected on this page. Export a proposal for human review.'}</p>
      <p role="status" className="bottleneck-small">{notice}</p>
      {error && <p role="alert" className="bottleneck-error">{error}</p>}
      {recovery !== null && <label>Recovery copy — unvalidated, not a proposal export<textarea readOnly rows={5} value={recovery} /></label>}
    </form>
  </section>;
}

export default function BottleneckWorkbench({ owner = 'guest', onPrepareContribution }: BottleneckWorkbenchProps) {
  const [query, setQuery] = useState({ caseId: 'reproducibility', field: 'all' });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery({ caseId: params.get('case') ?? 'reproducibility', field: params.get('field') ?? 'all' });
      setLoaded(true);
    };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  function navigate(field: string, caseId = query.caseId) {
    const url = new URL(window.location.href);
    url.searchParams.set('case', caseId);
    if (field === 'all') url.searchParams.delete('field'); else url.searchParams.set('field', field);
    window.history.pushState(null, '', url);
    setQuery({ caseId, field });
  }
  const item = BOTTLENECK_CASES.find(c => c.id === query.caseId && (query.field === 'all' || c.focusArea === query.field || c.relatedFields.some(f => f === query.field)));
  const [kind, setKind] = useState<ProposalKind>('intervention');
  return <div className="bottleneck-workbench">
    <header className="bottleneck-heading">
      <p className="bottleneck-kicker">Open Lab / co-creation workbench</p>
      <h1>Find the blockage.<br />Make a way through.</h1>
      <p>Invent together by making the problem precise, the next action small, and the evidence open to challenge. Across PL focus areas and other science.</p>
      <ol className="bottleneck-loop" aria-label="The collective learning loop">
        <li>Diagnose & refine</li><li>Design an intervention</li><li>Rally contributions</li><li>Test outcomes</li><li>Revise or retire</li>
      </ol>
      <p className="bottleneck-disclosure">Editorial starter · public-source brief, not an imported Console record or an active, validated campaign. The real Console bridge is not live.</p>
    </header>
    <div className="bottleneck-filter">
      <label htmlFor="bottleneck-field">Explore a field</label>
      <select id="bottleneck-field" value={query.field} onChange={event => navigate(event.target.value)}>
        <option value="all">All fields</option>
        {BOTTLENECK_FIELDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        {!['all', ...BOTTLENECK_FIELDS.map(([value]) => value)].includes(query.field) && <option value={query.field}>Unknown field</option>}
      </select>
      <span className="bottleneck-small">One carefully scoped starter. More fields are welcome, not populated by fixtures.</span>
    </div>
    {!loaded ? <p role="status">Reading case selection…</p> : !item ? <section className="bottleneck-empty">
      <h2>No editorial case matches this selection.</h2>
      <p>No campaign or draft target was substituted. Explore the reproducibility case to see the full co-creation loop.</p>
      <button onClick={() => navigate('all', 'reproducibility')}>Open reproducibility case</button>
    </section> : <div className="bottleneck-columns">
      <article data-baseline className="bottleneck-baseline" aria-labelledby="bottleneck-title">
        <p className="bottleneck-kicker">01 / baseline · unvalidated diagnosis</p>
        <h2 id="bottleneck-title">{item.title}</h2>
        <p>{item.statement}</p>
        <h3>Who is affected?</h3><p>{item.affectedActors}</p>
        <h3>What the source supports</h3><p>{item.evidence}</p>
        <a href={item.source.url} target="_blank" rel="noopener noreferrer">Read the primary source ↗</a>
        <h3>What we do not know</h3><p>{item.uncertainty}</p>
        <h3>What removal would look like</h3><p>{item.resolutionSignal}</p>
        <p className="bottleneck-small">Reviewed {item.source.reviewedAt} · {item.source.revision}. {item.source.note} No inflection-point mapping is asserted.</p>
        <div className="bottleneck-support">
          <h3>Supporting tools, not active campaigns</h3>
          <a href="/lab/collaborate/">Prepare a bounded agent work packet ↗</a>
          <a href="/lab/efforts/">Explore the local effort experiment ↗</a>
          <p className="bottleneck-small">These tools do not staff or execute this proposal. No network totals are implied.</p>
        </div>
      </article>
      <div>
        <div className="bottleneck-mode" aria-label="Proposal type">
          <button aria-pressed={kind === 'refinement'} onClick={() => setKind('refinement')}>Refine diagnosis</button>
          <button aria-pressed={kind === 'intervention'} onClick={() => setKind('intervention')}>Design intervention</button>
        </div>
        <ProposalEditor key={`${owner}:${item.id}:${kind}`} item={item} owner={owner} kind={kind} onPrepareContribution={onPrepareContribution} />
      </div>
    </div>}
  </div>;
}
