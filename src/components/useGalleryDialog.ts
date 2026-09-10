'use client'

import { useEffect, useRef } from 'react'

// Reference-count ownership so replacing a URL-addressed modal cannot restore
// scrolling/inert state owned by another mounted dialog.
const bodyLocks = new WeakMap<HTMLElement, { count: number; overflow: string; paddingRight: string; paddingBottom: string }>()
const inertLocks = new WeakMap<Element, { count: number; value: string | null }>()

/** One portal focus boundary; definitions remain visible within it. */
export function useGalleryDialog(onClose: () => void, restoreTarget?: () => HTMLElement | null) {
  const dialog = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  const fallbackFocus = useRef(restoreTarget)
  fallbackFocus.current = restoreTarget
  useEffect(() => {
    const panel = dialog.current
    if (!panel) return
    const previousFocus = document.activeElement as HTMLElement | null
    const body = document.body
    let lock = bodyLocks.get(body)
    if (!lock) {
      lock = { count: 0, overflow: body.style.overflow, paddingRight: body.style.paddingRight, paddingBottom: body.style.paddingBottom }
      bodyLocks.set(body, lock)
      const scrollbar = document.documentElement.clientWidth > 0 ? Math.max(0, window.innerWidth - document.documentElement.clientWidth) : 0
      const minimumWidth = parseFloat(window.getComputedStyle(body).minWidth) || 0
      // At the site's 320px body minimum, hiding the scrollbar doesn't widen
      // the body. Compensate only the width it can actually gain.
      const gutter = Math.min(scrollbar, Math.max(0, window.innerWidth - minimumWidth))
      const padding = parseFloat(window.getComputedStyle(body).paddingRight) || 0
      // The preview's full-bleed band can also create a horizontal scrollbar.
      // Removing it increases the viewport height and clamps scrollY at the
      // document bottom. Reserve that height BEFORE hiding either scrollbar.
      const horizontalGutter = document.documentElement.clientHeight > 0 ? Math.max(0, window.innerHeight - document.documentElement.clientHeight) : 0
      const bottomPadding = parseFloat(window.getComputedStyle(body).paddingBottom) || 0
      if (horizontalGutter) body.style.paddingBottom = `${bottomPadding + horizontalGutter}px`
      if (gutter) body.style.paddingRight = `${padding + gutter}px`
      body.style.overflow = 'hidden'
    }
    lock.count++
    const backdrop = panel.parentElement!
    const siblings = Array.from(document.body.children).filter(el => el !== backdrop)
    siblings.forEach(el => {
      const state = inertLocks.get(el) ?? { count: 0, value: el.getAttribute('inert') }
      state.count++
      inertLocks.set(el, state)
      el.setAttribute('inert', '')
    })

    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex]')).filter(el => {
      if (el.tabIndex < 0 || el.matches(':disabled') || el.closest('[hidden], [inert]')) return false
      for (let ancestor: Element | null = el; ancestor && ancestor !== panel; ancestor = ancestor.parentElement) {
        const style = window.getComputedStyle(ancestor)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        if (ancestor.matches('details:not([open])')) {
          const summary = ancestor.querySelector(':scope > summary')
          if (!summary?.contains(el)) return false
        }
      }
      return true
    })
    const focusFirst = () => (focusable()[0] ?? panel).focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close.current()
      } else if (event.key === 'Tab') {
        const stops = focusable()
        const index = stops.indexOf(document.activeElement as HTMLElement)
        const next = event.shiftKey ? (index <= 0 ? stops.length - 1 : index - 1) : (index + 1) % stops.length
        event.preventDefault()
        ;(stops[next] ?? panel).focus()
      }
    }
    const onFocus = (event: FocusEvent) => {
      if (!panel.contains(event.target as Node)) focusFirst()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('focusin', onFocus)
    focusFirst()
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('focusin', onFocus)
      lock.count--
      if (!lock.count) {
        body.style.overflow = lock.overflow
        body.style.paddingRight = lock.paddingRight
        // Width restoration can bring back the horizontal scrollbar. Commit
        // its viewport height before removing the compensating bottom space.
        void document.documentElement.clientHeight
        body.style.paddingBottom = lock.paddingBottom
        bodyLocks.delete(body)
      }
      siblings.forEach(el => {
        const state = inertLocks.get(el)!
        state.count--
        if (!state.count) {
          if (state.value === null) el.removeAttribute('inert')
          else el.setAttribute('inert', state.value)
          inertLocks.delete(el)
        }
      })
      if (!document.querySelector('.instrument-gallery-dialog')) {
        const target = previousFocus?.isConnected && previousFocus !== body && !previousFocus.closest('[inert]') ? previousFocus : fallbackFocus.current?.()
        target?.focus({ preventScroll: true })
      }
    }
  }, [])
  return dialog
}
