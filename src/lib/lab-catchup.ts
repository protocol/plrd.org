import type { FeedRow } from '@/lib/lab-feed-model'
import type { FollowingMode, FollowingStore } from '@/lib/lab-following'

export type CatchupReceipt = { id: string; revision: string }
export type CatchupState = { version: 1; owner: string; mode: FollowingMode; seen: CatchupReceipt[] }
export const catchupKey = (owner: string, mode: FollowingMode) => `open-lab:catchup:v1:${mode}:${encodeURIComponent(owner)}`
export const emptyCatchup = (owner: string, mode: FollowingMode): CatchupState => ({ version: 1, owner, mode, seen: [] })
/** Source content, not wall-clock time or local curation, defines an update. */
export function catchupReceipt(row: FeedRow): CatchupReceipt {
  // Keep existing receipts byte-for-byte when no source-associated result exists.
  return { id: row.id, revision: JSON.stringify([row.ideaId, row.title, row.text, row.kind, row.origin, row.author, row.artifact, row.artifactUrl ?? '', row.request, row.stage, row.publicRecord?.cid ?? '', ...(row.returnedResultRevision ? [row.returnedResultRevision] : [])]) }
}
export function isCaughtUp(state: CatchupState, row: FeedRow): boolean {
  const receipt = catchupReceipt(row)
  return state.seen.some(r => r.id === receipt.id && r.revision === receipt.revision)
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const validId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 4096 && !/[\u0000-\u001f\u007f]/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v)
const validReceipt = (v: unknown): v is CatchupReceipt => object(v) && Object.keys(v).length === 2 && validId(v.id) && typeof v.revision === 'string' && v.revision.length > 0 && v.revision.length <= 131072
const MAX_RECEIPTS = 1000
const MAX_BYTES = 1048576
const withinByteLimit = (raw: string) => raw.length <= MAX_BYTES && new TextEncoder().encode(raw).byteLength <= MAX_BYTES
function validState(state: unknown, owner: string, mode: FollowingMode): state is CatchupState {
  return object(state) && Object.keys(state).length === 4 && state.version === 1 && state.owner === owner && state.mode === mode && Array.isArray(state.seen) && state.seen.length <= MAX_RECEIPTS && state.seen.every(validReceipt) && new Set(state.seen.map(r => r.id)).size === state.seen.length
}
export function loadCatchup(store: FollowingStore, owner: string, mode: FollowingMode): { state: CatchupState; error: string } {
  const empty = emptyCatchup(owner, mode)
  try {
    const raw = store.getItem(catchupKey(owner, mode))
    if (raw === null) return { state: empty, error: '' }
    if (!withinByteLimit(raw)) throw Error('History exceeds byte limit')
    const state = JSON.parse(raw)
    if (!validState(state, owner, mode)) throw Error('Unsupported data')
    return { state, error: '' }
  } catch { return { state: empty, error: 'Catch-up history could not be read. The original is preserved; no catch-up changes can be saved.' } }
}
/** Explicit acknowledgement intersects the current view with exact reviewed revisions. */
export function markCaughtUp(store: FollowingStore, owner: string, mode: FollowingMode, visibleRows: FeedRow[], reviewed: CatchupReceipt[]) {
  const loaded = loadCatchup(store, owner, mode)
  if (loaded.error) return { ok: false, count: 0, error: loaded.error }
  const eligible = visibleRows.map(catchupReceipt).filter(r => reviewed.some(v => v.id === r.id && v.revision === r.revision))
  const seen = new Map(loaded.state.seen.map(r => [r.id, r]))
  let count = 0
  for (const receipt of eligible) {
    if (seen.get(receipt.id)?.revision === receipt.revision) continue
    seen.set(receipt.id, receipt); count++
  }
  if (!count) return { ok: true, count: 0, error: '' }
  if (seen.size > MAX_RECEIPTS) return { ok: false, count: 0, error: 'Catch-up history is full (1,000 updates). The original is preserved; no new acknowledgements were saved.' }
  const state = { ...loaded.state, seen: [...seen.values()] }
  if (!validState(state, owner, mode)) return { ok: false, count: 0, error: 'An update exceeds the supported catch-up format. Existing history is preserved; no acknowledgements were saved.' }
  const serialized = JSON.stringify(state)
  if (!withinByteLimit(serialized)) return { ok: false, count: 0, error: 'Catch-up history reached its browser size limit. Existing history is preserved; no acknowledgements were saved.' }
  try {
    const key = catchupKey(owner, mode)
    store.setItem(key, serialized)
    if (store.getItem(key) !== serialized) throw Error('Readback mismatch')
    return { ok: true, count, error: '' }
  } catch { return { ok: false, count: 0, error: 'Catch-up changes could not be verified in browser storage. Nothing is marked caught up in this view.' } }
}
