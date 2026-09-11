import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'

// Actual Next dev Requests use http://localhost:3390 even for a caller
// on the explicitly configured 127.0.0.1:3390 authority. Headers may only
// match the preconfigured identity, never create a different identity.
test('capabilities recognize a preconfigured authority behind an internal listener', async () => {
 const before={...process.env}
 try {
  delete process.env.VERCEL
  process.env.NODE_ENV='development'
  process.env.LAB_PUBLIC_URL='http://127.0.0.1:3390'
  const route=source('app/api/lab/capabilities/route.ts')
  const response=route.GET(new Request('http://localhost:3390/api/lab/capabilities/',{headers:{host:'127.0.0.1:3390','x-forwarded-proto':'http'}}))
  const config=await response.json()
  assert.equal(config.canSignIn,true)
  assert.equal(config.origin,'http://127.0.0.1:3390')
  assert.equal(config.canPublish,false)
  assert.equal(config.oauthVerified,false)
  const {configForBrowser}=source('lib/lab-oauth-config.ts')
  assert.equal(configForBrowser(config,'http://127.0.0.1:3390').canSignIn,true)
  assert.equal(configForBrowser(config,'http://localhost:3390').canSignIn,false)
 } finally {process.env=before}
})

test('internal HTTPS metadata routing never trusts an alternate host or forwarded host', async () => {
 const before={...process.env}
 try {
  delete process.env.VERCEL
  process.env.LAB_PUBLIC_URL='https://lab-review.example.org'
  const caps=source('app/api/lab/capabilities/route.ts'),meta=source('app/api/lab/oauth/client-metadata.json/route.ts')
  const request=(url,headers)=>new Request(url,{headers})
  const valid={host:'lab-review.example.org','x-forwarded-proto':'https','x-forwarded-host':'ignored.example.org'}
  const result=meta.GET(request('http://localhost:3000/api/lab/oauth/client-metadata.json',valid))
  assert.equal(result.status,200)
  const data=await result.json()
  assert.equal(data.client_id,'https://lab-review.example.org/api/lab/oauth/client-metadata.json')
  assert.deepEqual(data.redirect_uris,['https://lab-review.example.org/lab/oauth/return/'])
  for(const [url,headers] of [
   ['http://localhost:3000',{...valid,host:'other.example.org'}],
   ['http://localhost:3000',{...valid,host:'lab-review.example.org:444'}],
   ['http://localhost:3000',{...valid,'x-forwarded-proto':'http'}],
   ['http://localhost:3000',{'x-forwarded-host':'lab-review.example.org','x-forwarded-proto':'https'}],
   ['https://attacker.example.org',valid],
   ['http://localhost:3000',{...valid,'x-forwarded-proto':'https,http'}],
  ]) {
   const req=request(url+'/api/lab/capabilities/',headers)
   assert.equal((await caps.GET(req).json()).canSignIn,false,JSON.stringify([url,headers]))
   assert.equal(meta.GET(req).status,404)
  }
 } finally {process.env=before}
})
