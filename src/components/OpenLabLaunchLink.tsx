'use client'

import { useEffect, useRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react'
import styles from './OpenLabLaunchLink.module.css'

type Props = ComponentPropsWithoutRef<'a'> & { href: string }

/** Explicit entry only; never wrap the app's routine links or auth routes. */
export default function OpenLabLaunchLink({ children, onClick, ...props }: Props) {
  const departing = useRef<boolean | 'native'>(false)
  const cancel = useRef<(() => void) | null>(null)
  useEffect(() => {
    const reset = () => {
      cancel.current?.()
      departing.current = false
    }
    window.addEventListener('pagehide', reset)
    window.addEventListener('pageshow', reset)
    window.addEventListener('popstate', reset)
    return () => {
      reset()
      window.removeEventListener('pagehide', reset)
      window.removeEventListener('pageshow', reset)
      window.removeEventListener('popstate', reset)
    }
  }, [])
  function launch(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    const anchor = event.currentTarget
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const target = anchor.getAttribute('target') ?? document.querySelector('base[target]')?.getAttribute('target')
    if ((target && target.toLowerCase() !== '_self') || anchor.hasAttribute('download')) return
    // Keep a pending document load from being issued twice; restore on pageshow.
    if (departing.current === 'native') return
    if (departing.current) { event.preventDefault(); return }
    const destination = anchor.href
    let url: URL
    try { url = new URL(destination) } catch { return }
    if (!['http:', 'https:'].includes(url.protocol)) return
    if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search) return
    let motion: MediaQueryList
    try {
      if (typeof window.matchMedia !== 'function') return
      motion = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (motion.matches ||
          typeof anchor.animate !== 'function' || typeof window.CSS?.supports !== 'function' ||
          !window.CSS.supports('clip-path', 'circle(1px at 0 0)')) return
    } catch { return }
    const rect = anchor.getBoundingClientRect()
    const x = event.detail > 0 ? event.clientX : rect.left + rect.width / 2
    const y = event.detail > 0 ? event.clientY : rect.top + rect.height / 2
    const radius = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)))
    const cover = document.createElement('div')
    cover.className = styles.cover
    cover.setAttribute('aria-hidden', 'true')
    let animation: Animation | undefined
    let timeout: number | undefined
    let settled = false
    const cleanup = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      motion.removeEventListener?.('change', reduce)
      cover.remove()
      try { animation?.cancel() } catch { /* The cover is already gone. */ }
      cancel.current = null
    }
    const finish = () => {
      if (settled) return
      cleanup()
      // A real document load also works across origins. No router/VT dependency.
      try { window.location.assign(destination) } catch { departing.current = 'native' }
    }
    const reduce = () => { if (motion.matches) finish() }
    try {
      document.body.appendChild(cover)
      animation = cover.animate([
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
      ], { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' })
      void animation.finished.then(finish, finish)
      timeout = window.setTimeout(finish, 320)
      motion.addEventListener?.('change', reduce)
      cancel.current = cleanup
      departing.current = true
      event.preventDefault()
    } catch {
      cleanup() // No preventDefault until setup succeeds: the anchor still works.
    }
  }

  return <a {...props} onClick={launch}>{children}</a>
}
