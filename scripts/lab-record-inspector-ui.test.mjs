import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
require.extensions['.css'] = () => {}
const uri = 'at://did:plc:abcdefghijklmnopqrstuvwx/org.plresearch.lab.note/abc'

test('a signed-out visitor reads a linked record, sees safe text and can prepare evidence without publishing', async () => {
  assert.ok(existsSync('src/components/lab/LabPublicInspector.tsx'), 'missing unsigned public record reader')
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/lab/record/?uri='+encodeURIComponent(uri) })
  const saved = {}
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Event']) { saved[key] = Object.getOwnPropertyDescriptor(globalThis,key); Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true}) }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('root'))
  let proposed = null
  const loaded = []
  const Component = source('components/lab/LabPublicInspector.tsx').default
  try {
    await React.act(async () => root.render(React.createElement(Component,{loadRecord:async u => { loaded.push(u); return {uri:u,cid:'test-cid',did:'did:plc:abcdefghijklmnopqrstuvwx',kind:'note',data:{text:'<img src=x onerror=alert(1)>',postType:'negative',field:'neurotech'},createdAt:'2026-09-01T00:00:00Z'} },onPropose:r=>{proposed=r}})))
    assert.deepEqual(loaded,[uri])
    assert.match(document.body.textContent, /Negative result/)
    assert.match(document.body.textContent, /<img src=x onerror=alert\(1\)>/)
    assert.equal(document.querySelectorAll('img').length,0)
    assert.match(document.body.textContent, /not scientific verification/i)
    const button = [...document.querySelectorAll('button')].find(b=>b.textContent==='Add evidence to this work')
    await React.act(()=>button.click())
    assert.equal(proposed.uri,uri)
    assert.deepEqual(loaded,[uri])
  } finally { await React.act(()=>root.unmount()); dom.window.close(); for(const [k,d] of Object.entries(saved)){ if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k] } delete globalThis.IS_REACT_ACT_ENVIRONMENT }
})
