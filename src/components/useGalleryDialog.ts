'use client'

import { useEffect, useRef } from 'react'

/** A focused, single-level portal dialog. Definitions use native details inside
 * this dialog, so there is no competing nested-modal focus/scroll lifecycle. */
export function useGalleryDialog(onClose: () => void) {
  const dialog = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const panel = dialog.current
    if (!panel) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    const backdrop = panel.parentElement!
    const siblings = Array.from(document.body.children).filter(el => el !== backdrop)
    const inertStates = siblings.map(el => el.getAttribute('inert'))
    document.body.style.overflow = 'hidden'
    siblings.forEach(el => el.setAttribute('inert', ''))

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
      document.body.style.overflow = previousOverflow
      siblings.forEach((el, index) => {
        const value = inertStates[index]
        if (value === null) el.removeAttribute('inert')
        else el.setAttribute('inert', value)
      })
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])
  return dialog
}
