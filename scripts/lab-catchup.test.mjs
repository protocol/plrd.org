import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
const storage = () => { const values = new Map(); return { values, getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v) } }
const row = (id, text = 'Source-authored update') => ({ id, ideaId: id, title: id, text, kind: 'Help wanted', origin: 'local', author: 'Your local build', disciplines: ['math'], artifact: 'Test fixture', request: 'Check the fixture', stage: 'idea', action: 'Help build' })

test('needs-a-hand uses explicit requests, not every tool, question, or unvalidated result', () => {
 const feed = source('lib/lab-feed-model.ts'), demo = source('lib/lab-demo.ts')
 assert.equal(typeof feed.needsAHand,'function','Explicit help classifier missing')
 assert.equal(feed.needsAHand(row('a')),true)
 assert.equal(feed.needsAHand({...row('b'),kind:'help-wanted'}),true)
 for (const kind of ['Tool','Research question','test-result','Evidence gap','note']) assert.equal(feed.needsAHand({...row('c'),kind}),false)
 const rows=feed.buildFeedRows({isDemo:true,demo:demo.emptyDemoState(),drafts:[]})
 assert.ok(rows.some(r=>r.action==='View app'))
 assert.ok(rows.filter(feed.needsAHand).every(r=>r.kind==='Help wanted'))
 assert.ok(!rows.some(r=>r.action==='Try prototype'))
})

test('catch-up records only reviewed exact revisions, persists reload, and never clears hidden updates', () => {
 assert.ok(existsSync('src/lib/lab-catchup.ts'), 'Scoped catch-up model missing')
 const m = source('lib/lab-catchup.ts'), s = storage(), a = row('a'), b = row('b')
 assert.equal(m.loadCatchup(s,'guest','live').state.seen.length,0)
 const reviewed = [m.catchupReceipt(a)]
 const result = m.markCaughtUp(s,'guest','live',[a,b],reviewed)
 assert.equal(result.ok,true); assert.equal(result.count,1)
 const state = m.loadCatchup(s,'guest','live').state
 assert.deepEqual([a,b].filter(r => !m.isCaughtUp(state,r)).map(r=>r.id),['b'])
 assert.equal(m.isCaughtUp(state,row('a','Actually changed source')),false)
 assert.equal(m.markCaughtUp(s,'guest','live',[b],reviewed).count,0,'A filtered-out revision is not eligible')
 assert.equal(m.markCaughtUp(s,'guest','live',[row('a','Changed while drawer open')],reviewed).count,0,'Review of an older revision cannot acknowledge a new one')
 assert.equal(m.loadCatchup(s,'other','live').state.seen.length,0)
 assert.equal(m.loadCatchup(s,'guest','demo').state.seen.length,0)
})

test('F1: acknowledging then returning evidence reopens only the exact source and persists the new acknowledgement', () => {
 const feed=source('lib/lab-feed-model.ts'), demo=source('lib/lab-demo.ts'), bench=source('lib/lab-inventions.ts'), m=source('lib/lab-catchup.ts'), s=storage()
 const args={isDemo:true,demo:demo.emptyDemoState(),drafts:[]}
 const before=feed.buildFeedRows(args), first=before[0], oldReceipt=m.catchupReceipt(first)
 const task={id:first.ideaId,sourceId:first.ideaId,title:first.title,request:first.request,artifact:first.artifact,artifactUrl:first.artifactUrl||''}
 assert.equal(bench.changeBench(s,'guest','demo',{type:'take-task',task}).ok,true)
 assert.equal(m.markCaughtUp(s,'guest','demo',before,before.map(m.catchupReceipt)).count,before.length)
 const history=s.getItem(m.catchupKey('guest','demo'))
 const result={note:'Synthetic counterexample found',outcome:'did-not-work',artifactUrl:'https://example.org/failure'}
 assert.equal(bench.changeBench(s,'guest','demo',{type:'return-result',id:task.id,result}).ok,true)
 const saved=bench.loadBench(s,'guest','demo').state
 assert.deepEqual(saved.tasks,[{...task,result}],'Saved task snapshot is unchanged')
 const after=feed.buildFeedRows({...args,updates:saved.updates,tasks:saved.tasks}), updated=after.find(r=>r.id===first.id)
 assert.equal(after.length,before.length)
 assert.notDeepEqual(m.catchupReceipt(updated),oldReceipt,'F1: returned evidence must change the acknowledged source receipt')
 assert.equal(s.getItem(m.catchupKey('guest','demo')),history,'Returning evidence must not rewrite any acknowledgement history')
 const state=m.loadCatchup(s,'guest','demo').state
 assert.deepEqual(after.filter(r=>!m.isCaughtUp(state,r)).map(r=>r.id),before.filter(r=>r.ideaId===first.ideaId).map(r=>r.id))
 assert.equal(m.markCaughtUp(s,'guest','demo',[updated],[oldReceipt]).count,0,'Stale review cannot acknowledge the new result')
 assert.equal(m.markCaughtUp(s,'guest','demo',[updated],[m.catchupReceipt(updated)]).count,1)
 const reloaded=feed.buildFeedRows({...args,...bench.loadBench(s,'guest','demo').state})
 assert.equal(m.isCaughtUp(m.loadCatchup(s,'guest','demo').state,reloaded.find(r=>r.id===first.id)),true)
 assert.equal(m.loadCatchup(s,'guest','demo').state.seen.length,before.length)
 assert.equal(m.loadCatchup(s,'other','demo').state.seen.length,0)
 assert.equal(m.loadCatchup(s,'guest','live').state.seen.length,0)
})

test('catch-up writer preserves a full history instead of producing an unreadable 1001-entry store', () => {
 const m = source('lib/lab-catchup.ts'), s = storage(), key = m.catchupKey('guest','live')
 const rows = Array.from({length:1000},(_,i)=>row(`item-${i}`))
 assert.equal(m.markCaughtUp(s,'guest','live',rows,rows.map(m.catchupReceipt)).ok,true)
 assert.equal(m.loadCatchup(s,'guest','live').state.seen.length,1000)
 const original = s.getItem(key), extra = row('overflow')
 const result = m.markCaughtUp(s,'guest','live',[extra],[m.catchupReceipt(extra)])
 assert.equal(result.ok,false,'A full store must not be replaced with data the loader rejects')
 assert.equal(result.count,0); assert.match(result.error,/limit|full/i)
 assert.equal(s.getItem(key),original)
 const changed = row('item-0','A revised source at capacity')
 assert.equal(m.markCaughtUp(s,'guest','live',[changed],[m.catchupReceipt(changed)]).ok,true)
 assert.equal(m.loadCatchup(s,'guest','live').error,'')
 assert.equal(m.isCaughtUp(m.loadCatchup(s,'guest','live').state,changed),true)
})

test('catch-up reader and writer share UTF-8 envelope and receipt schema limits without destructive repair', () => {
 const m = source('lib/lab-catchup.ts'), key = m.catchupKey('guest','live'), s = storage()
 const large = Array.from({length:4},(_,i)=>row(`large-${i}`,'界'.repeat(100000)))
 assert.equal(m.markCaughtUp(s,'guest','live',large.slice(0,3),large.map(m.catchupReceipt)).ok,true)
 const original = s.getItem(key)
 assert.equal(m.loadCatchup(s,'guest','live').error,'')
 const result = m.markCaughtUp(s,'guest','live',large,large.map(m.catchupReceipt))
 assert.equal(result.ok,false,'UTF-8 envelope limit must be checked before writing')
 assert.equal(result.count,0); assert.equal(s.getItem(key),original)
 const oversized = JSON.stringify({...m.emptyCatchup('guest','live'),seen:large.map(m.catchupReceipt)})
 assert.ok(oversized.length < 1048576 && Buffer.byteLength(oversized,'utf8') > 1048576)
 s.setItem(key,oversized)
 assert.ok(m.loadCatchup(s,'guest','live').error,'Initial reads use the same byte bound')
 assert.equal(m.markCaughtUp(s,'guest','live',[row('small')],[m.catchupReceipt(row('small'))]).ok,false)
 assert.equal(s.getItem(key),oversized)
 for (const invalid of [row('__proto__'),row('x'.repeat(4097)),row('bad\u0000id'),row('long','a'.repeat(131072))]) {
  s.setItem(key,original)
  assert.equal(m.markCaughtUp(s,'guest','live',[invalid],[m.catchupReceipt(invalid)]).ok,false,'Invalid receipt must not poison readable history')
  assert.equal(s.getItem(key),original)
 }
 const empty = JSON.stringify(m.emptyCatchup('guest','live'))
 s.setItem(key,empty.padEnd(1048576,' '))
 assert.equal(m.loadCatchup(s,'guest','live').error,'','Exact envelope limit is inclusive')
 s.setItem(key,empty.padEnd(1048577,' '))
 assert.ok(m.loadCatchup(s,'guest','live').error,'Check serialized bound before parsing padding away')
})

test('catch-up preserves corrupt, unknown, wrong-scope and unavailable stores; failed writes never claim success', () => {
 const m = source('lib/lab-catchup.ts'), a = row('a'), key = m.catchupKey('guest','live')
 const valid = m.emptyCatchup('guest','live')
 for (const raw of ['{broken', 'null', JSON.stringify({...valid,version:2}), JSON.stringify({...valid,owner:'other'}), JSON.stringify({...valid,extra:'future'}), JSON.stringify({...valid,seen:[{id:'a'}]}), JSON.stringify({...valid,seen:[{id:'a',revision:'v',extra:true}]}), JSON.stringify({...valid,seen:[{id:'__proto__',revision:'v'}]})]) {
  const s = storage();s.setItem(key,raw)
  assert.ok(m.loadCatchup(s,'guest','live').error,raw)
  assert.equal(m.markCaughtUp(s,'guest','live',[a],[m.catchupReceipt(a)]).ok,false)
  assert.equal(s.getItem(key),raw)
 }
 let writes = 0
 const unavailable={getItem(){throw Error('blocked')},setItem(){writes++}}
 assert.equal(m.markCaughtUp(unavailable,'guest','live',[a],[m.catchupReceipt(a)]).ok,false);assert.equal(writes,0)
 const rejected={getItem(){return null},setItem(){throw Error('quota')}}
 assert.equal(m.markCaughtUp(rejected,'guest','live',[a],[m.catchupReceipt(a)]).ok,false)
 const mismatch={getItem(){return null},setItem(){}}
 assert.equal(m.markCaughtUp(mismatch,'guest','live',[a],[m.catchupReceipt(a)]).ok,false)
 const s=storage();m.markCaughtUp(s,'guest','live',[a],[m.catchupReceipt(a)])
 m.markCaughtUp(s,'guest','live',[row('b')],[m.catchupReceipt(row('b'))])
 assert.equal(m.loadCatchup(s,'guest','live').state.seen.length,2,'Re-read current state before merging another tab’s acknowledgement')
})
