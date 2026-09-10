import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'

test('drafts round-trip by kind and owner, reject corruption, and report blocked storage', () => {
  const { saveDraft, loadDraft, draftKey } = source('lib/lab-drafts.ts')
  const store = new Map(); const storage = {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}
  assert.equal(saveDraft(storage, 'note', 'guest', {text:'An unfinished question'}).ok,true)
  assert.deepEqual(loadDraft(storage,'note','guest').data,{text:'An unfinished question'})
  assert.equal(loadDraft(storage,'note','did:plc:other').data,null)
  store.set(draftKey('note','guest'),'{broken'); assert.equal(loadDraft(storage,'note','guest').status,'corrupt')
  assert.equal(saveDraft({setItem(){throw Error('quota')}},'note','guest',{}).ok,false)
})
