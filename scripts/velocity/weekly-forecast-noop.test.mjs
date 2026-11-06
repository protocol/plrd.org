import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { refreshForecast } from './weekly-forecast.mjs'

test('unchanged forecast preserves last observation timestamp and exact bytes; failed HTTP retains staging', async () => {
 const folder=await mkdtemp(join(tmpdir(),'forecast-noop-')), input=join(folder,'input.json'),out=join(folder,'out.json')
 const base={_provenance:{api:'https://api.futarchy.ai/v1/net/markets',generatedAt:'2026-01-01T00:00:00Z'},series:[{key:'ftm_agi',label:'AGI arrives',points:[{year:2032,prob:.1,id:'x'},{year:2033,prob:.2,id:'y'}]}]}
 const bytes=JSON.stringify(base)+'\n';await writeFile(input,bytes)
 const raw=base.series[0].points.map(p=>({id:p.id,variableId:'ftm_agi_by_'+p.year,marginals:{yes:p.prob}}))
 const result=await refreshForecast({input,out,fetcher:async()=>({ok:true,json:async()=>raw}),now:()=>{throw Error('unchanged must not advance observation time')}})
 assert.equal(result.changed,false);assert.equal(await readFile(out,'utf8'),bytes)
 await assert.rejects(refreshForecast({input,out,fetcher:async()=>({ok:false,status:503})}),/HTTP 503/)
 assert.equal(await readFile(out,'utf8'),bytes)
 await assert.rejects(refreshForecast({input,out,fetcher:async()=>{throw Error('transport failed')}}))
 assert.equal(await readFile(out,'utf8'),bytes)
})
