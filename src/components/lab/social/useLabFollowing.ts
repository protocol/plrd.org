'use client'
import { useCallback, useEffect, useState } from 'react'
import { useLabIdentity } from '@/lib/lab-identity'
import { emptyFollowing, loadFollowing, updateFollowing, type FollowingAction } from '@/lib/lab-following'
import { DEMO_THREADS, DEMO_PEOPLE } from '@/lib/lab-demo'
import { useDemoCommunity } from '@/components/lab/demo/DemoCommunityProvider'
const CHANGED = 'open-lab:following-changed'
export function useLabFollowing() {
  const identity = useLabIdentity(), demo = useDemoCommunity()
  const owner = identity.isAuthenticated && identity.session?.did ? identity.session.did : 'guest'
  const mode: 'demo' | 'live' = demo.isDemo ? 'demo' : 'live'
  const scope = `${mode}:${owner}`
  const [loaded, setLoaded] = useState({ scope: '', state: emptyFollowing(owner, mode), error: '' })
  const [saveError, setSaveError] = useState('')
  const refresh = useCallback(() => {
    try { setLoaded({ scope, ...loadFollowing(window.localStorage, owner, mode) }) }
    catch { setLoaded({ scope, state: emptyFollowing(owner, mode), error: 'Browser storage is unavailable. Following cannot be saved.' }) }
  }, [owner, mode, scope])
  useEffect(() => {
    setSaveError(''); refresh()
    window.addEventListener('storage', refresh); window.addEventListener(CHANGED, refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(CHANGED, refresh) }
  }, [refresh])
  const ready = loaded.scope === scope && !identity.isLoading && demo.ready
  const state = ready ? loaded.state : emptyFollowing(owner, mode)
  // The provider's follows/saved discussions remain the single demo source of truth.
  const scopedDemo = !identity.isAuthenticated || demo.state.scope === owner
  const prefs = demo.isDemo && scopedDemo ? { ...state, people: [...new Set([...state.people, ...demo.state.follows])], ideas: [...new Set([...state.ideas, ...demo.state.saves])] } : state
  function act(action: FollowingAction) {
    if (!ready) return { ok: false, error: 'Wait for this identity’s preferences to load.' }
    if (demo.isDemo && !scopedDemo) { const error = 'Demo identity scope is not ready. No follow was changed.'; setSaveError(error); return { ok: false, error } }
    let result
    if (demo.isDemo && action.type === 'toggle' && action.kind === 'people' && DEMO_PEOPLE.some(p => p.id === action.id)) result = demo.act({ type: 'follow', personId: action.id })
    else if (demo.isDemo && action.type === 'toggle' && action.kind === 'ideas' && DEMO_THREADS.some(t => t.id === action.id)) result = demo.act({ type: 'save', threadId: action.id })
    else {
      try { result = updateFollowing(window.localStorage, owner, mode, action) }
      catch { result = { ok: false, error: 'Browser storage is unavailable. No preference was saved.' } }
    }
    setSaveError(result.error || '')
    if (result.ok) { refresh(); window.dispatchEvent(new Event(CHANGED)) }
    return result
  }
  return { owner, mode, scope, ready, prefs, act, error: saveError || (ready ? loaded.error : '') || (demo.isDemo ? demo.error : '') }
}
