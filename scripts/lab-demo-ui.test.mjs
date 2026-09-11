import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { source } from './velocity/test-source-loader.mjs';
const require=createRequire(import.meta.url);
require.extensions['.css']=(m)=>{m.exports=new Proxy({}, {get:(_,p)=>p==='__esModule'?false:String(p)});};
async function harness(run, url='http://localhost/lab/demo/') {
  assert.ok(existsSync('src/components/lab/demo/index.ts'), 'composable demo components must exist');
  const dom=new JSDOM('<div id="root"></div>',{url}); const saved={};
  for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','KeyboardEvent','MouseEvent','StorageEvent']) {saved[k]=Object.getOwnPropertyDescriptor(globalThis,k); Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true});}
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const oldFetch=globalThis.fetch; let fetches=0; globalThis.fetch=()=>{fetches++;throw Error('Demo must not fetch');};
  const React=await import('react'); const {createRoot}=await import('react-dom/client'); let root=createRoot(document.getElementById('root'));
  const C=source('components/lab/demo/index.ts');
  const click=async text=>{const b=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim()===text||e.getAttribute('aria-label')===text); assert.ok(b,'Missing control: '+text); await React.act(()=>{b.focus();b.click();}); return b;};
  const render=async (props={})=>React.act(()=>root.render(React.createElement(C.DemoCommunityProvider,props,React.createElement(C.DemoCommunityExperience))));
  const reload=async()=>{await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render();};
  try { await run({dom,React,C,render,reload,click,root}); assert.equal(fetches,0); }
  finally {await React.act(()=>root.unmount());dom.window.close();globalThis.fetch=oldFetch;for(const [k,d] of Object.entries(saved)) {if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}delete globalThis.IS_REACT_ACT_ENVIRONMENT;}
}

test('real components: fictional profile, local thread reply, save, support, read/dismiss, live switch and reset', async()=>harness(async({dom,React,render,reload,click})=>{
  dom.window.localStorage.setItem('open-lab:draft:real:note','untouched'); await render();
  assert.match(document.body.textContent,/Fictional people/);
  const opener=await click('View Ada Lovelace’s demo profile');
  assert.match(document.querySelector('[role="dialog"]').textContent,/Research software maintainer/);
  await click('Follow in demo');
  await React.act(()=>document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(document.querySelector('[role="dialog"]'),null);assert.ok(document.activeElement===opener, 'Escape returns focus to profile trigger');
  await click('Open discussion: What would actually catch the leak?');
  assert.match(document.body.textContent,/false alarm/i);
  await click('Reply to Hedy Lamarr: r6');
  const textarea=document.querySelector('textarea');
  await React.act(()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(textarea,'<b>A narrower local test</b>');textarea.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  await click('Save demo reply');
  assert.match(document.body.textContent,/<b>A narrower local test<\/b>/);assert.equal(document.querySelector('b'),null);
  await click('Save discussion');await click('Allocate 1 demo point');
  await click('Demo notifications: 3 unread');
  await click('Dismiss: Marie kept an unknown instead of estimating missing hours.');
  const link=[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Inspect the revised test'));
  assert.match(link.getAttribute('href'),/^\/lab\/demo\/\?discussion=split-boundary/);
  await React.act(()=>link.click());
  assert.ok(document.querySelector('[data-thread="split-boundary"] textarea'));
  await reload();
  assert.ok(document.querySelector('[data-thread="split-boundary"] textarea'), 'notification permalink reopens discussion after reload');
  assert.match(document.body.textContent,/<b>A narrower local test<\/b>/);
  assert.match(document.body.textContent,/Saved discussion/);assert.match(document.body.textContent,/4 fictional points/);
  await click('View Ada Lovelace’s demo profile');assert.match(document.querySelector('[role="dialog"]').textContent,/Following in demo/);await click('Close dialog');
  assert.ok(document.querySelector('[aria-label="Demo notifications: 1 unread"]'));
  await click('Show real / empty view');
  assert.doesNotMatch(document.body.textContent,/Ada Lovelace|fictional points|What would actually catch/);
  assert.equal(document.querySelector('[aria-label^="Demo notifications:"]'),null);
  await reload();assert.doesNotMatch(document.body.textContent,/Ada Lovelace/);
  await click('Show demo community');await click('Reset demo');
  await click('Cancel');
  assert.equal(JSON.parse(dom.window.localStorage.getItem('app-demo:community:v1:browser')).replies.length,1);
  await click('Reset demo');await click('Reset demo changes');
  assert.equal(dom.window.localStorage.getItem('app-demo:community:v1:browser'),null);
  assert.equal(dom.window.localStorage.getItem('open-lab:draft:real:note'),'untouched');
}));

test('direct notification URL opens a visible discussion; unknown IDs remain honest',async()=>harness(async({render})=>{
  await render();assert.ok(document.querySelector('[data-thread="duration-denominator"] textarea'));
  assert.match(document.body.textContent,/overlap metadata/);
},'http://localhost/lab/demo/?discussion=duration-denominator#demo-discussion-duration-denominator'));

test('outside provider renders safely and hides examples; scoped filters do not leak other cases',async()=>harness(async({C,React,root,render})=>{
  await React.act(()=>root.render(React.createElement(React.Fragment,null,React.createElement(C.DemoPeople),React.createElement(C.DemoNotifications),React.createElement(C.DemoActivityFeed))));
  assert.equal(document.body.textContent,'');
  await React.act(()=>root.render(React.createElement(C.DemoCommunityProvider,null,React.createElement(C.DemoCommunityPanel,{context:'atlas'}))));
  assert.match(document.body.textContent,/Two durations/);assert.doesNotMatch(document.body.textContent,/catch the leak|A working link/);
}));

test('notification can reopen the same collapsed target; dialogs trap Tab; corrupt saves retain reply text',async()=>harness(async({dom,React,render,click})=>{
  await render();
  await click('Demo notifications: 3 unread'); await click('Inspect the revised test →');
  await click('Close discussion: What would actually catch the leak?');
  await click('Demo notifications: 2 unread'); await click('Inspect the revised test →');
  assert.ok(document.querySelector('[data-thread="split-boundary"] textarea'), 'same notification reopens a collapsed discussion');
  await click('View Ada Lovelace’s demo profile');
  const dialog=document.querySelector('[role="dialog"]'); const first=dialog.querySelector('button');
  first.focus();
  await React.act(()=>document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true})));
  assert.ok(document.activeElement.textContent.includes('Follow in demo'),'Shift-Tab wraps to final dialog control');
  await click('Close dialog');
  dom.window.localStorage.setItem('app-demo:community:v1:browser','{bad');
  const textarea=document.querySelector('textarea');
  await React.act(()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(textarea,'Keep this unsaved text');textarea.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  await click('Save demo reply');
  assert.equal(textarea.value,'Keep this unsaved text');
  assert.match(document.body.textContent,/preserved/);
  assert.equal(dom.window.localStorage.getItem('app-demo:community:v1:browser'),'{bad');
}));

test('provider remount isolates event scopes and storage events synchronize view preference',async()=>harness(async({dom,React,render,click})=>{
  await render({storageScope:'alpha'});await click('Save discussion');
  await render({storageScope:'beta'});assert.doesNotMatch(document.body.textContent,/Saved discussion/);
  await render({storageScope:'alpha'});assert.match(document.body.textContent,/Saved discussion/);
  dom.window.localStorage.setItem('app-demo:mode:v1','live');
  await React.act(()=>dom.window.dispatchEvent(new dom.window.StorageEvent('storage',{key:'app-demo:mode:v1',newValue:'live'})));
  assert.doesNotMatch(document.body.textContent,/Ada Lovelace|fictional points/);
}));

test('unknown discussion does not pretend a target exists',async()=>harness(async({render})=>{
  await render();assert.match(document.body.textContent,/That demo discussion does not exist/);assert.equal(document.querySelector('textarea'),null);
},'http://localhost/lab/demo/?discussion=not-a-thread'));

test('demo modules have no network, identity, raw HTML, remote imagery or shared store dependencies',()=>{
  const files=['src/lib/lab-demo.ts',...readdirSync('src/components/lab/demo').filter(x=>/\.tsx?$/.test(x)).map(x=>'src/components/lab/demo/'+x)];
  for(const file of files){const code=readFileSync(file,'utf8');assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|dangerouslySetInnerHTML|localStorage\.clear|lab-drafts|lab-auth|lab-protocol|lab-social|<img\b/,file);}
});
