import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { source } from './velocity/test-source-loader.mjs';
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility' });
for (const k of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent']) globalThis[k] = dom.window[k];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.fetch = () => { throw Error('No network allowed'); };
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
let root;
const text = () => document.body.textContent;
const button = name => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === name);
async function click(name) { const b = button(name); assert.ok(b, name); assert.equal(b.disabled, false); await act(async () => b.click()); }
async function input(id, value) {
  const el = document.getElementById(id); assert.ok(el, id);
  await act(async () => {
    const proto = el.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : HTMLTextAreaElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}
async function mount(props = {}) {
  root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(source('components/lab/BottleneckWorkbench.tsx').default, props)));
}
async function unmount() { await act(async () => root.unmount()); }

test('quota failure never leaves a saved status and oversized multibyte recovery stays bounded', async () => {
  const m = source('lib/lab-bottlenecks.ts');
  window.localStorage.clear();
  const d = m.createBottleneckDraft('reproducibility');
  window.localStorage.setItem(m.bottleneckDraftKey(d), '🧪'.repeat(15000));
  await mount();
  assert.match(document.querySelector('[role="alert"]').textContent, /Oversized data remains/);
  assert.equal(document.querySelector('textarea[readonly]'), null);
  await unmount();
  window.localStorage.clear(); await mount();
  await input('bottleneck-hypothesis', 'Saved first');
  const oldSet = dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.setItem = () => { throw Error('Quota exceeded'); };
  try {
    await input('bottleneck-hypothesis', 'Not saved second');
    assert.match(document.querySelector('[role="status"]').textContent, /not saved/i);
    assert.equal(JSON.parse(window.localStorage.getItem(m.bottleneckDraftKey(d))).fields.hypothesis, 'Saved first');
  } finally { dom.window.Storage.prototype.setItem = oldSet; await unmount(); }
});

test('incomplete drafts autosave before a mode switch or reload', async () => {
  window.localStorage.clear();
  await mount();
  await input('bottleneck-hypothesis', 'Retain this incomplete idea');
  await click('Refine diagnosis'); await click('Design intervention');
  assert.equal(document.getElementById('bottleneck-hypothesis').value, 'Retain this incomplete idea');
  await unmount(); await mount();
  assert.equal(document.getElementById('bottleneck-hypothesis').value, 'Retain this incomplete idea');
  await unmount();
});

test('callback prepares a contribution without publishing; corrupt storage is preserved and blocked storage is honest', async () => {
  const m = source('lib/lab-bottlenecks.ts');
  const d = m.createBottleneckDraft('reproducibility');
  window.localStorage.clear();
  window.localStorage.setItem(m.bottleneckDraftKey(d), JSON.stringify({ ...d, sourceRevision: 'old' }));
  await mount();
  assert.match(text(), /original was not overwritten/);
  assert.equal(button('Save local draft').disabled, true);
  assert.ok(document.querySelector('textarea[readonly]'));
  await unmount();
  assert.equal(JSON.parse(window.localStorage.getItem(m.bottleneckDraftKey(d))).sourceRevision, 'old');
  window.localStorage.clear();
  let prepared;
  await mount({ onPrepareContribution: initial => { prepared = initial; } });
  for (const f of m.PROPOSAL_FIELDS) await input(`bottleneck-${f.key}`, `Proposed ${f.key}.`);
  await click('Prepare contribution draft');
  assert.equal(prepared.targetUrl, 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility');
  assert.match(prepared.observation, /not executed or published/);
  await unmount();
  const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw Error('Storage blocked'); } });
  try {
    await mount(); assert.match(text(), /storage is unavailable/);
    await input('bottleneck-hypothesis', 'Still editable'); await click('Save local draft');
    assert.match(document.querySelector('[role="alert"]').textContent, /Not saved/);
    assert.equal(document.getElementById('bottleneck-hypothesis').value, 'Still editable');
    await unmount();
  } finally { Object.defineProperty(window, 'localStorage', descriptor); }
});

test('URL field filters and Back/Forward are authoritative; owners and proposal kinds stay isolated', async () => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/lab/bottlenecks/?case=reproducibility&field=ai-robotics');
  await mount({ owner: 'alpha' });
  await input('bottleneck-hypothesis', 'Alpha intervention'); await click('Save local draft');
  await click('Refine diagnosis');
  assert.equal(document.getElementById('bottleneck-hypothesis').value, '');
  await input('bottleneck-hypothesis', 'Alpha refinement'); await click('Save local draft');
  await click('Design intervention');
  assert.equal(document.getElementById('bottleneck-hypothesis').value, 'Alpha intervention');
  await input('bottleneck-field', 'neurotech');
  assert.match(text(), /No editorial case matches/);
  assert.equal(document.querySelector('textarea'), null);
  assert.equal(new URL(window.location.href).searchParams.get('field'), 'neurotech');
  await act(async () => { const done = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true })); window.history.back(); await done; });
  assert.equal(document.getElementById('bottleneck-field').value, 'ai-robotics');
  assert.equal(document.getElementById('bottleneck-hypothesis').value, 'Alpha intervention');
  await act(async () => { const done = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true })); window.history.forward(); await done; });
  assert.match(text(), /No editorial case matches/);
  await unmount();
  window.history.replaceState(null, '', '/lab/bottlenecks/?case=reproducibility');
  await mount({ owner: 'beta' });
  assert.equal(document.getElementById('bottleneck-hypothesis').value, '');
  await unmount();
});

test('mounted proposal saves, survives reload, and downloads the actual version-linked JSON', async () => {
  window.localStorage.clear();
  await mount();
  assert.match(text(), /Editorial starter/);
  assert.match(text(), /not live/);
  assert.match(text(), /No notebook has been audited/);
  await click('Export proposal JSON');
  assert.match(document.querySelector('[role="alert"]').textContent, /Complete every/);
  const m = source('lib/lab-bottlenecks.ts');
  for (const f of m.PROPOSAL_FIELDS) await input(`bottleneck-${f.key}`, `Proposed ${f.key}, including a negative result.`);
  await click('Save local draft');
  assert.match(text(), /Saved on this device/);
  await unmount(); await mount();
  assert.equal(document.getElementById('bottleneck-hypothesis').value, 'Proposed hypothesis, including a negative result.');
  let blob, filename;
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL, oldClick = dom.window.HTMLAnchorElement.prototype.click;
  URL.createObjectURL = value => { blob = value; return 'blob:packet'; };
  URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = function () { filename = this.download; };
  try {
    await click('Export proposal JSON');
    assert.equal(filename, 'open-lab-reproducibility-intervention.json');
    const packet = JSON.parse(await blob.text());
    assert.equal(packet.target.caseId, 'reproducibility');
    assert.equal(packet.proposal.fields.risks, 'Proposed risks, including a negative result.');
    assert.equal(packet.execution, 'not-executed');
    assert.equal(packet.publication, 'not-published');
  } finally { URL.createObjectURL = create; URL.revokeObjectURL = revoke; dom.window.HTMLAnchorElement.prototype.click = oldClick; }
  assert.match(document.querySelector('[data-baseline]').textContent, /When preprocessing learns from held-out data/);
  await unmount();
});
