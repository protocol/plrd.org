import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const modulePath = new URL('./weekly-forecast.mjs', import.meta.url)
test('weekly forecast re-reads the exact existing source identities; invalid or missing points cannot overwrite last good', async () => {
  let api
  try { api = await import(modulePath) } catch { assert.fail('weekly forecast refresh is missing') }
  const folder = await mkdtemp(join(tmpdir(), 'forecast-weekly-'))
  const input=join(folder,'source.json'),out=join(folder,'staged.json')
  const base={_provenance:{source:'Bayes Market',api:'https://api.futarchy.ai/v1/net/markets',generatedAt:'2026-08-26T00:00:00Z'},series:[{key:'ftm_agi',label:'AGI arrives',points:[{year:2032,prob:.1,id:'x'},{year:2033,prob:.2,id:'y'},{year:2034,prob:.3,id:'z'}]},{key:'ftm_full_auto',label:'Full automation',points:[{year:2032,prob:.1,id:'a'},{year:2033,prob:.2,id:'b'},{year:2034,prob:.3,id:'c'}]}]}
  await writeFile(input,JSON.stringify(base)+'\n')
  const raw=base.series.flatMap(s=>s.points.map(p=>({id:p.id,variableId:s.key+'_by_'+p.year,marginals:{yes:p.prob+.01}})))
  const fixture=async()=>({ok:true,status:200,json:async()=>raw})
  const result=await api.refreshForecast({input,out,fetcher:fixture,now:()=>new Date('2026-11-06T10:00:00Z')})
  assert.equal(result.changed,true)
  const updated=JSON.parse(await readFile(out,'utf8'))
  assert.equal(updated.series[0].points[0].prob,.11)
  assert.deepEqual(updated.series.map(s=>s.points.map(p=>[p.id,p.year])),base.series.map(s=>s.points.map(p=>[p.id,p.year])))
  const frozen=await readFile(out,'utf8')
  for(const mutation of [r=>r.slice(1),r=>r.map((p,i)=>i? p:{...p,marginals:{yes:NaN}}),r=>r.map((p,i)=>i? p:{...p,variableId:'ftm_full_auto_by_2032'}),r=>[...r,r[0]],r=>r.map((p,i)=>i? p:{...p,marginals:{yes:2}})]){
    await assert.rejects(api.refreshForecast({input,out,fetcher:async()=>({ok:true,json:async()=>mutation(raw)})}))
    assert.equal(await readFile(out,'utf8'),frozen)
  }
  assert.equal(await readFile(input,'utf8'),JSON.stringify(base)+'\n')
})
