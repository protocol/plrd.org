import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { source } from './velocity/test-source-loader.mjs';

function memoryStorage() { const values = new Map(); return { values, getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) }; }
const load = () => { assert.ok(existsSync('src/lib/lab-demo.ts'), 'demo fixture module must exist'); return source('lib/lab-demo.ts'); };
test('fictional community has coherent people, cases, proposals, threaded evidence and route targets', () => {
  const d = load();
  assert.equal(d.DEMO_PEOPLE.length, 6);
  assert.deepEqual(d.DEMO_CASES.map(x => x.id), ['reproducibility', 'neural-measurement', 'open-artifacts']);
  const people = new Set(d.DEMO_PEOPLE.map(x => x.id));
  const cases = new Set(d.DEMO_CASES.map(x => x.id));
  const proposals = new Set(d.DEMO_PROPOSALS.map(x => x.id));
  const threads = new Set(d.DEMO_THREADS.map(x => x.id));
  assert.equal(people.size, 6);
  for (const p of d.DEMO_PEOPLE) { assert.equal(p.fictional, true); assert.ok(p.role && p.bio); }
  for (const p of d.DEMO_PROPOSALS) { assert.ok(cases.has(p.caseId)); assert.ok(people.has(p.authorId)); assert.ok(p.test && p.stop && p.revision); }
  for (const t of d.DEMO_THREADS) {
    assert.ok(cases.has(t.caseId)); assert.ok(proposals.has(t.proposalId));
    const seen = new Set();
    for (const m of t.messages) { assert.ok(people.has(m.authorId)); if(m.parentId) assert.ok(seen.has(m.parentId)); seen.add(m.id); assert.match(m.sequence, /^Illustrative day /); }
    assert.equal(seen.size, t.messages.length);
    const url = new URL(d.demoThreadHref(t.id), 'https://example.test');
    assert.equal(url.pathname, '/lab/demo/'); assert.equal(url.searchParams.get('discussion'), t.id);
  }
  for (const n of d.DEMO_NOTIFICATIONS) { assert.ok(threads.has(n.threadId)); assert.ok(people.has(n.actorId)); assert.equal(n.href, d.demoThreadHref(n.threadId)); }
  for (const a of d.DEMO_SUPPORT) { assert.ok(people.has(a.personId)); assert.ok(proposals.has(a.proposalId)); assert.ok(a.points > 0 && a.points <= 3); }
  const all = JSON.stringify([d.DEMO_PEOPLE,d.DEMO_THREADS,d.DEMO_PROPOSALS]);
  assert.doesNotMatch(all, /did:|at:\/\/|linkedin\.com|scholar\.google|https?:\/\/.*\.(png|jpg)/);
  assert.ok(d.DEMO_THREADS.flatMap(t => t.messages).some(m => m.kind === 'dissent'));
  assert.ok(d.DEMO_THREADS.flatMap(t => t.messages).some(m => m.kind === 'uncertain'));
});

test('demo actions persist in an isolated scope, count fixture + local events, and reset preserves real drafts', () => {
  const d = load(); const store = memoryStorage();
  assert.equal(typeof d.emptyDemoState, 'function', 'local demo reducer must exist');
  store.setItem('open-lab:draft:real-owner:note', 'precious real draft');
  let state = d.emptyDemoState('alpha');
  state = d.reduceDemoState(state, {type:'reply', threadId:'split-boundary', parentId:'r6', text:'  I can try the narrow check.  '});
  state = d.reduceDemoState(state, {type:'save', threadId:'split-boundary'});
  state = d.reduceDemoState(state, {type:'follow', personId:'mira'});
  state = d.reduceDemoState(state, {type:'allocate', proposalId:'split-check', delta:1});
  state = d.reduceDemoState(state, {type:'read', notificationId:'revision-ready'});
  state = d.reduceDemoState(state, {type:'dismiss', notificationId:'denominator-help'});
  assert.equal(d.saveDemoState(store, state).ok, true);
  assert.deepEqual(d.loadDemoState(store,'alpha').state,state);
  assert.equal(d.loadDemoState(store,'beta').state.replies.length,0);
  assert.equal(state.replies[0].authorId,'demo-visitor');
  assert.equal(state.replies[0].text,'I can try the narrow check.');
  const counts = d.demoCounts(state,'reproducibility');
  assert.equal(counts.people, d.DEMO_PEOPLE.filter(p=>p.caseIds.includes('reproducibility')).length);
  assert.equal(counts.messages, d.DEMO_THREADS.filter(t=>t.caseId==='reproducibility').reduce((n,t)=>n+t.messages.length,0)+1);
  assert.equal(counts.points, d.DEMO_SUPPORT.filter(a=>a.proposalId==='split-check').reduce((n,a)=>n+a.points,0)+1);
  assert.equal(d.demoUnread(state).length,1);
  assert.equal(d.saveDemoMode(store,'live').ok,true);
  assert.equal(d.loadDemoMode(store,'demo').mode,'live');
  assert.equal(d.resetDemoState(store,'alpha',false).ok,false);
  assert.equal(d.loadDemoState(store,'alpha').state.replies.length,1);
  assert.equal(d.resetDemoState(store,'alpha',true).ok,true);
  assert.equal(d.loadDemoState(store,'alpha').state.replies.length,0);
  assert.equal(store.getItem('open-lab:draft:real-owner:note'),'precious real draft');
  assert.equal(d.loadDemoMode(store,'demo').mode,'live');
  assert.ok([...store.values.keys()].filter(k=>k!=='open-lab:draft:real-owner:note').every(k=>k.startsWith('app-demo:')));
});

test('malformed, mismatched, oversized, blocked storage and invalid actions fail safely', () => {
  const d=load(); const store=memoryStorage(); const key=d.demoStorageKey('alpha');
  store.setItem(key,'{broken');
  assert.equal(d.loadDemoState(store,'alpha').status,'corrupt');
  assert.equal(d.saveDemoState(store,d.emptyDemoState('alpha')).ok,false);
  assert.equal(store.getItem(key),'{broken');
  store.setItem(key,JSON.stringify(d.emptyDemoState('beta')));
  assert.equal(d.loadDemoState(store,'alpha').status,'corrupt');
  store.setItem(key,'x'.repeat(260000));
  assert.equal(d.loadDemoState(store,'alpha').status,'corrupt');
  const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('quota')},removeItem(){throw Error('blocked')}};
  assert.equal(d.loadDemoState(blocked,'alpha').status,'unavailable');
  assert.equal(d.saveDemoMode(blocked,'live').ok,false);
  assert.equal(d.resetDemoState(blocked,'alpha',true).ok,false);
  let state=d.emptyDemoState('alpha');
  for(const action of [
    {type:'reply',threadId:'missing',text:'hello'}, {type:'reply',threadId:'split-boundary',parentId:'n1',text:'wrong parent'},
    {type:'reply',threadId:'split-boundary',text:' '}, {type:'reply',threadId:'split-boundary',text:'a'.repeat(2001)},
    {type:'follow',personId:'unknown'}, {type:'read',notificationId:'unknown'}, {type:'allocate',proposalId:'missing',delta:1},
  ]) assert.throws(()=>d.reduceDemoState(state,action));
  for(let i=0;i<d.DEMO_POINT_BUDGET;i++) state=d.reduceDemoState(state,{type:'allocate',proposalId:'split-check',delta:1});
  assert.throws(()=>d.reduceDemoState(state,{type:'allocate',proposalId:'duration-note',delta:1}));
  state=d.reduceDemoState(state,{type:'allocate',proposalId:'split-check',delta:-1});
  assert.equal(d.demoPointsRemaining(state),1);
});
