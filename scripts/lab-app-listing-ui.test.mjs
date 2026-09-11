import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require=createRequire(import.meta.url)
require.extensions['.css']=m=>{m.exports=new Proxy({}, {get:(_,p)=>p==='__esModule'?false:String(p)})}
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/lab/apps/'})
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLDialogElement','Event','KeyboardEvent','StorageEvent','localStorage'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true})
HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false}
globalThis.self=dom.window;globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client')
let identity={isLoading:false,isAuthenticated:false,session:null}
source('lib/lab-identity.ts').useLabIdentity=()=>identity
const D=source('components/lab/demo/DemoCommunityProvider.tsx')
function Mode(){const d=D.useDemoCommunity();return React.createElement('button',{onClick:()=>d.setMode(d.isDemo?'live':'demo')},'Switch mode')}
const click=async label=>{const e=[...document.querySelectorAll('button,a,summary')].find(e=>e.getAttribute('aria-label')===label||e.textContent.trim()===label);assert.ok(e,'Missing action '+label);await React.act(()=>{e.focus();e.click()});return e}
const fill=async(label,value)=>{const e=document.querySelector(`[aria-label="${label}"]`);assert.ok(e,'Missing input '+label);await React.act(()=>{Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))})}
test('open local listing details and editor drafts never cross identity or Demo scopes',async()=>{
 localStorage.clear();window.history.replaceState(null,'','/lab/apps/')
 const c=source('lib/lab-app-catalog.ts'),ownerA='did:plc:fixturea',ownerB='did:plc:fixtureb'
 for(const [owner,mode,title] of [[ownerA,'demo','A demo source'],[ownerA,'live','A live source'],[ownerB,'live','B live source']]){
  assert.equal(c.changeAppShelf(localStorage,owner,mode,{type:'listing',listing:{...c.APP_CATALOG[0],id:'local:shared-id',origin:'local',title,description:`Private context for ${title}`}}).ok,true)
 }
 identity={isLoading:false,isAuthenticated:true,session:{did:ownerA}}
 const C=source('components/lab/AppsWorkbench.tsx').default,root=createRoot(document.getElementById('root'))
 const render=()=>React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,{storageScope:identity.session.did},React.createElement(C),React.createElement(Mode))))
 try{
  await render();await click('View app: A demo source');await fill('Your review draft','Unsaved A demo review')
  await click('Switch mode');assert.doesNotMatch(document.body.textContent,/A demo source|Private context for A demo/)
  assert.equal(document.querySelector('[aria-label="Your review draft"]').value,'')
  await click('Edit local listing');await fill('Short description','Unsaved A live edit')
  identity={isLoading:false,isAuthenticated:true,session:{did:ownerB}};await render()
  assert.equal(document.querySelector('[aria-label="Short description"]'),null)
  assert.doesNotMatch(document.body.textContent,/A live source|Unsaved A live edit/)
  assert.match(document.querySelector('dialog').textContent,/B live source/)
  assert.equal(c.loadAppShelf(localStorage,ownerB,'live').state.listings[0].description,'Private context for B live source')
 }finally{await React.act(()=>root.unmount());identity={isLoading:false,isAuthenticated:false,session:null};window.history.replaceState(null,'','/lab/apps/')}
})
test('an invalid local listing can be corrected and saved without closing the editor',async()=>{
 localStorage.clear();window.history.replaceState(null,'','/lab/apps/');identity={isLoading:false,isAuthenticated:false,session:null}
 const c=source('lib/lab-app-catalog.ts'),listing={...c.APP_CATALOG[0],origin:'local',id:'local:correction',title:'Correction fixture'}
 assert.equal(c.changeAppShelf(localStorage,'guest','demo',{type:'listing',listing}).ok,true)
 const C=source('components/lab/AppsWorkbench.tsx').default,root=createRoot(document.getElementById('root'))
 try{
  await React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C))))
  await click('View app: Correction fixture');await click('Edit local listing')
  await fill('GitHub source URL (optional)','https://example.org/not-github');await click('Save local listing')
  assert.match(document.querySelector('[role="alert"]').textContent,/GitHub/)
  assert.equal(c.loadAppShelf(localStorage,'guest','demo').state.listings[0].codeUrl,listing.codeUrl)
  await fill('GitHub source URL (optional)','https://github.com/example/corrected');await click('Save local listing')
  assert.equal(c.loadAppShelf(localStorage,'guest','demo').state.listings[0].codeUrl,'https://github.com/example/corrected')
  assert.equal(document.querySelector('[aria-label="App name"]'),null)
 }finally{await React.act(()=>root.unmount())}
})
test('app discovery opens a source-rich listing before external launch; saves, follows and review drafts persist without network',async()=>{
 localStorage.clear();const C=source('components/lab/AppsWorkbench.tsx').default
 let root=createRoot(document.getElementById('root'));let calls=0;const prior=globalThis.fetch;globalThis.fetch=()=>{calls++;throw Error('No remote calls')}
 const render=()=>React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,null,React.createElement(C),React.createElement(Mode))))
 try{
 await render();assert.equal(document.querySelector('[data-signal-sandbox]'),null);assert.doesNotMatch(document.body.textContent,/Synthetic signal experiment/)
 const trigger=await click('View app: marimo');const dialog=document.querySelector('dialog[open]');assert.ok(dialog)
 assert.match(dialog.textContent,/Maintainer|Maintained by/);assert.match(dialog.textContent,/License/);assert.match(dialog.textContent,/Evidence/);assert.match(dialog.textContent,/No community reviews/)
 const launch=dialog.querySelector('[data-app-launch]');assert.equal(launch.href,'https://marimo.io/');assert.equal(launch.target,'_blank');assert.match(launch.rel,/noopener/)
 assert.ok(dialog.querySelector('[data-license-source]'),'License claim needs its inspected source link')
 assert.equal(document.querySelector('iframe,canvas'),null)
 await click('Save app');await click('Follow app');await fill('Your review draft','Reruns my synthetic example. Dependency compatibility remains untested.');await click('Save review draft')
 assert.match(dialog.textContent,/not published|unpublished/i);await click('Close dialog');assert.equal(document.activeElement,trigger)
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render();await click('View app: marimo')
 assert.ok(document.querySelector('[aria-label="Unsave app"]'));assert.ok(document.querySelector('[aria-label="Unfollow app"]'));assert.match(document.querySelector('[aria-label="Your review draft"]').value,/synthetic example/)
 await click('Close dialog');await click('Switch mode');await click('View app: marimo');assert.equal(document.querySelector('[aria-label="Your review draft"]').value,'');await click('Close dialog')
 await click('Add your app');await fill('App name','Test-only notebook');await fill('Short description','A local listing for public synthetic inputs.');await fill('Maintained by','Synthetic author');await fill('License / terms','Unverified — check linked source');await fill('Use case','Compare two public-input examples.');await fill('Evidence and limitations','Not independently evaluated.');await fill('App URL','https://example.org/app');await fill('Source / documentation URL','https://example.org/docs');await click('Save local listing')
 await click('View app: Test-only notebook');assert.match(document.querySelector('dialog').textContent,/unpublished/i);await click('Close dialog');await click('Switch mode');assert.doesNotMatch(document.body.textContent,/Test-only notebook/)
 assert.equal(calls,0)
 }finally{await React.act(()=>root.unmount());globalThis.fetch=prior}
})
