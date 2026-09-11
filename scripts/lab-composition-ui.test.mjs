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
beforeEach(()=>{localStorage.clear();for(const owner of [did,other])source('lib/lab-drafts.ts').saveDraft(localStorage,'social',owner,{onboardingSkipped:true});window.history.replaceState(null,'','/lab/');identity={session:{did,handle:'real-person.example.org'},isAuthenticated:true,isLoading:false,oauthSession:null,logout:async()=>{},login:async()=>{}};mock.method(auth,'useLabIdentity',()=>identity);mock.method(globalThis,'fetch',async path=>{assert.ok(['/api/lab/feed/','/api/lab/capabilities/'].includes(path),'No ghost records API or writes');return Response.json(path.includes('feed')?{items:[],status:'empty'}:{canSignIn:false,canPublish:false,mode:'unconfigured'});});root=createRoot(document.getElementById('root'));});
afterEach(async()=>{await act(()=>root.unmount());mock.restoreAll();});

test('one global demo control scopes the actual feed and supplemental tool discussions',async()=>{
 mock.method(source('lib/lab-protocol.ts'),'listLabRecords',async(owner,kind)=>({authorDid:owner,kind,records:[]}));
 const cases=[['components/lab/Landing.tsx','feed'],['components/lab/FeedWorkbench.tsx','feed'],['app/lab/atlas/page.tsx','duration-denominator'],['app/lab/apps/page.tsx','split-boundary'],['app/lab/collaborate/page.tsx','split-boundary'],['app/lab/profile/page.tsx','bench']];
 for(const [file,kind] of cases){
  const Page=source(file).default;await mount(Shell,{children:React.createElement(Page)});
  const rows=document.querySelectorAll('[data-feed-row]').length;
  if(kind==='feed') {assert.ok(document.querySelector('[aria-label="Mixed science feed"]'));assert.ok(rows>1);assert.equal(document.querySelector('[data-demo-community-panel]'),null);}
  else if(kind==='bench') {assert.ok(document.querySelector('[aria-label="Personal invention bench"]'));assert.ok(!document.querySelector('[aria-label="Fictional demo people"]'),'Bench must not append a duplicate people directory');}
  else {assert.ok(document.querySelector(`[data-thread="${kind}"]`),file);assert.equal(document.querySelectorAll('[aria-label="Demo community discussion"]').length,1,file);}
  if(file.includes('atlas'))assert.equal(document.querySelector('[data-thread="split-boundary"]'),null);
  assert.equal(document.querySelectorAll('[data-lab-scope-control]').length,1);await act(()=>document.querySelector('[data-lab-scope-control]').click());
  await click('Show real / empty view');assert.equal(document.querySelector('[data-thread]'),null);assert.equal(document.querySelector('[aria-label="Fictional demo people"]'),null);
  if(kind==='feed')assert.ok(document.querySelectorAll('[data-feed-row]').length<rows,'Demo off hides synthetic activities, not the real workbench');
  await click('Show demo community');await click('Close dialog');
 }
});

test('bottleneck route prepares the real isolated contribution editor without publishing',async()=>{
 window.history.replaceState(null,'','/lab/bottlenecks/?case=reproducibility');
 const Page=source('app/lab/bottlenecks/page.tsx').default;
 identity={...identity,isLoading:true};await mount(Shell,{children:React.createElement(Page)});assert.ok(!document.querySelector('#bottleneck-hypothesis'),'No owner editor during restoration');
 identity={...identity,isLoading:false};await mount(Shell,{children:React.createElement(Page)});
 assert.ok(document.querySelector('[data-thread="split-boundary"]'));
 assert.ok(document.querySelector('[data-thread]').compareDocumentPosition(document.querySelector('.bottleneck-proposal')) & window.Node.DOCUMENT_POSITION_FOLLOWING);
 for(const el of document.querySelectorAll('.bottleneck-fields textarea'))await fill('#'+el.id,'A bounded test with a review and stop condition.');
 await click('Prepare contribution draft');assert.ok(document.querySelector('dialog #entry-observation'));
 const initial=document.querySelector('#entry-observation').value;assert.match(initial,/bounded test/);
 await fill('#entry-observation','Preserve my contribution edits');await click('Cancel');await click('Prepare contribution draft');assert.equal(document.querySelector('#entry-observation').value,'Preserve my contribution edits');
 await click('Cancel');identity={...identity,session:{did:other}};await mount(Shell,{children:React.createElement(Page)});assert.equal(document.querySelector('.bottleneck-fields textarea').value,'');
 await act(()=>{window.history.pushState(null,'','/lab/bottlenecks/?case=neural-measurement');window.dispatchEvent(new window.PopStateEvent('popstate'));});
 assert.ok(document.querySelector('[data-thread="duration-denominator"]'));assert.match(document.body.textContent,/only.*reproducibility|reproducibility.*only/i);
 assert.ok(document.querySelector('a[href="/lab/bottlenecks/?case=reproducibility"]'));assert.equal(document.querySelector('.bottleneck-proposal'),null);
});

test('bench preserves public LinkedIn into review and local recovery with one editor',async()=>{
 const data={workingOn:'Source methods',lookingFor:'Reviewers',interests:['neurotech'],linkedinUrl:'https://www.linkedin.com/in/test-fixture/',scholarUrl:'https://scholar.google.com/citations?user=fixture',githubUrl:'https://github.com/fixture'};
 mock.method(source('lib/lab-protocol.ts'),'listLabRecords',async(owner,kind)=>({authorDid:owner,kind,records:kind==='profile'?[{uri:`at://${owner}/org.plresearch.lab.profile/self`,cid:'reviewed-cid',kind,authorDid:owner,data,pds:'https://pds.example.org'}]:[]}));
 const Page=source('components/lab/ProfileWorkbench.tsx').default;
 identity={...identity,isLoading:true};await mount(Shell,{children:React.createElement(Page)});assert.ok(!document.querySelector('.lab-profile-card'));
 identity={...identity,isLoading:false};await mount(Shell,{children:React.createElement(Page)});
 assert.ok(document.querySelector(`a[href="${data.linkedinUrl}"]`));assert.ok(document.querySelector('a[href="/lab/onboarding/#profile-completion"]'));
 await click('Edit profile draft');assert.equal(document.querySelectorAll('#entry-linkedinUrl').length,1);assert.equal(document.querySelector('#entry-linkedinUrl').value,data.linkedinUrl);
 await click('Review draft');assert.match(document.querySelector('.lab-record-preview').textContent,/linkedin.com\/in\/test-fixture/);assert.match(document.querySelector('.lab-record-preview').textContent,/reviewed-cid/);
 await click('Cancel');await click('Edit profile draft');assert.equal(document.querySelector('#entry-linkedinUrl').value,data.linkedinUrl);
});

test('onboarding uses the existing real identity provider and waits during restoration',async()=>{
 const authModule=source('lib/lab-auth.tsx');
 mock.method(authModule,'useLabAuth',()=>identity);
 mock.method(authModule,'LabAuthProvider',()=>{throw Error('No nested auth provider allowed');});
 const Page=source('app/lab/onboarding/page.tsx').default;
 identity={...identity,isLoading:true};await mount(Page);assert.ok(!document.querySelector('form'));
 identity={...identity,isLoading:false};await mount(Page);assert.match(document.body.textContent,/Save starting choices/);assert.match(document.body.textContent,/Save profile locally/);
});

test('feed reads the explicit DID through the real notebook adapter and isolates late accounts',async()=>{
 const protocol=source('lib/lab-protocol.ts');let finish;const reads=[];
 mock.method(protocol,'listLabRecords',async(owner,kind,options)=>{
  reads.push({owner,kind,options});
  if(owner===did) await new Promise(r=>{ if(kind==='note')finish=r; else r(); });
  const data={text:owner===did?'LATE OLD ACCOUNT':'Current account note',field:'neurotech',postType:'question'};
  const record={uri:`at://${owner}/org.plresearch.lab.note/one`,cid:'test-cid',kind:'note',authorDid:owner,data,pds:'https://pds.example.org',provenance:'pds-https-unverified-signature'};
  return {authorDid:owner,kind,records:kind==='note'?[record]:[],cursor:kind==='note'?'next':undefined};
 });
 const Feed=source('components/lab/FeedWorkbench.tsx').default;
 await mount(Feed);assert.equal(reads.length,0,'The default feed does not eagerly read notebook records');await click('Public sources');assert.equal(reads.length,5);assert.ok(reads.every(r=>r.owner===did));
 identity={...identity,session:{did:other}};await mount(Feed);await click('Your records');
 assert.match(document.body.textContent,/Current account note/);
 assert.match(document.body.textContent,/up to 30 per collection.*more exist/);
 assert.match(document.body.textContent,/Current PDS: https:\/\/pds.example.org/);
 assert.ok(document.querySelector(`a[href="/lab/record/?uri=${encodeURIComponent(`at://${other}/org.plresearch.lab.note/one`)}"]`));
 await act(()=>finish());assert.doesNotMatch(document.body.textContent,/LATE OLD ACCOUNT/);
});

test('composed shell has one demo control and top-right bell, live switch preserves real drafts and hides restoring inbox',async()=>{
 const drafts=source('lib/lab-drafts.ts');drafts.saveDraft(localStorage,'note',did,{text:'Real private local draft'});
 const before=localStorage.getItem(drafts.draftKey('note',did));
 const Page=source('app/lab/demo/page.tsx').default;
 await mount(Shell,{children:React.createElement(Page)});
 assert.equal(document.querySelectorAll('[data-lab-scope-control]').length,1);assert.equal(document.querySelectorAll('[aria-label="Community preview mode"]').length,0);await act(()=>document.querySelector('[data-lab-scope-control]').click());assert.equal(document.querySelectorAll('[aria-label="Community preview mode"]').length,1);
 assert.equal(document.querySelectorAll('[aria-label^="Demo notifications:"]').length,1);
 assert.ok(document.querySelector('.lab-header-actions [aria-label^="Demo notifications:"]'));
 assert.equal(document.querySelectorAll('[aria-label^="Your next actions"]').length,0);
 assert.match(document.querySelector('.lab-header-actions').textContent,/real-person/);
 await click('Show real / empty view');
 assert.equal(document.querySelectorAll('[aria-label^="Demo notifications:"]').length,0);
 assert.equal(document.querySelectorAll('.lab-header-actions [aria-label^="Your next actions"]').length,1);
 assert.doesNotMatch(document.body.textContent,/Mira Sen|fictional points/);
 assert.equal(localStorage.getItem(drafts.draftKey('note',did)),before);
 identity={...identity,isLoading:true};await mount(Shell,{children:React.createElement(Page)});
 assert.equal(document.querySelectorAll('[aria-label^="Your next actions"]').length,0);
 assert.ok(document.querySelector('nav a[href="/lab/bottlenecks/"]'));
 assert.ok(document.querySelector('a[href="/lab/profile/"]'));
 assert.ok(document.querySelector('a[href="/lab/efforts/"]'));
});
