// Illustrative design assumption, not an entitlement or a funding amount.
export const POINT_BUDGET = 100;

export const EFFORTS = [
  {
    id: 'reproduce-tutorial',
    title: 'Reproduce an open tutorial',
    kind: 'Reproducibility',
    summary: 'Turn a small published example into a rerunnable result.',
    scope: 'Reproduce the scikit-learn common-pitfalls example on inconsistent preprocessing. Record the documentation version, Python environment, split, commands, and both prediction-error outputs.',
    acceptance: 'A second reader can rerun the example from a clean environment and compare scaled versus unscaled preprocessing. Include exact outputs and explain any difference from the published example; matching a number alone is not enough.',
    failure: 'If dependencies fail or the result differs, keep the error log, environment and smallest failing example. Report the discrepancy rather than tuning until the expected answer appears.',
    sources: [{ title: 'scikit-learn: inconsistent preprocessing', url: 'https://scikit-learn.org/stable/common_pitfalls.html#inconsistent-preprocessing' }],
  },
  {
    id: 'trace-source',
    title: 'Trace a source claim',
    kind: 'Source audit',
    summary: 'Show exactly what a source supports—and what it does not.',
    scope: 'Trace the scikit-learn documentation claim that data leakage gives overly optimistic performance estimates. Quote the exact passage, identify its example and conditions, and distinguish the documented mechanism from a universal numerical effect.',
    acceptance: 'A short source note links the precise passage and example, records the accessed version, and separates direct source support, interpretation and unresolved questions.',
    failure: 'Keep missing references, unsupported extrapolations or contradictory observations visible. An inconclusive audit is a valid output; do not turn missing evidence into confirmation.',
    sources: [{ title: 'scikit-learn: data leakage', url: 'https://scikit-learn.org/stable/common_pitfalls.html#data-leakage' }],
  },
  {
    id: 'reusable-notebook',
    title: 'Improve a reusable notebook',
    kind: 'Research tooling',
    summary: 'Make the reproduction easier for the next person to inspect.',
    scope: 'Package the proposed preprocessing reproduction as a small Jupyter notebook: explicit inputs, pinned environment, ordered cells, saved outputs and a limitations section. This is proposed new work, not an existing staffed project.',
    acceptance: 'Restart-and-run-all produces the recorded outputs without hidden state. Validate the notebook format; include a README with the source, environment and a clean-run command.',
    failure: 'Preserve failed cells and distinguish an execution failure from a scientific disagreement. If clean execution cannot be achieved, export the minimal blocker and a reproducible issue instead.',
    sources: [
      { title: 'scikit-learn: source example', url: 'https://scikit-learn.org/stable/common_pitfalls.html#inconsistent-preprocessing' },
      { title: 'Jupyter notebook format', url: 'https://nbformat.readthedocs.io/en/latest/format_description.html' },
    ],
  },
] as const;

export type EffortId = (typeof EFFORTS)[number]['id'];
export type LocalEvidence = { url: string; summary: string };
export type Portfolio = {
  version: 1;
  allocations: Record<EffortId, number>;
  evidence: Partial<Record<EffortId, LocalEvidence>>;
};
export function createPortfolio(): Portfolio {
  return {
    version: 1,
    allocations: Object.fromEntries(EFFORTS.map(e => [e.id, 0])) as Record<EffortId, number>,
    evidence: {},
  };
}
export function totalSupport(portfolio: Portfolio): number {
  return Object.values(portfolio.allocations).reduce((sum, n) => sum + n, 0);
}
function isEffortId(id: string): id is EffortId {
  return EFFORTS.some(e => e.id === id);
}
export function setSupport(portfolio: Portfolio, id: string, amount: number): Portfolio {
  if (!isEffortId(id)) throw new Error('Unknown effort.');
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > POINT_BUDGET) {
    throw new Error(`Use a whole number from 0 to ${POINT_BUDGET}.`);
  }
  const next = { ...portfolio, allocations: { ...portfolio.allocations, [id]: amount } };
  if (totalSupport(next) > POINT_BUDGET) throw new Error('Not enough points in your budget. Reclaim support from another effort first.');
  return next;
}

export const STORAGE_KEY = 'open-lab-effort-portfolio-v1';
export function setEvidence(portfolio: Portfolio, id: string, entry: LocalEvidence | null): Portfolio {
  if (!isEffortId(id)) throw new Error('Unknown effort.');
  const evidence = { ...portfolio.evidence };
  if (entry === null) { delete evidence[id]; return { ...portfolio, evidence }; }
  if (typeof entry.url !== 'string' || entry.url.length > 2048 || !/^https?:\/\//i.test(entry.url) || /[\s\\\u0000-\u001f\u007f]/.test(entry.url)) {
    throw new Error('Use a complete http(s) evidence URL without spaces.');
  }
  let url: URL;
  try { url = new URL(entry.url); } catch { throw new Error('Use a valid http(s) evidence URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('Use an http(s) evidence URL without credentials.');
  }
  if (typeof entry.summary !== 'string' || !entry.summary.trim() || entry.summary.length > 1200) {
    throw new Error('Add an evidence summary of 1–1200 characters.');
  }
  evidence[id] = { url: entry.url, summary: entry.summary.trim() };
  return { ...portfolio, evidence };
}

export const ASSUMPTIONS = [
  `${POINT_BUDGET} points is an illustrative design assumption, adjustable in the model—not a monetary amount.`,
  'These are editorial proposals, not active initiatives or participating researchers.',
  'One optional local evidence note per effort; support and evidence are independent.',
];
export const DISCLAIMERS = [
  'Local allocation experiment; no money, global vote, or funding commitment.',
  'Same-browser storage only. Resetting storage or using different devices creates new local state. This is not a one-person-one-budget guarantee.',
  'Support expresses your preference, not scientific validity. Evidence is user-entered and unreviewed.',
  'No network sends. Export includes your saved local evidence; check it before sharing yourself.',
  'No issued Hypercert. Claims, evidence and evaluations do not themselves certify truth, allocate funds, or convey equity or IP.',
];
export function effortDraft(id: string) {
  const effort = EFFORTS.find(e => e.id === id);
  if (!effort) throw new Error('Unknown effort.');
  return {
    status: 'NOT ISSUED',
    format: 'Local design sketch; not a validated mint payload or AT Protocol record.',
    possibleFutureSchema: 'org.hypercerts.claim.activity',
    proposedWork: { title: effort.title, scope: effort.scope, acceptanceCriterion: effort.acceptance, negativeResultHandling: effort.failure, sources: effort.sources },
    missingBeforeAnyIssuance: ['Actual contributors and their identities', 'Work dates and relevant location', 'Actual work and provenance', 'Schema validation, informed authorization and a separate explicit publish action'],
    evidenceModel: 'Separately authored attachments, measurements and evaluations may reference an issued activity by {uri,cid}; an evaluator retains their own record on their own PDS.',
  };
}
export function exportPortfolio(portfolio: Portfolio): string {
  const clean = parsePortfolio(JSON.stringify(portfolio));
  return JSON.stringify({
    name: 'Open Lab — local effort portfolio',
    formatVersion: 1,
    budget: POINT_BUDGET,
    portfolio: clean,
    assumptions: ASSUMPTIONS,
    disclaimers: DISCLAIMERS,
    proposals: EFFORTS.map(e => effortDraft(e.id)),
    hypercertsSources: ['https://docs.hypercerts.org/core-concepts/hypercerts-core-data-model', 'https://docs.hypercerts.org/getting-started/quickstart'],
  }, null, 2);
}

type PortfolioStorage = Pick<Storage, 'getItem' | 'setItem'>;
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function parsePortfolio(raw: string): Portfolio {
  if (raw.length > 20000) throw new Error('Portfolio is too large.');
  const p: unknown = JSON.parse(raw);
  if (!isObject(p) || p.version !== 1 || Object.keys(p).sort().join(',') !== 'allocations,evidence,version' ||
      !isObject(p.allocations) || !isObject(p.evidence)) throw new Error('Invalid local portfolio.');
  if (Object.keys(p.allocations).length !== EFFORTS.length || Object.keys(p.allocations).some(id => !isEffortId(id))) {
    throw new Error('Invalid efforts in local portfolio.');
  }
  let clean = createPortfolio();
  for (const effort of EFFORTS) clean = setSupport(clean, effort.id, p.allocations[effort.id] as number);
  for (const [id, entry] of Object.entries(p.evidence)) {
    if (!isObject(entry) || Object.keys(entry).sort().join(',') !== 'summary,url') throw new Error('Invalid evidence.');
    clean = setEvidence(clean, id, entry as LocalEvidence);
  }
  return clean;
}
export function loadPortfolio(storage: PortfolioStorage): { status: 'empty' | 'loaded' | 'invalid' | 'unavailable'; portfolio: Portfolio } {
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); }
  catch { return { status: 'unavailable', portfolio: createPortfolio() }; }
  if (raw === null) return { status: 'empty', portfolio: createPortfolio() };
  try { return { status: 'loaded', portfolio: parsePortfolio(raw) }; }
  catch { return { status: 'invalid', portfolio: createPortfolio() }; }
}
export function savePortfolio(storage: PortfolioStorage, portfolio: Portfolio): boolean {
  try {
    const raw = JSON.stringify(portfolio);
    parsePortfolio(raw);
    storage.setItem(STORAGE_KEY, raw);
    return storage.getItem(STORAGE_KEY) === raw;
  } catch { return false; }
}
