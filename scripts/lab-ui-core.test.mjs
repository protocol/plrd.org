import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'

test('client adapter fails closed on missing backend, rejects malformed receipts and unsafe URLs', async () => {
  const { createLabClient, safeUrl } = source('lib/lab-client.ts')
  const offline=createLabClient(async()=>new Response('missing',{status:404}))
  assert.equal((await offline.capabilities()).canPublish,false)
  assert.equal((await offline.feed()).status,'unavailable')
  await assert.rejects(offline.publish('note',{text:'hi'}), /unavailable|failed/i)
  const malformed=createLabClient(async()=>Response.json({ok:true}))
  await assert.rejects(malformed.publish('note',{text:'hi'}), /receipt/i)
  for(const url of ['javascript:alert(1)','data:text/html,test','http://localhost/a','https://x.com@evil.test/']) assert.equal(safeUrl(url),null)
  assert.equal(safeUrl('https://marimo.io/'),'https://marimo.io/')
})

test('editorial starter search relates artifacts by topic, never member metrics', () => {
  const { artifacts, filterArtifacts, relatedArtifacts } = source('lib/lab-data.ts')
  assert.ok(artifacts.length>=6)
  assert.equal(filterArtifacts(artifacts,{query:'MARIMO',field:'all',type:'all'})[0].id,'marimo')
  assert.equal(filterArtifacts(artifacts,{query:'',field:'neurotech',type:'all'}).every(a=>a.field==='neurotech'),true)
  const related=relatedArtifacts('neuromatch'); assert.ok(related.some(a=>a.field==='neurotech'))
  for(const a of artifacts){assert.match(a.url,/^https:\/\//);assert.ok(a.source);assert.equal(a.followers,undefined)}
})

test('bounded work packet contains source provenance, output schema and no dispatch fiction', () => {
  const { buildWorkPacket, packetMarkdown } = source('lib/lab-packets.ts')
  const p=buildWorkPacket('reference-audit','review',25)
  assert.equal(p.taskId,'atlas-reference-audit-v1'); assert.equal(p.budgetHintMinutes,25)
  assert.ok(p.sourceUrls.length>0);assert.ok(p.stopConditions.length>2);assert.ok(p.outputSchema)
  assert.match(packetMarkdown(p),/Human acceptance/)
  assert.throws(()=>buildWorkPacket('reference-audit','review',-1),/budget/i)
})

test('synthetic signal is deterministic, sampling changes measurements, reset parameters reproduce output', () => {
  const { sampleSignal } = source('lib/lab-signal.ts')
  const a=sampleSignal(5,40,0);const b=sampleSignal(5,10,0)
  assert.deepEqual(a,sampleSignal(5,40,0));assert.equal(a.length,41);assert.equal(b.length,11)
  assert.ok(Math.abs(a[2].value-1)<1e-9)
  assert.throws(()=>sampleSignal(5,0,0),/sample/i)
})

test('drafts round-trip by kind and owner, reject corruption, and report blocked storage', () => {
  const { saveDraft, loadDraft, draftKey } = source('lib/lab-drafts.ts')
  const store = new Map(); const storage = {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}
  assert.equal(saveDraft(storage, 'note', 'guest', {text:'An unfinished question'}).ok,true)
  assert.deepEqual(loadDraft(storage,'note','guest').data,{text:'An unfinished question'})
  assert.equal(loadDraft(storage,'note','did:plc:other').data,null)
  store.set(draftKey('note','guest'),'{broken'); assert.equal(loadDraft(storage,'note','guest').status,'corrupt')
  assert.equal(saveDraft({setItem(){throw Error('quota')}},'note','guest',{}).ok,false)
})
