'use client'

import { useLayoutEffect, useRef } from 'react'
import { animate } from 'framer-motion'

type Slot = { left: number; top: number; width: number }

/** Like FundingFlow's flying clone, start at one real slot, then spread into
 * the contact sheet. A damped spring adds a small settle; stagger keeps order. */
export function galleryFanMotion(slot: Slot, origin: Slot, index: number, count: number) {
  return {
    keyframes: {
      x: [origin.left + origin.width / 2 - slot.left - slot.width / 2 + index * 8, 0],
      y: [origin.top - slot.top + index * 6, 0],
      rotate: [count === 1 ? 0 : (index - (count - 1) / 2) * 5, 0],
      scale: [0.88, 1],
      opacity: [0.4, 1],
    },
    transition: { type: 'spring' as const, stiffness: 220, damping: 26, mass: 0.9, delay: Math.min(index, 7) * 0.075 },
  }
}

export function useGalleryFan() {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const grid = ref.current
    if (!grid || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-gallery-item]'))
    // Offset geometry is unaffected by the dialog's own entrance transform.
    const slots = cards.map(card => ({ left: card.offsetLeft, top: card.offsetTop, width: card.offsetWidth }))
    if (!slots[0]?.width) return
    const controls = cards.map((card, index) => {
      const { keyframes, transition } = galleryFanMotion(slots[index], slots[0], index, cards.length)
      return animate(card, keyframes, transition)
    })
    return () => controls.forEach(control => control.stop())
  }, [])
  return ref
}
