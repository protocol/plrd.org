'use client';

import { useEffect, useRef, useState } from 'react';
import {
  EFFORTS, POINT_BUDGET, DISCLAIMERS, createPortfolio, totalSupport,
  setSupport, setEvidence, loadPortfolio, savePortfolio, exportPortfolio, effortDraft,
  type EffortId, type Portfolio, type LocalEvidence,
} from '@/lib/lab-efforts';

const storageWarning = 'Browser storage is unavailable. Changes are not saved; export before leaving.';

export default function EffortBacking() {
  const [portfolio, setPortfolio] = useState<Portfolio>(createPortfolio);
  const [selected, setSelected] = useState<EffortId>(EFFORTS[0].id);
  const [amount, setAmount] = useState('0');
  const [drafts, setDrafts] = useState<Partial<Record<EffortId, LocalEvidence>>>({});
  const [ready, setReady] = useState(false);
  const [storage, setStorage] = useState('Checking local browser storage…');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorArea, setErrorArea] = useState<'support' | 'evidence' | 'export'>('support');
  const inspector = useRef<HTMLHeadingElement>(null);
  const focusInspector = useRef(false);

  useEffect(() => {
    try {
      const loaded = loadPortfolio(window.localStorage);
      setPortfolio(loaded.portfolio);
      setAmount(String(loaded.portfolio.allocations[EFFORTS[0].id]));
      setStorage(loaded.status === 'unavailable' ? storageWarning
        : loaded.status === 'invalid' ? 'Invalid saved portfolio ignored. Starting at zero; your next change replaces it.'
        : loaded.status === 'loaded' ? 'Restored from this browser. Nothing was sent.'
        : 'Changes stay in this browser. Nothing is sent.');
    } catch { setStorage(storageWarning); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (focusInspector.current) { inspector.current?.focus(); focusInspector.current = false; }
  }, [selected]);

  const effort = EFFORTS.find(e => e.id === selected)!;
  const support = portfolio.allocations[selected];
  const remaining = POINT_BUDGET - totalSupport(portfolio);
  const evidence = portfolio.evidence[selected];
  const draft = drafts[selected] ?? evidence ?? { url: '', summary: '' };

  function commit(next: Portfolio) {
    setPortfolio(next);
    try { setStorage(savePortfolio(window.localStorage, next) ? 'Saved in this browser. Nothing was sent.' : storageWarning); }
    catch { setStorage(storageWarning); }
  }
  function allocate(n: number) {
    setErrorArea('support');
    try {
      const next = setSupport(portfolio, selected, n);
      commit(next); setAmount(String(n)); setError('');
      setMessage(`Your support for “${effort.title}” is now ${n} points.`);
    } catch (e) { setError((e as Error).message); setMessage(''); }
  }
  function saveEvidence() {
    setErrorArea('evidence');
    try {
      commit(setEvidence(portfolio, selected, draft));
      setError(''); setMessage('Local evidence note recorded. It has not been reviewed or published.');
    } catch (e) { setError((e as Error).message); setMessage(''); }
  }
  function download() {
    setErrorArea('export');
    try {
      const blob = new Blob([exportPortfolio(portfolio)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'open-lab-effort-portfolio.json';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError(''); setMessage('Portfolio prepared for download. Includes saved local evidence only; nothing was sent.');
    } catch { setError('Download is unavailable in this browser. Your current portfolio is still on this page.'); }
  }

  return (
    <div className="effort-backing">
      <header className="effort-intro">
        <div>
          <p className="effort-eyebrow">Open Lab / An allocation experiment</p>
          <h1>What deserves<br /><em>your support?</em></h1>
        </div>
        <div className="effort-intro-note">
          <p>A finite budget makes a preference concrete. Try backing a small piece of useful work, then change your mind as you learn.</p>
          <p className="effort-small">An optional experiment alongside <a href="/lab/collaborate/">collaboration</a>—not a replacement for doing or reviewing the work.</p>
        </div>
      </header>

      <section className="effort-ledger" aria-label="Your local points budget">
        <div className="effort-balance" role="status" aria-live="polite" aria-atomic="true">
          <strong>{remaining} points available</strong>
          <span>{totalSupport(portfolio)} allocated / {POINT_BUDGET} total</span>
        </div>
        <div className="effort-ledger-note">
          <p>{POINT_BUDGET} points is an illustrative design assumption, not a monetary amount.</p>
          <p className="effort-small">Reclaim points from one effort to support another. You don’t need to use them all.</p>
        </div>
        <button className="effort-button" type="button" disabled={!ready} onClick={download}>Export portfolio JSON</button>
      </section>
      <p className="effort-disclaimer" id="effort-local-notice">{DISCLAIMERS[0]}</p>
      <p className="effort-small effort-storage" role="status">{storage}</p>
      {error && errorArea === 'export' && <p className="effort-error" id="effort-error" role="alert">{error}</p>}

      <div className="effort-workspace">
        <section className="effort-proposals" aria-labelledby="effort-proposals-title">
          <h2 id="effort-proposals-title" tabIndex={-1}>Three possible next steps.</h2>
          <p className="effort-small">Editorial proposals—not active initiatives, participating researchers, or endorsements by the linked projects.</p>
          <ol className="effort-list">
            {EFFORTS.map((item, i) => (
              <li key={item.id} className={selected === item.id ? 'is-selected' : ''}>
                <button
                  type="button" aria-label={`Inspect ${item.title}`} aria-pressed={selected === item.id}
                  aria-controls="effort-inspector" disabled={!ready}
                  onClick={() => {
                    if (selected === item.id) { inspector.current?.focus(); return; }
                    focusInspector.current = true; setSelected(item.id);
                    setAmount(String(portfolio.allocations[item.id])); setError(''); setMessage('');
                  }}
                >
                  <span className="effort-index">0{i + 1} / {item.kind}</span>
                  <strong>{item.title}</strong>
                  <span className="effort-small">{item.summary}</span>
                  <span className="effort-row-meta">
                    <span>Your support <b>{portfolio.allocations[item.id]} pts</b></span>
                    <span>Evidence <b>{portfolio.evidence[item.id] ? 'Local note' : 'None added'}</b></span>
                  </span>
                  <span className="effort-inspect-label">{selected === item.id ? 'Inspecting this proposal ↓' : 'Inspect proposed work →'}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="effort-small">Support is your preference, not a measure of scientific validity. Useful negative results count as work; popularity does not prove science.</p>
        </section>

        <section className="effort-inspector" id="effort-inspector" aria-labelledby="effort-title">
          <p className="effort-eyebrow">Proposed work / {effort.kind}</p>
          <h2 id="effort-title" ref={inspector} tabIndex={-1}>{effort.title}</h2>
          <dl className="effort-scope">
            <div><dt>Proposed work scope</dt><dd>{effort.scope}</dd></div>
            <div><dt>Acceptance criterion</dt><dd>{effort.acceptance}</dd></div>
            <div><dt>If it fails / negative results</dt><dd>{effort.failure}</dd></div>
          </dl>
          <div className="effort-sources">
            <span className="effort-label">Source material—not evidence of completed work</span>
            {effort.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a>)}
          </div>

          <form className="effort-support-form" noValidate onSubmit={e => {
            e.preventDefault();
            setErrorArea('support');
            if (!/^(0|[1-9]\d*)$/.test(amount)) { setError('Use a whole number from 0 to ' + POINT_BUDGET + '.'); setMessage(''); return; }
            allocate(Number(amount));
          }}>
            <label className="effort-label" htmlFor="effort-support">Your support <span>· points, not money</span></label>
            <div className="effort-number-row">
              <button className="effort-step" type="button" aria-label="Reclaim one point" disabled={!ready || support === 0} onClick={() => allocate(support - 1)}>−</button>
              <input id="effort-support" type="number" inputMode="numeric" min={0} max={POINT_BUDGET} step={1}
                value={amount} onChange={e => setAmount(e.target.value)} disabled={!ready}
                aria-describedby="effort-local-notice effort-support-help effort-error" />
              <button className="effort-step" type="button" aria-label="Add one point" disabled={!ready || remaining === 0} onClick={() => allocate(support + 1)}>+</button>
              <button className="effort-button" type="submit" disabled={!ready}>Set support</button>
            </div>
            <div className="effort-support-footer">
              <p className="effort-small" id="effort-support-help">Currently {support} points. Maximum for this effort now: {support + remaining}.</p>
              <button className="effort-text-button" type="button" disabled={!ready || support === 0} onClick={() => allocate(0)}>Reclaim support</button>
            </div>
            <p className="effort-small">{DISCLAIMERS[0]}</p>
            {error && errorArea === 'support' && <p className="effort-error" id="effort-error" role="alert">{error}</p>}
          </form>

          <form className="effort-evidence-form" noValidate onSubmit={e => { e.preventDefault(); saveEvidence(); }}>
            <h3>Evidence <span>Optional / local / unreviewed</span></h3>
            <p className="effort-small">Add a source and what it shows, including uncertainty or a negative result. No points required. This does not submit a review or a funding request.</p>
            {evidence && <div className="effort-saved-evidence"><a href={evidence.url} target="_blank" rel="noopener noreferrer">Open saved evidence ↗</a><p>{evidence.summary}</p></div>}
            <label className="effort-label" htmlFor="effort-evidence-url">Evidence URL (http or https)</label>
            <input id="effort-evidence-url" type="url" maxLength={2048} value={draft.url} disabled={!ready}
              onChange={e => setDrafts({ ...drafts, [selected]: { ...draft, url: e.target.value } })} aria-describedby="effort-evidence-help effort-error" />
            <label className="effort-label" htmlFor="effort-evidence-summary">What does it show? What remains uncertain?</label>
            <textarea id="effort-evidence-summary" maxLength={1200} rows={3} value={draft.summary} disabled={!ready}
              onChange={e => setDrafts({ ...drafts, [selected]: { ...draft, summary: e.target.value } })} aria-describedby="effort-evidence-help effort-error" />
            <p className="effort-small" id="effort-evidence-help">One saved note per effort. Only saved notes enter the export. Avoid private information; inspect the file before sharing it yourself.</p>
            <div className="effort-evidence-actions">
              <button className="effort-button effort-quiet" type="submit" disabled={!ready}>Save local evidence</button>
              {evidence && <button className="effort-text-button" type="button" onClick={() => {
                commit(setEvidence(portfolio, selected, null));
                setDrafts({ ...drafts, [selected]: { url: '', summary: '' } });
                setError(''); setMessage('Local evidence removed. Your support is unchanged.');
              }}>Remove local evidence</button>}
            </div>
            {error && errorArea === 'evidence' && <p className="effort-error" id="effort-error" role="alert">{error}</p>}
          </form>
          <p className="effort-small" role="status">{message}</p>
          <a className="effort-back-link" href="#effort-proposals-title">Back to proposals ↑</a>
        </section>
      </div>

      <section className="effort-future" aria-labelledby="effort-hypercerts-title">
        <div>
          <p className="effort-eyebrow">A possible next layer / Not implemented here</p>
          <h2 id="effort-hypercerts-title">From an effort to a Hypercert.</h2>
          <p>Rather than invent an Open Lab claim format, a future integration could use the existing Hypercerts AT Protocol schemas. An activity claim anchors work scope, contributors, time and location. Attachments, measurements and evaluations are separately authored records referencing {'{uri,cid}'}; an evaluator keeps their record on their own PDS.</p>
          <p className="effort-small">The <a href="https://docs.hypercerts.org/core-concepts/hypercerts-core-data-model" target="_blank" rel="noopener noreferrer">current data model</a> says activity records are immutable and on-chain tokenization is not implemented. See the <a href="https://docs.hypercerts.org/getting-started/quickstart" target="_blank" rel="noopener noreferrer">AT Protocol quickstart</a>. Claims, evidence and evaluations do not themselves certify truth, allocate funds, or convey equity or IP.</p>
        </div>
        <div>
          <details className="effort-draft">
            <summary>Local design sketch · NOT ISSUED</summary>
            <p className="effort-small">For “{effort.title}”. Not a validated mint payload, signed record or issued Hypercert. Actual identities, work dates and outcomes are deliberately absent.</p>
            <pre>{JSON.stringify(effortDraft(selected), null, 2)}</pre>
          </details>
          <p className="effort-small effort-limit">{DISCLAIMERS[1]} Other tabs are not synchronized; the last saved edit wins. This is not authentication.</p>
        </div>
      </section>
    </div>
  );
}
