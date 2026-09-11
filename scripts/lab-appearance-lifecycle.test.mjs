import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import React, { act, useLayoutEffect } from 'react';
import { source } from './velocity/test-source-loader.mjs';
const require = createRequire(import.meta.url);
require.extensions['.css'] = m => { m.exports = new Proxy({}, {get: (_, p) => p === '__esModule' ? false : String(p)}); };
const dom = new JSDOM('<div id="root"></div>', { url: 'https://lab.example.org/about/' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'StorageEvent', 'localStorage', 'sessionStorage']) globalThis[key] = dom.window[key];
globalThis.self = window;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
window.HTMLDialogElement.prototype.close = function() { this.open = false; };
const { createRoot } = await import('react-dom/client');
const { PathnameContext } = require('next/dist/shared/lib/hooks-client-context.shared-runtime');
const auth = source('lib/lab-identity.ts');
const Shell = source('components/lab/LabShell.tsx').default;
const boot = readFileSync('src/app/layout.tsx', 'utf8').match(/__html:\s*`([^`]+)`/)[1];
const isDark = () => document.documentElement.classList.contains('dark');
let root, osDark, atCommit;
function CommitProbe() {
  // Sibling layout effects run after the shell's, but BEFORE passive effects.
  // This catches fixing navigation only after the first app frame has painted.
  useLayoutEffect(() => { atCommit.push(isDark()); });
  return null;
}
async function navigate(path = '/lab/', strict = false) {
  window.history.replaceState(null, '', path);
  const content = React.createElement(PathnameContext.Provider, { value: path },
    React.createElement(Shell, null, React.createElement('h1', null, 'Appearance lifecycle probe')),
    React.createElement(CommitProbe));
  await act(async () => { root.render(strict ? React.createElement(React.StrictMode, null, content) : content); });
}
async function leave() {
  window.history.replaceState(null, '', '/about/');
  await act(() => root.render(null));
}
async function toggle() {
  const button = document.querySelector('button[aria-label^="Switch to "]');
  assert.ok(button);
  await act(() => button.click());
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('open-lab:welcome:v2', 'seen');
  document.documentElement.classList.remove('dark'); window.history.replaceState(null, '', '/about/');
  osDark = true; atCommit = [];
  window.matchMedia = () => ({ matches: osDark, addEventListener() {}, removeEventListener() {} });
  mock.method(auth, 'useLabIdentity', () => ({ isLoading: false, isAuthenticated: false, session: null, error: null }));
  mock.method(globalThis, 'fetch', async path => {
    assert.equal(path, '/api/lab/capabilities/');
    return Response.json({ canSignIn: false, canPublish: false, mode: 'unconfigured' });
  });
  root = createRoot(document.getElementById('root'));
});
afterEach(async () => { await act(() => root.unmount()); mock.restoreAll(); });

test('dark marketing → Lab is light during layout commit, stays light within Lab, then restores OS on exit', async () => {
  runInNewContext(boot, { window, document, localStorage }); assert.equal(isDark(), true);
  await navigate(); assert.deepEqual(atCommit, [false], 'Not a passive-effect-only theme correction');
  assert.equal(isDark(), false); assert.equal(localStorage.getItem('theme'), null);
  assert.ok(document.querySelector('[aria-label="Switch to dark mode"]'));
  await navigate('/lab/feed/'); assert.equal(isDark(), false);
  await leave(); assert.equal(isDark(), true); assert.equal(localStorage.getItem('theme'), null);
});
test('direct Lab load restores current marketing OS, not the light class captured at mount', async () => {
  window.history.replaceState(null, '', '/lab/');
  runInNewContext(boot, { window, document, localStorage }); assert.equal(isDark(), false);
  await navigate(); osDark = false; await leave(); assert.equal(isDark(), false);
  await navigate(); osDark = true; await leave(); assert.equal(isDark(), true);
});
for (const saved of ['light', 'dark']) {
  test(`saved explicit ${saved} wins over inherited DOM and OS on mount and unmount`, async () => {
    localStorage.setItem('theme', saved); document.documentElement.classList.toggle('dark', saved !== 'dark');
    osDark = saved !== 'dark';
    await navigate(); assert.deepEqual(atCommit, [saved === 'dark']);
    assert.equal(isDark(), saved === 'dark');
    await leave(); assert.equal(isDark(), saved === 'dark'); assert.equal(localStorage.getItem('theme'), saved);
  });
}
test('appearance button persists only the explicit choice and keeps it when leaving or reentering', async () => {
  await navigate(); await toggle(); assert.equal(isDark(), true); assert.equal(localStorage.getItem('theme'), 'dark');
  await toggle(); assert.equal(isDark(), false); assert.equal(localStorage.getItem('theme'), 'light');
  await leave(); assert.equal(isDark(), false);
  await navigate(); assert.equal(isDark(), false); assert.ok(document.querySelector('[aria-label="Switch to dark mode"]'));
});
test('blocked storage reads do not leave inherited dark on Lab or prevent OS restoration', async () => {
  mock.method(window.Storage.prototype, 'getItem', function(key) { if (key === 'theme') throw Error('Blocked read'); return null; });
  document.documentElement.classList.add('dark');
  await navigate(); assert.equal(isDark(), false); assert.deepEqual(atCommit, [false]);
  await leave(); assert.equal(isDark(), true);
});
test('failed writes keep a just-chosen light appearance on exit, rather than stale saved dark', async () => {
  localStorage.setItem('theme', 'dark');
  mock.method(window.Storage.prototype, 'setItem', function() { throw Error('Quota exceeded'); });
  await navigate(); assert.equal(isDark(), true);
  await toggle(); assert.equal(isDark(), false); assert.equal(localStorage.getItem('theme'), 'dark');
  await leave(); assert.equal(isDark(), false);
});
test('another tab’s explicit choice or removal updates the mounted shell and cleanup', async () => {
  await navigate();
  localStorage.setItem('theme', 'dark');
  await act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark', storageArea: localStorage })));
  assert.equal(isDark(), true); assert.ok(document.querySelector('[aria-label="Switch to light mode"]'));
  localStorage.removeItem('theme');
  await act(() => window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage })));
  assert.equal(isDark(), false); await leave(); assert.equal(isDark(), true);
  // No leaked subscriber after unmount.
  await act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'light', storageArea: localStorage })));
  assert.equal(isDark(), true);
});
test('StrictMode setup/cleanup/setup keeps the implicit default scoped and never writes a choice', async () => {
  document.documentElement.classList.add('dark');
  await navigate('/lab/', true); assert.ok(atCommit.length >= 2); assert.ok(atCommit.every(dark => !dark));
  assert.equal(isDark(), false); assert.equal(localStorage.getItem('theme'), null);
  await leave(); assert.equal(isDark(), true);
});
