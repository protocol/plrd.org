import { DISCIPLINES, type FollowingMode, type FollowingStore } from '@/lib/lab-following'
import {validInventionMedia, type InventionMedia} from '@/lib/lab-invention-media'
export type BenchResult = { note: string; artifactUrl: string; outcome: 'worked' | 'did-not-work' | 'uncertain' }
export type BenchTask = { id: string; title: string; request: string; artifactUrl: string; artifact?:string; sourceId?:string; result?: BenchResult }
export type InventionUpdate = { id:string; createdAt?:string; media?:InventionMedia[]; kind:'prototype'|'test-result'|'help-wanted'; stage:'idea'|'prototype'|'working'|'tested'; title:string; summary:string; artifactUrl:string; request:string; disciplines:string[] }
export type InventionBench = { version: 1; owner: string; mode: FollowingMode; tasks: BenchTask[]; updates:InventionUpdate[]; drafts:InventionUpdate[] }
export const benchKey = (owner: string, mode: FollowingMode) => `open-lab:inventions:v1:${mode}:${encodeURIComponent(owner)}`
const empty = (owner: string, mode: FollowingMode): InventionBench => ({ version: 1, owner, mode, tasks: [], updates: [], drafts: [] })
const text = (v: unknown, max: number) => typeof v === 'string' && !!v.trim() && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v.replace(/\n|\r|\t/g,''))
export function validArtifactLink(v: unknown): v is string {
  if (v === '') return true
  if (typeof v !== 'string' || v.length > 2048) return false
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password } catch { return false }
}
function validResult(r: BenchResult) { return r && text(r.note,4000) && validArtifactLink(r.artifactUrl) && ['worked','did-not-work','uncertain'].includes(r.outcome) }
function validUpdate(u: InventionUpdate, incomplete = false) {
  const field = (v: unknown, max: number) => (incomplete && typeof v === 'string' && !v.trim() && v.length <= max) || text(v, max)
  return u && text(u.id,100) && field(u.title,200) && field(u.summary,4000) && field(u.request,2000) &&
    validArtifactLink(u.artifactUrl) && !String(u.artifactUrl||'').startsWith('blob:') &&
    (u.createdAt === undefined || (typeof u.createdAt === 'string' && Number.isFinite(Date.parse(u.createdAt)))) &&
    (u.media === undefined || validInventionMedia(u.media)) &&
    ['prototype','test-result','help-wanted'].includes(u.kind) && ['idea','prototype','working','tested'].includes(u.stage) &&
    Array.isArray(u.disciplines) && u.disciplines.length <= 9 && u.disciplines.every(d=>DISCIPLINES.some(f=>f.id===d))
}
function parse(raw: string, owner: string, mode: FollowingMode): InventionBench {
  if (raw.length > 7_000_000) throw Error('Too much local bench data. Keep attachment backups and reduce local media.')
  const s=JSON.parse(raw)
  if (!s || Object.keys(s).some(k=>!['version','owner','mode','tasks','updates','drafts'].includes(k)) || s.version!==1 || s.owner!==owner || s.mode!==mode || !Array.isArray(s.tasks) || s.tasks.length>100 ||
    !s.tasks.every((t:BenchTask)=>t && text(t.id,4096) && text(t.title,200) && text(t.request,2000) && validArtifactLink(t.artifactUrl) && (t.artifact===undefined||text(t.artifact,2000)) && (t.sourceId===undefined||text(t.sourceId,4096)) && (t.result===undefined || validResult(t.result))) || new Set(s.tasks.map((t:BenchTask)=>t.id)).size!==s.tasks.length) throw Error('Invalid bench data.')
  if(!Array.isArray(s.updates)||s.updates.length>100||!s.updates.every((u:InventionUpdate)=>validUpdate(u))||new Set(s.updates.map((u:InventionUpdate)=>u.id)).size!==s.updates.length)throw Error('Invalid local invention update.')
  // Version 1 benches predating resumable composing have no drafts property.
  if(s.drafts === undefined)s.drafts=[]
  if(!Array.isArray(s.drafts)||s.drafts.length>100||!s.drafts.every((u:InventionUpdate)=>validUpdate(u,true))||new Set(s.drafts.map((u:InventionUpdate)=>u.id)).size!==s.drafts.length)throw Error('Invalid invention drafts.')
  return s
}
export function loadBench(storage: FollowingStore, owner: string, mode: FollowingMode) {
  try {const raw=storage.getItem(benchKey(owner,mode));return {state:raw===null?empty(owner,mode):parse(raw,owner,mode),error:''}}
  catch {return {state:empty(owner,mode),error:'Your local invention bench could not be read. The original is preserved; no changes were saved.'}}
}
export type BenchAction = {type:'save-update';update:InventionUpdate;requireExisting?:boolean}|{type:'save-draft';draft:InventionUpdate}|{type:'discard-draft';id:string}|{type:'take-task';task:Omit<BenchTask,'result'>}|{type:'return-result';id:string;result:BenchResult}
export function changeBench(storage:FollowingStore,owner:string,mode:FollowingMode,action:BenchAction):{ok:boolean;error?:string} {
  const loaded=loadBench(storage,owner,mode);if(loaded.error)return {ok:false,error:loaded.error}
  try {
    const next=loaded.state
    if(action.type==='take-task') {
      const existing=next.tasks.find(t=>t.id===action.task.id)
      if(existing?.sourceId && existing.sourceId!==action.task.sourceId)throw Error('This saved task belongs to a different source. Nothing was remapped.')
      // Revisit by exact ID, never title. Keep the original task snapshot and
      // result, including the absence of correlation on older tasks.
      if(!existing)next.tasks.push({...action.task})
    }
    else if(action.type==='return-result') {const t=next.tasks.find(t=>t.id===action.id);if(!t||!validResult(action.result))throw Error('Choose a saved task and add a result note with a valid HTTPS artifact link, or leave the link blank.');t.result={...action.result}}
    else if(action.type==='save-draft') {
      const old=next.updates.find(d=>d.id===action.draft.id)||next.drafts.find(d=>d.id===action.draft.id)
      const draft={...action.draft,createdAt:old?.createdAt||action.draft.createdAt||new Date().toISOString()}
      next.drafts=[draft,...next.drafts.filter(d=>d.id!==draft.id)]
    }
    else if(action.type==='discard-draft') {next.drafts=next.drafts.filter(d=>d.id!==action.id)}
    else if(action.type==='save-update') {
      const index=next.updates.findIndex(u=>u.id===action.update.id),old=next.updates[index]
      if(action.requireExisting&&!old)throw Error('This build no longer exists in this identity’s bench. Nothing was saved.')
      const update={...action.update,createdAt:old?old.createdAt:next.drafts.find(d=>d.id===action.update.id)?.createdAt||new Date().toISOString(),media:action.update.media??old?.media}
      if(old)next.updates[index]=update;else next.updates.unshift(update)
      next.drafts=next.drafts.filter(d=>d.id!==action.update.id)
    }
    else throw Error('Unknown bench action.')
    const raw=JSON.stringify(next);parse(raw,owner,mode);storage.setItem(benchKey(owner,mode),raw)
    if(storage.getItem(benchKey(owner,mode))!==raw)throw Error('Browser storage did not confirm the save.')
    return {ok:true}
  }catch(e){return {ok:false,error:e instanceof Error?e.message:'Could not save your local bench.'}}
}
