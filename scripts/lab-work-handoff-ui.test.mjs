import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require=createRequire(import.meta.url)
require.extensions['.css']=m=>{m.exports=new Proxy({}, {get:(_,p)=>p==='__esModule'?false:String(p)})}
const dom=new JSDOM('<div id="root"></div>',{url:'https://example.org/lab/feed/'})
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLDialogElement','Event','KeyboardEvent','StorageEvent','localStorage'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true})
HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false}
globalThis.self=window;globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client')
let identity={isLoading:false,isAuthenticated:false,session:null}
source('lib/lab-identity.ts').useLabIdentity=()=>identity
const D=source('components/lab/demo/DemoCommunityProvider.tsx'),b=source('lib/lab-inventions.ts'),m=source('lib/lab-feed-model.ts'),d=source('lib/lab-demo.ts')
const rows=()=>m.buildFeedRows({isDemo:true,demo:d.emptyDemoState(),drafts:[]})
const click=async label=>{const e=[...document.querySelectorAll('button,a,summary')].find(e=>e.getAttribute('aria-label')===label||e.textContent.trim()===label);assert.ok(e,'Missing action '+label);await React.act(async()=>{e.click();await Promise.resolve()});return e}
const fill=async(label,value)=>{const e=document.querySelector(`[aria-label="${label}"]`);assert.ok(e,'Missing input '+label);await React.act(()=>{Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))})}
test('exact feed task is copied for an own agent, exported for GitHub, then returned to the same source; no network',async()=>{
 localStorage.clear();const row=rows()[0],C=source('components/lab/feed/FeedDetail.tsx').default
 const root=createRoot(document.getElementById('root'));let copied='',downloaded,blob,network=0
 Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{copied=t}},configurable:true})
 const fetch=globalThis.fetch,create=URL.createObjectURL,revoke=URL.revokeObjectURL,anchorClick=window.HTMLAnchorElement.prototype.click
 globalThis.fetch=()=>{network++;throw Error('No network from handoff')};URL.createObjectURL=b=>{blob=b;return 'blob:test'};URL.revokeObjectURL=()=>{};window.HTMLAnchorElement.prototype.click=function(){downloaded=this.download}
 try{
 await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C,{row,onClose:()=>{}}))))
 await click('Use my agent');await click('Copy brief');assert.ok(copied.includes(row.ideaId));assert.ok(copied.includes(row.request));assert.match(copied,/Stop condition/)
 assert.equal(b.loadBench(localStorage,'guest','demo').state.tasks[0].sourceId,row.ideaId)
 await click('Work on GitHub');await fill('GitHub destination URL','https://github.com.evil.test/research');await click('Copy brief');assert.match(document.querySelector('[data-work-handoff]').textContent,/GitHub URL/)
 await fill('GitHub destination URL','https://github.com/example/research/issues/42');await click('Download brief');assert.match(downloaded,/\.txt$/);assert.match(await blob.text(),/issues\/42/)
 await click('Return a result →');await fill('Result note','Counterexample: held-out rows reached preprocessing.');await fill('Result artifact URL','https://example.org/failure');await click('Outcome: did-not-work');await click('Save result to My bench')
 assert.match(document.querySelector('[aria-label="Results for this source"]').textContent,/Counterexample/)
 assert.equal(b.loadBench(localStorage,'guest','demo').state.tasks.length,1);assert.equal(network,0)
 }finally{await React.act(()=>root.unmount());globalThis.fetch=fetch;URL.createObjectURL=create;URL.revokeObjectURL=revoke;window.HTMLAnchorElement.prototype.click=anchorClick}
})
test('export rereads the bench, keeps saved goals/results and refuses a newly corrupt store',async()=>{
 localStorage.clear();const row=rows().find(r=>r.artifactId==='marimo'),C=source('components/lab/feed/FeedDetail.tsx').default,root=createRoot(document.getElementById('root'))
 const task={id:row.ideaId,sourceId:row.ideaId,title:'Original test',request:'Original exact saved goal',artifact:'Original artifact',artifactUrl:'https://example.org/original'}
 b.changeBench(localStorage,'guest','demo',{type:'take-task',task});b.changeBench(localStorage,'guest','demo',{type:'return-result',id:task.id,result:{note:'Preserve my failed attempt',artifactUrl:'',outcome:'did-not-work'}})
 let copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>copied.push(text)},configurable:true})
 try{
  await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C,{row,onClose:()=>{}}))))
  await click('Copy brief');assert.match(copied[0],/Original exact saved goal/)
  assert.match(b.loadBench(localStorage,'guest','demo').state.tasks[0].result.note,/Preserve/)
  const key=b.benchKey('guest','demo'),corrupt='{unreadable-original';localStorage.setItem(key,corrupt)
  await click('Copy brief');assert.equal(copied.length,1);assert.equal(localStorage.getItem(key),corrupt)
  assert.match(document.querySelector('[data-work-handoff] [role="alert"]').textContent,/preserved|could not be read/)
 }finally{await React.act(()=>root.unmount())}
})
test('tool feed details lead with the actual app listing and retain bounded contribution work',async()=>{
 localStorage.clear();const row=rows().find(r=>r.artifactId==='marimo'),C=source('components/lab/feed/FeedDetail.tsx').default,root=createRoot(document.getElementById('root'))
 try{await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C,{row,onClose:()=>{}}))));assert.ok(document.querySelector('[data-app-launch]'));assert.ok(document.querySelector('[data-work-handoff]'));assert.equal(document.querySelector('iframe,canvas'),null)}finally{await React.act(()=>root.unmount())}
})
