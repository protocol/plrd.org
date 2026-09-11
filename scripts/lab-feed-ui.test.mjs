import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require=createRequire(import.meta.url)
require.extensions['.css']=m=>{m.exports=new Proxy({}, {get:(_,p)=>p==='__esModule'?false:String(p)})}
const dom=new JSDOM('<div id="root"></div>', {url:'http://localhost/lab/feed/'})
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLDialogElement','Event','KeyboardEvent','StorageEvent','localStorage']) Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true})
HTMLDialogElement.prototype.showModal=function(){this.open=true;this.querySelector('button')?.focus()}
HTMLDialogElement.prototype.close=function(){this.open=false}
globalThis.self=dom.window
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'), {createRoot}=await import('react-dom/client')
let identity={isLoading:false,isAuthenticated:false,session:null}
source('lib/lab-identity.ts').useLabIdentity=()=>identity
const D=source('components/lab/demo/DemoCommunityProvider.tsx')
function Mode(){const d=D.useDemoCommunity();return React.createElement('button',{onClick:()=>d.setMode(d.isDemo?'live':'demo')},'Test mode switch')}
const click=async label=>{const e=[...document.querySelectorAll('button,a,summary')].find(e=>e.getAttribute('aria-label')===label||e.textContent.trim()===label);assert.ok(e,'Missing action: '+label);await React.act(()=>{e.focus();e.click()});return e}
const fill=async(label,value)=>{const e=document.querySelector(`[aria-label="${label}"]`);assert.ok(e,'Missing input '+label);await React.act(()=>{Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))})}
const rows=()=>[...document.querySelectorAll('[data-feed-row]')]
test('main compact feed: follow/filter, local reply, saved curator view, reload and mode isolation',async()=>{
 assert.ok(existsSync('src/components/lab/feed/MixedScienceFeed.tsx'),'Main mixed feed missing')
 localStorage.clear()
 const C=source('components/lab/feed/MixedScienceFeed.tsx').default
 let root=createRoot(document.getElementById('root'))
 const render=()=>React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,{storageScope:identity.session?.did||'browser'},React.createElement(Mode),React.createElement(C))))
 try{
 await render();assert.equal(rows().length,8)
 await click('Following');assert.equal(rows().length,0);assert.match(document.body.textContent,/Reset filters/)
 await click('Reset filters');assert.equal(rows().length,8)
 await click('Follow idea: Split-before-fit inspector');await click('Following');assert.equal(rows().length,2)
 await click('Discover');const person=await click('View Ada Lovelace’s profile');assert.ok(document.querySelector('dialog[open]'));await click('Follow in demo');await click('Close dialog');assert.equal(document.activeElement,person)
 await click('Contribute: Split-before-fit inspector');await fill('Your contribution','Check fitted rows in a clean environment.');await click('Save demo contribution');assert.match(document.body.textContent,/Saved in this browser/);await click('Close dialog');assert.equal(rows().length,9)
 await click('Refine the feed');await click('Branch: Neuroscience');await click('Branch: AI & machine learning');await fill('Name this view','Methods bridge');await click('Save view');assert.match(document.body.textContent,/Methods bridge/)
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render();assert.equal(document.querySelector('[aria-label="Branch: Neuroscience"]').getAttribute('aria-pressed'),'true');assert.match(document.body.textContent,/Methods bridge/)
 await click('Reset filters');await click('Test mode switch');assert.equal(rows().length,3);assert.doesNotMatch(document.body.textContent,/Ada Lovelace|Check fitted rows/)
 await click('Following');assert.equal(rows().length,0)
 await click('Test mode switch');assert.ok(rows().length>=8)
 }finally{await React.act(()=>root.unmount())}
})

test('top-level curation opens discipline follows in a focus-managed drawer',async()=>{
 localStorage.clear();window.history.replaceState(null,'','/lab/feed/')
 const C=source('components/lab/FeedWorkbench.tsx').default,root=createRoot(document.getElementById('root'))
 try {
 await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C))))
 assert.ok(Array.from(document.querySelectorAll('button')).some(x=>x.getAttribute('aria-label')==='Curate the feed'),'Curation must be reachable before scrolling the stream')
 await click('Curate the feed');assert.ok(document.querySelector('dialog[open]'))
 assert.match(document.querySelector('dialog[open]').textContent,/Your branches/)
 await click('Follow branch: Mathematics');await click('Follow branch: Neuroscience')
 await click('Close dialog');assert.equal(document.querySelector('dialog[open]'),null)
 await click('Curate the feed');assert.equal(document.querySelector('dialog[open] [aria-label="Unfollow branch: Mathematics"]').getAttribute('aria-pressed'),'true')
 assert.equal(document.querySelector('dialog[open] [aria-label="Unfollow branch: Neuroscience"]').getAttribute('aria-pressed'),'true')
 } finally {await React.act(()=>root.unmount())}
})
test('curation explicitly turns followed disciplines into a saved filter view',async()=>{
 localStorage.clear();window.history.replaceState(null,'','/lab/feed/')
 const C=source('components/lab/FeedWorkbench.tsx').default;let root=createRoot(document.getElementById('root'))
 const render=()=>React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C))))
 try {
 await render();await click('Curate the feed');await click('Follow branch: Mathematics');await click('Follow branch: Neuroscience')
 await click('Use followed branches as filters');await fill('Name this view','Minds and methods');await click('Save view')
 assert.match(document.querySelector('dialog[open]').textContent,/View saved in this browser/)
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render();await click('Curate the feed')
 const view=Array.from(document.querySelectorAll('dialog[open] button')).find(x=>x.textContent.includes('Minds and methods'))
 assert.ok(view);assert.match(view.textContent,/2 branches/);await React.act(()=>view.click());await click('Close dialog')
 assert.equal(document.querySelector('[aria-label="Branch: Mathematics"]').getAttribute('aria-pressed'),'true')
 assert.equal(document.querySelector('[aria-label="Branch: Neuroscience"]').getAttribute('aria-pressed'),'true')
 } finally {await React.act(()=>root.unmount())}
})
test('feed refinement starts collapsed and opens through a keyboard-accessible native control',async()=>{
 localStorage.clear();window.history.replaceState(null,'','/lab/feed/')
 const C=source('components/lab/FeedWorkbench.tsx').default,root=createRoot(document.getElementById('root'))
 try {
 await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C))))
 const summary=document.querySelector('summary[aria-label="Refine the feed"]');assert.ok(summary,'Search and discipline controls belong in one optional refinement panel')
 assert.equal(summary.closest('details').open,false)
 await React.act(()=>summary.click());assert.equal(summary.closest('details').open,true)
 assert.ok(summary.closest('details').querySelector('[aria-label="Search the feed"]'))
 assert.ok(summary.closest('details').querySelector('[aria-label="Branch: Neuroscience"]'))
 await React.act(()=>summary.click());assert.equal(summary.closest('details').open,false)
 } finally {await React.act(()=>root.unmount())}
})

test('the global search URL filters the actual default science feed after hydration', async()=>{
 localStorage.clear();window.history.replaceState(null,'','/lab/feed/?q=Split-before-fit')
 const C=source('components/lab/feed/MixedScienceFeed.tsx').default,root=createRoot(document.getElementById('root'))
 try {await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C))));assert.equal(document.querySelector('[aria-label="Search the feed"]').value,'Split-before-fit');assert.ok(rows().length>0);assert.ok(rows().every(row=>/split-before-fit/i.test(row.textContent)))}finally{await React.act(()=>root.unmount());window.history.replaceState(null,'','/lab/feed/')}
})

test('FeedWorkbench defaults to the mixed feed while preserving source and record workbenches',async()=>{
 const C=source('components/lab/FeedWorkbench.tsx').default
 const root=createRoot(document.getElementById('root'));localStorage.clear()
 const prior=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({items:[],status:'empty',sourceLabel:'Test-only disconnected source'})})
 try {await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C))));assert.equal(rows().length,8);await click('Public sources & my records');assert.match(document.body.textContent,/From Bluesky/);assert.match(document.body.textContent,/Your records/)}finally{await React.act(()=>root.unmount());globalThis.fetch=prior}
})

test('onboarding appears only after verified auth, saves locally per DID and never reopens completed/skipped state',async()=>{
 assert.ok(existsSync('src/components/lab/social/LabOnboardingGate.tsx'),'Verified-auth onboarding gate missing')
 const Gate=source('components/lab/social/LabOnboardingGate.tsx').default
 const drafts=source('lib/lab-drafts.ts'), social=source('lib/lab-social.ts')
 localStorage.clear();let calls=0;const prior=globalThis.fetch;globalThis.fetch=()=>{calls++;throw Error('No public calls from onboarding')}
 let root=createRoot(document.getElementById('root'));const render=()=>React.act(()=>root.render(React.createElement(Gate)))
 try{
 identity={isLoading:true,isAuthenticated:false,session:null};await render();assert.equal(document.querySelector('dialog'),null)
 identity={isLoading:false,isAuthenticated:false,session:{did:'did:plc:unverified',displayName:'Not verified'}};await render();assert.equal(document.querySelector('dialog'),null)
 drafts.saveDraft(localStorage,'profile','did:plc:alice',{workingOn:'Existing research',custom:'must remain'})
 identity={isLoading:false,isAuthenticated:true,session:{did:'did:plc:alice',handle:'alice.test',displayName:'Imported Alice'}};await render();assert.match(document.body.textContent,/Imported Alice/)
 await fill('Display name','Alice local');await click('Interest: Neuroscience');await fill('GitHub URL','https://github.com/alice');await click('Save and continue')
 assert.equal(document.querySelector('dialog'),null)
 assert.equal(social.loadSocialState(localStorage,'did:plc:alice').meta.onboardingCompleted,true)
 const profile=drafts.loadDraft(localStorage,'profile','did:plc:alice').data;assert.equal(profile.custom,'must remain');assert.equal(profile.workingOn,'Existing research');assert.equal(profile.githubUrl,'https://github.com/alice');assert.equal(profile.interests,'neurotech')
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render();assert.equal(document.querySelector('dialog'),null)
 identity={...identity,session:{did:'did:plc:bob',handle:'bob.test'}};await render();assert.ok(document.querySelector('dialog'));await click('Skip for now');await render();assert.equal(document.querySelector('dialog'),null)
 assert.equal(social.loadSocialState(localStorage,'did:plc:bob').meta.onboardingSkipped,true)
 assert.equal(calls,0)
 }finally{await React.act(()=>root.unmount());globalThis.fetch=prior;identity={isLoading:false,isAuthenticated:false,session:null}}
})

test('take a bounded test to My bench, return a negative result, and retain it across reload',async()=>{
 assert.ok(existsSync('src/components/lab/feed/InventionBench.tsx'),'Invention bench UI missing')
 localStorage.clear();const Feed=source('components/lab/feed/MixedScienceFeed.tsx').default,Bench=source('components/lab/feed/InventionBench.tsx').default
 let root=createRoot(document.getElementById('root'));let page=Feed
 const render=()=>React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(page))))
 try {await render();await click('Contribute: Split-before-fit inspector');await click('Save this test to My bench');assert.match(document.body.textContent,/personal bench item/);await click('Close dialog');page=Bench;await render();assert.match(document.body.textContent,/Compare two tiny synthetic workflows/)
 await click('Return a result');await fill('Result note','Held-out inputs appeared in fit. Keep this failure.');await fill('Result artifact URL','https://example.org/failure-log');await click('Outcome: did-not-work');await click('Save result to My bench');assert.match(document.body.textContent,/did-not-work/)
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render();assert.match(document.body.textContent,/Held-out inputs appeared/)
 }finally{await React.act(()=>root.unmount())}
})
test('structured composer persists text but makes media preview lifetime and publication deferral explicit',async()=>{
 assert.ok(existsSync('src/components/lab/feed/InventionComposer.tsx'),'Workshop composer missing')
 localStorage.clear();const C=source('components/lab/feed/InventionComposer.tsx').default
 const root=createRoot(document.getElementById('root'))
 try {await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C,{onClose:()=>{}}))))
 await fill('Build title','Overlap calculator');await fill('What it does','Separates subject-hours from elapsed hours.');await fill('Next useful request','Try two overlapping sessions.');await fill('Artifact URL','https://example.org/notebook');await click('Save build to My bench')
 assert.match(document.body.textContent,/Text saved locally/);assert.match(document.body.textContent,/not saved|not stored/)
 const state=source('lib/lab-inventions.ts').loadBench(localStorage,'guest','demo').state;assert.equal(state.updates[0].title,'Overlap calculator');assert.equal(state.updates[0].stage,'idea')
 }finally{await React.act(()=>root.unmount())}
})

test('People opens the right historical persona with local follow; Profile shows imported identity and followed bench items',async()=>{
 assert.ok(existsSync('src/components/lab/PeopleWorkbench.tsx'),'People workbench missing')
 const Module=require('node:module'),load=Module._load
 Module._load=function(id,...args){if(id==='@/components/lab/social/BlueskyConnections')return {__esModule:true,default:()=>React.createElement('div',null,'Auth worker connection seam')};return load.call(this,id,...args)}
 const People=source('components/lab/PeopleWorkbench.tsx').default
 Module._load=load
 localStorage.clear();const root=createRoot(document.getElementById('root'))
 const wrap=Page=>React.createElement(D.DemoCommunityProvider,{storageScope:identity.session?.did||'browser'},React.createElement(Page))
 const prior=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({status:'ready',records:[],profile:null,limit:50,hasMore:false})})
 try{await React.act(()=>root.render(wrap(People)));assert.match(document.body.textContent,/Auth worker connection seam/);await click('View Katherine Johnson’s profile');assert.match(document.querySelector('dialog').textContent,/Measurement-tool designer/);await click('Follow in demo');await click('Close dialog')
 identity={isLoading:false,isAuthenticated:true,session:{did:'did:plc:alice',handle:'alice.test',displayName:'Actual Imported Alice',avatar:'https://example.org/avatar.png'}}
 const Profile=source('components/lab/ProfileWorkbench.tsx').default
 await React.act(()=>root.render(wrap(Profile)));assert.match(document.body.textContent,/Actual Imported Alice/);assert.match(document.body.textContent,/did:plc:alice/);assert.match(document.body.textContent,/My bench/);assert.match(document.body.textContent,/Followed ideas/);assert.match(document.body.textContent,/Followed people/);assert.match(document.body.textContent,/Builds & tests/)
 assert.doesNotMatch(document.querySelector('[aria-label="Your local follows"]').textContent,/Katherine Johnson/)
 }finally{await React.act(()=>root.unmount());globalThis.fetch=prior;identity={isLoading:false,isAuthenticated:false,session:null}}
})

test('a slow auth restore never blanks public workshop samples or exposes saved identity work',async()=>{
 localStorage.clear();identity={isLoading:true,isAuthenticated:false,session:null}
 const root=createRoot(document.getElementById('root')),C=source('components/lab/feed/MixedScienceFeed.tsx').default
 try{await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C))));assert.equal(rows().length,8);assert.equal(document.querySelector('[aria-label="Follow idea: Split-before-fit inspector"]').disabled,true)}finally{await React.act(()=>root.unmount());identity={isLoading:false,isAuthenticated:false,session:null}}
})

test('legacy public source bookmarks preserve malformed storage instead of silently replacing it',async()=>{
 const C=source('components/lab/feed/PublicFeedSources.tsx').default,key=source('lib/lab-drafts.ts').draftKey('promising','guest')
 localStorage.clear();localStorage.setItem(key,'{broken');const root=createRoot(document.getElementById('root')),oldFetch=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({items:[],status:'empty',sourceLabel:'Test source'})})
 try{await React.act(()=>root.render(React.createElement(C)));await click('✧ Promising');assert.equal(localStorage.getItem(key),'{broken');assert.match(document.body.textContent,/preserved|not overwritten/)}finally{await React.act(()=>root.unmount());globalThis.fetch=oldFetch}
})
