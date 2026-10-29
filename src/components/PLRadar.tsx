'use client'

/**
 * PL R&D Radar — a collapsible, swipeable "catch up in a minute" digest that
 * sits at the top of /insights. It surfaces the most recent things PL R&D has
 * published (talks, podcasts, publications, posts) as one-card-at-a-time
 * "stories", ending with a "You're all caught up" slide.
 *
 * It's an editorial *monthly* edition (e.g. "July Radar"): the server picks the
 * newest items and passes them in via `items`, with `edition` as the label.
 *
 * Collapse state is remembered in localStorage so once a reader is done, the
 * Insights page stays clean on their next visit.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

export type RadarItem = {
  key: string
  title: string
  description?: string
  href: string
  external?: boolean
  /** Display type: Talk · Podcast · Publication · Blog · Signal */
  type: string
  areaLabel: string
  areaSlug: string
  /** Pre-formatted date string (e.g. "Jun 25, 2026"). */
  date: string
  /** Optional cover image (e.g. a YouTube thumbnail). Falls back to a gradient. */
  image?: string
  imageAlt?: string
  plainImage?: boolean
  /** Source-specific action, e.g. "Watch the conversation". */
  ctaLabel?: string
}

const STORAGE_KEY = 'plrd-radar-collapsed'

/** How long each story slide dwells before auto-advancing (ms). */
const SLIDE_MS = 7000

const AREA_GRADIENT: Record<string, { from: string; via: string; to: string; dot: string }> = {
  'digital-human-rights': { from: '#0b1f4d', via: '#1e3a8a', to: '#3966FE', dot: '#3966FE' },
  'economies-governance': { from: '#0a3b2e', via: '#0f6b4c', to: '#12bfdf', dot: '#12bfdf' },
  'ai-robotics': { from: '#2a1b4d', via: '#4834c4', to: '#7b6cf6', dot: '#7b6cf6' },
  neurotech: { from: '#141a52', via: '#2340c9', to: '#5b7bff', dot: '#3966FE' },
  default: { from: '#0d0f13', via: '#1d2b5c', to: '#1982F4', dot: '#1982F4' },
}

const TYPE_CTA: Record<string, string> = {
  Talk: 'Watch the talk',
  Podcast: 'Listen now',
  Publication: 'Read the paper',
  Blog: 'Read the post',
  Signal: 'Read the story',
}

// One neutral badge style for every type — the Radar no longer colour-codes by type.
const TYPE_BADGE = 'text-gray-600 bg-gray-100'

function grad(slug: string) {
  return AREA_GRADIENT[slug] || AREA_GRADIENT.default
}

/** Cover image with graceful fallback: image → hidden (so the gradient shows). */
function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const [hqSrc, setHqSrc] = useState(src)
  if (failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hqSrc}
      alt={alt}
      className="absolute inset-0 z-0 w-full h-full object-contain"
      loading="lazy"
      onError={() => {
        // YouTube maxres often 404s → retry hqdefault, then give up to gradient.
        const hq = hqSrc.replace('maxresdefault', 'hqdefault')
        if (hq !== hqSrc) setHqSrc(hq)
        else setFailed(true)
      }}
    />
  )
}

export default function PLRadar({ edition, items }: { edition: string; items: RadarItem[] }) {
  const [open, setOpen] = useState(true)
  const [i, setI] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const touchX = useRef<number | null>(null)

  // Remember collapse state across visits.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(STORAGE_KEY) === '1') setOpen(false)
  }, [])
  const setOpenPersist = (v: boolean) => {
    setOpen(v)
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? '0' : '1')
    } catch {}
  }

  const N = items.length + 1 // + "all caught up" slide
  const go = useCallback((n: number) => {
    // Arrow navigation from a CTA must not leave focus in the now-inert card.
    if (document.activeElement?.closest('[data-radar-slide]')) sectionRef.current?.focus()
    setI(Math.max(0, Math.min(N - 1, n)))
  }, [N])

  const atEnd = i === items.length

  // Story-style auto-advance: fill the current slide's bar over SLIDE_MS, then
  // step to the next slide. Pauses while collapsed, held/hovered, or when the
  // tab is hidden, and halts on the final "all caught up" slide.
  useEffect(() => {
    setProgress(0)
    if (!open || paused || focusWithin || atEnd) return
    let raf = 0
    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now
      const p = Math.min(1, (now - start) / SLIDE_MS)
      setProgress(p)
      if (p >= 1) go(i + 1)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [i, open, paused, focusWithin, atEnd, go])

  // Pause auto-advance when the tab loses focus (browsers throttle rAF anyway).
  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
    setPaused(true) // press-and-hold pauses, like stories
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    setPaused(false)
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx < -40) go(i + 1)
    else if (dx > 40) go(i - 1)
    touchX.current = null
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(i + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(i - 1)
    }
  }

  const shareOnX = () => {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/insights` : 'https://www.plrd.org/insights'
    const text = `PL R&D Radar — ${edition}\nA one-minute swipe through what's new across our research, talks & ideas.`
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
      url,
    )}&via=protocollabs_rd`
    window.open(intent, '_blank', 'noopener,noreferrer')
  }

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      onKeyDown={open ? onKeyDown : undefined}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false)
      }}
      aria-label="PL R&D Radar"
      className="mb-10 outline-none"
    >
      {/* Explainer / header row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
          <span
            className="w-2 h-2 rounded-full bg-blue"
            style={{ boxShadow: '0 0 0 4px rgba(25,130,244,0.15)' }}
          />
          PL R&amp;D Radar
        </span>
        <span className="text-[13px] text-gray-500">
          A one-minute swipe through what&apos;s new · updated monthly ·{' '}
          <span className="font-semibold text-gray-700">{edition}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={shareOnX}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100 transition-colors"
            aria-label="Share the Radar on X"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
          <button
            onClick={() => setOpenPersist(!open)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100 transition-colors"
            aria-expanded={open}
          >
            {open ? 'Hide' : 'Show'}
            <span className="text-[10px] leading-none" aria-hidden="true">{open ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* Swiper */}
      {open && (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[0_8px_30px_rgba(15,17,21,0.06)]">
          {/* progress segments — own band above the content so they never overlap it */}
          <div className="relative z-30 flex gap-1.5 px-4 pt-4 pb-3 bg-white">
            {Array.from({ length: N }).map((_, idx) => {
              // Past slides are full; the current slide fills as it plays; future slides are empty.
              const fill = idx < i ? 1 : idx === i ? (atEnd ? 1 : progress) : 0
              return (
                <div key={idx} className="flex-1 h-[3px] rounded-full bg-black/10 overflow-hidden">
                  <div
                    className={`h-full bg-black rounded-full ${idx === i ? '' : 'transition-[width] duration-300'}`}
                    style={{ width: `${fill * 100}%` }}
                  />
                </div>
              )
            })}
          </div>

          <div
            className="relative grid min-h-[300px] sm:min-h-[360px]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* content slides */}
            {items.map((item, idx) => {
              const g = grad(item.areaSlug)
              const cta = item.ctaLabel || TYPE_CTA[item.type] || 'Open'
              const badge = TYPE_BADGE
              return (
                <div
                  key={item.key}
                  // `pointer-events-none` lets clicks on the empty parts of the
                  // active slide fall through to the tap zones below, while the
                  // CTA (which re-enables pointer events) stays clickable. The
                  // active slide sits above the tap zones (z-20) so its CTA wins.
                  className={`relative col-start-1 row-start-1 min-w-0 grid grid-cols-1 grid-rows-[190px_auto] sm:grid-rows-[220px_auto] md:grid-cols-2 md:grid-rows-1 transition-all duration-300 pointer-events-none ${
                    idx === i ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 translate-x-4'
                  }`}
                  data-radar-slide
                  aria-hidden={idx !== i}
                  inert={idx !== i}
                >
                  {/* Charts keep their labels and legend clear of overlays. */}
                  {item.plainImage && item.image ? (
                    <div className="flex min-w-0 flex-col bg-white">
                      <div className="relative flex-1 min-h-0">
                        <CoverImage src={item.image} alt={item.imageAlt || item.title} />
                      </div>
                      <div className="shrink-0 px-5 py-2 bg-[#141a52] text-white">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]">{item.areaLabel}</div>
                        <div className="text-[13px]">{item.date}</div>
                      </div>
                    </div>
                  ) : (
                  <div
                    className="relative min-h-[170px] md:min-h-full overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${g.from}, ${g.via} 55%, ${g.to})` }}
                  >
                    {/* hex texture */}
                    <div
                      className="absolute inset-0 opacity-[0.10] z-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 65%, #fff 1px, transparent 1px)`,
                        backgroundSize: '26px 26px, 34px 34px',
                      }}
                    />
                    {item.image && <CoverImage src={item.image} alt={item.imageAlt || item.title} />}
                    {/* legibility scrim */}
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        background:
                          'linear-gradient(0deg, rgba(10,12,18,0.60) 0%, rgba(10,12,18,0.10) 34%, transparent 62%)',
                      }}
                    />
                    <div className="absolute left-5 bottom-4 z-20 text-white">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-90">
                        {item.areaLabel}
                      </div>
                      <div className="font-serif text-lg">{item.date}</div>
                    </div>
                  </div>

                  )}

                  {/* body */}
                  <div className="flex flex-col justify-center px-7 sm:px-10 py-8">
                    <span
                      className={`self-start text-[11px] font-bold uppercase tracking-[0.09em] px-2.5 py-1 rounded-md mb-4 ${badge}`}
                    >
                      {item.type}
                    </span>
                    <h3 className="font-serif text-[22px] sm:text-[26px] font-medium leading-tight tracking-tight mb-3">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className={`text-[15px] text-gray-600 leading-relaxed max-w-md ${item.type === 'Signal' ? '' : 'line-clamp-3'}`}>
                        {item.description}
                      </p>
                    )}
                    {item.external ? (
                      <a
                        href={item.href}
                        tabIndex={idx === i ? 0 : -1}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 self-start inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors pointer-events-auto"
                      >
                        {cta} →
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        tabIndex={idx === i ? 0 : -1}
                        className="mt-6 self-start inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors pointer-events-auto"
                      >
                        {cta} →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}

            {/* end slide */}
            <div
              className={`col-start-1 row-start-1 min-w-0 flex items-center justify-center text-center px-6 py-8 transition-all duration-300 pointer-events-none ${
                atEnd ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 translate-x-4'
              }`}
              data-radar-slide
              aria-hidden={!atEnd}
              inert={!atEnd}
            >
              <div className="max-w-md">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#e7f7ef] text-[#18b26b] flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h3 className="font-serif text-[28px] font-medium mb-2">You&apos;re all caught up.</h3>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  That&apos;s the {edition}. Browse everything below, or come back next month.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 pointer-events-auto">
                  <button
                    onClick={shareOnX}
                    tabIndex={atEnd ? 0 : -1}
                    className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </button>
                  <button
                    onClick={() => setOpenPersist(false)}
                    tabIndex={atEnd ? 0 : -1}
                    className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                  >
                    Collapse Radar
                  </button>
                </div>
              </div>
            </div>

            {/* tap zones */}
            {i > 0 && (
              <button
                onClick={() => go(i - 1)}
                aria-label="Previous"
                className="absolute left-0 top-14 bottom-14 w-[38%] z-10 cursor-pointer"
              />
            )}
            {i < N - 1 && (
              <button
                onClick={() => go(i + 1)}
                aria-label="Next"
                className="absolute right-0 top-14 bottom-14 w-[52%] z-10 cursor-pointer"
              />
            )}
          </div>

          {/* controls */}
          <div className="relative z-30 flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
            <button
              onClick={() => go(i - 1)}
              disabled={i === 0}
              aria-label="Previous"
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              ←
            </button>
            <span className="text-[12.5px] text-gray-500 tabular-nums">
              {atEnd ? 'All caught up' : `${i + 1} / ${items.length}`}
            </span>
            <button
              onClick={() => go(i + 1)}
              disabled={i === N - 1}
              aria-label="Next"
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
