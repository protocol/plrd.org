import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'
const png=new Uint8Array([137,80,78,71,13,10,26,10,0])
test('media session enforces MIME/signature/size limits, never uploads, and revokes on remove/dispose and pending close',async()=>{
 assert.ok(existsSync('src/lib/lab-media.ts'),'Local media preview missing')
 const m=source('lib/lab-media.ts'),created=[],revoked=[],url={createObjectURL:f=>{const u='blob:local/'+created.length;created.push(f);return u},revokeObjectURL:u=>revoked.push(u)}
 const s=m.createMediaSession('demo:alice',url)
 await assert.rejects(()=>s.add(new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'})),/PNG|JPEG|WebP/)
 await assert.rejects(()=>s.add(new File(['<html/>'],'fake.png',{type:'image/png'})),/signature/)
 await assert.rejects(()=>s.add(new File([new Uint8Array(m.IMAGE_LIMIT+1)],'huge.png',{type:'image/png'})),/limit/)
 const item=await s.add(new File([png],'test.png',{type:'image/png'}));assert.equal(item.scope,'demo:alice');assert.equal(item.kind,'image');assert.equal(created.length,1)
 s.remove(item.id);assert.deepEqual(revoked,['blob:local/0'])
 const item2=await s.add(new File([png],'again.png',{type:'image/png'}));s.dispose();assert.ok(revoked.includes(item2.url))
 await assert.rejects(()=>s.add(new File([png],'late.png',{type:'image/png'})),/closed/)
 const next=m.createMediaSession('live:bob',url);assert.equal(next.items.length,0);next.dispose()
})
