"use client"

// Impact surface ported from researchretreat.org: a 3D coverflow
// carousel of hypercerts — the active card sits front and center while
// the neighbouring past & upcoming hypercerts stay visible, tilted
// back at the sides. The stack can be dragged (click / touch) with the
// cards tracking the pointer continuously, and snaps to the nearest
// card on release. Clicking the active card morphs its photo (shared
// layoutId) up into a full project-page detail with an evidence
// timeline and live community activity from the ATProto network.

import { useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import type { Hypercert } from "@/data/hypercerts"
import { HypercertCard } from "@/components/hypercerts/HypercertCard"
import { HypercertDetail } from "@/components/hypercerts/HypercertDetail"
import { useImpactNavigation } from "@/components/useImpactNavigation"

type CardStyle = {
  translateX: string
  rotateY: number
  translateZ: number
  scale: number
  opacity: number
  zIndex: number
  hidden: boolean
}

// Coverflow anchor poses at integer offsets 0 / ±1 / ±2 (+ a vanish
// pose at ±3). Fractional offsets — produced while dragging — are
// linearly interpolated between the neighbouring anchors so the cards
// track the pointer continuously.
//
// Side cards stay (near-)opaque: depth reads from scale + tilt + z-depth,
// not fade. Keeping opacity high stops the light page background from
// bleeding through a tilted card where it isn't backed by its neighbour
// (the gaps between stacked cards). Only the ±3 pose fades to 0 so a card
// still dissolves cleanly as it leaves the stack while dragging.
const POSES = [
  { x: 0, rot: 0, z: 0, scale: 1, opacity: 1 },
  { x: 62, rot: 25, z: -160, scale: 0.85, opacity: 1 },
  { x: 112, rot: 35, z: -260, scale: 0.7, opacity: 0.92 },
  { x: 150, rot: 40, z: -340, scale: 0.6, opacity: 0 },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function getCardStyle(offset: number): CardStyle {
  const abs = Math.abs(offset)
  if (abs >= 3) {
    return { translateX: "0%", rotateY: 0, translateZ: 0, scale: 1, opacity: 0, zIndex: 0, hidden: true }
  }
  const side = offset < 0 ? -1 : 1
  const i = Math.min(Math.floor(abs), POSES.length - 2)
  const t = abs - i
  const a = POSES[i]
  const b = POSES[i + 1]
  return {
    translateX: `${side * lerp(a.x, b.x, t)}%`,
    rotateY: -side * lerp(a.rot, b.rot, t),
    translateZ: lerp(a.z, b.z, t),
    scale: lerp(a.scale, b.scale, t),
    opacity: lerp(a.opacity, b.opacity, t),
    zIndex: 5 - Math.round(abs),
    hidden: false,
  }
}

// Card sizing: measure the container and clamp the card width so the
// side previews never overflow small screens.
const MIN_CARD_W = 210
const MAX_CARD_W = 280
const CARD_ASPECT = 8 / 5 // matches HypercertCard's aspect-[5/8]
// Drag tuning: movement below the slop is a click; one card step is
// the ±62% translate of the first side pose; releases past the catch
// fraction advance even without a full step.
const CLICK_SLOP_PX = 6
const STEP_RATIO = 0.62
const CATCH_FRACTION = 0.15

export function ImpactExperience({
  certs,
  detailVariant = "page",
  showFunding = false,
}: {
  certs: Hypercert[]
  /** How the card detail opens: full-bleed "page" (default) or contained "modal". */
  detailVariant?: "page" | "modal"
  /** Enable the "Fund this effort" flow in the detail (preview only). */
  showFunding?: boolean
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [foreignFragment, setForeignFragment] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState<number>(MAX_CARD_W)

  // Click-and-drag: dragPx follows the pointer while grabbing, and is
  // converted into a fractional index shift for the card poses.
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; dragging: boolean; downIdx: number | null } | null>(null)
  const suppressClickRef = useRef(false)
  const [dragPx, setDragPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const items = certs
  const activeCert = items.find((c) => c.rkey === selected) ?? null

  // URL <-> modal sync. The open cert lives in the URL hash (…/#<rkey>) so a
  // reload or shared link reopens that cert's detail, and the browser Back
  // button closes it.
  const openDetail = (rkey: string) => {
    const idx = items.findIndex((c) => c.rkey === rkey)
    if (idx >= 0) setActiveIndex(idx)
    setForeignFragment(false)
    setSelected(rkey)
    const base = window.location.pathname + window.location.search
    window.history.pushState({ hypercert: rkey }, "", `${base}#${rkey}`)
  }

  const closeDetail = () => {
    // If we pushed a history entry for this modal, pop it so the URL and the
    // Back button stay consistent; otherwise (e.g. opened via a deep link)
    // just strip the hash in place.
    if (typeof window !== "undefined" && (window.history.state as { hypercert?: string } | null)?.hypercert) {
      window.history.back()
    } else {
      setSelected(null)
      const base = window.location.pathname + window.location.search
      window.history.replaceState(null, "", base)
    }
  }

  // Read the hash on mount (deep link) and on Back/Forward (popstate), keeping
  // the open cert in step with the URL.
  useImpactNavigation(() => {
      const rkey = window.location.hash.slice(1)
      const idx = rkey ? items.findIndex((c) => c.rkey === rkey) : -1
      setForeignFragment(!!rkey && idx < 0)
      if (idx >= 0) {
        setActiveIndex(idx)
        setSelected(rkey)
      } else {
        setSelected(null)
      }
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (w <= 0) return
      // The side cards translate by ±62% / ±112%, so the visible stack
      // is about 2.2 card-widths wide. Fit that (plus arrow gutters on
      // sm+).
      const arrowReserve = window.innerWidth >= 640 ? 88 : 16
      const fit = Math.max(
        MIN_CARD_W,
        Math.min(MAX_CARD_W, Math.floor((w - arrowReserve) / 1.7)),
      )
      setCardWidth(fit)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  const carouselHeight = Math.round(cardWidth * CARD_ASPECT) + 24
  const safeActive = Math.min(Math.max(activeIndex, 0), items.length - 1)
  const stepPx = cardWidth * STEP_RATIO
  // Fractional shift of the whole stack while dragging (drag left →
  // positive → next card approaches center). Rubber-band at the ends:
  // past the first/last card the stack only follows at 25%.
  let dragShift = isDragging ? -dragPx / stepPx : 0
  {
    const last = items.length - 1
    let center = safeActive + dragShift
    if (center < 0) center *= 0.25
    else if (center > last) center = last + (center - last) * 0.25
    dragShift = center - safeActive
  }

  const navigate = (next: number) => {
    setActiveIndex(Math.max(0, Math.min(items.length - 1, next)))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") navigate(safeActive - 1)
    else if (e.key === "ArrowRight") navigate(safeActive + 1)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    // Remember which card the press began on, so a tap on a slanted side card
    // can bring it to center even if the pointer jitters past the drag slop.
    const cardEl = (e.target as HTMLElement).closest<HTMLElement>("[data-card-idx]")
    const downIdx = cardEl ? Number(cardEl.dataset.cardIdx) : null
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, dragging: false, downIdx }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    if (!drag.dragging) {
      if (Math.abs(dx) < CLICK_SLOP_PX) return
      // Passed the slop → this is a drag, not a click. Capture the
      // pointer so the grab survives leaving the carousel, and swallow
      // the click that would otherwise open the card on release.
      drag.dragging = true
      suppressClickRef.current = true
      setIsDragging(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* synthetic or already-released pointer — drag still works */
      }
    }
    setDragPx(dx)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null

    // Which card did a tap target? The 3D-transformed side cards (perspective +
    // translateZ behind the center) don't reliably capture pointer events — a
    // press on a slanted card often falls through to the stage, leaving
    // downIdx null. When that happens, hit-test the exact press point for any
    // card wrapper stacked underneath so a click on a far card (e.g. +2) still
    // centers *that* card, instead of only ever stepping one toward it.
    const resolveTap = (): number | null => {
      if (drag.downIdx != null) return drag.downIdx
      if (typeof document !== "undefined") {
        for (const el of document.elementsFromPoint(drag.startX, drag.startY)) {
          const cardEl = (el as HTMLElement).closest?.<HTMLElement>("[data-card-idx]")
          if (cardEl?.dataset.cardIdx != null) return Number(cardEl.dataset.cardIdx)
        }
      }
      // Nothing under the pointer resolved to a card — fall back to inferring
      // direction from where the press landed relative to the carousel center.
      const rect = e.currentTarget.getBoundingClientRect()
      const off = drag.startX - (rect.left + rect.width / 2)
      if (Math.abs(off) < 40) return null // dead-center: leave it alone
      return safeActive + (off < 0 ? -1 : 1)
    }

    // Pure click (never crossed the drag slop): center the tapped card. Suppress
    // the trailing click so it doesn't also open the (now-centered) card.
    if (!drag.dragging) {
      const target = resolveTap()
      if (target != null && target !== safeActive) {
        navigate(target)
        suppressClickRef.current = true
        setTimeout(() => (suppressClickRef.current = false), 0)
      }
      return
    }
    const frac = -(e.clientX - drag.startX) / stepPx
    let steps = Math.round(frac)
    if (steps === 0 && Math.abs(frac) > CATCH_FRACTION) steps = Math.sign(frac)
    // A tiny movement reads as a tap → center the tapped card instead of a no-op.
    if (steps === 0) {
      const target = resolveTap()
      navigate(target != null ? target : safeActive)
    } else {
      navigate(safeActive + steps)
    }
    setIsDragging(false)
    setDragPx(0)
    // The click event fires right after pointerup — let the capture
    // handler swallow it, then re-arm.
    setTimeout(() => (suppressClickRef.current = false), 0)
  }

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return
    e.preventDefault()
    e.stopPropagation()
    suppressClickRef.current = false
  }

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 hidden sm:grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-gray-200 bg-white text-[15px] text-gray-600 transition hover:border-blue hover:text-blue disabled:cursor-not-allowed disabled:opacity-30"

  return (
    <div className="relative">
      {/* Coverflow carousel */}
      <div ref={containerRef}>
        <div
          className={`relative w-full touch-pan-y overflow-hidden outline-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ perspective: "1300px", height: carouselHeight }}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={handleClickCapture}
          aria-label="Hypercert carousel — drag or use the arrows / dots to navigate"
        >
          <button
            type="button"
            onClick={() => navigate(safeActive - 1)}
            disabled={safeActive <= 0}
            aria-label="Previous hypercert"
            className={`${arrowClass} left-0 ml-1`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => navigate(safeActive + 1)}
            disabled={safeActive >= items.length - 1}
            aria-label="Next hypercert"
            className={`${arrowClass} right-0 mr-1`}
          >
            →
          </button>

          <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
            {items.map((cert, idx) => {
              const discreteOffset = idx - safeActive
              const style = getCardStyle(discreteOffset - dragShift)
              return (
                <div
                  key={cert.rkey}
                  data-card-idx={idx}
                  // A clean click anywhere on a slanted side card centers it.
                  onClick={discreteOffset === 0 ? undefined : () => navigate(idx)}
                  className={`absolute left-1/2 top-1/2 ${
                    isDragging ? "" : "transition-all duration-500 ease-out"
                  }`}
                  style={{
                    width: cardWidth,
                    transform: `translateX(-50%) translateY(-50%) translateX(${style.translateX}) rotateY(${style.rotateY}deg) translateZ(${style.translateZ}px) scale(${style.scale})`,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    // Side cards stay clickable so a click brings them front
                    // and center (a real drag is swallowed by handleClickCapture).
                    pointerEvents: style.hidden ? "none" : "auto",
                    cursor: discreteOffset === 0 ? undefined : "pointer",
                    display: style.hidden ? "none" : "block",
                  }}
                >
                  <HypercertCard
                    cert={cert}
                    isActive={discreteOffset === 0}
                    frozen={isDragging}
                    width={cardWidth}
                    layoutDependency={`${safeActive}|${selected ?? ""}`}
                    // Center card opens its detail; a slanted side card first
                    // navigates itself into the center.
                    onSelect={() => (discreteOffset === 0 ? openDetail(cert.rkey) : navigate(idx))}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="mt-8 flex items-center justify-center gap-2.5">
        {items.map((c, i) => (
          <button
            key={c.rkey}
            type="button"
            onClick={() => navigate(i)}
            aria-label={`Go to ${c.title}`}
            className={`relative h-1.5 cursor-pointer rounded-full transition-all ${
              i === safeActive ? "bg-blue" : "bg-gray-300"
            }`}
            style={{ width: i === safeActive ? 26 : 8 }}
          >
            <span aria-hidden className="absolute inset-0 -mx-1 -my-3" />
          </button>
        ))}
      </div>
      <p className="mt-5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        Drag to browse past &amp; upcoming editions · click a card to open its impact claim
      </p>

      {/* A different fragment family must remove the old overlay immediately,
          not retain its body lock above a newly opened dialog during exit. */}
      <AnimatePresence key={foreignFragment ? 'other-fragment' : 'cert'}>
        {activeCert && (
          <HypercertDetail
            key={activeCert.rkey}
            cert={activeCert}
            certs={items}
            showFunding={showFunding}
            variant={detailVariant}
            onClose={closeDetail}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
