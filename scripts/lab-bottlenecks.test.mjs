import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { source } from './velocity/test-source-loader.mjs';

test('the route mounts the workbench with only locally scoped responsive styles', () => {
  const page = fs.readFileSync('src/app/lab/bottlenecks/page.tsx', 'utf8');
  assert.match(page, /<BottleneckWorkbench\s*\/>/);
  assert.match(page, /BottleneckWorkbench.css/);
  const css = fs.readFileSync('src/components/lab/BottleneckWorkbench.css', 'utf8');
  assert.match(css, /\.open-lab \.bottleneck-workbench/);
  assert.match(css, /var\(--font-serif\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /max-width: 600px/);
});
const model = () => source('lib/lab-bottlenecks.ts');

test('contribution preparation includes all proposal fields within the existing 1200-character contract', () => {
  const m = model();
  const d = m.createBottleneckDraft('reproducibility', 'guest', 'intervention');
  for (const f of m.PROPOSAL_FIELDS) d.fields[f.key] = '🧪'.repeat(500);
  const initial = m.prepareBottleneckContribution(d, 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility&field=neurotech#secret');
  assert.deepEqual(Object.keys(initial).sort(), ['evidenceUrl', 'field', 'observation', 'targetUrl']);
  assert.ok(initial.observation.length <= 1200);
  for (const f of m.PROPOSAL_FIELDS) assert.ok(initial.observation.includes(f.label));
  assert.ok(initial.observation.includes(d.sourceRevision));
  assert.match(initial.observation, /Excerpts/);
  assert.equal(initial.field, 'ai-robotics');
  assert.equal(initial.targetUrl, 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility');
  assert.equal(initial.evidenceUrl, m.BOTTLENECK_CASES[0].source.url);
  source('lib/lab-validation.ts').validateLabData('contribution', initial);
  for (const location of ['http://localhost:3000/lab/', 'https://preview.internal/lab/', 'https://u:p@example.org/lab/', 'javascript:alert(1)']) assert.throws(() => m.prepareBottleneckContribution(d, location));
});

test('a proposal targets one editorial case revision, never mutates its baseline', () => {
  const m = model();
  const baseline = JSON.stringify(m.BOTTLENECK_CASES);
  const d = m.createBottleneckDraft('reproducibility', 'guest', 'intervention');
  assert.equal(d.caseId, 'reproducibility');
  assert.equal(d.sourceRevision, m.BOTTLENECK_CASES[0].source.revision);
  assert.equal(d.status, 'local-draft');
  assert.equal(d.fields.hypothesis, '');
  d.fields.hypothesis = 'Test whether a split-first pipeline prevents held-out data leakage.';
  assert.equal(JSON.stringify(m.BOTTLENECK_CASES), baseline);
  assert.throws(() => m.createBottleneckDraft('unknown', 'guest', 'intervention'), /case/i);
  assert.throws(() => m.createBottleneckDraft('reproducibility', 'guest', 'execution'), /kind/i);
});

test('recoverable drafts and exports reject stale, oversized, incomplete, or foreign payloads', () => {
  const m = model();
  const d = m.createBottleneckDraft('reproducibility', 'guest', 'refinement');
  const key = m.bottleneckDraftKey(d);
  assert.notEqual(key, m.bottleneckDraftKey({ ...d, owner: 'different' }));
  assert.notEqual(key, m.bottleneckDraftKey({ ...d, kind: 'intervention' }));
  assert.deepEqual(m.parseBottleneckDraft(JSON.stringify(d), d), d);
  assert.throws(() => m.exportBottleneckDraft(d, 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility'), /complete/i);
  for (const f of m.PROPOSAL_FIELDS) d.fields[f.key] = `Proposed ${f.key}; not a measured outcome.`;
  const exported = JSON.parse(m.exportBottleneckDraft(d, 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility&token=secret'));
  assert.equal(exported.execution, 'not-executed');
  assert.equal(exported.publication, 'not-published');
  assert.equal(exported.target.caseId, d.caseId);
  assert.equal(exported.target.sourceRevision, d.sourceRevision);
  assert.equal(exported.target.publicPermalink, 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility');
  assert.equal(exported.provenance, 'editorial-public-source-starter');
  assert.ok(!JSON.stringify(exported).includes('secret'));
  for (const change of [{ owner: 'other' }, { sourceRevision: 'old' }, { version: 2 }, { status: 'accepted' }, { workspace: 'private' }, { caseId: 'unknown' }, { fields: { ...d.fields, risks: 'x'.repeat(1001) } }]) {
    assert.throws(() => m.parseBottleneckDraft(JSON.stringify({ ...d, ...change }), d));
  }
  assert.throws(() => m.parseBottleneckDraft(' '.repeat(m.MAX_BOTTLENECK_BYTES + 1), d), /size/i);
  assert.throws(() => m.exportBottleneckDraft({ ...d, fields: { ...d.fields, action: '' } }, 'https://www.plrd.org/lab/bottlenecks/'), /complete/i);
});
