import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
const store = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,v), m } }
test('following persists per identity and mode without writing any draft keys', () => {
  assert.ok(existsSync('src/lib/lab-following.ts'), 'Local subscription model is missing')
  const f = source('lib/lab-following.ts'), s = store()
  assert.equal(f.updateFollowing(s, 'did:plc:alice', 'live', { type: 'toggle', kind: 'ideas', id: 'marimo' }).ok, true)
  assert.deepEqual(f.loadFollowing(s, 'did:plc:alice', 'live').state.ideas, ['marimo'])
  assert.deepEqual(f.loadFollowing(s, 'did:plc:bob', 'live').state.ideas, [])
  assert.deepEqual(f.loadFollowing(s, 'did:plc:alice', 'demo').state.ideas, [])
  assert.ok([...s.m.keys()].every(k => k.startsWith('open-lab:following:v1:')))
})

test('curator views and multi-tag assignments survive reload; malformed state is never overwritten', () => {
  const f = source('lib/lab-following.ts'), s = store(), owner = 'guest', mode = 'demo'
  assert.equal(f.updateFollowing(s, owner, mode, { type: 'save-view', name: 'Methods across fields', disciplines: ['neurotech', 'ai-robotics'] }).ok, true)
  assert.deepEqual(f.loadFollowing(s, owner, mode).state.views[0], { name: 'Methods across fields', disciplines: ['neurotech', 'ai-robotics'] })
  assert.equal(f.updateFollowing(s, owner, mode, { type: 'tag-idea', id: 'draft:note:test', disciplines: ['neurotech', 'cross-field'] }).ok, true)
  assert.deepEqual(f.loadFollowing(s, owner, mode).state.ideaTags['draft:note:test'], ['neurotech', 'cross-field'])
  assert.equal(f.updateFollowing(s, owner, mode, { type: 'filter', feed: 'following', disciplines: ['neurotech'] }).ok, true)
  assert.equal(f.loadFollowing(s, owner, mode).state.filter.feed, 'following')
  const key = f.followingKey(owner, mode)
  for (const raw of ['{broken', JSON.stringify({...f.emptyFollowing(owner, mode), views: 'broken'}), JSON.stringify({...f.emptyFollowing(owner, mode), disciplines: ['invented']})]) {
    s.setItem(key,raw)
    assert.ok(f.loadFollowing(s, owner, mode).error)
    assert.equal(f.updateFollowing(s, owner, mode, {type: 'toggle', kind: 'ideas', id: 'x'}).ok, false)
    assert.equal(s.getItem(key),raw)
  }
})
test('invalid or dangerous curator entries fail without changing storage', () => {
 const f=source('lib/lab-following.ts'), s=store()
 for (const action of [{type:'save-view',name:'',disciplines:['neurotech']},{type:'save-view',name:'bad',disciplines:['bogus']},{type:'tag-idea',id:'__proto__',disciplines:['neurotech']}]) assert.equal(f.updateFollowing(s,'guest','live',action).ok,false)
 assert.equal(s.m.size,0)
})
