type ReadStore = Pick<Storage, 'getItem'>
type WriteStore = Pick<Storage, 'setItem'>
export const draftKey = (kind: string, owner: string) => `plrd:open-lab:v1:${encodeURIComponent(owner)}:${kind}`
export function saveDraft(storage: WriteStore, kind: string, owner: string, data: Record<string, unknown>) {
  try { storage.setItem(draftKey(kind, owner), JSON.stringify({version:1, data, savedAt:new Date().toISOString()})); return {ok:true} }
  catch { return {ok:false} }
}
export function loadDraft(storage: ReadStore, kind: string, owner: string): {data:Record<string, unknown>|null; status:'saved'|'empty'|'corrupt'|'blocked'; savedAt?:string} {
  try {
    const raw=storage.getItem(draftKey(kind,owner)); if(!raw) return {data:null,status:'empty'}
    try { const value=JSON.parse(raw); if(value.version!==1 || !value.data || typeof value.data!=='object' || Array.isArray(value.data)) return {data:null,status:'corrupt'}; return {data:value.data,status:'saved',savedAt:value.savedAt} }
    catch { return {data:null,status:'corrupt'} }
  } catch { return {data:null,status:'blocked'} }
}
