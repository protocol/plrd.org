import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m}}
test('catalog is a source-attributed external shelf, not an embedded runtime or invented community',()=>{
 assert.ok(existsSync('src/lib/lab-app-catalog.ts'),'External app catalog model missing')
 const c=source('lib/lab-app-catalog.ts')
 assert.equal(c.APP_CATALOG.length,5)
 for(const app of c.APP_CATALOG){assert.ok(c.validAppListing(app));assert.equal(app.origin,'editorial');assert.ok(app.maintainer);assert.ok(app.license);assert.ok(app.evidence);assert.ok(c.safeAppUrl(app.launchUrl));assert.ok(!app.launchUrl.startsWith('/'))}
 assert.equal(c.filterApps(c.APP_CATALOG,{query:'notebook',field:'cross-field'}).length,2)
 for(const url of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','https://example.org/\nsecret','https://example.org/%0a',' https://example.org','https://github.com.evil.test/x','https://github.com@evil.test/x']){
  assert.equal(c.safeAppUrl(url,true),false,url)
 }
 assert.equal(c.safeAppUrl('https://github.com/marimo-team/marimo',true),true)
})
test('app shelf writer and reader agree at entry and serialized-size limits without overwriting originals',()=>{
 const c=source('lib/lab-app-catalog.ts'),s=store(),owner='bounds',mode='live',key=c.appShelfKey(owner,mode)
 const listing=i=>({...c.APP_CATALOG[0],id:`local:${i}`,origin:'local'})
 const full={version:1,owner,mode,saved:[],reviews:{},listings:Array.from({length:100},(_,i)=>listing(i))}
 s.setItem(key,JSON.stringify(full));assert.equal(c.loadAppShelf(s,owner,mode).error,'')
 const before=s.getItem(key)
 assert.equal(c.changeAppShelf(s,owner,mode,{type:'listing',listing:listing(100)}).ok,false);assert.equal(s.getItem(key),before)
 assert.equal(c.changeAppShelf(s,owner,mode,{type:'listing',listing:{...listing(99),title:'Existing listing updated'}}).ok,true)
 assert.equal(c.loadAppShelf(s,owner,mode).error,'')
 // Each field is within its own bound; the total serialized envelope is not.
 const oversized={...full,listings:full.listings.map(a=>({...a,description:'d'.repeat(2000),useCase:'u'.repeat(2000),evidence:'e'.repeat(2000)})),reviews:Object.fromEntries(Array.from({length:100},(_,i)=>[`local:${i}`,'r'.repeat(4000)]))}
 const raw=JSON.stringify(oversized);assert.ok(raw.length>1_000_000);s.setItem(key,raw)
 assert.ok(c.loadAppShelf(s,owner,mode).error);assert.equal(c.changeAppShelf(s,owner,mode,{type:'save',id:'marimo'}).ok,false);assert.equal(s.getItem(key),raw)
})
test('saved apps, review drafts and authored listings are verified browser/identity/mode scoped writes',()=>{
 const c=source('lib/lab-app-catalog.ts'),s=store()
 assert.equal(typeof c.changeAppShelf,'function','Scoped app shelf writer missing')
 assert.equal(c.changeAppShelf(s,'alice','live',{type:'save',id:'marimo'}).ok,true)
 assert.equal(c.changeAppShelf(s,'alice','live',{type:'review',id:'marimo',text:'Useful for my synthetic notebook. Package support not tested.'}).ok,true)
 const listing={...c.APP_CATALOG[0],id:'local:one',title:'My public-input notebook',origin:'local'}
 assert.equal(c.changeAppShelf(s,'alice','live',{type:'listing',listing}).ok,true)
 const state=c.loadAppShelf(s,'alice','live').state
 assert.deepEqual(state.saved,['marimo']);assert.match(state.reviews.marimo,/synthetic notebook/);assert.equal(state.listings[0].title,listing.title)
 assert.equal(c.loadAppShelf(s,'bob','live').state.saved.length,0);assert.equal(c.loadAppShelf(s,'alice','demo').state.saved.length,0)
 for(const bad of ['{broken',JSON.stringify({...state,version:9}),JSON.stringify({...state,extra:true}),JSON.stringify({...state,listings:[{...listing,futureField:'preserve me'}]})]){
  s.setItem(c.appShelfKey('alice','live'),bad)
  assert.equal(c.changeAppShelf(s,'alice','live',{type:'save',id:'cadcad'}).ok,false)
  assert.equal(s.getItem(c.appShelfKey('alice','live')),bad)
 }
 assert.equal(c.changeAppShelf({getItem:()=>{throw Error('Blocked')},setItem:()=>assert.fail('No overwrite')},'a','live',{type:'save',id:'marimo'}).ok,false)
 assert.equal(c.changeAppShelf({getItem:()=>null,setItem:()=>{}},'a','live',{type:'save',id:'marimo'}).ok,false)
 assert.equal(c.changeAppShelf(store(),'a','live',{type:'listing',listing:{...listing,codeUrl:'https://evil.test/repo'}}).ok,false)
})
