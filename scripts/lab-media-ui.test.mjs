import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {createRequire} from 'node:module'
import {JSDOM} from 'jsdom'
import {source} from './velocity/test-source-loader.mjs'
const require=createRequire(import.meta.url);require.extensions['.css']=m=>{m.exports={}}
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'})
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','Event'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true})
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client')
test('photo/video selection previews locally, edits alt/caption, removes, and cleans object URLs on scope change',async()=>{
 assert.ok(existsSync('src/components/lab/feed/MediaPicker.tsx'),'Media picker missing')
 const C=source('components/lab/feed/MediaPicker.tsx').default,revoked=[];let seq=0
 const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;URL.createObjectURL=()=>`blob:test-${++seq}`;URL.revokeObjectURL=u=>revoked.push(u)
 const root=createRoot(document.getElementById('root'));let calls=0;const oldFetch=globalThis.fetch;globalThis.fetch=()=>{calls++;throw Error('No media upload')}
 const render=scope=>React.act(()=>root.render(React.createElement(C,{scope})))
 const choose=async file=>{const input=document.querySelector('input[type=file]');Object.defineProperty(input,'files',{value:[file],configurable:true});await React.act(async()=>{input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,0))})}
 try{await render('demo:alice');await choose(new File([new Uint8Array([137,80,78,71,13,10,26,10,0])],'photo.png',{type:'image/png'}));assert.ok(document.querySelector('img[src^="blob:"]'))
 const alt=document.querySelector('[aria-label="Alt text for photo.png"]');await React.act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(alt,'Wiring of the prototype');alt.dispatchEvent(new Event('input',{bubbles:true}))});assert.equal(document.querySelector('img').alt,'Wiring of the prototype')
 await choose(new File([new Uint8Array([0,0,0,16,102,116,121,112,109,112,52,50,0,0,0,0])],'clip.mp4',{type:'video/mp4'}));const v=document.querySelector('video');assert.ok(v);assert.equal(v.autoplay,false);assert.equal(v.controls,true)
 assert.ok(document.querySelector('a[download="photo.png"]'));await React.act(()=>document.querySelector('[aria-label="Remove photo.png"]').click());assert.ok(revoked.includes('blob:test-1'))
 await render('live:bob');assert.equal(document.querySelector('video'),null);assert.ok(revoked.includes('blob:test-2'));assert.equal(calls,0)
 }finally{await React.act(()=>root.unmount());URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;globalThis.fetch=oldFetch}
})
