import test from 'node:test'
import assert from 'node:assert/strict'
import {source} from './velocity/test-source-loader.mjs'
const b=source('lib/lab-inventions.ts'),media=source('lib/lab-invention-media.ts')
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m}}
const update=(id='build-one')=>({id,kind:'prototype',stage:'idea',title:'Test jig',summary:'Measure two cases.',request:'Check one case.',artifactUrl:'https://example.org/jig',disciplines:['math']})
const task=(id='invention:build-one')=>({id,title:'Test jig',request:'Check one case.',artifactUrl:'https://example.org/jig',artifact:'Jig specification',sourceId:'invention:build-one'})

test('unknown/corrupt storage and unknown media fields fail closed without rewriting the original',()=>{
 for(const raw of ['{broken',JSON.stringify({version:2,owner:'guest',mode:'demo',updates:[],drafts:[],tasks:[]}),JSON.stringify({version:1,owner:'other',mode:'demo',updates:[],tasks:[]}),JSON.stringify({version:1,owner:'guest',mode:'demo',updates:[{...update(),media:[{url:'blob:lost'}]}],tasks:[]}),JSON.stringify({version:1,owner:'guest',mode:'demo',updates:[],tasks:[],futureSchema:{data:'preserve'}})]){
  const s=store(),key=b.benchKey('guest','demo');s.setItem(key,raw)
  assert.ok(b.loadBench(s,'guest','demo').error,'Must reject '+raw)
  assert.equal(b.changeBench(s,'guest','demo',{type:'save-update',update:update()}).ok,false);assert.equal(s.getItem(key),raw)
 }
})

test('same-ID edits preserve original timestamp/media, cannot create a missing edit target, and discard only that edit draft',async()=>{
 const s=store(),photo=new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64')],'one.png',{type:'image/png'}),m=await media.storeInventionMedia(photo)
 assert.equal(b.changeBench(s,'guest','demo',{type:'save-update',update:{...update(),media:[m]}}).ok,true)
 const original=b.loadBench(s,'guest','demo').state.updates[0]
 assert.equal(b.changeBench(s,'guest','demo',{type:'save-update',requireExisting:true,update:{...update(),title:'Revised',createdAt:'2000-01-01T00:00:00.000Z'}}).ok,true)
 assert.equal(b.changeBench(s,'guest','demo',{type:'save-update',requireExisting:true,update:update('unknown')}).ok,false)
 const saved=b.loadBench(s,'guest','demo').state.updates[0]
 assert.equal(saved.createdAt,original.createdAt);assert.deepEqual(saved.media,[m]);assert.equal(saved.id,original.id)
 for(const id of ['build-one','another-draft'])assert.equal(b.changeBench(s,'guest','demo',{type:'save-draft',draft:{...update(id),summary:''}}).ok,true)
 assert.equal(b.changeBench(s,'guest','demo',{type:'discard-draft',id:'build-one'}).ok,true)
 const state=b.loadBench(s,'guest','demo').state;assert.deepEqual(state.updates,[saved]);assert.deepEqual(state.drafts.map(d=>d.id),['another-draft'])
})

test('quota, unreadable and unconfirmed storage never report success',()=>{
 const s=store(),key=b.benchKey('guest','demo');b.changeBench(s,'guest','demo',{type:'save-update',update:update()});const original=s.getItem(key)
 for(const bad of [{getItem:()=>{throw Error('read denied')},setItem:()=>assert.fail('must not write')},{getItem:s.getItem,setItem:()=>{throw Error('quota exceeded')}},{getItem:s.getItem,setItem:()=>{}}]){
  assert.equal(b.changeBench(bad,'guest','demo',{type:'save-update',update:{...update(),title:'Unsaved'}}).ok,false);assert.equal(s.getItem(key),original)
 }
})

test('legacy task snapshots are never linked by title or silently remapped when revisited',()=>{
 const s=store(),legacy={id:'legacy',title:'Test jig',request:'Old exact request',artifactUrl:'https://example.org/old'}
 assert.equal(b.changeBench(s,'guest','demo',{type:'take-task',task:legacy}).ok,true)
 assert.equal(b.changeBench(s,'guest','demo',{type:'take-task',task:{...task(),id:'legacy'}}).ok,true)
 assert.deepEqual(b.loadBench(s,'guest','demo').state.tasks,[legacy])
 assert.equal(b.changeBench(s,'guest','demo',{type:'return-result',id:'missing',result:{note:'No target',artifactUrl:'',outcome:'worked'}}).ok,false)
 assert.equal(b.changeBench(s,'guest','demo',{type:'take-task',task:task()}).ok,true)
 assert.equal(b.changeBench(s,'guest','demo',{type:'take-task',task:{...task(),sourceId:'different'}}).ok,false)
 const state=b.loadBench(s,'guest','demo').state;assert.equal(state.tasks.length,2);assert.deepEqual(state.tasks[0],legacy)
 assert.equal(b.loadBench(s,'someone-else','demo').state.tasks.length,0);assert.equal(b.loadBench(s,'guest','live').state.tasks.length,0)
})

test('local attachments reject object URLs, corrupt encodings, unsupported types and excessive media',async()=>{
 const s=store(),photo=new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64')],'one.png',{type:'image/png'}),m=await media.storeInventionMedia(photo)
 for(const bad of [{...m,dataUrl:'blob:temporary'},{...m,dataUrl:'data:image/png;base64,bm90LWEtcG5n'},{...m,type:'image/svg+xml'},{...m,caption:'x'.repeat(501)}])assert.equal(b.changeBench(s,'guest','demo',{type:'save-update',update:{...update(),media:[bad]}}).ok,false)
 await assert.rejects(media.storeInventionMedia(new File([new Uint8Array(media.INVENTION_MEDIA_LIMIT+1)],'large.mp4',{type:'video/mp4'})),/2 MiB/)
 assert.equal(media.validInventionMedia(Array.from({length:5},(_,i)=>({...m,id:String(i)}))),false)
 assert.equal(b.loadBench(s,'guest','demo').state.updates.length,0)
})
