import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {JSDOM} from 'jsdom'
import {source} from './velocity/test-source-loader.mjs'
const require=createRequire(import.meta.url)
require.extensions['.css']=m=>{m.exports=new Proxy({}, {get:(_,p)=>p==='__esModule'?false:String(p)})}
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/lab/feed/'})
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLDialogElement','Event','KeyboardEvent','StorageEvent','localStorage'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true})
HTMLDialogElement.prototype.showModal=function(){this.open=true}
HTMLDialogElement.prototype.close=function(){this.open=false}
globalThis.self=window;globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client')
let identity={isLoading:false,isAuthenticated:false,session:null}
source('lib/lab-identity.ts').useLabIdentity=()=>identity
const D=source('components/lab/demo/DemoCommunityProvider.tsx'),b=source('lib/lab-inventions.ts')
const Composer=source('components/lab/feed/InventionComposer.tsx').default
const click=async label=>{const e=[...document.querySelectorAll('button,a')].find(e=>e.getAttribute('aria-label')===label||e.textContent.trim()===label);assert.ok(e,'Missing action: '+label);await React.act(()=>e.click());return e}
const fill=async(label,value)=>{const e=document.querySelector(`[aria-label="${label}"]`);assert.ok(e,'Missing input: '+label);await React.act(()=>{Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))})}
const mount=async(C,props={})=>{const root=createRoot(document.getElementById('root'));const render=()=>React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,{storageScope:identity.session?.did||'browser'},React.createElement(C,props))));await render();return {root,render,unmount:()=>React.act(()=>root.unmount())}}
let network=0
globalThis.fetch=()=>{network++;throw Error('External writes/reads forbidden in invention loop')}

test('incomplete build survives close/reopen and saves exactly one stable draft ID',async()=>{
 localStorage.clear();let closed=false
 let app=await mount(Composer,{onClose:()=>{closed=true}})
 try{await fill('Build title','Unfinished overlap jig');await click('Close dialog');assert.equal(closed,true)}finally{await app.unmount()}
 app=await mount(Composer,{onClose:()=>{}})
 try{
  assert.equal(document.querySelector('[aria-label="Build title"]').value,'Unfinished overlap jig')
  const draft=b.loadBench(localStorage,'guest','demo').state.drafts[0]
  await fill('What it does','Separates elapsed and subject hours.');await fill('Next useful request','Test two overlapping recordings.');await click('Save build to My bench')
  const state=b.loadBench(localStorage,'guest','demo').state
  assert.equal(state.updates.length,1);assert.equal(state.updates[0].id,draft.id);assert.ok(state.updates[0].createdAt);assert.equal(state.drafts.length,0)
 }finally{await app.unmount()}
 assert.equal(network,0)
})

const choose=async file=>{const input=document.querySelector('input[type=file]');assert.ok(input);Object.defineProperty(input,'files',{value:[file],configurable:true});await React.act(async()=>{input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,0))})}
const photo=()=>new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64')],'jig.png',{type:'image/png'})
test('saved build reopens by ID, revises without duplication, and preserves createdAt, media bytes and captions on reload',async()=>{
 localStorage.clear();let app=await mount(Composer,{onClose:()=>{}})
 try{
  await fill('Build title','Media jig');await fill('What it does','Inspect the prototype wiring.');await fill('Next useful request','Check the polarity.');await choose(photo());await fill('Caption for jig.png','First wiring');await fill('Alt text for jig.png','Prototype leads');await click('Save build to My bench')
 }finally{await app.unmount()}
 const original=b.loadBench(localStorage,'guest','demo').state.updates[0]
 assert.equal(original.media?.length,1,'Selected bytes must persist with the saved build')
 assert.equal(original.media[0].caption,'First wiring');assert.ok(!JSON.stringify(original).includes('blob:'))
 app=await mount(source('components/lab/feed/InventionBench.tsx').default)
 try{
  await click('Edit build: Media jig');assert.equal(document.querySelector('[aria-label="Build title"]').value,'Media jig');assert.ok(document.querySelector('img'))
  await fill('Build title','Media jig revised');await fill('Caption for jig.png','Reversed leads');await click('Save build to My bench')
 }finally{await app.unmount()}
 const state=b.loadBench(localStorage,'guest','demo').state
 assert.equal(state.updates.length,1);assert.equal(state.updates[0].id,original.id);assert.equal(state.updates[0].createdAt,original.createdAt);assert.equal(state.updates[0].media[0].dataUrl,original.media[0].dataUrl);assert.equal(state.updates[0].media[0].caption,'Reversed leads')
 app=await mount(Composer,{updateId:original.id,onClose:()=>{}})
 try{assert.equal(document.querySelector('[aria-label="Build title"]').value,'Media jig revised');assert.equal(document.querySelector('[aria-label="Caption for jig.png"]').value,'Reversed leads');assert.equal(document.querySelector('img').alt,'Prototype leads')}finally{await app.unmount()}
 assert.equal(network,0)
})

const model=source('lib/lab-feed-model.ts'),demoModel=source('lib/lab-demo.ts')
const Detail=source('components/lab/feed/FeedDetail.tsx').default
const feedRow=updates=>model.buildFeedRows({isDemo:true,demo:demoModel.emptyDemoState(),drafts:[],updates})[0]
test('fresh and existing Split-before-fit returns open the exact local task drawer, keep artifact context, and attach results at source',async()=>{
 localStorage.clear();const row=feedRow([])
 for(const outcome of ['did-not-work','worked']){
  const app=await mount(Detail,{row,onClose:()=>{}})
  try{
   const recipes=[...document.querySelectorAll('a')].find(e=>e.textContent==='Browse other task recipes →')
   assert.ok(recipes,'No matching recipe must not promise an unrelated run packet')
   assert.ok(!document.body.textContent.includes('Prepare a run packet'))
   await click('Return a result →')
   const editor=[...document.querySelectorAll('dialog')].find(d=>d.querySelector('[aria-label="Result note"]'))
   assert.ok(editor,'Return must save/select this task and open its editor, not navigate to an empty bench')
   assert.ok(editor.textContent.includes(row.title));assert.ok(editor.textContent.includes(row.request));assert.ok(editor.textContent.includes(row.artifact))
   await fill('Result note',`Exact split test: ${outcome}`);await click(`Outcome: ${outcome}`);await click('Save result to My bench')
   const state=b.loadBench(localStorage,'guest','demo').state
   assert.equal(state.tasks.length,1);assert.equal(state.tasks[0].id,row.ideaId);assert.equal(state.tasks[0].sourceId,row.ideaId);assert.equal(state.tasks[0].title,row.title);assert.equal(state.tasks[0].request,row.request);assert.equal(state.tasks[0].artifact,row.artifact)
   assert.ok(document.querySelector('[aria-label="Results for this source"]').textContent.includes(`Exact split test: ${outcome}`))
  }finally{await app.unmount()}
 }
 const app=await mount(Detail,{row,onClose:()=>{}})
 try{assert.ok(document.querySelector('[aria-label="Results for this source"]').textContent.includes('Exact split test: worked'))}finally{await app.unmount()}
 assert.equal(network,0)
})

test('discard confirmation removes only the selected unfinished draft, never another draft or its saved build',async()=>{
 localStorage.clear()
 const seed=id=>({id,kind:'prototype',stage:'idea',title:id,summary:'',request:'',artifactUrl:'',disciplines:[]})
 for(const id of ['draft-one','draft-two'])assert.equal(b.changeBench(localStorage,'guest','demo',{type:'save-draft',draft:seed(id)}).ok,true)
 const app=await mount(Composer,{draftId:'draft-one',onClose:()=>{}})
 try{
  await click('Discard this draft…');assert.equal(b.loadBench(localStorage,'guest','demo').state.drafts.length,2)
  await click('Keep editing');assert.equal(document.querySelector('[aria-label="Build title"]').value,'draft-one')
  await click('Discard this draft…');await click('Confirm discard this draft')
  assert.deepEqual(b.loadBench(localStorage,'guest','demo').state.drafts.map(d=>d.id),['draft-two'])
 }finally{await app.unmount()}
})

test('My bench exposes each incomplete draft for explicit resume, and rejects stale task query context',async()=>{
 localStorage.clear()
 for(const id of ['first-draft','second-draft'])assert.equal(b.changeBench(localStorage,'guest','demo',{type:'save-draft',draft:{id,kind:'prototype',stage:'idea',title:id,summary:'',request:'',artifactUrl:'',disciplines:[]}}).ok,true)
 window.history.replaceState(null,'','/lab/profile/?task=missing&scope=demo%3Asomeone-else')
 const app=await mount(source('components/lab/feed/InventionBench.tsx').default)
 try{
  assert.match(document.querySelector('[role="alert"]')?.textContent||'',/task.*link|context|query/i)
  await click('Resume draft: first-draft');assert.equal(document.querySelector('[aria-label="Build title"]').value,'first-draft')
  await fill('What it does','Recovered the first draft.');await fill('Next useful request','Try one test.');await click('Save build to My bench');assert.match(document.body.textContent,/Text saved locally/)
  assert.equal(b.loadBench(localStorage,'guest','demo').state.updates[0].id,'first-draft');assert.deepEqual(b.loadBench(localStorage,'guest','demo').state.drafts.map(d=>d.id),['second-draft'])
 }finally{await app.unmount();window.history.replaceState(null,'','/lab/feed/')}
})

// Real 16×16 blue H.264 clip, generated by ffmpeg; JSDOM does not decode media.
const video=()=>new File([Buffer.from("AAAAJGZ0eXBpc29tAAACAGlzb21pc282aXNvMmF2YzFtcDQxAAAC7G1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAAA...AABj//wAAADRhdmNDAWQACv/hABdnZAAKrNlewEQAAAMABAAAAwAQPEiWWAEABmjr48siwP34+AAAAAAQcGFzcAAAAAEAAAABAAAAEHN0dHMAAAAAAAAAAAAAABBzdHNjAAAAAAAAAAAAAAAUc3RzegAAAAAAAAAAAAAAAAAAABBzdGNvAAAAAAAAAAAAAAAobXZleAAAACB0cmV4AAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAYXVkdGEAAABZbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAsaWxzdAAAACSpdG9vAAAAHGRhdGEAAAABAAAAAExhdmY2MS43LjEwMwAAAHhtb29mAAAAEG1maGQAAAAAAAAAAQAAAGB0cmFmAAAAJHRmaGQAAAA5AAAAAQAAAAAAAAMQAAAgAAAAAssBAQAAAAAAFHRmZHQBAAAAAAAAAAAAAAAAAAAgdHJ1bgAAAgUAAAACAAAAgAIAAAAAAALLAAAADAAAAt9tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxOWY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTIgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAWZYiEABT//uzafgU3DFb59dMhveABgQAAAAhBmiFsQS/+4AAAAENtZnJhAAAAK3RmcmEBAAAAAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAADEAEBAQAAABBtZnJvAAAAAAAAAEM=",'base64')],'test.mp4',{type:'video/mp4'})

test('complete workshop loop: unfinished build → resume → save → edit same card → negative return → reload source/detail and bench',async()=>{
 localStorage.clear();const Feed=source('components/lab/FeedWorkbench.tsx').default
 let app=await mount(Feed)
 try{
  await click('What are you making? Show a build →');await fill('Build title','Polarity tester');await choose(photo());await choose(video());await fill('Caption for test.mp4','First local test');await fill('Alt text for jig.png','Polarity jig')
  await click('Close dialog');assert.equal(document.querySelector('dialog'),null)
  await click('What are you making? Show a build →');assert.equal(document.querySelector('[aria-label="Build title"]').value,'Polarity tester');assert.ok(document.querySelector('video').controls);assert.equal(document.querySelector('video').autoplay,false)
  await fill('What it does','Catch reversed leads.');await fill('Next useful request','Try the polarity reversal.');await fill('Artifact URL','https://example.org/polarity');await click('Save build to My bench');await click('Close dialog')
  const initial=b.loadBench(localStorage,'guest','demo').state.updates[0]
  await click('Open details: Polarity tester');await click('Edit build: Polarity tester');await fill('What it does','Catch reversed leads; note the false negatives.');await fill('Caption for test.mp4','Test conditions: swapped leads');await click('Save build to My bench');await click('Close dialog')
  await click('Return a result →');await fill('Result note','Negative: swapped leads were missed. Keep this counterexample.');await fill('Result artifact URL','https://example.org/counterexample');await click('Outcome: did-not-work');await click('Save result to My bench')
  assert.match(document.querySelector('[aria-label="Results for this source"]').textContent,/swapped leads were missed/)
  await click('Close dialog');assert.equal(document.querySelectorAll(`[data-feed-row="invention:${initial.id}"]`).length,1)
  const state=b.loadBench(localStorage,'guest','demo').state
  assert.equal(state.updates.length,1);assert.equal(state.tasks.length,1);assert.equal(state.updates[0].createdAt,initial.createdAt);assert.equal(state.updates[0].id,initial.id);assert.equal(state.updates[0].media.length,2);assert.equal(state.drafts.length,0)
 }finally{await app.unmount()}
 app=await mount(Feed)
 try{
  await click('Open details: Polarity tester');const result=document.querySelector('[aria-label="Results for this source"]');assert.match(result.textContent,/did-not-work/);assert.match(result.textContent,/swapped leads were missed/);assert.ok(document.querySelector('video').src.startsWith('data:video/mp4;base64,'));assert.match(document.querySelector('dialog').textContent,/Test conditions: swapped leads/)
  await click('Return a result →');assert.match(document.querySelector('[aria-label="Result note"]').value,/swapped leads were missed/);await click('Close dialog')
  assert.equal(b.loadBench(localStorage,'guest','demo').state.tasks.length,1)
 }finally{await app.unmount()}
 app=await mount(source('components/lab/feed/InventionBench.tsx').default)
 try{const article=[...document.querySelectorAll('article')].find(a=>a.querySelector('[aria-label="Edit build: Polarity tester"]'));assert.match(article.querySelector('[aria-label="Results for this source"]').textContent,/swapped leads were missed/)}finally{await app.unmount()}
 assert.equal(network,0)
})

test('identity change during composing/saving preserves A’s draft but never copies it or late media to B/live/guest',async()=>{
 localStorage.clear();identity={isLoading:false,isAuthenticated:true,session:{did:'did:plc:alice'}}
 let app=await mount(Composer,{onClose:()=>{}}),release
 try{
  await fill('Build title','Alice unfinished');await fill('What it does','Private local scope A');await fill('Next useful request','One local test')
  const a=b.loadBench(localStorage,'did:plc:alice','demo').state.drafts[0],file=photo(),originalArray=file.arrayBuffer.bind(file)
  file.arrayBuffer=()=>new Promise(r=>{release=async()=>r(await originalArray())})
  await choose(file);assert.ok(release);assert.equal([...document.querySelectorAll('button')].find(e=>e.textContent==='Save build to My bench').disabled,true)
  identity={isLoading:false,isAuthenticated:true,session:{did:'did:plc:bob'}};await app.render()
  assert.equal(document.querySelector('[aria-label="Build title"]').value,'')
  await React.act(async()=>{await release();await new Promise(r=>setTimeout(r,0))})
  assert.equal(document.querySelector('img'),null)
  await fill('Build title','Bob build');await fill('What it does','Scope B only');await fill('Next useful request','Bob test');await click('Save build to My bench')
  assert.equal(b.loadBench(localStorage,'did:plc:alice','demo').state.drafts[0].id,a.id);assert.equal(b.loadBench(localStorage,'did:plc:alice','demo').state.updates.length,0)
  assert.equal(b.loadBench(localStorage,'did:plc:bob','demo').state.updates[0].title,'Bob build');assert.equal(b.loadBench(localStorage,'did:plc:bob','demo').state.updates[0].media,undefined)
  identity={isLoading:true,isAuthenticated:false,session:null};await app.render();assert.equal(document.querySelector('[aria-label="Build title"]'),null)
  identity={isLoading:false,isAuthenticated:false,session:null};await app.render();assert.equal(document.querySelector('[aria-label="Build title"]').value,'')
  assert.equal(b.loadBench(localStorage,'guest','demo').state.updates.length,0);assert.equal(b.loadBench(localStorage,'did:plc:alice','live').state.drafts.length,0)
 }finally{await app.unmount();identity={isLoading:false,isAuthenticated:false,session:null}}
})

test('quota failure keeps current edits open and never reports saved; retry restores the same local draft',async()=>{
 localStorage.clear();let closed=false;const app=await mount(Composer,{onClose:()=>{closed=true}}),proto=window.Storage.prototype,original=proto.setItem
 try{
  await fill('Build title','Safe old draft');const prior=localStorage.getItem(b.benchKey('guest','demo'))
  proto.setItem=function(k,v){if(k.startsWith('open-lab:inventions:'))throw Error('Quota test');return original.call(this,k,v)}
  await fill('What it does','Keep unsaved work visible');await fill('Next useful request','Retry storage');await click('Save build to My bench');await click('Close dialog')
  assert.equal(closed,false);assert.equal(document.querySelector('[aria-label="What it does"]').value,'Keep unsaved work visible');assert.ok(!document.body.textContent.includes('Text saved locally'));assert.match(document.body.textContent,/Quota test/);assert.equal(localStorage.getItem(b.benchKey('guest','demo')),prior)
  proto.setItem=original;await click('Save build to My bench');assert.match(document.body.textContent,/Text saved locally/);assert.equal(b.loadBench(localStorage,'guest','demo').state.updates.length,1)
 }finally{proto.setItem=original;await app.unmount()}
})

test('unknown IDs and stale identity drawers error without creating or remapping a task; legacy results stay unassociated',async()=>{
 localStorage.clear();const Return=source('components/lab/feed/ReturnResult.tsx').default
 for(const props of [{taskId:'unknown',scope:'demo:guest'},{taskId:'known',scope:'demo:someone-else'}]){
  const app=await mount(Return,{...props,onClose:()=>{}})
  try{assert.match(document.querySelector('[role="alert"]').textContent,/Unknown task|changed identity/);assert.equal(document.querySelector('[aria-label="Result note"]'),null)}finally{await app.unmount()}
 }
 let app=await mount(Composer,{updateId:'unknown',onClose:()=>{}})
 try{assert.match(document.querySelector('[role="alert"]').textContent,/Unknown build/);assert.equal(document.querySelector('[aria-label="Build title"]'),null)}finally{await app.unmount()}
 const row=feedRow([]),legacy={id:row.ideaId,title:row.title,request:'Older saved request',artifactUrl:'https://example.org/older'}
 b.changeBench(localStorage,'guest','demo',{type:'take-task',task:legacy})
 app=await mount(Detail,{row,onClose:()=>{}})
 try{await click('Return a result →');assert.match(document.querySelector('dialog').textContent,/Older saved request/);assert.match(document.querySelector('dialog').textContent,/no recorded source association/);await fill('Result note','Older task observation');await click('Save result to My bench');assert.equal(document.querySelector('[aria-label="Results for this source"]'),null);assert.equal(b.loadBench(localStorage,'guest','demo').state.tasks[0].sourceId,undefined)}finally{await app.unmount()}
 assert.equal(network,0)
})
