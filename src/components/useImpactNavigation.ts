'use client'

import { useEffect, useRef } from 'react'
import type { FocusAreaKey } from '@/lib/field-velocity'
import { parseChartHash } from '@/lib/chart-selection'
import { parseInflectionHash } from '@/lib/impact-selection'

const navigationEvent = 'impact-navigation'
// In-memory ownership deliberately does not alter Next's history state. A new
// page load has no owned entries, so closing a pasted link never leaves the page.
const sessions = new WeakMap<Window, { listeners: number; owned: Set<string>; closing: boolean }>()

export function useImpactNavigation(restore: () => void) {
  const latest = useRef(restore)
  latest.current = restore
  useEffect(() => {
    let session = sessions.get(window)
    if (!session) {
      session = { listeners: 0, owned: new Set(), closing: false }
      sessions.set(window, session)
    }
    session.listeners++
    const sync = () => { session.closing = false; latest.current() }
    sync()
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    window.addEventListener(navigationEvent, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
      window.removeEventListener(navigationEvent, sync)
      if (--session.listeners === 0) sessions.delete(window)
    }
  }, [])
}

/** Named methodology/section fragments cannot also encode a focus area. Carry
 * the current area in the query on those links; chart fragments stay unchanged. */
export function impactUrl(hash: string) {
  const url = new URL(hash, window.location.href)
  const area = parseChartHash(window.location.hash)?.area ?? parseInflectionHash(window.location.hash)?.area
  if (area && !parseChartHash(hash) && !parseInflectionHash(hash) && url.searchParams.get('area') !== area) url.searchParams.set('area', area)
  return url.href
}

export function navigateImpact(hash: string) {
  const url = impactUrl(hash)
  if (url !== window.location.href) window.history.pushState(window.history.state, '', url)
  window.dispatchEvent(new window.Event(navigationEvent))
}

export function openImpactDialog(hash: string) {
  const url = impactUrl(hash)
  if (url === window.location.href) return
  window.history.pushState(window.history.state, '', url)
  sessions.get(window)?.owned.add(url)
  window.dispatchEvent(new window.Event(navigationEvent))
}

export function closeImpactDialog(parentHash: string, area?: FocusAreaKey) {
  const session = sessions.get(window)
  if (session?.closing) return
  if (session?.owned.has(window.location.href)) {
    session.closing = true
    window.history.back()
  } else {
    const parent = new URL(parentHash, window.location.href)
    if (area) parent.searchParams.set('area', area)
    window.history.replaceState(window.history.state, '', parent.href)
    window.dispatchEvent(new window.Event(navigationEvent))
  }
}
