import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
require.extensions['.css'] = m => { m.exports = new Proxy({}, {get: (_,p) => p === '__esModule' ? false : String(p)}) }
const dom = new JSDOM('<div id="root"></div>',{url:'https://fixture.example/lab/feed/'})
for (const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLDialogElement','Event','MouseEvent','KeyboardEvent','StorageEvent','localStorage']) Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true})
globalThis.self=window;globalThis.IS_REACT_ACT_ENVIRONMENT=true
HTMLDialogElement.prototype.showModal=function(){this.open=true}
HTMLDialogElement.prototype.close=function(){this.open=false}
const React=await import('react'), {createRoot}=await import('react-dom/client')
const auth=source('lib/lab-identity.ts'), D=source('components/lab/demo/DemoCommunityProvider.tsx'), M=source('lib/lab-catchup.ts')
let root, identity
function Mode(){const d=D.useDemoCommunity();return React.createElement('button',{onClick:()=>d.setMode(d.isDemo?'live':'demo')},'Fixture mode')}
const Feed=source('components/lab/FeedWorkbench.tsx').default
const render=()=>React.act(()=>root.render(React.createElement(D.DemoCommunityProvider,{storageScope:identity.session?.did||'browser'},React.createElement(Mode),React.createElement(Feed))))
const button=label=>[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===label||b.textContent.trim()===label)
const click=async label=>{const el=button(label);assert.ok(el,'Missing action: '+label);await React.act(()=>el.click())}
const rows=()=>[...document.querySelectorAll('[data-feed-row]')]
const fill=async(label,value)=>{const e=document.querySelector(`[aria-label="${label}"]`);assert.ok(e);await React.act(()=>{Object.getOwnPropertyDescriptor(e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))})}
beforeEach(()=>{localStorage.clear();window.history.replaceState(null,'','/lab/feed/');identity={isLoading:false,isAuthenticated:false,session:null};mock.method(auth,'useLabIdentity',()=>identity);mock.method(globalThis,'fetch',()=>{throw Error('Unexpected network from local daily journey')});root=createRoot(document.getElementById('root'))})
afterEach(async()=>{await React.act(()=>root.unmount());mock.restoreAll()})

test('needs-a-hand narrows to actual requests and the same saved task returns a result',async()=>{
 await render();await click('Needs a hand')
 assert.ok(rows().length>0);assert.ok(rows().every(r=>r.textContent.includes('Help wanted')))
 const first=rows()[0], title=first.querySelector('h2').textContent
 await click(`Open details: ${title}`);await click('Save this test to My bench');await click('Close dialog')
 assert.ok(document.querySelector('[aria-label="Continue your work"]'),'Saved-task continuation missing')
 await click(`Return a result: ${title}`)
 assert.ok(document.querySelector('[aria-label="Result note"]'))
 assert.ok(document.querySelector('dialog').textContent.includes(title))
 await fill('Result note','Synthetic fixture: the declared test failed on the negative control.')
 await fill('Result artifact URL','https://fixture.example/results/negative-control')
 await click('Outcome: did-not-work');await click('Save result to My bench')
 assert.ok(!document.querySelector('dialog'))
 assert.ok(!document.querySelector('[aria-label="Continue your work"]'),'Completed task leaves the continuation queue')
 const bench=source('lib/lab-inventions.ts').loadBench(localStorage,'guest','demo').state
 assert.equal(bench.tasks.length,1);assert.equal(bench.tasks[0].title,title)
 assert.equal(bench.tasks[0].result.outcome,'did-not-work')
 assert.equal(bench.tasks[0].result.artifactUrl,'https://fixture.example/results/negative-control')
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render()
 assert.ok(!document.querySelector('[aria-label="Continue your work"]'))
 await click('All activity');assert.equal(rows().length,8)
})

test('F1 UI: acknowledge -> return -> new unread -> acknowledge -> reload without replay',async()=>{
 await render()
 const title='Split-before-fit inspector', first=rows()[0].dataset.feedRow
 const unrelated=rows().find(r=>r.querySelector('h2').textContent==='marimo')
 assert.ok(unrelated)
 await click('Reviewed: marimo');await click(`Open details: ${title}`)
 await click('Save this test to My bench');await click('Close dialog');await click('Mark reviewed caught up')
 assert.equal(rows().length,6);assert.ok(!rows().some(r=>r.dataset.feedRow===first))
 const bench=source('lib/lab-inventions.ts'), snapshot=bench.loadBench(localStorage,'guest','demo').state.tasks[0]
 const history=localStorage.getItem(M.catchupKey('guest','demo'))
 await click(`Return a result: ${title}`)
 await fill('Result note','Synthetic counterexample: negative control failed.')
 await fill('Result artifact URL','https://fixture.example/results/counterexample')
 await click('Outcome: did-not-work');await click('Save result to My bench')
 assert.equal(rows().length,7,'Only the acknowledged source returns to unread')
 assert.ok(rows().some(r=>r.dataset.feedRow===first),'Returned evidence must reopen its source')
 assert.ok(!rows().some(r=>r.dataset.feedRow===unrelated.dataset.feedRow),'Unrelated acknowledgement survives')
 assert.equal(localStorage.getItem(M.catchupKey('guest','demo')),history)
 assert.equal(button('Mark reviewed caught up').disabled,true,'Returning is not reviewing the new revision')
 await click(`Open details: ${title}`)
 assert.match(document.querySelector('[aria-label="Results for this source"]').textContent,/negative control failed/)
 await click('Close dialog');await click('Mark reviewed caught up')
 assert.equal(rows().length,6)
 const saved=bench.loadBench(localStorage,'guest','demo').state.tasks[0]
 const {result,...original}=saved;assert.deepEqual(original,snapshot);assert.equal(result.outcome,'did-not-work')
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render()
 assert.equal(rows().length,6);assert.ok(!rows().some(r=>r.dataset.feedRow===first))
 assert.deepEqual(bench.loadBench(localStorage,'guest','demo').state.tasks[0],saved)
 await click('Fixture mode');assert.equal(rows().length,3)
 assert.equal(bench.loadBench(localStorage,'guest','live').state.tasks.length,0)
 await click('Fixture mode');assert.equal(rows().length,6)
 identity={isLoading:false,isAuthenticated:true,session:{did:'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb',handle:'b.example.org'}};await render()
 assert.equal(rows().length,8,'Another identity cannot inherit returned evidence or acknowledgements')
 await click(`Open details: ${title}`)
 assert.equal(document.querySelector('[aria-label="Results for this source"]'),null)
 await click('Close dialog')
 identity={isLoading:false,isAuthenticated:false,session:null};await render()
 assert.equal(rows().length,6,'Returning to the original scope restores the acknowledged result revision')
})

test('catch-up, reviewed selections, and bench drawers stay isolated across restored identities',async()=>{
 const a={did:'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa',handle:'a.example.org'}, b={did:'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb',handle:'b.example.org'}
 identity={isLoading:false,isAuthenticated:true,session:a}
 await render();await click('Open details: Split-before-fit inspector');await click('Save this test to My bench');await click('Close dialog');await click('Mark reviewed caught up')
 assert.equal(rows().length,7)
 await click('Return a result: Split-before-fit inspector')
 identity={...identity,session:b};await render()
 assert.equal(rows().length,8);assert.ok(!document.querySelector('dialog'))
 assert.ok(!document.querySelector('[aria-label="Continue your work"]'))
 assert.equal(button('Mark reviewed caught up').disabled,true)
 assert.equal(M.loadCatchup(localStorage,b.did,'demo').state.seen.length,0)
 identity={...identity,session:a};await render()
 assert.equal(rows().length,7);assert.ok(document.querySelector('[aria-label="Continue your work"]'))
 assert.ok(!document.querySelector('dialog'),'An old result editor does not reopen after switching back')
 assert.equal(button('Mark reviewed caught up').disabled,true)
})

test('reset filters leaves an empty help view and returns to unread discovery',async()=>{
 await render();await click('Fixture mode');await click('Needs a hand')
 assert.equal(rows().length,0)
 await click('Reset filters')
 assert.equal(rows().length,3,'Reset must clear the help filter as well as branches and text')
 assert.equal(button('Not caught up').getAttribute('aria-pressed'),'true')
})

test('failed catch-up preserves source storage and replaces any earlier success notice',async()=>{
 await render();await click('Open details: Split-before-fit inspector');await click('Close dialog');await click('Mark reviewed caught up')
 assert.match(document.querySelector('[aria-label="Daily catch-up"]').textContent,/1 update marked caught up/)
 const title=rows()[0].querySelector('h2').textContent
 await click(`Reviewed: ${title}`)
 const key=M.catchupKey('guest','demo'), corrupt='{future unreadable history'
 localStorage.setItem(key,corrupt)
 await click('Mark reviewed caught up')
 assert.equal(localStorage.getItem(key),corrupt)
 assert.equal(rows().length,7,'Failed acknowledgement does not remove another row')
 const summary=document.querySelector('[aria-label="Daily catch-up"]')
 assert.match(summary.textContent,/could not be read/)
 assert.ok(summary.querySelector('[role="status"]')===null,'A prior success must not describe the failed save')
})

test('incomplete public reads never become an all-caught-up claim',async()=>{
 const pub=source('components/lab/feed/usePublicFollowing.ts')
 mock.method(pub,'usePublicFollowing',()=>({requested:true,loading:false,records:[],feed:null,error:'Fixture source failed',refresh(){}}))
 await render();await click('Following')
 assert.match(document.querySelector('[aria-label="Daily catch-up"]').textContent,/Catch-up is incomplete/)
 assert.doesNotMatch(document.body.textContent,/You’re caught up|Nothing unread/)
 assert.match(document.body.textContent,/Fixture source failed/)
})

test('returning readers can open unread followed work directly from the daily summary',async()=>{
 await render();await click('Follow idea: Split-before-fit inspector')
 assert.ok(button('Catch up on followed work'),'Followed-work shortcut missing')
 assert.match(button('Catch up on followed work').textContent,/2 unread from your follows/)
 await click('Catch up on followed work');assert.equal(rows().length,2)
 await click('Open details: Split-before-fit inspector');await click('Close dialog');await click('Mark reviewed caught up');assert.equal(rows().length,1)
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render();assert.equal(rows().length,1)
})

test('daily cold start is honest; explicit reviewed-only catch-up persists without replaying hidden work',async()=>{
 await render()
 assert.ok(document.querySelector('[aria-label="Daily catch-up"]'),'Daily catch-up missing')
 assert.equal(document.querySelector('h1').textContent,'Catch up')
 assert.match(document.body.textContent,/Follow an idea, person, or branch/)
 assert.match(document.body.textContent,/not a live activity timeline/)
 assert.equal(rows().length,8)
 const mark=()=>button('Mark reviewed caught up')
 assert.equal(mark().disabled,true,'Rendering rows is not reviewing them')
 const first=rows()[0].dataset.feedRow, second=rows()[1].dataset.feedRow
 await click('Open details: Split-before-fit inspector');await click('Close dialog')
 assert.equal(mark().disabled,false)
 await fill('Search the feed','marimo');assert.equal(mark().disabled,true,'Hidden review cannot clear a different filter')
 await fill('Search the feed','');await click('Mark reviewed caught up')
 assert.equal(rows().length,7);assert.ok(!rows().some(r=>r.dataset.feedRow===first));assert.ok(rows().some(r=>r.dataset.feedRow===second))
 assert.match(document.querySelector('[aria-label="Daily catch-up"]').textContent,/1 update marked caught up/)
 await React.act(()=>root.unmount());root=createRoot(document.getElementById('root'));await render()
 assert.equal(rows().length,7,'Exact acknowledged update stays out after reload')
 await click('All activity');assert.equal(rows().length,8);assert.match(rows()[0].textContent,/Caught up/)
 await click('Fixture mode');assert.equal(rows().length,3);assert.equal(M.loadCatchup(localStorage,'guest','live').state.seen.length,0)
 await click('Fixture mode');assert.equal(rows().length,7)
})
