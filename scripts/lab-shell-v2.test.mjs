import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { source } from './velocity/test-source-loader.mjs';
process.env.__NEXT_TRAILING_SLASH = 'true';
const require = createRequire(import.meta.url);
require.extensions['.css'] = m => { m.exports = new Proxy({}, {get: (_, p) => p === '__esModule' ? false : String(p)}); };
const dom = new JSDOM('<div id="root"></div>', {url: 'https://lab.example.org/lab/'});
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'StorageEvent', 'localStorage', 'sessionStorage']) globalThis[key] = dom.window[key];
window.matchMedia = () => ({matches: false, addEventListener(){}, removeEventListener(){}});
globalThis.self = window; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLDialogElement.prototype.showModal = function(){this.open = true;};
window.HTMLDialogElement.prototype.close = function(){this.open = false;};
const { createRoot } = await import('react-dom/client');
const { PathnameContext } = require('next/dist/shared/lib/hooks-client-context.shared-runtime');
// Cross-lane interface only: never install a placeholder in production source.
const gatePath = resolve('src/components/lab/social/LabOnboardingGate.tsx');
const gateIsPending = !existsSync(gatePath);
if (gateIsPending) {
  const Module = require('node:module'); const original = Module._resolveFilename;
  Module._resolveFilename = function(id, ...args) {return id === '@/components/lab/social/LabOnboardingGate' ? gatePath : original.call(this, id, ...args);};
  require.cache[gatePath] = {id:gatePath, filename:gatePath, loaded:true, exports:{__esModule:true, default:() => React.createElement('span', {'data-onboarding-interface':true})}};
}
const auth = source('lib/lab-identity.ts');
let root, identity, loginCalls, configured;
const mount = async (C, props = {}) => act(async () => { root.render(React.createElement(PathnameContext.Provider, {value: window.location.pathname}, React.createElement(C, props))); await new Promise(r => setTimeout(r, 10)); });
const click = async text => { const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text || b.getAttribute('aria-label') === text); assert.ok(el, text); await act(() => el.click()); };
const fill = async (selector, value) => {const el = document.querySelector(selector); assert.ok(el, selector); await act(() => {Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', {bubbles:true}));});};
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); window.history.replaceState(null, '', '/lab/');
  document.documentElement.classList.remove('dark'); document.body.style.overflow = '';
  loginCalls = []; configured = false;
  identity = {isAuthenticated: false, isLoading: false, session: null, error: null, login: async (...args) => {loginCalls.push(args); throw Error('Provider unavailable in test');}};
  mock.method(auth, 'useLabIdentity', () => identity);
  mock.method(globalThis, 'fetch', async path => {assert.ok(['/api/lab/feed/', '/api/lab/capabilities/'].includes(path), `Unexpected network: ${path}`); return Response.json(path.includes('feed') ? {items:[], status:'empty'} : {canSignIn:configured, canPublish:false, mode:configured?'ready':'unconfigured', message:configured?'':'Sign-in is unavailable on this origin.'});});
  root = createRoot(document.getElementById('root'));
});
afterEach(async () => {await act(() => root.unmount()); mock.restoreAll();});

test('action navigation selects one destination, and global search and account remain accessible', async () => {
  const Shell = source('components/lab/LabShell.tsx').default;
  sessionStorage.setItem('open-lab:welcome:v2', 'seen');
  const destinations = [['/lab/', 'Catch up'], ['/lab/bottlenecks/', 'Work on ideas'], ['/lab/apps/', 'Find tools'], ['/lab/explorations/observatory/', 'Explore the tech tree'], ['/lab/collaborate/', 'Contribute'], ['/lab/people/', 'Find people'], ['/lab/profile/', 'My bench']];
  for (const route of ['/lab/', '/lab/feed/', '/lab/bottlenecks/', '/lab/people/', '/lab/explorations/observatory/']) {
    window.history.replaceState(null, '', route); await mount(Shell);
    const nav = document.querySelector('nav[aria-label="Open Lab"]'); assert.ok(nav);
    assert.deepEqual([...nav.querySelectorAll('a')].map(a => [a.getAttribute('href'), a.textContent.trim()]), destinations);
    const selected = nav.querySelectorAll('[aria-current="page"]'); assert.equal(selected.length, 1);
    assert.equal(selected[0].getAttribute('href'), route === '/lab/feed/' ? '/lab/' : route);
  }
  const search = document.querySelector('form[role="search"]'); assert.ok(search);
  for (const route of ['/lab/atlas/', '/lab/efforts/']) {
    window.history.replaceState(null, '', route); await mount(Shell);
    const selected = document.querySelectorAll('#lab-sidebar [aria-current="page"]');
    assert.equal(selected.length, 1); assert.equal(selected[0].getAttribute('href'), route);
  }
  assert.equal(search.getAttribute('action'), '/lab/feed/'); assert.equal(search.getAttribute('method'), 'get');
  assert.ok(search.querySelector('input[name="q"][type="search"][aria-label]'));
  assert.equal(search.querySelector('input').getAttribute('aria-label'), 'Search work');
  assert.equal(search.querySelector('input').getAttribute('placeholder'), 'Search feed ideas, tools, and requests');
  assert.ok(document.querySelector('button[aria-label="Sign in to Open Lab"]'));
  assert.ok(document.querySelector('.lab-header-actions a[href="/lab/profile/"][aria-label="My bench"]'), 'Unsigned people still need a persistent profile control');
  identity = {...identity, isAuthenticated:true, session:{did:'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa',handle:'person.example.org',displayName:'Test person'}};
  await mount(Shell);
  assert.ok(document.querySelector('.lab-header-actions a[aria-label="My bench — Test person"]'));
  const menu = document.querySelector('button[aria-controls="lab-sidebar"]'); assert.ok(menu); assert.equal(menu.getAttribute('aria-expanded'), 'false');
  await act(() => menu.click()); assert.equal(menu.getAttribute('aria-expanded'), 'true');
});

test('single global scope control opens a truthful demo disclosure and switches without touching drafts', async () => {
  const Shell = source('components/lab/LabShell.tsx').default;
  sessionStorage.setItem('open-lab:welcome:v2', 'seen');
  localStorage.setItem('shell-test-real-draft', 'unchanged'); await mount(Shell);
  assert.ok(!document.querySelector('.lab-composition-banner'), 'No page-wide mode banner');
  assert.equal(document.querySelectorAll('[data-lab-scope-control]').length, 1);
  assert.match(document.querySelector('[data-lab-scope-control]').textContent, /Demo.*on/);
  assert.equal(document.querySelector('dialog'), null);
  await act(() => document.querySelector('[data-lab-scope-control]').click());
  const dialog = document.querySelector('dialog'); assert.ok(dialog);
  assert.match(dialog.textContent, /example people and activity/i);
  assert.match(dialog.textContent, /local.*demo|demo.*local/i);
  assert.match(dialog.textContent, /no messages.*sent/i);
  assert.match(dialog.textContent, /not.*scientific evidence/i);
  await click('Show real / empty view');
  assert.match(document.querySelector('[data-lab-scope-control]').textContent, /Demo.*off/);
  assert.equal(localStorage.getItem('shell-test-real-draft'), 'unchanged');
  assert.ok(document.querySelector('.lab-header-actions [aria-label^="Your next actions"]'));
  identity.isLoading = true; await mount(Shell);
  assert.ok(document.querySelector('.lab-header-actions [aria-label="Notifications loading"]'), 'Toolbar keeps its notification affordance while auth settles');
  identity.isLoading = false; await mount(Shell);
  await click('Show demo community');
  assert.ok(document.querySelector('.lab-header-actions [aria-label^="Demo notifications:"]'));
});

test('welcome waits for auth, invites once per session, and never interrupts OAuth return', async () => {
  const Shell = source('components/lab/LabShell.tsx').default;
  identity.isLoading = true; await mount(Shell); assert.ok(!document.querySelector('dialog'));
  identity.isLoading = false; await mount(Shell);
  assert.ok(document.querySelector('dialog'), 'Settled guest gets a real login invitation');
  assert.match(document.querySelector('dialog').textContent, /Continue browsing/);
  await click('Continue browsing');
  await act(() => root.unmount()); root = createRoot(document.getElementById('root'));
  window.history.replaceState(null, '', '/lab/apps/'); await mount(Shell); assert.ok(!document.querySelector('dialog'), 'No repeat on remount or navigation');
  sessionStorage.clear();
  await act(() => root.unmount()); root = createRoot(document.getElementById('root'));
  window.history.replaceState(null, '', '/lab/oauth/return/#code=test&state=test'); await mount(Shell); assert.ok(!document.querySelector('dialog'));
});

test('welcome uses the existing identity API, keeps errors, and fails closed when unconfigured', async () => {
  const Shell = source('components/lab/LabShell.tsx').default;
  await mount(Shell); assert.ok(document.querySelector('dialog'));
  assert.ok(document.querySelector('dialog button[type="submit"]').disabled, 'Unavailable sign-in is not offered as working');
  assert.match(document.querySelector('dialog').textContent, /Sign-in is unavailable on this preview/);
  await fill('input[name="handle"]', 'person.bsky.social');
  await act(async () => {document.querySelector('dialog form').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}));});
  assert.equal(loginCalls.length, 0); assert.match(document.querySelector('dialog').textContent, /unavailable/i);
  await act(() => root.unmount()); root = createRoot(document.getElementById('root')); configured = true;
  await mount(Shell); await click('Sign in to Open Lab');
  await fill('input[name="handle"]', 'person.bsky.social');
  await act(async () => {document.querySelector('dialog form').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}));});
  assert.deepEqual(loginCalls, [['person.bsky.social','/lab/']]);
  assert.match(document.querySelector('dialog [role="alert"]').textContent, /Provider unavailable in test/);
  assert.doesNotMatch(document.body.textContent, /signed in successfully/i);
});

test('LabDialog defaults to a named right drawer, traps focus, and restores scrolling and trigger focus', async () => {
  const Dialog = source('components/lab/LabDialog.tsx').default;
  let closed = 0; const trigger = document.createElement('button'); trigger.textContent = 'Inspect source'; document.body.append(trigger); trigger.focus();
  document.body.style.overflow = 'scroll';
  await mount(Dialog, {title:'Source detail', onClose:() => closed++, wide:true, children:React.createElement('button', {id:'last-control'}, 'Review source')});
  const dialog = document.querySelector('dialog');
  assert.equal(dialog.dataset.variant, 'drawer'); assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent, 'Source detail');
  assert.equal(document.body.style.overflow, 'hidden');
  assert.ok(dialog.classList.contains('lab-dialog-wide'));
  const last = document.getElementById('last-control'); last.focus();
  await act(() => last.dispatchEvent(new KeyboardEvent('keydown', {key:'Tab',bubbles:true,cancelable:true})));
  assert.equal(document.activeElement.getAttribute('aria-label'), 'Close dialog');
  await act(() => dialog.dispatchEvent(new Event('cancel', {cancelable:true}))); assert.equal(closed, 1);
  await act(() => root.render(null));
  assert.equal(document.body.style.overflow, 'scroll'); assert.ok(document.activeElement === trigger); trigger.remove();
  await mount(Dialog, {title:'Welcome', variant:'centered', onClose:() => {}, children:'Browse freely'});
  assert.equal(document.querySelector('dialog').dataset.variant, 'centered');
});

test('nested LabDialogs keep body locked until the last one closes', async () => {
  const Dialog = source('components/lab/LabDialog.tsx').default;
  const Both = ({inner}) => React.createElement(Dialog, {title:'Outer', onClose:()=>{}}, inner && React.createElement(Dialog, {title:'Inner', onClose:()=>{}}, 'Review'));
  await mount(Both, {inner:true}); assert.equal(document.body.style.overflow, 'hidden');
  await mount(Both, {inner:false}); assert.equal(document.body.style.overflow, 'hidden');
  await act(() => root.render(null)); assert.equal(document.body.style.overflow, '');
});

test('ResearchMap paints from theme tokens instead of a fixed dark palette', async () => {
  const Map = source('components/lab/ResearchMap.tsx').default;
  await mount(Map);
  const geometry = document.querySelector('.lab-map-svg'); assert.ok(geometry);
  const colors = [...geometry.querySelectorAll('[fill], [stroke]')].flatMap(e => [e.getAttribute('fill'),e.getAttribute('stroke')]).filter(Boolean);
  assert.ok(colors.every(c => !c.startsWith('#')), 'Every SVG color follows the current light/dark theme');
  assert.ok(colors.some(c => c.includes('var(--lab-blue)')));
  assert.match(document.querySelector('.lab-map-legend').textContent, /not endorsements/);
  const systems = [...geometry.querySelectorAll('.lab-map-field')].find(t => t.textContent === 'OPEN SYSTEMS');
  assert.ok(Number(systems.getAttribute('y')) > 128, 'Field label sits below its hub, clear of the content-addressing label');
});

test('shell mounts the worker onboarding interface once, only after verified identity restoration', async () => {
  const code = readFileSync('src/components/lab/LabShell.tsx', 'utf8');
  assert.match(code, /import LabOnboardingGate from ["']@\/components\/lab\/social\/LabOnboardingGate["']/);
  assert.equal((code.match(/<LabOnboardingGate\s*\/>/g) || []).length, 1);
  if (!gateIsPending) return; // The integrated worker owns its own behavior tests.
  const Shell = source('components/lab/LabShell.tsx').default;
  sessionStorage.setItem('open-lab:welcome:v2', 'seen'); await mount(Shell);
  assert.equal(document.querySelectorAll('[data-onboarding-interface]').length, 0);
  identity = {...identity,isAuthenticated:true,isLoading:true,session:{did:'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa',handle:'person.example.org'}};
  await mount(Shell); assert.equal(document.querySelectorAll('[data-onboarding-interface]').length, 0);
  identity.isLoading = false; await mount(Shell);
  assert.equal(document.querySelectorAll('[data-onboarding-interface]').length, 1);
});

test('the single demo provider keeps local activity isolated by authenticated DID', async () => {
  const {useDemoCommunity} = source('components/lab/demo/DemoCommunityProvider.tsx');
  const Shell = source('components/lab/LabShell.tsx').default;
  const a = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', b = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb';
  let demo;
  function Probe() { demo = useDemoCommunity(); return React.createElement('span', null, demo.state.scope); }
  identity = {...identity,isLoading:false,isAuthenticated:true,session:{did:a,handle:'a.example.org'}};
  await mount(Shell, {children:React.createElement(Probe)});
  assert.equal(demo.state.scope,a,'The actual shell must pass its authenticated identity to the demo provider');
  await act(() => {assert.equal(demo.act({type:'reply',threadId:'split-boundary',text:'A local demo note'}).ok,true)});
  assert.equal(demo.state.replies.length,1);
  identity = {...identity,session:{did:b,handle:'b.example.org'}};
  await mount(Shell, {children:React.createElement(Probe)});
  assert.equal(demo.state.scope,b); assert.equal(demo.state.replies.length,0);
  identity = {...identity,session:{did:a,handle:'a.example.org'}};
  await mount(Shell, {children:React.createElement(Probe)});
  assert.equal(demo.state.replies[0].text,'A local demo note');
});

test('home renders the real FeedWorkbench below one slim invitation', async () => {
  await mount(source('components/lab/Landing.tsx').default);
  assert.ok(document.querySelector('[aria-label="Mixed science feed"]'), 'Actual feed is the default home surface');
  const invitation = document.querySelector('[aria-label="Workshop invitation"]');
  assert.ok(invitation, 'A single compact workshop header owns the invitation and composer');
  assert.match(invitation.textContent, /Catch up.*Find what changed/);
  assert.ok(invitation.querySelector('button[aria-label="What are you making? Show a build →"]'));
  assert.equal(document.querySelector('.lab-welcome'), null, 'No second marketing invitation above the feed');
  assert.equal(document.querySelector('.lab-hero'), null);
  assert.equal(document.querySelector('.lab-home-work'), null);
});
