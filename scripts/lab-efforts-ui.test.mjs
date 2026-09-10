import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { source } from './velocity/test-source-loader.mjs';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://local.test/lab/efforts/' });
for (const name of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent']) globalThis[name] = dom.window[name];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Any component-initiated request fails the test immediately.
globalThis.fetch = () => { throw Error('Network is forbidden in this local experiment'); };
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { act } = React;
let root;
const text = () => document.body.textContent;
const button = name => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === name || b.getAttribute('aria-label') === name);
async function click(name) {
  const b = button(name); assert.ok(b, `button: ${name}`); assert.equal(b.disabled, false);
  await act(async () => b.click());
}
async function input(id, value) {
  const el = document.getElementById(id); assert.ok(el, id);
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function mount() {
  const Component = source('components/lab/EffortBacking.tsx').default;
  root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(Component)));
}
async function unmount() { await act(async () => root.unmount()); }

test('real actions allocate, reject overspend, reclaim, shift and reload locally', async () => {
  window.localStorage.clear();
  await mount();
  assert.match(text(), /Local allocation experiment; no money, global vote, or funding commitment/);
  assert.match(text(), /100 points available/);
  assert.match(text(), /Proposed work scope/);
  assert.match(text(), /Acceptance criterion/);
  assert.match(text(), /If it fails/);
  await input('effort-support', '80'); await click('Set support');
  assert.match(text(), /20 points available/);
  await click('Inspect Trace a source claim');
  await input('effort-support', '21'); await click('Set support');
  assert.match(document.querySelector('[role="alert"]').textContent, /budget/i);
  assert.ok(document.querySelector('.effort-support-form [role="alert"]'), 'budget error belongs beside support controls');
  assert.match(text(), /20 points available/);
  await input('effort-support', '20'); await click('Set support');
  assert.match(text(), /0 points available/);
  assert.equal(button('Add one point').disabled, true);
  await click('Reclaim support');
  assert.match(text(), /20 points available/);
  await click('Inspect Improve a reusable notebook');
  await input('effort-support', '20'); await click('Set support');
  await input('effort-support', '1.5'); await click('Set support');
  assert.match(document.querySelector('[role="alert"]').textContent, /whole number/i);
  assert.match(text(), /0 points available/);
  await unmount(); await mount();
  assert.match(text(), /0 points available/);
  assert.equal(document.getElementById('effort-support').value, '80');
  await unmount();
});

test('evidence saves without support, unsafe URLs fail, export downloads actual JSON', async () => {
  window.localStorage.clear(); await mount();
  await input('effort-evidence-url', 'javascript:alert(1)');
  await input('effort-evidence-summary', 'This needs independent review.');
  await click('Save local evidence');
  assert.match(document.querySelector('[role="alert"]').textContent, /http\(s\)/);
  await input('effort-evidence-url', 'https://example.org/result');
  await click('Save local evidence');
  assert.match(text(), /100 points available/);
  const link = document.querySelector('a[href="https://example.org/result"]');
  assert.ok(link); assert.match(link.rel, /noopener/); assert.match(link.rel, /noreferrer/);
  let blob; let download;
  const oldCreate = URL.createObjectURL; const oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = value => { blob = value; return 'blob:local-test'; };
  URL.revokeObjectURL = () => {};
  const oldClick = dom.window.HTMLAnchorElement.prototype.click;
  dom.window.HTMLAnchorElement.prototype.click = function () { download = this.download; };
  try {
    await click('Export portfolio JSON');
    assert.equal(download, 'open-lab-effort-portfolio.json');
    const exported = JSON.parse(await blob.text());
    assert.equal(exported.portfolio.evidence['reproduce-tutorial'].summary, 'This needs independent review.');
    assert.equal(exported.portfolio.allocations['reproduce-tutorial'], 0);
  } finally {
    URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke;
    dom.window.HTMLAnchorElement.prototype.click = oldClick;
  }
  await unmount(); await mount();
  assert.equal(document.getElementById('effort-evidence-url').value, 'https://example.org/result');
  await unmount();
});

test('corrupt or unavailable storage is visible, never a crash or false save claim', async () => {
  const { STORAGE_KEY } = source('lib/lab-efforts.ts');
  window.localStorage.setItem(STORAGE_KEY, '{"broken":true}');
  await mount(); assert.match(text(), /invalid.*ignored/i); assert.match(text(), /100 points available/); await unmount();
  const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw Error('blocked'); } });
  try {
    await mount(); assert.match(text(), /storage is unavailable/i);
    await click('Add one point'); assert.match(text(), /99 points available/);
    assert.match(text(), /not saved/i);
    await unmount();
  } finally { Object.defineProperty(window, 'localStorage', descriptor); }
});
