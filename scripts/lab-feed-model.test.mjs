import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
test('mixed feed reuses coherent stories and source artifacts, filters follow union once, and hides examples in real mode', () => {
 assert.ok(existsSync('src/lib/lab-feed-model.ts'), 'Mixed feed model missing')
 const m=source('lib/lab-feed-model.ts'), d=source('lib/lab-demo.ts'), f=source('lib/lab-following.ts')
 const demo=d.emptyDemoState(), prefs=f.emptyFollowing('guest','demo')
 const rows=m.buildFeedRows({isDemo:true,demo,drafts:[]})
 assert.equal(rows.length,8)
 assert.equal(new Set(rows.map(r=>r.id)).size,8)
 assert.ok(new Set(rows.map(r=>r.kind)).size>=4)
 assert.ok(rows.filter(r=>r.origin==='demo').every(r=>d.DEMO_THREADS.some(t=>t.id===r.ideaId)))
 const followed={...prefs,ideas:['split-boundary'],people:['sana'],disciplines:['cross-field'],filter:{feed:'following',disciplines:[]}}
 const result=m.filterFeedRows([...rows,rows[0]],followed,'')
 assert.equal(new Set(result.map(r=>r.id)).size,result.length)
 assert.ok(result.some(r=>r.authorId==='sana'))
 assert.ok(result.some(r=>r.ideaId==='split-boundary'))
 assert.ok(result.some(r=>r.id==='artifact:marimo'))
 assert.equal(m.filterFeedRows(rows,{...prefs,filter:{feed:'following',disciplines:[]}},'').length,0)
 assert.equal(m.filterFeedRows(rows,prefs,'no possible match').length,0)
 const live=m.buildFeedRows({isDemo:false,demo,drafts:[]})
 assert.ok(live.every(r=>r.origin!=='demo'))
})

test('provider replies and real local ideas enter their own mode; tags drive cross-field views', () => {
 const m=source('lib/lab-feed-model.ts'), d=source('lib/lab-demo.ts'), f=source('lib/lab-following.ts')
 const demo=d.reduceDemoState(d.emptyDemoState(), {type:'reply',threadId:'split-boundary',text:'A smaller independent rerun'})
 const drafts=[{slot:'note:abc',kind:'note',data:{text:'My duration question',field:'neurotech'}}]
 const rows=m.buildFeedRows({isDemo:true,demo,drafts})
 assert.ok(rows.some(r=>r.text==='A smaller independent rerun' && r.origin==='demo'))
 assert.ok(!rows.some(r=>r.draftSlot))
 const live=m.buildFeedRows({isDemo:false,demo,drafts})
 assert.ok(live.some(r=>r.ideaId==='draft:note:abc'))
 assert.ok(!live.some(r=>r.text==='A smaller independent rerun'))
 const prefs={...f.emptyFollowing('guest','live'),ideaTags:{'draft:note:abc':['digital-human-rights','neurotech']},filter:{feed:'discover',disciplines:['digital-human-rights','neurotech']}}
 assert.equal(m.filterFeedRows(live,prefs,'duration').length,1)
})

test('workshop feed centers buildable artifacts and bounded requests, with science taxonomy and historical persona disclosure',()=>{
 const m=source('lib/lab-feed-model.ts'),d=source('lib/lab-demo.ts'),f=source('lib/lab-following.ts')
 assert.ok(f.DISCIPLINES?.some(v=>v.id==='physics'),'Scientific disciplines missing')
 assert.equal(f.protocolFieldForDiscipline('physics'),'cross-field')
 const rows=m.buildFeedRows({isDemo:true,demo:d.emptyDemoState(),drafts:[]})
 assert.ok(rows.every(r=>r.artifact && r.request && r.stage))
 assert.ok(rows.some(r=>r.action==='Try prototype'))
 assert.ok(rows.some(r=>r.action==='Take a test'))
 const prefs={...f.emptyFollowing('guest','demo'),filter:{feed:'discover',disciplines:['physics']}}
 assert.equal(m.filterFeedRows(rows,prefs,'').length,0)
 assert.equal(d.DEMO_PEOPLE[0].name,'Ada Lovelace')
 assert.match(d.DEMO_PERSONA_DISCLOSURE,/not their statements/i)
})
