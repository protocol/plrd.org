// Editorial public-source cases. No Console records, private identifiers, or live connector.
export const BOTTLENECK_FIELDS = [
  ['digital-human-rights', 'Digital Human Rights'],
  ['economies-governance', 'Economies & Governance'],
  ['ai-robotics', 'AI & Robotics'],
  ['neurotech', 'Neurotechnology'],
  ['cross-field', 'Cross-field / other science'],
] as const;
export type BottleneckField = typeof BOTTLENECK_FIELDS[number][0];
export const BOTTLENECK_CASES = [{
  id: 'reproducibility',
  title: 'Make leakage visible before a result travels',
  focusArea: 'ai-robotics' as BottleneckField,
  relatedFields: ['cross-field'] as BottleneckField[],
  type: 'infrastructure', status: 'unknown', validation: 'editorial-starter',
  statement: 'When preprocessing learns from held-out data, a model evaluation can overstate performance. A reusable, inspectable split-and-fit workflow is needed before others can rely on the result.',
  affectedActors: 'Researchers reproducing a model, maintainers of example notebooks, reviewers, and people relying on downstream predictions.',
  evidence: 'The scikit-learn guide explains how test-data leakage produces optimistic estimates. It recommends splitting before preprocessing and fitting transformations only on training data, including within cross-validation pipelines.',
  uncertainty: 'This source establishes a failure mechanism, not its prevalence or severity in any particular project. No notebook has been audited here; no field-level bottleneck or proposed remedy has been validated.',
  resolutionSignal: 'An independent reader can inspect a specified public example, verify that held-out data never influences fitting or selection, and reproduce its evaluation from a documented environment. A lower score can be a useful correction, not a failure.',
  inflectionPointIds: [] as string[],
  source: {
    title: 'scikit-learn · Common pitfalls: data leakage',
    url: 'https://scikit-learn.org/stable/common_pitfalls.html#data-leakage',
    revision: 'editorial-reproducibility-v1',
    reviewedAt: '2026-09-10',
    note: 'Editorial brief revision, not an upstream content hash. The stable documentation URL can change.',
  },
}] as const;
export type BottleneckCase = typeof BOTTLENECK_CASES[number];
export const PROPOSAL_FIELDS = [
  { key: 'hypothesis', label: 'Hypothesis / causal link', hint: 'Why would this change remove this bottleneck? For a refinement, state the better diagnosis.' },
  { key: 'action', label: 'Smallest useful action', hint: 'Name one bounded artifact or check. For a refinement, say how to test the new diagnosis.' },
  { key: 'successSignal', label: 'Success signal', hint: 'What observable change would support the hypothesis? Avoid claiming an outcome already happened.' },
  { key: 'measurement', label: 'How to measure it', hint: 'Specify a comparison, reproducible method, and evidence to retain, including negative results.' },
  { key: 'consultation', label: 'Who to involve or consult', hint: 'Describe roles and affected parties, not assignments or unconfirmed endorsements.' },
  { key: 'risks', label: 'Harms, risks, and constraints', hint: 'Consider privacy, misleading results, licenses, compute, and who bears the cost.' },
  { key: 'review', label: 'Stop / review criterion', hint: 'Give a review date or bounded checkpoint, and when to revise or retire the proposal.' },
  { key: 'contributions', label: 'Requested contributions', hint: 'Ask for specific evidence, reproduction, design, or review. No funds or execution requests.' },
] as const;
export type ProposalKey = typeof PROPOSAL_FIELDS[number]['key'];
export type ProposalKind = 'refinement' | 'intervention';
export interface BottleneckDraft {
  version: 1; caseId: string; sourceRevision: string; owner: string;
  kind: ProposalKind; status: 'local-draft';
  fields: Record<ProposalKey, string>;
}
export const MAX_BOTTLENECK_BYTES = 48_000;
const UNSAFE_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
export function bottleneckDraftKey(d: Pick<BottleneckDraft, 'owner' | 'caseId' | 'kind'>): string {
  return `open-lab:bottleneck:v1:${encodeURIComponent(d.owner)}:${encodeURIComponent(d.caseId)}:${d.kind}`;
}
function exactObject(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) throw new Error('Invalid draft shape.');
}
export function parseBottleneckDraft(raw: string, expected: Pick<BottleneckDraft, 'owner' | 'caseId' | 'kind'>): BottleneckDraft {
  if (new TextEncoder().encode(raw).length > MAX_BOTTLENECK_BYTES) throw new Error('Draft size exceeds the local limit.');
  const d: unknown = JSON.parse(raw);
  exactObject(d, ['version', 'caseId', 'sourceRevision', 'owner', 'kind', 'status', 'fields']);
  const baseline = createBottleneckDraft(expected.caseId, expected.owner, expected.kind);
  for (const key of ['version', 'caseId', 'sourceRevision', 'owner', 'kind', 'status'] as const) {
    if (d[key] !== baseline[key]) throw new Error('Draft identity or source revision does not match. Saved original is preserved.');
  }
  exactObject(d.fields, PROPOSAL_FIELDS.map(f => f.key));
  for (const value of Object.values(d.fields)) {
    if (typeof value !== 'string' || value.length > 1000 || UNSAFE_TEXT.test(value)) throw new Error('Each draft field must be safe text, at most 1,000 characters.');
  }
  return d as unknown as BottleneckDraft;
}
export function bottleneckPermalink(caseId: string, location: string): string {
  bottleneckCase(caseId);
  const url = new URL(location);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP(S) page URL without credentials.');
  // Only retain identity, never arbitrary location query strings or fragments.
  return `${url.origin}/lab/bottlenecks/?case=${encodeURIComponent(caseId)}`;
}
function completeDraft(draft: BottleneckDraft): BottleneckDraft {
  const d = parseBottleneckDraft(JSON.stringify(draft), draft);
  if (PROPOSAL_FIELDS.some(f => !d.fields[f.key].trim())) throw new Error('Complete every proposal field before export or contribution preparation. You can save an incomplete local draft.');
  return d;
}
export function exportBottleneckDraft(draft: BottleneckDraft, location: string): string {
  const d = completeDraft(draft);
  const item = bottleneckCase(d.caseId);
  const packet = JSON.stringify({
    schema: 'open-lab-bottleneck-proposal', version: 1,
    provenance: 'editorial-public-source-starter',
    publication: 'not-published', execution: 'not-executed', acceptance: 'not-accepted',
    target: { caseId: d.caseId, sourceRevision: d.sourceRevision, publicPermalink: bottleneckPermalink(d.caseId, location), sourceUrl: item.source.url, sourceReviewedAt: item.source.reviewedAt },
    proposal: { kind: d.kind, status: d.status, fields: d.fields },
    caution: 'Local proposal only. No funds, assignments, author approval, or execution. Owner storage identity is intentionally excluded. Human review is required; negative results can support revision or retirement.',
  }, null, 2);
  if (new TextEncoder().encode(packet).length > MAX_BOTTLENECK_BYTES) throw new Error('Export size exceeds the local limit.');
  return packet;
}
export function prepareBottleneckContribution(draft: BottleneckDraft, location: string): Record<string, string> {
  const d = completeDraft(draft);
  const item = bottleneckCase(d.caseId);
  const targetUrl = bottleneckPermalink(d.caseId, location);
  const url = new URL(targetUrl);
  if (url.protocol !== 'https:' || url.port || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(url.hostname) || /\.(?:local|localhost|internal|test)$/i.test(url.hostname)) throw new Error('Contribution preparation needs a public HTTPS page. Export locally instead; a preview URL is not a public record.');
  const excerpt = (text: string) => {
    const normalized = text.trim().replace(/\s+/g, ' ');
    let result = '';
    for (const char of normalized) { if (result.length + char.length > 80) break; result += char; }
    return result + (result.length < normalized.length ? '…' : '');
  };
  const observation = [
    `Proposed ${d.kind} for ${d.caseId} (${d.sourceRevision}); not executed or published.`,
    'Editorial starter, not an accepted change. Excerpts below; export the full proposal JSON separately for review.',
    ...PROPOSAL_FIELDS.map(f => `${f.label}: ${excerpt(d.fields[f.key])}`),
  ].join('\n');
  if (observation.length > 1200) throw new Error('Contribution summary exceeds 1,200 characters. Export the full local proposal instead.');
  return { observation, evidenceUrl: item.source.url, targetUrl, field: item.focusArea };
}
export function bottleneckCase(id: string): BottleneckCase {
  const item = BOTTLENECK_CASES.find(c => c.id === id);
  if (!item) throw new Error('Unknown bottleneck case.');
  return item;
}
export function createBottleneckDraft(caseId: string, owner = 'guest', kind: ProposalKind = 'intervention'): BottleneckDraft {
  const item = bottleneckCase(caseId);
  if (!['refinement', 'intervention'].includes(kind)) throw new Error('Unknown proposal kind.');
  if (typeof owner !== 'string' || !owner.trim() || owner.length > 240) throw new Error('Invalid local draft owner.');
  return { version: 1, caseId, sourceRevision: item.source.revision, owner, kind, status: 'local-draft', fields: Object.fromEntries(PROPOSAL_FIELDS.map(f => [f.key, ''])) as BottleneckDraft['fields'] };
}
