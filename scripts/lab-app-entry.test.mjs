import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
import { createRequire } from 'node:module'
createRequire(import.meta.url).extensions['.css']=m=>{m.exports={}}
test('editorial license claims link to the exact inspected license, not a guessed blanket license',()=>{
 const c=source('lib/lab-app-catalog.ts')
 for(const [id,license] of [['marimo','Apache-2.0'],['jupyterlite','BSD-3-Clause'],['cadcad','MIT']]){
  const app=c.APP_CATALOG.find(a=>a.id===id);assert.match(app.license,new RegExp(license));assert.ok(c.safeAppUrl(app.licenseUrl));assert.ok(c.validAppListing(app))
 }
 assert.match(c.APP_CATALOG.find(a=>a.id==='allen').license,/not verified/i)
 assert.equal(c.validAppListing({...c.APP_CATALOG[0],licenseUrl:'javascript:alert(1)'}),false)
})
test('app styling consumes the existing light/dark shell tokens rather than falling back to white panels',()=>{
 const css=readFileSync('src/components/lab/AppListing.module.css','utf8')
 assert.doesNotMatch(css,/--lab-surface|--lab-panel/,'Undefined tokens make dark listings unreadable')
 assert.match(css,/--lab-card/);assert.match(css,/--lab-paper/);assert.match(css,/focus-visible/);assert.match(css,/@media/)
})
test('the legacy tools entrance redirects to the catalog instead of starting an embedded experiment',()=>{
 const page=source('app/lab/explorations/arcade/page.tsx')
 assert.throws(()=>page.default(),e=>e.digest?.includes('NEXT_REDIRECT')&&e.digest.includes('/lab/apps/'))
})
