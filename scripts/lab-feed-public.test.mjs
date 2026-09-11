import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { source } from './velocity/test-source-loader.mjs';
process.env.__NEXT_TRAILING_SLASH='true';
const require = createRequire(import.meta.url);
require.extensions['.css'] = m => { m.exports = new Proxy({}, {get:(_,p)=>p==='__esModule'?false:String(p)}); };
const dom = new JSDOM('<div id="root"></div>', {url:'https://lab.example.org/lab/'});
for (const key of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','MouseEvent','KeyboardEvent','StorageEvent','localStorage']) globalThis[key]=dom.window[key];
window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
globalThis.self=window; globalThis.IS_REACT_ACT_ENVIRONMENT=true;
window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
window.HTMLDialogElement.prototype.close=function(){this.open=false;};
const { createRoot } = await import('react-dom/client');
const { PathnameContext }=require('next/dist/shared/lib/hooks-client-context.shared-runtime');
const did='did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', other='did:plc:bbbbbbbbbbbbbbbbbbbbbbbb';
let root, identity;
const auth=source('lib/lab-identity.ts');
const Shell=source('components/lab/LabShell.tsx').default;
const click=async text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text)||b.getAttribute('aria-label')===text);assert.ok(b,text);await act(()=>b.click());};
const mount=async (C,props={})=>act(async()=>{root.render(React.createElement(PathnameContext.Provider,{value:window.location.pathname},React.createElement(C,props)));await new Promise(r=>setTimeout(r,10));});
const fill=async(selector,value)=>{const el=document.querySelector(selector);assert.ok(el,selector);await act(()=>{Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});};
beforeEach(()=>{localStorage.clear();window.history.replaceState(null,'','/lab/');identity={session:{did,handle:'real-person.example.org'},isAuthenticated:true,isLoading:false,oauthSession:null,logout:async()=>{},login:async()=>{}};mock.method(auth,'useLabIdentity',()=>identity);mock.method(globalThis,'fetch',async path=>{assert.ok(['/api/lab/feed/','/api/lab/capabilities/'].includes(path),'No ghost records API or writes');return Response.json(path.includes('feed')?{items:[],status:'empty'}:{canSignIn:false,canPublish:false,mode:'unconfigured'});});root=createRoot(document.getElementById('root'));});
afterEach(async()=>{await act(()=>root.unmount());mock.restoreAll();});

test('feed reads the explicit DID through the real notebook adapter and isolates late accounts',async()=>{
 const protocol=source('lib/lab-protocol.ts');let finish;const reads=[];
 mock.method(protocol,'listLabRecords',async(owner,kind,options)=>{
  reads.push({owner,kind,options});
  if(owner===did) await new Promise(r=>{ if(kind==='note')finish=r; else r(); });
  const data={text:owner===did?'LATE OLD ACCOUNT':'Current account note',field:'neurotech',postType:'question'};
  const record={uri:`at://${owner}/org.plresearch.lab.note/one`,cid:'test-cid',kind:'note',authorDid:owner,data,pds:'https://pds.example.org',provenance:'pds-https-unverified-signature'};
  return {authorDid:owner,kind,records:kind==='note'?[record]:[],cursor:kind==='note'?'next':undefined};
 });
 const Feed=source('components/lab/feed/PublicFeedSources.tsx').default;
 await mount(Feed);assert.equal(reads.length,5);assert.ok(reads.every(r=>r.owner===did));
 identity={...identity,session:{did:other}};await mount(Feed);await click('Your records');
 assert.match(document.body.textContent,/Current account note/);
 assert.match(document.body.textContent,/up to 30 per collection.*more exist/);
 assert.match(document.body.textContent,/Current PDS: https:\/\/pds.example.org/);
 assert.ok(document.querySelector(`a[href="/lab/record/?uri=${encodeURIComponent(`at://${other}/org.plresearch.lab.note/one`)}"]`));
 await act(()=>finish());assert.doesNotMatch(document.body.textContent,/LATE OLD ACCOUNT/);
});


test('relocated public-source search, kind filter and legacy source bookmarks survive a remount',async()=>{
 const Page=source('components/lab/feed/PublicFeedSources.tsx').default;
 identity={...identity,isAuthenticated:false,session:null};
 await mount(Page);await fill('[aria-label="Search scientific work"]','marimo');
 assert.equal(document.querySelectorAll('.lab-feed-entry').length,1);await click('Promising');
 await act(()=>root.render(null));await mount(Page);assert.match(document.body.textContent,/Promising · saved/);
 await fill('[aria-label="Search scientific work"]','');
 const select=document.querySelector('[aria-label="Source kind"]');
 await act(()=>{Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set.call(select,'negative');select.dispatchEvent(new Event('change',{bubbles:true}))});
 assert.match(document.querySelector('.lab-empty').textContent,/No editorial starters/);
 await act(()=>{Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set.call(select,'all');select.dispatchEvent(new Event('change',{bubbles:true}))});
 assert.ok(document.querySelectorAll('.lab-feed-entry').length>1);
});
