import type { LabField } from '@/lib/lab-types'
/** Local science taxonomy. Existing IDs retained; PDS fields remain unchanged. */
export const DISCIPLINES: {id:string;label:string;protocolField:LabField}[] = [
  {id:'neurotech',label:'Neuroscience',protocolField:'neurotech'},
  {id:'ai-robotics',label:'AI & machine learning',protocolField:'ai-robotics'},
  {id:'cross-field',label:'Scientific software',protocolField:'cross-field'},
  {id:'math',label:'Mathematics',protocolField:'cross-field'},
  {id:'physics',label:'Physics',protocolField:'cross-field'},
  {id:'biology',label:'Biology',protocolField:'cross-field'},
  {id:'materials',label:'Materials science',protocolField:'cross-field'},
  {id:'economies-governance',label:'Coordination science',protocolField:'economies-governance'},
  {id:'digital-human-rights',label:'Open systems',protocolField:'digital-human-rights'},
]
export function protocolFieldForDiscipline(id:string):LabField {return DISCIPLINES.find(d=>d.id===id)?.protocolField || 'cross-field'}
export type FollowingMode = 'demo' | 'live'
export type FollowKind = 'disciplines' | 'ideas' | 'people'
export type CuratedView = { name: string; disciplines: string[] }
export type FeedFilter = { feed: 'discover' | 'following'; disciplines: string[] }
export type FollowingState = {
  version: 1; owner: string; mode: FollowingMode; disciplines: string[]; ideas: string[]; people: string[];
  views: CuratedView[]; ideaTags: Record<string, string[]>; filter: FeedFilter
}
export type FollowingStore = Pick<Storage, 'getItem' | 'setItem'>
export const followingKey = (owner: string, mode: FollowingMode) => `open-lab:following:v1:${mode}:${encodeURIComponent(owner)}`
export const emptyFollowing = (owner: string, mode: FollowingMode): FollowingState => ({ version: 1, owner, mode, disciplines: [], ideas: [], people: [], views: [], ideaTags: {}, filter: { feed: 'discover', disciplines: [] } })
const malformed = 'Saved following preferences could not be read. The original is preserved; no changes were saved.'
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const idValid = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 4096 && !['__proto__', 'constructor', 'prototype'].includes(v) && !/[\u0000-\u001f\u007f]/.test(v)
const idsValid = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 1000 && v.every(idValid) && new Set(v).size === v.length
const disciplinesValid = (v: unknown): v is string[] => idsValid(v) && v.every(id => DISCIPLINES.some(f => f.id === id))
const nameValid = (v: unknown): v is string => idValid(v) && v.trim() === v && v.length <= 60
function parse(raw: string, owner: string, mode: FollowingMode): FollowingState {
  if (raw.length > 500_000) throw Error(malformed)
  const s = JSON.parse(raw)
  if (!object(s) || s.version !== 1 || s.owner !== owner || s.mode !== mode ||
    !Object.keys(s).every(k => Object.keys(emptyFollowing(owner, mode)).includes(k)) ||
    !disciplinesValid(s.disciplines) || !idsValid(s.ideas) || !idsValid(s.people) ||
    !Array.isArray(s.views) || s.views.length > 24 || !s.views.every(v => object(v) && nameValid(v.name) && disciplinesValid(v.disciplines) && v.disciplines.length > 0 && Object.keys(v).length === 2) || new Set(s.views.map(v => v.name)).size !== s.views.length ||
    !object(s.ideaTags) || Object.keys(s.ideaTags).length > 1000 || !Object.entries(s.ideaTags).every(([id, tags]) => idValid(id) && disciplinesValid(tags)) ||
    !object(s.filter) || !['discover', 'following'].includes(String(s.filter.feed)) || !disciplinesValid(s.filter.disciplines) || Object.keys(s.filter).length !== 2) throw Error(malformed)
  return s as FollowingState
}
export function loadFollowing(storage: FollowingStore, owner: string, mode: FollowingMode) {
  try { const raw = storage.getItem(followingKey(owner, mode)); return { state: raw === null ? emptyFollowing(owner, mode) : parse(raw, owner, mode), error: '' } }
  catch { return { state: emptyFollowing(owner, mode), error: malformed } }
}
export type FollowingAction =
  | { type: 'toggle'; kind: FollowKind; id: string }
  | { type: 'save-view'; name: string; disciplines: string[] }
  | { type: 'remove-view'; name: string }
  | { type: 'tag-idea'; id: string; disciplines: string[] }
  | { type: 'filter'; feed: FeedFilter['feed']; disciplines: string[] }
export function updateFollowing(storage: FollowingStore, owner: string, mode: FollowingMode, action: FollowingAction): { ok: boolean; error?: string } {
  const loaded = loadFollowing(storage, owner, mode)
  if (loaded.error) return { ok: false, error: loaded.error }
  try {
    const next = loaded.state
    switch (action.type) {
      case 'toggle': {
        if (!['disciplines', 'ideas', 'people'].includes(action.kind) || !idValid(action.id)) throw Error('Choose a valid follow target.')
        const ids = next[action.kind]
        next[action.kind] = ids.includes(action.id) ? ids.filter(id => id !== action.id) : [...ids, action.id]; break
      }
      case 'save-view': {
        if (!nameValid(action.name) || !disciplinesValid(action.disciplines) || !action.disciplines.length) throw Error('Name a view (1–60 characters) and choose at least one discipline.')
        if (next.views.some(v => v.name === action.name)) throw Error('That view name is already saved. Choose another name.')
        next.views.push({ name: action.name, disciplines: action.disciplines }); break
      }
      case 'remove-view': next.views = next.views.filter(v => v.name !== action.name); break
      case 'tag-idea':
        if (!idValid(action.id) || !disciplinesValid(action.disciplines)) throw Error('Choose valid idea disciplines.')
        next.ideaTags[action.id] = action.disciplines; break
      case 'filter': next.filter = { feed: action.feed, disciplines: action.disciplines }; break
      default: throw Error('Unknown following action.')
    }
    const raw = JSON.stringify(next); parse(raw, owner, mode)
    storage.setItem(followingKey(owner, mode), raw)
    if (storage.getItem(followingKey(owner, mode)) !== raw) throw Error('Storage did not confirm the save.')
    return { ok: true }
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Browser storage is unavailable. Not saved.' } }
}
