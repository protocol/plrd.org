import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m}}
test('a bounded task reaches My bench, reloads, and accepts an evidence return without claiming external completion',()=>{
 assert.ok(existsSync('src/lib/lab-inventions.ts'),'Invention bench model missing')
 const b=source('lib/lab-inventions.ts'),s=store()
 const task={id:'split-check',title:'Inspect fitted row IDs',request:'Run two synthetic splits, log fit inputs; stop after two cases.',artifactUrl:'https://marimo.io/'}
 assert.equal(b.changeBench(s,'did:plc:a','demo',{type:'take-task',task}).ok,true)
 assert.equal(b.changeBench(s,'did:plc:a','demo',{type:'take-task',task}).ok,true)
 let state=b.loadBench(s,'did:plc:a','demo').state;assert.equal(state.tasks.length,1);assert.equal(state.tasks[0].result,undefined)
 assert.equal(b.changeBench(s,'did:plc:a','demo',{type:'return-result',id:task.id,result:{note:'Fit saw held-out rows; counterexample kept.',artifactUrl:'https://example.org/log',outcome:'did-not-work'}}).ok,true)
 state=b.loadBench(s,'did:plc:a','demo').state;assert.equal(state.tasks[0].result.outcome,'did-not-work')
 assert.equal(b.loadBench(s,'did:plc:b','demo').state.tasks.length,0);assert.equal(b.loadBench(s,'did:plc:a','live').state.tasks.length,0)
 const key=b.benchKey('did:plc:a','demo');s.setItem(key,'{broken');assert.equal(b.changeBench(s,'did:plc:a','demo',{type:'take-task',task}).ok,false);assert.equal(s.getItem(key),'{broken')
})

test('structured invention updates save an honest stage, artifact and next request; no public validation status can be invented',()=>{
 const b=source('lib/lab-inventions.ts'),s=store()
 const update={id:'build-1',kind:'prototype',stage:'idea',title:'A duration comparison app',summary:'Keep elapsed and subject-hours separate.',artifactUrl:'',request:'Help implement an overlap check.',disciplines:['neurotech','math']}
 assert.equal(b.changeBench(s,'guest','live',{type:'save-update',update}).ok,true)
 assert.equal(b.loadBench(s,'guest','live').state.updates[0].stage,'idea')
 assert.equal(b.changeBench(s,'guest','live',{type:'save-update',update:{...update,id:'bad',stage:'externally-validated'}}).ok,false)
 assert.equal(b.changeBench(s,'guest','live',{type:'save-update',update:{...update,id:'bad',artifactUrl:'javascript:alert(1)'}}).ok,false)
 assert.equal(b.loadBench(s,'guest','demo').state.updates.length,0)
})
