import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
const model=source('lib/lab-feed-model.ts'),demo=source('lib/lab-demo.ts')
const rows=()=>model.buildFeedRows({isDemo:true,demo:demo.emptyDemoState(),drafts:[]})
test('a local idea handoff includes the actual source text, not only the generic next-step recipe',()=>{
 const h=source('lib/lab-work-handoff.ts')
 const row=model.buildFeedRows({isDemo:false,demo:demo.emptyDemoState(),drafts:[{slot:'note:fixture',kind:'note',data:{text:'Compare missing-value handling in two synthetic sensor streams.',field:'cross-field'}}]}).find(r=>r.draftSlot)
 const text=h.formatWorkHandoff(h.createWorkHandoff({row,destination:'agent',mode:'live'}))
 assert.ok(text.includes(row.text),'The exported brief loses the actual local idea')
 assert.match(text,/Source context/)
 const task={id:row.ideaId,sourceId:row.ideaId,title:row.title,request:'Previously saved goal',artifact:row.artifact,artifactUrl:''}
 const revisited=h.formatWorkHandoff(h.createWorkHandoff({row,destination:'github',mode:'live',savedTask:task}))
 assert.match(revisited,/Current source context.*not part of the saved task snapshot/)
 assert.ok(revisited.includes(task.request));assert.ok(revisited.includes(row.text))
})
test('a saved task snapshot is exported unchanged; legacy or mismatched sources fail closed',()=>{
 const h=source('lib/lab-work-handoff.ts'),row=rows()[0]
 const savedTask={id:row.ideaId,sourceId:row.ideaId,title:'Original bounded title',request:'Original exact goal',artifact:'Original expected artifact',artifactUrl:'https://example.org/original',result:{note:'Keep this result',artifactUrl:'',outcome:'uncertain'}}
 const packet=h.createWorkHandoff({row,destination:'agent',mode:'demo',savedTask})
 assert.equal(packet.goal,savedTask.request);assert.equal(packet.task.title,savedTask.title);assert.equal(packet.task.artifactUrl,savedTask.artifactUrl);assert.equal(packet.task.result,undefined)
 assert.ok(packet.sources.some(s=>s.href===savedTask.artifactUrl));assert.ok(!h.formatWorkHandoff(packet).includes('Keep this result'))
 for(const task of [{...savedTask,sourceId:undefined},{...savedTask,sourceId:'wrong'},{...savedTask,id:'wrong'}])assert.throws(()=>h.createWorkHandoff({row,destination:'here',mode:'demo',savedTask:task}),/source|task/i)
 assert.throws(()=>h.createWorkHandoff({row,destination:'agent',mode:'live'}),/Demo/)
})
test('handoff carries the exact task and source, required output, limits, and stop condition for each work destination',()=>{
 assert.ok(existsSync('src/lib/lab-work-handoff.ts'),'Source-bound work handoff missing')
 const h=source('lib/lab-work-handoff.ts'),row=rows()[0]
 for(const destination of ['here','github','agent']){
  const packet=h.createWorkHandoff({row,destination,mode:'demo',githubUrl:destination==='github'?'https://github.com/example/research/issues/42':''})
  assert.equal(packet.task.id,row.ideaId);assert.equal(packet.task.sourceId,row.ideaId);assert.equal(packet.goal,row.request);assert.ok(packet.expectedOutput);assert.ok(packet.stopCondition)
  assert.equal(packet.sources[0].href,demo.demoThreadHref(row.threadId));assert.match(packet.disclosure,/illustrative|fictional/i)
  const text=h.formatWorkHandoff(packet)
  for(const value of [row.ideaId,row.request,row.artifact,'Expected output','Stop condition','No credentials','My bench'])assert.ok(text.includes(value),value)
  assert.match(text,/not.*(dispatch|run)|No.*agent.*(run|launch)/i)
 }
 const editorial=rows().find(r=>r.artifactId==='marimo')
 const p=h.createWorkHandoff({row:editorial,destination:'agent',mode:'live'})
 assert.ok(p.sources.some(s=>s.href==='https://marimo.io/'));assert.ok(p.sources.some(s=>s.href==='https://github.com/marimo-team/marimo'))
 assert.match(p.disclosure,/editorial/i)
 for(const bad of ['https://github.com.evil.test/a','https://user@github.com/a','https://github.com/a\n','javascript:alert(1)'])assert.throws(()=>h.createWorkHandoff({row,destination:'github',mode:'demo',githubUrl:bad}),/GitHub/)
})
