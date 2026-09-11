/** Entirely fictional product demonstration. Never import auth, drafts, or a network client here. */
export const DEMO_PERSONA_DISCLOSURE = 'Fictional scenarios using inventor-inspired names; not their statements, endorsements, or actual users.';
export type DemoCaseId = 'reproducibility' | 'neural-measurement' | 'open-artifacts';
export type DemoContext = 'landing' | 'feed' | 'bottleneck' | 'atlas' | 'apps' | 'agents';
export type DemoMode = 'demo' | 'live';
export interface DemoPerson { id: string; name: string; initials: string; role: string; bio: string; lookingFor: string; caseIds: DemoCaseId[]; fictional: true }
export const DEMO_PEOPLE: readonly DemoPerson[] = [
  { id: 'mira', name: 'Ada Lovelace', initials: 'AL', role: 'Research software maintainer', bio: 'In this story, Ada turns evaluation notebooks into inspectable workflows. She would rather keep a failing test than hide a weak result.', lookingFor: 'A second reader for a split-and-fit checklist.', caseIds: ['reproducibility', 'open-artifacts'], fictional: true },
  { id: 'ellis', name: 'Hedy Lamarr', initials: 'HL', role: 'Methods reviewer', bio: 'Hedy asks whether a proposed test can distinguish the explanation from its alternatives. Skepticism is a contribution, not a veto.', lookingFor: 'A counterexample that survives the proposed audit.', caseIds: ['reproducibility'], fictional: true },
  { id: 'jo', name: 'Nikola Tesla', initials: 'NT', role: 'Independent reproducibility engineer', bio: 'Nikola keeps small execution logs and writes down what could not be reproduced, including missing dependencies.', lookingFor: 'Someone to rerun the revised toy example independently.', caseIds: ['reproducibility', 'open-artifacts'], fictional: true },
  { id: 'sana', name: 'Marie Curie', initials: 'MC', role: 'Neural data steward', bio: 'Marie works through units, recording duration, and dataset boundaries before putting measurements on the same chart.', lookingFor: 'A reviewer for simultaneous versus sequential recording definitions.', caseIds: ['neural-measurement'], fictional: true },
  { id: 'tomas', name: 'Katherine Johnson', initials: 'KJ', role: 'Measurement-tool designer', bio: 'Katherine prototypes small evidence forms. She prefers an explicit unknown to a precise number with an ambiguous denominator.', lookingFor: 'An example where two reasonable duration definitions disagree.', caseIds: ['neural-measurement', 'open-artifacts'], fictional: true },
  { id: 'nia', name: 'Leonardo da Vinci', initials: 'LV', role: 'Open artifact librarian', bio: 'Leonardo checks whether an artifact can be found, understood, and reused without assuming an open link is an open license.', lookingFor: 'A license-aware reader to test a minimal reuse receipt.', caseIds: ['open-artifacts'], fictional: true },
];
export const DEMO_CASES: readonly { id: DemoCaseId; title: string; question: string; refinement: string; outcome: string; contexts: DemoContext[] }[] = [
  { id: 'reproducibility', title: 'Make leakage visible before a result travels', question: 'Can another reader tell what the evaluation actually held out?', refinement: 'Start with the boundary between splitting and fitting, not a claim to solve reproducibility.', outcome: 'A revised toy check—not an audited research result. Independent rerun still needed.', contexts: ['landing', 'feed', 'bottleneck', 'apps', 'agents'] },
  { id: 'neural-measurement', title: 'Agree on what a recording hour means', question: 'Which durations can be compared without mixing sessions, subjects, and channels?', refinement: 'Keep observed duration, simultaneous coverage, and inferred totals separate.', outcome: 'A denominator note with unresolved gaps—not a new Atlas measurement.', contexts: ['landing', 'feed', 'bottleneck', 'atlas', 'agents'] },
  { id: 'open-artifacts', title: 'Make an open artifact reusable by a stranger', question: 'What is missing between a working link and a usable research artifact?', refinement: 'Test access, environment, and license separately; do not infer permission from availability.', outcome: 'A smaller reuse receipt, with one example intentionally blocked on permission.', contexts: ['landing', 'feed', 'bottleneck', 'apps', 'agents'] },
];
export const DEMO_PROPOSALS = [
  { id: 'split-check', caseId: 'reproducibility' as DemoCaseId, authorId: 'mira', title: 'A split-before-fit check, not another leaderboard', hypothesis: 'An inspectable boundary check may catch one class of accidental leakage before anyone interprets the score.', test: 'Compare two tiny synthetic workflows: preprocessing before the split versus a training-only pipeline. Keep the environment and failure log.', stop: 'Stop after these two examples. If the check cannot distinguish them, revise the check rather than generalize.', help: 'One independent reader to inspect what is fitted, and one rerun with a clean environment.', revision: 'v2: inspect fitted inputs explicitly. A score difference alone is not evidence of leakage.', artifact: 'Toy-check specification + failure log', outcome: 'Uncertain: the first check also flagged a harmless transform. No real benchmark was evaluated.' },
  { id: 'duration-note', caseId: 'neural-measurement' as DemoCaseId, authorId: 'sana', title: 'A denominator card beside every duration', hypothesis: 'Making the unit and aggregation rule visible may prevent incompatible durations from looking comparable.', test: 'Use two invented recording schedules and ask two readers to calculate duration under an explicit rule.', stop: 'If readers need unavailable metadata, report unknown. Do not estimate missing hours.', help: 'A measurement reviewer to challenge the aggregation rule.', revision: 'v2: add an overlap field; distinguish elapsed time from summed subject-hours.', artifact: 'Annotated denominator card', outcome: 'Uncertain: one invented schedule lacks overlap metadata, so its comparable duration remains unknown.' },
  { id: 'reuse-receipt', caseId: 'open-artifacts' as DemoCaseId, authorId: 'nia', title: 'A minimal receipt for the next person', hypothesis: 'A short reuse receipt may reveal an access or permission blocker before a stranger spends time setting up.', test: 'Walk through one invented artifact with a URL placeholder, environment note, license field, and expected output description.', stop: 'Do not execute downloads or reuse material when permission is unknown. Record the blocker.', help: 'A fresh reader to say which fields actually changed their next action.', revision: 'v2: separate “can retrieve” from “may reuse”; drop the overall green badge.', artifact: 'Reuse receipt with a permission checkpoint', outcome: 'Negative: the example is reachable in the story but not cleared for reuse. A receipt is not certification.' },
] as const;
export type DemoMessageKind = 'question' | 'dissent' | 'test' | 'contribution' | 'uncertain' | 'revision' | 'help';
export interface DemoMessage { id: string; authorId: string; parentId?: string; kind: DemoMessageKind; sequence: string; text: string }
export interface DemoThread { id: string; caseId: DemoCaseId; proposalId: string; title: string; messages: readonly DemoMessage[] }
export const DEMO_THREADS: readonly DemoThread[] = [
  { id: 'split-boundary', caseId: 'reproducibility', proposalId: 'split-check', title: 'What would actually catch the leak?', messages: [
    { id: 'r1', authorId: 'mira', kind: 'question', sequence: 'Illustrative day 1 · opening', text: 'I started with “make notebooks reproducible,” but that is too broad to test. Could we start at the split-and-fit boundary and produce something a reviewer can inspect?' },
    { id: 'r2', authorId: 'ellis', parentId: 'r1', kind: 'dissent', sequence: 'Illustrative day 1 · challenge', text: 'I would not use a score drop as the leakage detector. Randomness and a changed model can also move the score. What observation would distinguish our explanation?' },
    { id: 'r3', authorId: 'jo', parentId: 'r2', kind: 'test', sequence: 'Illustrative day 2 · narrower test', text: 'Two synthetic workflows, same inputs: one fits preprocessing before the split, one only on training data. Log the exact row IDs visible to fit. No benchmark sweep.' },
    { id: 'r4', authorId: 'jo', parentId: 'r3', kind: 'uncertain', sequence: 'Illustrative day 3 · trial result', text: 'In this invented trial, the first check also flagged a transform that learned nothing from the data. That is a false alarm. I kept the failing example in the proposed test log; the detector is not ready.' },
    { id: 'r5', authorId: 'mira', parentId: 'r4', kind: 'revision', sequence: 'Illustrative day 4 · design revision', text: 'Revised: track fitted state and its input rows, not merely where a transform appears. The output is now an inspectable boundary report, not a pass/fail seal. This is the v2 proposal below.' },
    { id: 'r6', authorId: 'ellis', parentId: 'r5', kind: 'help', sequence: 'Illustrative day 4 · open request', text: 'That is narrower and more useful. Can someone independently rerun the toy case and try to break the fitted-input check? I would retain the uncertainty note even if that rerun agrees.' },
  ] },
  { id: 'duration-denominator', caseId: 'neural-measurement', proposalId: 'duration-note', title: 'Two durations; one missing denominator', messages: [
    { id: 'n1', authorId: 'sana', kind: 'question', sequence: 'Illustrative day 1 · opening', text: 'Before adding another duration to a chart, I want a card that says what was recorded, for whom, and whether sessions overlapped. The example schedules here are invented, not source measurements.' },
    { id: 'n2', authorId: 'tomas', parentId: 'n1', kind: 'dissent', sequence: 'Illustrative day 2 · challenge', text: 'A total-hours field still hides the problem. Summing subject-hours is not the same as elapsed recording time. Let the card keep both definitions without forcing a conversion.' },
    { id: 'n3', authorId: 'sana', parentId: 'n2', kind: 'uncertain', sequence: 'Illustrative day 3 · evidence gap', text: 'Our second fictional schedule omits overlap metadata. I cannot derive comparable elapsed duration from it. The useful result is “unknown,” with the exact missing field, not an estimated point on the Atlas.' },
    { id: 'n4', authorId: 'tomas', parentId: 'n3', kind: 'revision', sequence: 'Illustrative day 4 · design revision', text: 'Added overlap and aggregation-rule fields. A reviewer can now reject the comparison while keeping the source note. Looking for a counterexample before we expand the card.' },
  ] },
  { id: 'receipt-permission', caseId: 'open-artifacts', proposalId: 'reuse-receipt', title: 'A working link is not permission', messages: [
    { id: 'o1', authorId: 'nia', kind: 'question', sequence: 'Illustrative day 1 · opening', text: 'Could a stranger decide whether to try an artifact from a short reuse receipt? I drafted separate fields for access, environment, license, and expected output.' },
    { id: 'o2', authorId: 'jo', parentId: 'o1', kind: 'contribution', sequence: 'Illustrative day 2 · reader walk-through', text: 'In the fictional walk-through I could follow the access steps, but the license field was blank. I stopped there instead of treating a downloadable file as permission to reuse it.' },
    { id: 'o3', authorId: 'mira', parentId: 'o2', kind: 'dissent', sequence: 'Illustrative day 3 · challenge', text: 'Then the overall green badge is misleading. It collapses separate checks into something that looks like certification. Could the receipt show the blocker without scoring the artifact?' },
    { id: 'o4', authorId: 'nia', parentId: 'o3', kind: 'revision', sequence: 'Illustrative day 4 · design revision', text: 'Removed the badge. “Reachable; reuse permission unknown” is the result. A license-aware reader would help us test whether the smaller receipt changes the right next action.' },
  ] },
];
/** These small allocations are fictional interest signals, never money or minted certificates. */
export const DEMO_SUPPORT = [
  { personId: 'ellis', proposalId: 'split-check', points: 2 }, { personId: 'jo', proposalId: 'split-check', points: 1 },
  { personId: 'tomas', proposalId: 'duration-note', points: 2 }, { personId: 'mira', proposalId: 'reuse-receipt', points: 1 },
];
export function demoThreadHref(threadId: string): string { return `/lab/demo/?discussion=${encodeURIComponent(threadId)}#demo-discussion-${encodeURIComponent(threadId)}`; }
export const DEMO_NOTIFICATIONS = [
  { id: 'revision-ready', actorId: 'mira', threadId: 'split-boundary', label: 'Ada narrowed the leakage check after a false alarm.', action: 'Inspect the revised test', href: demoThreadHref('split-boundary') },
  { id: 'denominator-help', actorId: 'sana', threadId: 'duration-denominator', label: 'Marie kept an unknown instead of estimating missing hours.', action: 'Review the evidence gap', href: demoThreadHref('duration-denominator') },
  { id: 'receipt-blocker', actorId: 'nia', threadId: 'receipt-permission', label: 'Leonardo removed the green badge from the reuse receipt.', action: 'Read the design revision', href: demoThreadHref('receipt-permission') },
];
export function demoCasesFor(context?: DemoContext, caseId?: DemoCaseId) { return DEMO_CASES.filter(c => (!caseId || c.id === caseId) && (!context || c.contexts.includes(context))); }

export const DEMO_MODE_KEY = 'app-demo:mode:v1';
export const DEMO_POINT_BUDGET = 5;
export const DEMO_MAX_REPLIES = 100;
export type DemoStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type DemoResult = { ok: boolean; error?: string };
export interface DemoReply { id: string; threadId: string; parentId?: string; authorId: 'demo-visitor'; text: string }
export interface DemoState { version: 1; scope: string; replies: DemoReply[]; follows: string[]; saves: string[]; allocations: Record<string, number>; read: string[]; dismissed: string[] }
export type DemoAction =
  | { type: 'reply'; threadId: string; parentId?: string; text: string }
  | { type: 'follow'; personId: string }
  | { type: 'save'; threadId: string }
  | { type: 'allocate'; proposalId: string; delta: 1 | -1 }
  | { type: 'read' | 'dismiss'; notificationId: string };
export function demoStorageKey(scope = 'browser') { return `app-demo:community:v1:${encodeURIComponent(scope)}`; }
export function emptyDemoState(scope = 'browser'): DemoState { return { version: 1, scope, replies: [], follows: [], saves: [], allocations: {}, read: [], dismissed: [] }; }
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Could not save demo changes.';
const requireValid = (condition: unknown, message = 'Invalid demo data. The original has not been overwritten.'): void => { if (!condition) throw new Error(message); };
function validText(text: unknown): text is string { return typeof text === 'string' && text.trim().length > 0 && text.length <= 2000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text); }
function parseDemoState(raw: string, scope: string): DemoState {
  requireValid(raw.length <= 250_000);
  const v = JSON.parse(raw) as DemoState;
  requireValid(v && typeof v === 'object' && v.version === 1 && v.scope === scope);
  const keys = ['version', 'scope', 'replies', 'follows', 'saves', 'allocations', 'read', 'dismissed'];
  requireValid(Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k)));
  const ids = (value: unknown, allowed: readonly string[]) => Array.isArray(value) && value.length <= allowed.length && new Set(value).size === value.length && value.every(x => typeof x === 'string' && allowed.includes(x));
  requireValid(ids(v.follows, DEMO_PEOPLE.map(p => p.id)) && ids(v.saves, DEMO_THREADS.map(t => t.id)) && ids(v.read, DEMO_NOTIFICATIONS.map(n => n.id)) && ids(v.dismissed, DEMO_NOTIFICATIONS.map(n => n.id)));
  requireValid(v.allocations && typeof v.allocations === 'object' && !Array.isArray(v.allocations));
  requireValid(Object.entries(v.allocations).every(([id, n]) => DEMO_PROPOSALS.some(p => p.id === id) && Number.isInteger(n) && n >= 0 && n <= DEMO_POINT_BUDGET));
  requireValid(Object.values(v.allocations).reduce((a, b) => a + b, 0) <= DEMO_POINT_BUDGET);
  requireValid(Array.isArray(v.replies) && v.replies.length <= DEMO_MAX_REPLIES);
  const seen = new Map<string, string>();
  for (const r of v.replies) {
    requireValid(r && typeof r === 'object' && Object.keys(r).every(k => ['id', 'threadId', 'parentId', 'authorId', 'text'].includes(k)));
    const thread = DEMO_THREADS.find(t => t.id === r.threadId);
    requireValid(thread && r.authorId === 'demo-visitor' && typeof r.id === 'string' && /^local-reply-\d+$/.test(r.id) && !seen.has(r.id) && validText(r.text));
    requireValid(r.parentId === undefined || thread?.messages.some(m => m.id === r.parentId) || seen.get(r.parentId) === r.threadId);
    seen.set(r.id, r.threadId);
  }
  return v;
}
export function loadDemoState(storage: DemoStorage, scope = 'browser'): { state: DemoState; status: 'ok' | 'corrupt' | 'unavailable'; error?: string } {
  let raw: string | null;
  try { raw = storage.getItem(demoStorageKey(scope)); } catch { return { state: emptyDemoState(scope), status: 'unavailable', error: 'Browser storage is unavailable. Demo changes cannot be saved.' }; }
  try { return { state: raw === null ? emptyDemoState(scope) : parseDemoState(raw, scope), status: 'ok' }; }
  catch { return { state: emptyDemoState(scope), status: 'corrupt', error: 'Saved demo data could not be read. It is preserved; reset the demo explicitly to start over.' }; }
}
export function saveDemoState(storage: DemoStorage, state: DemoState): DemoResult {
  try {
    const current = loadDemoState(storage, state.scope); requireValid(current.status === 'ok', current.error);
    const raw = JSON.stringify(state); parseDemoState(raw, state.scope);
    storage.setItem(demoStorageKey(state.scope), raw);
    requireValid(storage.getItem(demoStorageKey(state.scope)) === raw, 'Demo storage did not confirm the save. Keep your text and retry.');
    return { ok: true };
  } catch (e) { return { ok: false, error: errorText(e) }; }
}
export function loadDemoMode(storage: DemoStorage, initialMode: DemoMode = 'demo'): { mode: DemoMode; error?: string } {
  try { const raw = storage.getItem(DEMO_MODE_KEY); if (raw === null) return { mode: initialMode }; if (raw === 'demo' || raw === 'live') return { mode: raw }; return { mode: 'live', error: 'Demo preference could not be read. Examples are hidden until you choose a mode.' }; }
  catch { return { mode: 'live', error: 'Browser storage is unavailable. Examples are hidden; mode changes cannot persist.' }; }
}
export function saveDemoMode(storage: DemoStorage, mode: DemoMode): DemoResult {
  try { requireValid(mode === 'demo' || mode === 'live'); storage.setItem(DEMO_MODE_KEY, mode); requireValid(storage.getItem(DEMO_MODE_KEY) === mode); return { ok: true }; }
  catch { return { ok: false, error: 'Could not remember your view preference in this browser.' }; }
}
/** Only the selected demo event key is removed. The global mode preference is deliberately retained. */
export function resetDemoState(storage: DemoStorage, scope: string, confirmed: boolean): DemoResult {
  if (!confirmed) return { ok: false, error: 'Confirm before resetting demo changes.' };
  try { storage.removeItem(demoStorageKey(scope)); requireValid(storage.getItem(demoStorageKey(scope)) === null); return { ok: true }; }
  catch { return { ok: false, error: 'Demo reset could not be confirmed. No real drafts were touched.' }; }
}
const toggle = (values: string[], value: string) => values.includes(value) ? values.filter(x => x !== value) : [...values, value];
export function reduceDemoState(state: DemoState, action: DemoAction): DemoState {
  const next = parseDemoState(JSON.stringify(state), state.scope);
  switch (action.type) {
    case 'reply': {
      const thread = DEMO_THREADS.find(t => t.id === action.threadId);
      requireValid(thread, 'Choose an existing demo discussion.');
      requireValid(validText(action.text), 'Write 1–2,000 characters for your local demo reply.');
      requireValid(next.replies.length < DEMO_MAX_REPLIES, 'This demo has reached its 100-reply limit. Reset to start over.');
      requireValid(!action.parentId || thread?.messages.some(m => m.id === action.parentId) || next.replies.some(r => r.threadId === action.threadId && r.id === action.parentId), 'Reply target must belong to this discussion.');
      const seq = Math.max(0, ...next.replies.map(r => Number(r.id.slice('local-reply-'.length)))) + 1;
      next.replies.push({ id: `local-reply-${seq}`, threadId: action.threadId, ...(action.parentId ? { parentId: action.parentId } : {}), authorId: 'demo-visitor', text: action.text.trim() }); break;
    }
    case 'follow': requireValid(DEMO_PEOPLE.some(p => p.id === action.personId)); next.follows = toggle(next.follows, action.personId); break;
    case 'save': requireValid(DEMO_THREADS.some(t => t.id === action.threadId)); next.saves = toggle(next.saves, action.threadId); break;
    case 'allocate': {
      requireValid(DEMO_PROPOSALS.some(p => p.id === action.proposalId) && (action.delta === 1 || action.delta === -1));
      const value = (next.allocations[action.proposalId] || 0) + action.delta;
      requireValid(value >= 0 && (action.delta < 0 || demoPointsRemaining(next) > 0), 'No demo points remain. Reclaim a point before allocating elsewhere.');
      next.allocations[action.proposalId] = value; break;
    }
    case 'read': case 'dismiss': {
      requireValid(DEMO_NOTIFICATIONS.some(n => n.id === action.notificationId)); const key = action.type === 'read' ? 'read' : 'dismissed';
      next[key] = [...new Set([...next[key], action.notificationId])]; break;
    }
    default: throw new Error('Unknown demo action.');
  }
  return parseDemoState(JSON.stringify(next), state.scope);
}
export function demoPointsRemaining(state: DemoState) { return DEMO_POINT_BUDGET - Object.values(state.allocations).reduce((sum, points) => sum + points, 0); }
export function demoUnread(state: DemoState) { return DEMO_NOTIFICATIONS.filter(n => !state.read.includes(n.id) && !state.dismissed.includes(n.id)); }
export function demoCounts(state: DemoState, caseId?: DemoCaseId, context?: DemoContext) {
  const caseIds = new Set(demoCasesFor(context, caseId).map(c => c.id));
  const threads = DEMO_THREADS.filter(t => caseIds.has(t.caseId));
  const proposalIds = new Set<string>(DEMO_PROPOSALS.filter(p => caseIds.has(p.caseId)).map(p => p.id));
  return {
    people: DEMO_PEOPLE.filter(p => p.caseIds.some(id => caseIds.has(id))).length,
    discussions: threads.length,
    messages: threads.reduce((sum, t) => sum + t.messages.length + state.replies.filter(r => r.threadId === t.id).length, 0),
    points: DEMO_SUPPORT.filter(a => proposalIds.has(a.proposalId)).reduce((sum, a) => sum + a.points, 0) + Object.entries(state.allocations).filter(([id]) => proposalIds.has(id)).reduce((sum, [, n]) => sum + n, 0),
  };
}
