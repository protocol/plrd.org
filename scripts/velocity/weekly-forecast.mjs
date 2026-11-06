#!/usr/bin/env node
// Re-observe the existing FTM snapshot identities, without changing families,
// horizons, threshold grouping, probability rounding, or forecast interpretation.
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const API='https://api.futarchy.ai/v1/net/markets'
const DEFAULT_INPUT=fileURLToPath(new URL('../../src/data/velocity/ftm-takeoff.json',import.meta.url))

export async function refreshForecast({input=DEFAULT_INPUT,out,fetcher=fetch,now=()=>new Date()}={}) {
  if(!out) throw new Error('A staging output path is required')
  const original=await readFile(input,'utf8')
  const prior=JSON.parse(original)
  if(prior?._provenance?.api!==API || !Array.isArray(prior.series) || !prior.series.length) throw new Error('Invalid source snapshot')
  const response=await fetcher(API,{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)})
  if(!response.ok) throw new Error(`Bayes Market HTTP ${Number.isInteger(response.status)?response.status:'unknown'}; last good retained`)
  const body=await response.json()
  const nodes=Array.isArray(body)?body:body?.markets
  if(!Array.isArray(nodes)||!nodes.length||nodes.length>20000) throw new Error('Invalid Bayes Market payload')
  const byId=new Map()
  for(const n of nodes){
    if(typeof n?.id!=='string'||byId.has(n.id)) throw new Error('Missing or duplicate source identity')
    byId.set(n.id,n)
  }
  const keys=prior.series.map(s=>s.key).sort((a,b)=>b.length-a.length)
  if(new Set(keys).size!==keys.length) throw new Error('Duplicate snapshot family')
  const ids=new Set()
  const series=prior.series.map(s=>{
    if(typeof s.key!=='string'||!s.key.startsWith('ftm_')||!Array.isArray(s.points)||s.points.length<2)throw new Error('Invalid snapshot family')
    return {...s,points:s.points.map(p=>{
      if(typeof p.id!=='string'||ids.has(p.id)||!Number.isInteger(p.year))throw new Error('Invalid frozen source identity')
      ids.add(p.id)
      const n=byId.get(p.id)
      const family=typeof n?.variableId==='string'?keys.find(k=>n.variableId.startsWith(k+'_')):null
      const year=Number(n?.variableId?.match(/_by_(\d{4})(?:_|$)/)?.[1])
      const prob=n?.marginals?.yes
      if(!n||family!==s.key||year!==p.year||typeof prob!=='number'||!Number.isFinite(prob)||prob<0||prob>1)throw new Error('Frozen forecast point missing, changed meaning, or invalid')
      return {...p,prob:Number(prob.toFixed(4))}
    })}
  })
  const changed=JSON.stringify(series)!==JSON.stringify(prior.series)
  const value=changed?{...prior,_provenance:{...prior._provenance,generatedAt:now().toISOString(),nodeCount:nodes.length},series}:prior
  const encoded=changed?JSON.stringify(value,null,2)+'\n':original
  await mkdir(dirname(out),{recursive:true})
  const temp=out+'.'+randomUUID()+'.tmp'
  try{await writeFile(temp,encoded,{flag:'wx'});await rename(temp,out)}finally{await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e})}
  return {changed,series:series.length,points:ids.size,source:API,output:out}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),out=args[args.indexOf('--out')+1]
  if(!args.includes('--out')||!out){console.error('Usage: node scripts/velocity/weekly-forecast.mjs --out <staged.json>');process.exitCode=1}
  else refreshForecast({out}).then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error('Weekly forecast acquisition failed; existing snapshot retained');process.exitCode=1})
}
