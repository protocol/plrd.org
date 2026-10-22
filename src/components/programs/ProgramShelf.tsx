'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'

export type ShelfProgram = {
  slug: string
  /** The caption under the sheet. */
  label: string
  /** "Program" or "Partnership", printed above the title when taken down. */
  kind: string
  title: string
  subtitle: string
  summary: string
  href: string
  pdf: string
  /** Page one of the printed PDF (npm run build-programs). */
  cover: string
}

/** Where a sheet stands on the shelf: centre point and layout width. */
type Spot = { cx: number; cy: number; w: number }

/**
 * The FA2 programs on a shelf, after ai4cop.org's field sheets: each one-pager
 * stands on a board as the page it prints, turned so it reads as an object,
 * and straightens when reached for. Taking one down flies the same leaf to
 * the centre of the page with both ways in, the web edition and the PDF.
 *
 * Each sheet is a real link to its web edition, so crawlers, new-tab clicks
 * and readers without JavaScript go straight there; a plain click takes the
 * sheet down instead.
 */
export default function ProgramShelf({ programs }: { programs: ShelfProgram[] }) {
  const [taken, setTaken] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const returnTo = useRef<string | null>(null)

  /** Where the taken sheet stands, measured on take-off and again on landing
      in case the page scrolled underneath. */
  const spot = useCallback((): Spot | null => {
    const el = rowRef.current?.querySelector<HTMLElement>(`[data-program="${taken}"] .program-sheet`)
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, w: el.offsetWidth }
  }, [taken])

  const putBack = useCallback(() => {
    returnTo.current = taken
    setTaken(null)
  }, [taken])

  /* Once the sheet is back on the board (and visible again), focus returns to it. */
  useEffect(() => {
    if (taken !== null || !returnTo.current) return
    rowRef.current?.querySelector<HTMLElement>(`[data-program="${returnTo.current}"]`)?.focus({ preventScroll: true })
    returnTo.current = null
  }, [taken])

  const program = programs.find((p) => p.slug === taken)

  return (
    <div className="program-shelf relative -mx-6 sm:mx-0">
      <div aria-hidden className="program-board absolute inset-x-0" />
      <div
        ref={rowRef}
        className="program-row relative flex gap-x-8 overflow-x-auto px-6 pt-4 pb-1 sm:px-0 md:gap-x-4 lg:gap-x-10 xl:gap-x-16"
      >
        {programs.map((p) => (
          <a
            key={p.slug}
            href={p.href}
            data-program={p.slug}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
              event.preventDefault()
              setTaken(p.slug)
            }}
            aria-haspopup="dialog"
            className={`program-item group flex shrink-0 flex-col items-center no-underline outline-none ${taken === p.slug ? 'invisible' : ''}`}
          >
            <span className="program-sheet">
              <img src={p.cover} alt="" width={640} height={905} loading="lazy" className="h-full w-full object-cover" />
            </span>
            <span aria-hidden className="program-shadow mt-1.5 block w-4/5" />
            <span className="program-caption mt-5 text-center text-[11px] uppercase leading-relaxed tracking-[0.14em] text-gray-500 transition-colors group-hover:text-black group-focus-visible:text-black">
              {p.label}
            </span>
          </a>
        ))}
      </div>

      {program && <TakenDown key={program.slug} program={program} spotOf={spot} onClose={putBack} />}
    </div>
  )
}

/**
 * A sheet taken down. The detail layout renders first, the leaf is
 * transformed back onto its shelf spot, then released, so it flies from the
 * board to the centre (a FLIP transition) and straightens on the way. Closing
 * flies it back to wherever its spot now is.
 */
function TakenDown({
  program,
  spotOf,
  onClose,
}: {
  program: ShelfProgram
  spotOf: () => Spot | null
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const flyerRef = useRef<HTMLDivElement>(null)
  const readRef = useRef<HTMLAnchorElement>(null)
  const [stage, setStage] = useState<'arriving' | 'open' | 'leaving'>('arriving')
  const [settled, setSettled] = useState(false)
  const leaving = useRef(false)

  /** The transform that puts the flyer back on its shelf spot. */
  const shelfTransform = useCallback(() => {
    const el = flyerRef.current
    const spot = spotOf()
    if (!el || !spot) return ''
    const rect = el.getBoundingClientRect()
    const dx = spot.cx - (rect.left + rect.width / 2)
    const dy = spot.cy - (rect.top + rect.height / 2)
    return `translate(${dx}px, ${dy}px) scale(${spot.w / el.offsetWidth})`
  }, [spotOf])

  const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* Take off: start on the shelf, then release toward the centre. */
  useLayoutEffect(() => {
    const el = flyerRef.current
    if (!el) return
    if (still()) {
      setStage('open')
      return
    }
    el.style.transform = shelfTransform()
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.classList.add('is-animating')
        el.style.transform = ''
        setStage('open')
      }),
    )
    return () => cancelAnimationFrame(raf)
  }, [shelfTransform])

  /* Landed: hand focus to the first way in, and let the leaf answer the cursor. */
  useEffect(() => {
    if (stage !== 'open') return
    readRef.current?.focus({ preventScroll: true })
    const id = window.setTimeout(() => setSettled(true), 660)
    return () => window.clearTimeout(id)
  }, [stage])

  const tilt = (event: React.PointerEvent) => {
    const el = flyerRef.current
    if (!el || !settled || leaving.current) return
    const rect = el.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
    el.style.setProperty('--tilt-y', `${(nx * 10).toFixed(2)}deg`)
    el.style.setProperty('--tilt-x', `${(ny * -7).toFixed(2)}deg`)
  }

  const untilt = () => {
    flyerRef.current?.style.setProperty('--tilt-y', '0deg')
    flyerRef.current?.style.setProperty('--tilt-x', '0deg')
  }

  /* Land: fly back to the spot, then hand the sheet back to the shelf. */
  const close = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    untilt()
    setSettled(false)
    setStage('leaving')
    if (still()) {
      onClose()
      return
    }
    const el = flyerRef.current
    if (el) el.style.transform = shelfTransform()
    window.setTimeout(onClose, 620)
  }, [onClose, shelfTransform])

  /* Escape puts it back; Tab stays inside the card while it is down. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const stops = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([tabindex="-1"])')]
      const first = stops[0]
      const last = stops[stops.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const open = stage === 'open'

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={program.label}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={close}
        className={`absolute inset-0 bg-white/85 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="pointer-events-none relative flex h-full items-center justify-center overflow-y-auto px-6 py-16">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-16">
          <div
            ref={flyerRef}
            data-stage={stage}
            onPointerMove={tilt}
            onPointerLeave={untilt}
            className={`program-flyer pointer-events-auto ${settled ? 'is-settled' : ''}`}
          >
            <span className="program-sheet">
              <img src={program.cover} alt={`Page one of ${program.label}`} width={640} height={905} className="h-full w-full object-cover" />
            </span>
          </div>

          <div
            className={`pointer-events-auto max-w-md text-center transition-all duration-500 sm:text-left ${
              open ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-3 opacity-0'
            }`}
          >
            <span className="block text-xs uppercase tracking-widest text-pink">{program.kind} · A4</span>
            <h3 className="mt-3 text-[30px] leading-[1.1] text-black sm:text-[36px]">{program.title}</h3>
            <p className="mt-1 font-serif text-[19px] italic leading-snug text-blue">{program.subtitle}</p>
            <p className="mt-4 text-base leading-relaxed text-gray-600">{program.summary}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:justify-start">
              <Link
                ref={readRef}
                href={program.href}
                className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 font-medium text-white no-underline transition-colors hover:bg-blue/90"
              >
                Read it on the web
              </Link>
              <a
                href={program.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 no-underline transition-colors hover:text-blue"
              >
                Download the PDF
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className={`absolute right-5 top-5 rounded-full p-2 text-gray-500 transition-all duration-300 hover:text-black ${open ? 'opacity-100' : 'opacity-0'}`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
