import { DISCIPLINES, type FollowingMode, type FollowingStore } from '@/lib/lab-following'
export type BenchResult = { note: string; artifactUrl: string; outcome: 'worked' | 'did-not-work' | 'uncertain' }
export type BenchTask = { id: string; title: string; request: string; artifactUrl: string; result?: BenchResult }
export type InventionUpdate = { id:string; kind:'prototype'|'test-result'|'help-wanted'; stage:'idea'|'prototype'|'working'|'tested'; title:string; summary:string; artifactUrl:string; request:string; disciplines:string[] }
export type InventionBench = { version: 1; owner: string; mode: FollowingMode; tasks: BenchTask[]; updates:InventionUpdate[] }
export const benchKey = (owner: string, mode: FollowingMode) => `open-lab:inventions:v1:${mode}:${encodeURIComponent(owner)}`
const empty = (owner: string, mode: FollowingMode): InventionBench => ({ version: 1, owner, mode, tasks: [], updates: [] })
const text = (v: unknown, max: number) => typeof v === 'string' && !!v.trim() && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v.replace(/\n|\r|\t/g,''))
export function validArtifactLink(v: unknown): v is string {
  if (v === '') return true
  if (typeof v !== 'string' || v.length > 2048) return false
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password } catch { return false }
}
function validResult(r: BenchResult) { return r && text(r.note,4000) && validArtifactLink(r.artifactUrl) && ['worked','did-not-work','uncertain'].includes(r.outcome) }
function parse(raw: string, owner: string, mode: FollowingMode): InventionBench {
  if (raw.length > 500_000) throw Error('Too much local bench data.')
  const s=JSON.parse(raw)
  if (!s || s.version!==1 || s.owner!==owner || s.mode!==mode || !Array.isArray(s.tasks) || s.tasks.length>100 ||
    !s.tasks.every((t:BenchTask)=>t && text(t.id,4096) && text(t.title,200) && text(t.request,2000) && validArtifactLink(t.artifactUrl) && (!t.result || validResult(t.result))) || new Set(s.tasks.map((t:BenchTask)=>t.id)).size!==s.tasks.length) throw Error('Invalid bench data.')
  if(!Array.isArray(s.updates)||s.updates.length>100||!s.updates.every((u:InventionUpdate)=>u&&text(u.id,100)&&text(u.title,200)&&text(u.summary,4000)&&text(u.request,2000)&&validArtifactLink(u.artifactUrl)&&['prototype','test-result','help-wanted'].includes(u.kind)&&['idea','prototype','working','tested'].includes(u.stage)&&Array.isArray(u.disciplines)&&u.disciplines.length<=9&&u.disciplines.every(d=>DISCIPLINES.some(f=>f.id===d)))||new Set(s.updates.map((u:InventionUpdate)=>u.id)).size!==s.updates.length)throw Error('Invalid local invention update.')
  return s
}
export function loadBench(storage: FollowingStore, owner: string, mode: FollowingMode) {
  try {const raw=storage.getItem(benchKey(owner,mode));return {state:raw===null?empty(owner,mode):parse(raw,owner,mode),error:''}}
  catch {return {state:empty(owner,mode),error:'Your local invention bench could not be read. The original is preserved; no changes were saved.'}}
}
export type BenchAction = {type:'save-update';update:InventionUpdate}|{type:'take-task';task:Omit<BenchTask,'result'>}|{type:'return-result';id:string;result:BenchResult}
export function changeBench(storage:FollowingStore,owner:string,mode:FollowingMode,action:BenchAction):{ok:boolean;error?:string} {
  const loaded=loadBench(storage,owner,mode);if(loaded.error)return {ok:false,error:loaded.error}
  try {
    const next=loaded.state
    if(action.type==='take-task') {if(!next.tasks.some(t=>t.id===action.task.id))next.tasks.push({...action.task})}
    else if(action.type==='return-result') {const t=next.tasks.find(t=>t.id===action.id);if(!t||!validResult(action.result))throw Error('Choose a saved task and add a result note with a valid HTTPS artifact link, or leave the link blank.');t.result={...action.result}}
    else if(action.type==='save-update') {if(next.updates.some(u=>u.id===action.update.id))throw Error('This update already exists. Keep the original.');next.updates.unshift({...action.update})}
    else throw Error('Unknown bench action.')
    const raw=JSON.stringify(next);parse(raw,owner,mode);storage.setItem(benchKey(owner,mode),raw)
    if(storage.getItem(benchKey(owner,mode))!==raw)throw Error('Browser storage did not confirm the save.')
    return {ok:true}
  }catch(e){return {ok:false,error:e instanceof Error?e.message:'Could not save your local bench.'}}
}
