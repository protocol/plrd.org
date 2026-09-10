import test from 'node:test';
import assert from 'node:assert/strict';
import { source } from './velocity/test-source-loader.mjs';

const model = () => source('lib/lab-efforts.ts');

test('a local portfolio begins with zero support and a finite illustrative budget', () => {
  const { POINT_BUDGET, EFFORTS, createPortfolio, totalSupport } = model();
  assert.equal(POINT_BUDGET, 100);
  assert.equal(EFFORTS.length, 3);
  const portfolio = createPortfolio();
  assert.equal(totalSupport(portfolio), 0);
  assert.deepEqual(Object.keys(portfolio.allocations), EFFORTS.map(e => e.id));
  assert.ok(Object.values(portfolio.allocations).every(n => n === 0));
});

test('allocate, reclaim and shift preserve the joint budget without mutating prior state', () => {
  const { createPortfolio, setSupport, totalSupport } = model();
  const initial = createPortfolio();
  let p = setSupport(initial, 'reproduce-tutorial', 80);
  assert.equal(totalSupport(initial), 0);
  p = setSupport(p, 'trace-source', 20);
  assert.equal(totalSupport(p), 100);
  assert.throws(() => setSupport(p, 'reusable-notebook', 1), /budget/i);
  p = setSupport(p, 'reproduce-tutorial', 40);
  p = setSupport(p, 'reusable-notebook', 40);
  assert.equal(totalSupport(p), 100);
  p = setSupport(p, 'trace-source', 0);
  assert.equal(totalSupport(p), 80);
  for (const bad of [-1, NaN, Infinity, 0.5, 101, '4', null, undefined]) {
    assert.throws(() => setSupport(p, 'trace-source', bad));
  }
  assert.throws(() => setSupport(p, 'unknown', 1));
  assert.throws(() => setSupport(p, '__proto__', 1));
});

test('deterministic allocation sequences never overspend', () => {
  const { EFFORTS, POINT_BUDGET, createPortfolio, setSupport, totalSupport } = model();
  let p = createPortfolio();
  let seed = 37;
  let accepted = 0;
  for (let i = 0; i < 2000; i++) {
    seed = (seed * 16807) % 2147483647;
    const id = EFFORTS[i % EFFORTS.length].id;
    const amount = seed % 130;
    try { p = setSupport(p, id, amount); accepted++; } catch (error) { assert.match(error.message, /budget|whole number/i); }
    assert.ok(totalSupport(p) <= POINT_BUDGET);
    assert.ok(Object.values(p.allocations).every(n => Number.isInteger(n) && n >= 0));
  }
  assert.ok(accepted > 100);
});

test('persistence reloads valid support and rejects corrupt portfolios as a whole', () => {
  const { createPortfolio, setSupport, parsePortfolio, loadPortfolio, savePortfolio, STORAGE_KEY } = model();
  const p = setSupport(createPortfolio(), 'trace-source', 45);
  assert.deepEqual(parsePortfolio(JSON.stringify(p)), p);
  const bad = [null, [], {}, { ...p, version: 2 }, { ...p, surprise: 1 }, { ...p, allocations: {} }];
  for (const n of [-1, NaN, Infinity, 1.2, 101, '5', null]) {
    bad.push({ ...p, allocations: { ...p.allocations, 'trace-source': n } });
  }
  bad.push({ ...p, allocations: { ...p.allocations, unknown: 0 } });
  bad.push({ ...p, allocations: { ...p.allocations, 'reproduce-tutorial': 90 } });
  for (const value of bad) assert.throws(() => parsePortfolio(JSON.stringify(value)));
  for (const value of ['{', '{"allocations":NaN}', 'x'.repeat(20001)]) assert.throws(() => parsePortfolio(value));
  const data = new Map();
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) };
  assert.equal(loadPortfolio(storage).status, 'empty');
  assert.equal(savePortfolio(storage, p), true);
  assert.deepEqual(loadPortfolio(storage), { status: 'loaded', portfolio: p });
  data.set(STORAGE_KEY, '{"malformed":true}');
  assert.equal(loadPortfolio(storage).status, 'invalid');
  assert.deepEqual(loadPortfolio(storage).portfolio, createPortfolio());
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.equal(loadPortfolio(blocked).status, 'unavailable');
  assert.equal(savePortfolio(blocked, p), false);
});

test('local evidence stays separate from support and allows only explicit http(s) links', () => {
  const { createPortfolio, setEvidence, parsePortfolio, totalSupport } = model();
  const initial = createPortfolio();
  const entry = { url: 'https://example.org/result', summary: 'A discrepancy, not a reviewed result.' };
  const p = setEvidence(initial, 'trace-source', entry);
  assert.equal(totalSupport(p), 0);
  assert.deepEqual(initial.evidence, {});
  assert.deepEqual(parsePortfolio(JSON.stringify(p)), p);
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', '//example.org', '/relative', 'ftp://example.org', 'https://u:pass@example.org', 'https://exa mple.org', '', 'https://example.org/\nfoo']) {
    assert.throws(() => setEvidence(p, 'trace-source', { ...entry, url }));
    assert.throws(() => parsePortfolio(JSON.stringify({ ...p, evidence: { 'trace-source': { ...entry, url } } })));
  }
  for (const evidence of [{ unknown: entry }, { 'trace-source': null }, { 'trace-source': { ...entry, reviewed: true } }, { 'trace-source': { ...entry, summary: '' } }]) {
    assert.throws(() => parsePortfolio(JSON.stringify({ ...p, evidence })));
  }
  assert.throws(() => setEvidence(p, 'unknown', entry));
  assert.throws(() => setEvidence(p, 'trace-source', { ...entry, summary: 'x'.repeat(1201) }));
  assert.deepEqual(setEvidence(p, 'trace-source', null).evidence, {});
});

test('export is a named local portfolio with assumptions and a non-issued design sketch', () => {
  const { createPortfolio, setSupport, setEvidence, exportPortfolio, effortDraft, EFFORTS } = model();
  let p = setSupport(createPortfolio(), 'trace-source', 12);
  p = setEvidence(p, 'trace-source', { url: 'http://example.org/note', summary: 'Unreviewed observation.' });
  const exported = JSON.parse(exportPortfolio(p));
  assert.equal(exported.name, 'Open Lab — local effort portfolio');
  assert.deepEqual(exported.portfolio, p);
  assert.equal(exported.budget, 100);
  assert.match(exported.assumptions.join(' '), /illustrative|design assumption/i);
  assert.match(exported.disclaimers.join(' '), /no money/i);
  assert.match(exported.disclaimers.join(' '), /different devices/i);
  assert.equal(exported.proposals.length, 3);
  const draft = effortDraft(EFFORTS[0].id);
  assert.equal(draft.status, 'NOT ISSUED');
  assert.equal(draft.possibleFutureSchema, 'org.hypercerts.claim.activity');
  assert.match(draft.format, /not a validated/i);
  assert.ok(!JSON.stringify(draft).includes('did:'));
  assert.ok(!JSON.stringify(draft).includes('$type'));
  assert.throws(() => effortDraft('unknown'));
});
