import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { source } from './velocity/test-source-loader.mjs';
const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.plrd.org/lab/bottlenecks/?case=reproducibility' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent']) globalThis[key] = dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const Component = source('components/lab/BottleneckWorkbench.tsx').default;
test('proposal progressively reveals three coherent steps without unmounting or losing draft fields', async () => {
  window.localStorage.clear();
  let root = createRoot(document.getElementById('root'));
  const render = async () => React.act(async () => root.render(React.createElement(Component)));
  await render();
  try {
    const steps = [...document.querySelectorAll('[data-proposal-step]')];
    assert.equal(steps.length, 3, 'Three manageable steps replace eight always-expanded fields');
    assert.equal(steps[0].open, true);
    assert.equal(steps[1].open, false);
    assert.equal(steps[2].open, false);
    assert.equal(document.querySelectorAll('.bottleneck-proposal textarea:not([readonly])').length, 8);
    const hypothesis = document.getElementById('bottleneck-hypothesis');
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(hypothesis, 'A compact synthetic proposal');
      hypothesis.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.match(document.querySelector('[data-proposal-progress]').textContent, /1 of 8/);
    steps[0].open = false; steps[1].open = true;
    assert.equal(hypothesis.value, 'A compact synthetic proposal');
    await React.act(async () => root.unmount());
    root = createRoot(document.getElementById('root'));
    await render();
    assert.equal(document.getElementById('bottleneck-hypothesis').value, 'A compact synthetic proposal');
    assert.match(document.querySelector('[data-proposal-progress]').textContent, /1 of 8/);
    assert.ok(document.querySelector('[data-baseline] details'), 'Source context is reachable through progressive disclosure');
  } finally { await React.act(async () => root.unmount()); }
});
