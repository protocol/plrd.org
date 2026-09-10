'use client'
import { useCallback, useEffect, useState } from 'react'
import { emptySocialState, loadSocialState, saveSocialMeta, saveSocialProfile, type SocialMeta, type SocialProfile, type SocialSaveResult } from '@/lib/lab-social'

/** Same-tab signal. Parent RecordEditor may emit this after a canonical draft save. */
export const LAB_SOCIAL_CHANGED = 'open-lab:local-drafts-changed'
export function useLabSocial(ownerId = 'guest') {
  const [loaded, setLoaded] = useState({ owner: '', state: emptySocialState() })
  const [saveError, setSaveError] = useState('')
  const refresh = useCallback(() => {
    try { setLoaded({ owner: ownerId, state: loadSocialState(window.localStorage, ownerId) }) }
    catch { setLoaded({ owner: ownerId, state: { ...emptySocialState(), error: 'Browser storage is unavailable. Changes cannot be saved here.' } }) }
  }, [ownerId])
  useEffect(() => {
    setSaveError('')
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener(LAB_SOCIAL_CHANGED, refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); window.removeEventListener(LAB_SOCIAL_CHANGED, refresh) }
  }, [refresh])
  const ready = loaded.owner === ownerId
  const state = ready ? loaded.state : emptySocialState()
  function persist(kind: 'profile' | 'social', patch: SocialProfile | Partial<SocialMeta>): SocialSaveResult {
    if (!ready) return { ok: false, error: 'Wait for this browser’s local drafts to load.' }
    let result: SocialSaveResult
    try { result = kind === 'profile' ? saveSocialProfile(window.localStorage, ownerId, patch) : saveSocialMeta(window.localStorage, ownerId, patch) }
    catch { result = { ok: false, error: 'Browser storage is unavailable. Changes were not saved.' } }
    setSaveError(result.error || '')
    if (result.ok) { refresh(); window.dispatchEvent(new Event(LAB_SOCIAL_CHANGED)) }
    return result
  }
  return { ...state, ready, readError: state.error, error: saveError || state.error, refresh, saveProfile: (patch: SocialProfile) => persist('profile', patch), saveMeta: (patch: Partial<SocialMeta>) => persist('social', patch) }
}
