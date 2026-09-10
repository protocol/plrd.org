'use client'

// Impact Dashboard — field velocity. Horizontal, sticky focus-area tabs sit
// above a wide "field velocity" box (the five velocity instruments, each with a
// direction indicator, opening a modal) and the inflection points we track,
// laid out as four cards in two rows with their live signals. The inflection
// cards mirror the PR #29 design; shared primitives are imported, never forked.

import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useGalleryDialog } from '@/components/useGalleryDialog'
import { useGalleryFan } from '@/components/useGalleryFan'
import { chartHash, parseChartHash } from '@/lib/chart-selection'
import { instrumentGallery, type GalleryItem } from '@/lib/instrument-gallery'
import {
  ROLE_META,
  PL_ROLE_ORDER,
  TEAM_LINKS,
  resolutionFor,
  inflectionLabel,
  inflectionSlug,
  type PLRole,
  type Intervention,
} from '@/lib/inflection-points'
import {
  FOCUS_AREAS,
  INFLECTION_POINTS,
  FIELD_COLOR,
  FIELD_INK,
  HAND_COLOR,
  LIVE_COLOR,
  type FocusAreaKey,
  type InflectionPoint,
} from '@/lib/field-velocity'
import {
  instrumentsForArea,
  INSTRUMENT_BY_ID,
  DIRECTION_META,
  STALE_AFTER_MONTHS,
  isStaleReading,
  shownDirection,
  type InstrumentId,
  type InstrumentRecord,
  type Direction,
} from '@/lib/velocity-instruments'
import { MeasurementChart } from '@/components/MeasurementSeriesCharts'
import type { MeasurementSeries } from '@/lib/measurement-series'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import { Sparkline, GhostChart, type SeriesPoint } from '@/components/VelocitySparkline'
import type { IdeaVintageExample } from '@/components/velocity-explainers'
import { isRenderableMarket, type MarketSignal } from '@/lib/market-signals'

/** Live output metrics for a point, keyed by the point's title. Fetched server-side. */
export type LiveMetric = { value: string; label: string }
export type LiveOutputs = Record<string, LiveMetric[]>
export type MarketSignals = Record<string, MarketSignal>

const PLATFORM_LABEL: Record<'polymarket' | 'kalshi' | 'metaculus' | 'futarchy', string> = {
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
  metaculus: 'Metaculus',
  futarchy: 'Bayes Market',
}

const FA_ICON: Record<FocusAreaKey, AreaIconType> = {
  'digital-human-rights': 'shield',
  'economies-governance': 'hexagon',
  'ai-robotics': 'neural',
  neurotech: 'brain',
}

export default function ImpactDashboardV2({
  liveOutputs = {},
  marketSignals = {},
  recordsByArea,
  measurementSeriesByArea = {},
  ideaVintageExamples = [],
  fixedArea,
  initialArea = 'digital-human-rights',
}: {
  initialArea?: FocusAreaKey
  /** Reuse the full charts/cards/modals on an area overview, without cross-field tabs. */
  fixedArea?: FocusAreaKey
  liveOutputs?: LiveOutputs
  marketSignals?: MarketSignals
  /** Instrument records per focus area, precomputed server-side (static records
   *  merged with any OpenAlex CSV readings). Falls back to the static set. */
  recordsByArea?: Partial<Record<FocusAreaKey, InstrumentRecord[]>>
  measurementSeriesByArea?: Partial<Record<FocusAreaKey, MeasurementSeries[]>>
  /** Methodology examples; galleries only use the selected area's fallback. */
  ideaVintageExamples?: IdeaVintageExample[]
}) {
  const [selectedArea, setFilter] = useState<FocusAreaKey>(initialArea)
  const filter = fixedArea ?? selectedArea
  const [active, setActive] = useState<InflectionPoint | null>(null)
  const [chartSelection, setChartSelection] = useState<{ instrument: InstrumentId; itemId: string } | null>(null)
  const velocityInstrument = chartSelection?.instrument
  const returningCover = useRef<InstrumentId | null>(null)
  const restoreCoverFocus = (instrument: InstrumentId) => {
    if (returningCover.current !== instrument) return false
    returningCover.current = null
    return true
  }

  const visible = useMemo(() => INFLECTION_POINTS.filter((p) => p.area === filter), [filter])
  const records = recordsByArea?.[filter] ?? instrumentsForArea(filter)
  // Live forecast markets mapped to this field's markers — surfaced on the
  // Markets instrument (the same crowd forecasts shown per inflection point).
  const fieldMarkets = useMemo(
    () =>
      visible
        .map((p) => marketSignals[p.title])
        // Only render a market that carries all four: question, venue, resolution
        // date, and URL. A bare probability without its question is uninterpretable.
        .filter((s): s is MarketSignal => !!s && isRenderableMarket(s) && (s.prob != null || !!s.readout)),
    [visible, marketSignals],
  )

  // Fragments are deliberately not DOM ids: opening a chart never scrolls the
  // background. History retains Next's own state and the origin/path/query.
  const ownedChart = useRef<string | null>(null)
  const navigationData = useRef({ recordsByArea, measurementSeriesByArea, marketSignals, ideaVintageExamples })
  navigationData.current = { recordsByArea, measurementSeriesByArea, marketSignals, ideaVintageExamples }
  useEffect(() => {
    const restore = () => {
      const route = parseChartHash(window.location.hash)
      if (route?.instrument) setActive(null)
      setChartSelection(null)
      if (!route || (fixedArea && route.area !== fixedArea)) {
        if (!fixedArea) setFilter(initialArea)
        return
      }
      setFilter(route.area)
      if (!route.instrument || !route.itemId) return
      const data = navigationData.current
      const record = (data.recordsByArea?.[route.area] ?? instrumentsForArea(route.area)).find(r => r.instrument === route.instrument)
      if (!record) return
      const markets = INFLECTION_POINTS.filter(p => p.area === route.area).map(p => data.marketSignals[p.title]).filter((market): market is MarketSignal => !!market)
      const label = FOCUS_AREAS.find(area => area.key === route.area)!.label
      const { items } = instrumentGallery(record, data.measurementSeriesByArea[route.area] ?? [], markets, data.ideaVintageExamples, label)
      if (items.some(item => item.id === route.itemId) || (!items.length && route.itemId === 'evidence')) setChartSelection({ instrument: route.instrument, itemId: route.itemId })
    }
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    restore()
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restore)
    return () => {
      window.removeEventListener('popstate', restore)
      window.removeEventListener('hashchange', restore)
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [fixedArea, initialArea])
  const selectArea = (area: FocusAreaKey) => {
    window.history.pushState(window.history.state, '', chartHash(area))
    setFilter(area)
    setChartSelection(null)
    ownedChart.current = null
  }
  const openChart = (instrument: InstrumentId, itemId: string) => {
    setActive(null)
    window.history.pushState(window.history.state, '', chartHash(filter, instrument, itemId))
    ownedChart.current = window.location.href
    setChartSelection({ instrument, itemId })
  }
  const closeChart = () => {
    if (ownedChart.current === window.location.href) window.history.back()
    else {
      window.history.replaceState(window.history.state, '', chartHash(filter))
      setChartSelection(null)
    }
    ownedChart.current = null
  }

  return (
    <>
      <div className={fixedArea ? 'min-w-0' : 'field-velocity-dashboard min-w-0'}>
        {/* Focus-area tabs share the content width and sit above every chart. */}
        {!fixedArea && <div className="mb-6 min-w-0">
          <div
            role="tablist"
            aria-orientation="horizontal"
            aria-label="Filter by focus area"
            className="flex flex-wrap gap-1.5"
          >
            {FOCUS_AREAS.map((fa) => (
              <Tab
                key={fa.key}
                label={fa.label}
                count={INFLECTION_POINTS.filter((p) => p.area === fa.key).length}
                forthcoming={fa.forthcoming}
                icon={FA_ICON[fa.key]}
                active={filter === fa.key}
                onClick={() => selectArea(fa.key)}
              />
            ))}
          </div>
        </div>}
        {/* Content: field velocity box + inflection points */}
        <div className="field-velocity-content min-w-0">
          {/* Field velocity — label outside the box; the box previews the five
              instruments and opens a modal. */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: FIELD_COLOR }}>
              Field velocity
            </span>
            <span className="text-[11px] text-gray-400">· Is the field speeding up?</span>
          </div>
          <FieldVelocityBox key={filter} records={records} markets={fieldMarkets} measurements={measurementSeriesByArea[filter] ?? []} examples={ideaVintageExamples} area={filter} onOpen={openChart} restoreCoverFocus={restoreCoverFocus} />

          {/* Inflection points — four cards in two rows, with live signals. */}
          <div className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Inflection points we&rsquo;re tracking
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {visible.map((p) => (
                <InflectionCard
                  key={`${p.area}-${p.title}`}
                  point={p}
                  metrics={liveOutputs[p.title]}
                  signal={marketSignals[p.title]}
                  onOpen={() => setActive(p)}
                />
              ))}
            </div>
          ) : (
            <EmptyState filter={filter} />
          )}
        </div>
      </div>

      {active && (
        <InflectionModal
          point={active}
          metrics={liveOutputs[active.title]}
          signal={marketSignals[active.title]}
          onClose={() => setActive(null)}
        />
      )}
      {velocityInstrument && records.find(r => r.instrument === velocityInstrument) && (
        <VelocityModal
          key={`${filter}-${velocityInstrument}-${chartSelection?.itemId}`}
          itemId={chartSelection!.itemId}
          area={filter}
          record={records.find(r => r.instrument === velocityInstrument)!}
          markets={fieldMarkets}
          measurements={measurementSeriesByArea[filter] ?? []}
          examples={ideaVintageExamples}
          onClose={closeChart}
          onRestoreCover={() => { returningCover.current = velocityInstrument }}
        />
      )}
    </>
  )
}

// ── Focus-area tab (horizontal overview navigation) ─────────────────────────────────
function Tab({
  label,
  count,
  forthcoming = false,
  active,
  icon,
  onClick,
}: {
  label: string
  count: number
  forthcoming?: boolean
  active: boolean
  icon?: AreaIconType
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm font-medium transition-all ${
        active
          ? 'border-gray-200 bg-white text-black shadow-sm'
          : 'border-transparent text-gray-500 hover:bg-white/60 hover:text-black'
      }`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center"
        style={{ color: active ? 'var(--impact-field)' : '#9ca3af' }}
      >
        {icon && <AreaIcon type={icon} className="block h-5 w-5" />}
      </span>
      <span className="flex-1 whitespace-nowrap">{label}</span>
      {forthcoming ? (
        <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-gray-400">Soon</span>
      ) : (
        <span className="text-xs tabular-nums text-gray-400">{count}</span>
      )}
    </button>
  )
}

// ── Field velocity box (wide) + its modal ─────────────────────────────────────

function DirectionChip({ direction, size = 'sm' }: { direction: Direction; size?: 'sm' | 'lg' }) {
  const meta = DIRECTION_META[direction]
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${size === 'lg' ? 'text-sm' : 'text-[11px]'}`}
      style={{ color: meta.color }}
    >
      <span className="tabular-nums" aria-hidden>{meta.glyph}</span>
      {meta.label}
    </span>
  )
}

/** Show the date portion of an ISO string (the full value stays in provenance). */
function shortDate(s?: string): string | undefined {
  return s ? s.slice(0, 10) : s
}

/** A visible "stale" pill for readings whose measured observation is older than
 *  the staleness policy. The direction chip is suppressed alongside it. */
function StaleMarker({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <span
      title={`Last measured over ${STALE_AFTER_MONTHS} months ago; not re-measured since, so no current trend is claimed.`}
      className={`inline-flex items-center gap-1 rounded-full bg-amber-50 font-medium text-amber-700 ${
        size === 'lg' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[10px]'
      }`}
    >
      <span aria-hidden>○</span> stale
    </span>
  )
}

function chartTitle(item: GalleryItem, record: InstrumentRecord, areaLabel: string) {
  if (item.kind === 'measurement') return item.measure.title
  if (item.kind === 'market') return item.market.question ?? 'Forecast'
  if (item.kind === 'reading') return 'Historical reading'
  if (item.kind === 'patent') return 'Patent vintage · invention side'
  if (item.kind === 'example') return `${item.example.label} · paper vintage`
  if (item.kind === 'secondary') return record.series2Label ?? 'Secondary series / normalizer'
  // Keep the animal-model qualifier in the complete RecordEvidence data face,
  // not in a repeated preview/modal/plot heading. The source feed is unchanged.
  const metricTitle = record.instrument === 'latency_compression' ? record.metric?.split(' Most entries are ')[0] : record.metric
  return record.instrument === 'idea_vintage' ? `${areaLabel} · paper vintage` : metricTitle ?? INSTRUMENT_BY_ID[record.instrument].label
}

function ChartPreview({ item, record }: { item: GalleryItem; record: InstrumentRecord }) {
  if (item.kind === 'measurement') return <><MeasurementChart measure={item.measure} face="preview" /><span className="chart-preview-caption">{item.measure.unit} · {item.measure.scale} scale</span></>
  if (item.kind === 'reading') return <><strong className="chart-preview-reading">{record.value}</strong><span className="chart-preview-caption">Single historical observation · not a time series</span></>
  if (item.kind === 'market') return <>{item.market.prob != null ? <meter min={0} max={1} value={item.market.prob} aria-label={item.market.question ?? 'Forecast probability'} /> : <strong>{item.market.readout}</strong>}<span className="chart-preview-caption">{item.market.prob != null ? `${Math.round(item.market.prob * 100)}% · ` : ''}{item.market.platform} · resolves {item.market.resolutionDate}</span></>
  const series: SeriesPoint[] = item.kind === 'secondary' ? record.series2! : item.kind === 'patent' ? record.patentVintage!.series! : item.kind === 'example' ? item.example.series : record.series!
  const scale = item.kind === 'example' ? item.example.scale : item.kind === 'primary' ? record.seriesScale : 'linear'
  return <><Sparkline series={series} scale={scale} band={series.some(p => p.lo != null)} width={280} height={112} /><span className="chart-preview-caption">{series[0].x}–{series[series.length - 1].x} · {scale ?? 'linear'} scale</span></>
}

function ChartDeck({ record, items, chartCount, areaLabel, area, onOpen, expanded, subdued, shift, onExpand, onCollapse, restoreCoverFocus }: {
  record: InstrumentRecord; items: GalleryItem[]; chartCount: number; areaLabel: string; area: FocusAreaKey
  onOpen: (id: InstrumentId, itemId: string) => void
  expanded: boolean; subdued: boolean; shift: number; onExpand: () => void; onCollapse: () => void
  restoreCoverFocus: () => boolean
}) {
  const deck = useRef<HTMLDivElement>(null)
  const cover = useRef<HTMLButtonElement>(null)
  const suppressFocus = useRef(false)
  const pinned = useRef(false)
  const fanId = useId()
  const inst = INSTRUMENT_BY_ID[record.instrument]
  const previewMeasure = items.find(item => item.kind === 'measurement')
  const multi = items.length > 1
  const expand = () => { if (multi) onExpand() }
  const revealCover = () => {
    const frame = deck.current?.closest<HTMLElement>('[data-chart-viewport]')
    if (!frame || !cover.current) return
    const bounds = frame.getBoundingClientRect()
    const target = cover.current.getBoundingClientRect()
    if (target.left < bounds.left || target.right > bounds.right) {
      // Dismissal can leave keyboard focus several cards offscreen on mobile.
      // Reveal only inside this gallery; never move the document vertically.
      frame.scrollTo?.({ left: Math.max(0, frame.scrollLeft + target.left - bounds.left), behavior: 'instant' })
    }
  }
  const dismiss = () => {
    pinned.current = false
    onCollapse()
    suppressFocus.current = true
    cover.current?.focus({ preventScroll: true })
    suppressFocus.current = false
    revealCover()
  }
  const focusFirstPreview = () => deck.current?.querySelector<HTMLAnchorElement>('.chart-fan-card')?.focus({ preventScroll: true })
  useLayoutEffect(() => {
    if (expanded) {
      if (document.activeElement === cover.current) focusFirstPreview()
      return
    }
    pinned.current = false
    // A sibling can take ownership on hover while keyboard focus is inside
    // this fan. Recover before paint instead of stranding focus in inert UI.
    if (deck.current?.querySelector('[data-chart-fan]')?.contains(document.activeElement)) {
      suppressFocus.current = true
      cover.current?.focus({ preventScroll: true })
      suppressFocus.current = false
      if (!subdued) revealCover()
    }
  }, [expanded])
  useEffect(() => {
    if (!expanded) return
    const outside = (event: PointerEvent) => { if (!(event.target instanceof Element && event.target.closest('.instrument-gallery-backdrop')) && !deck.current?.contains(event.target as Node)) { pinned.current = false; onCollapse() } }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [expanded])
  return <div ref={deck} className="chart-deck" data-chart-deck={record.instrument} data-expanded={expanded} data-subdued={subdued}
    style={{ '--deck-shift': shift } as CSSProperties}
    onPointerEnter={event => { if (event.pointerType === 'mouse') expand() }}
    onPointerLeave={() => { if (!pinned.current && !deck.current?.contains(document.activeElement)) onCollapse() }}
    onFocus={event => {
      if (suppressFocus.current) return
      if (event.target.isSameNode(cover.current) && restoreCoverFocus()) { revealCover(); return }
      expand()
      if (expanded && event.target.isSameNode(cover.current)) focusFirstPreview()
    }}
    onBlur={event => { if (!(event.relatedTarget instanceof Element && event.relatedTarget.closest('.instrument-gallery-backdrop')) && !event.currentTarget.contains(event.relatedTarget)) { pinned.current = false; onCollapse() } }}
    onKeyDown={event => { if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); dismiss() } }}>
    <button ref={cover} type="button" data-instrument={record.instrument} data-chart-count={chartCount} data-view-count={items.length}
      tabIndex={expanded ? -1 : 0}
      data-chart-target={!multi ? items[0]?.id : undefined}
      aria-expanded={multi ? expanded : undefined} aria-controls={multi ? fanId : undefined} aria-haspopup={multi ? undefined : 'dialog'}
      aria-label={`${inst.label}: ${items.length} ${items.length === 1 ? 'view' : 'views'}, ${chartCount} ${chartCount === 1 ? 'chart' : 'charts'}. ${multi ? 'Choose a chart' : items.length ? 'Open chart' : 'View evidence and status'}`}
      onClick={event => { event.currentTarget.focus({ preventScroll: true }); if (multi) { pinned.current = true; expand() } else onOpen(record.instrument, items[0]?.id ?? 'evidence') }} className="instrument-preview">
      {items.length > 2 && <span data-stack-layer="2" aria-hidden="true" className="instrument-stack-layer" />}
      {items.length > 1 && <span data-stack-layer="1" aria-hidden="true" className="instrument-stack-layer" />}
      <span className="instrument-preview-face">
        <span className="text-sm font-semibold leading-snug text-black">{inst.label}</span>
        <span className="instrument-chart-badge">{items.length > chartCount ? `${items.length} views` : `${chartCount} ${chartCount === 1 ? 'chart' : 'charts'}`} <span aria-hidden="true">↗</span></span>
        {record.state === 'reading' ? <>
          {record.series && record.series.length > 1 && <span className="instrument-preview-plot" aria-hidden="true"><Sparkline series={record.series} scale={record.seriesScale} band={record.series.some(p => p.lo != null)} /></span>}
          {!(record.series && record.series.length > 1) && previewMeasure?.kind === 'measurement' && <MeasurementChart measure={previewMeasure.measure} face="preview" />}
          <span className="line-clamp-3 text-xs font-medium leading-relaxed text-black">{record.value}</span>
          <span className="mt-auto flex flex-wrap items-center gap-1.5">
            {shownDirection(record) && <DirectionChip direction={shownDirection(record)!} />}{isStaleReading(record) && <StaleMarker />}
            {record.measuredAt && <span className="text-[10px] text-gray-500">measured {shortDate(record.measuredAt)}</span>}
          </span>
        </> : <>{record.state === 'unwired' && <GhostChart />}<span className="text-xs text-gray-500">{record.state === 'unwired' ? 'Not yet wired' : 'Not applicable to this field'}</span></>}
        <span className="mt-auto text-[11px] font-medium text-blue">{multi ? 'Hover or tap to choose a chart' : items.length ? 'Open chart ↗' : 'View evidence & status'}</span>
      </span>
    </button>
    {multi && <div id={fanId} className="chart-fan" data-chart-fan inert={!expanded} aria-hidden={!expanded}
      style={{ '--fan-count': items.length } as CSSProperties}>
      <div className="chart-fan-heading"><button type="button" onClick={dismiss} aria-label={`Collapse ${inst.label} previews`}><span aria-hidden="true">×</span></button></div>
      <div className="chart-fan-cards" data-count={items.length}>
        {items.map((item, index) => <a key={item.id} href={chartHash(area, record.instrument, item.id)}
          className="chart-fan-card" data-chart-target={item.id} aria-haspopup="dialog" style={{ '--fan-index': index } as CSSProperties}
          onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); pinned.current = true; event.currentTarget.focus({ preventScroll: true }); onOpen(record.instrument, item.id) }}>
          <span className="chart-fan-group">{inst.label} · {index + 1}/{items.length}</span>
          <span data-preview-title>{chartTitle(item, record, areaLabel)}</span>
          <span className="chart-fan-plot"><ChartPreview item={item} record={record} /></span>
          <span className="chart-preview-caption">Open {item.kind === 'reading' ? 'reading' : 'chart'} ↗</span>
        </a>)}
      </div>
    </div>}
  </div>
}

function FieldVelocityBox({ records, markets, measurements, examples, area, onOpen, restoreCoverFocus }: {
  records: InstrumentRecord[]; markets: MarketSignal[]; measurements: MeasurementSeries[]; examples: IdeaVintageExample[]; area: FocusAreaKey
  onOpen: (id: InstrumentId, itemId: string) => void
  restoreCoverFocus: (instrument: InstrumentId) => boolean
}) {
  const areaLabel = FOCUS_AREAS.find(f => f.key === area)!.label
  // One owner for the entire deck row: a pinned/focused deck cannot coexist
  // with a newly hovered one. Late leave/blur events only close their own deck.
  const [expandedInstrument, setExpandedInstrument] = useState<InstrumentId | null>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const galleries = records.map(record => instrumentGallery(record, measurements, markets, examples, areaLabel))
  const expandedIndex = records.findIndex(record => record.instrument === expandedInstrument)
  const viewCount = expandedIndex < 0 ? 0 : galleries[expandedIndex].items.length
  const extra = Math.max(0, viewCount - 1)
  useLayoutEffect(() => {
    if (!expandedInstrument) return
    const reveal = () => {
      const frame = viewport.current
      const deck = frame?.querySelector<HTMLElement>(`[data-chart-deck="${expandedInstrument}"]`)
      if (!frame?.clientWidth || !deck) return
      const row = deck.parentElement!
      const gap = parseFloat(window.getComputedStyle(row).columnGap) || 0
      const width = Math.min(viewCount * (deck.offsetWidth + gap) - gap, frame.clientWidth)
      const start = row.offsetLeft + deck.offsetLeft
      const left = Math.max(0, start + width - frame.clientWidth, Math.min(frame.scrollLeft, start))
      // Never scrollIntoView: only the gallery's horizontal viewport may move.
      // Stable dependencies also preserve a user's scroll across modal/history updates.
      frame.scrollTo?.({ left, behavior: 'instant' })
    }
    reveal()
    window.addEventListener('resize', reveal)
    return () => window.removeEventListener('resize', reveal)
  }, [expandedInstrument, viewCount])
  return <div ref={viewport} className="instrument-preview-viewport" data-chart-viewport role="region" aria-label="Field velocity charts">
    <div className="instrument-previews" data-active-group={expandedInstrument ?? undefined} style={{ '--gallery-slots': records.length + extra } as CSSProperties}>
      {records.map((record, index) => <ChartDeck key={`${area}-${record.instrument}`} record={record} {...galleries[index]} areaLabel={areaLabel} area={area} onOpen={onOpen}
        restoreCoverFocus={() => restoreCoverFocus(record.instrument)}
        expanded={expandedInstrument === record.instrument}
        subdued={expandedInstrument !== null && expandedInstrument !== record.instrument}
        shift={expandedIndex >= 0 && index > expandedIndex ? extra : 0}
        onExpand={() => setExpandedInstrument(record.instrument)}
        onCollapse={() => setExpandedInstrument(current => current === record.instrument ? null : current)} />)}
    </div>
  </div>
}

function SourceLinks({ sources }: { sources: { label: string; url: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue hover:underline"
        >
          {s.label}
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      ))}
    </div>
  )
}

/** Full record evidence remains available even for a reading with no time series. */
function RecordEvidence({ record: r }: { record: InstrumentRecord }) {
  return <div className="space-y-2 text-sm leading-relaxed text-gray-600">
    {r.state === 'reading' ? <>
      {r.value && <p className="font-semibold text-black">{r.value}</p>}
      {r.metric && <p>{r.metric}</p>}
      {r.trend && <p>{r.trend}</p>}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {shownDirection(r) && <DirectionChip direction={shownDirection(r)!} />}
        {isStaleReading(r) && <StaleMarker />}
        {r.window && <span>window {r.window}</span>}
        {r.measuredAt && <span>measured {shortDate(r.measuredAt)}</span>}
        {r.checkedAt && <span>last checked {shortDate(r.checkedAt)}</span>}
      </div>
      {isStaleReading(r) && <p className="text-xs text-amber-700">Last measured over {STALE_AFTER_MONTHS} months ago and not re-measured since, so no current direction is claimed.</p>}
      {r.provenance && <p className="text-xs break-words">{r.provenance.query && <>Cohort / query: {r.provenance.query}. </>}{r.provenance.generated && <>Retrieved {r.provenance.generated}</>}</p>}
      {r.sources && <SourceLinks sources={r.sources} />}
    </> : r.state === 'unwired' ? <>
      <p className="font-semibold text-black">Not yet wired</p>
      <p>Intended metric: {r.candidateMetric}</p><p>Blocked by: {r.blocker}</p>
      {r.owner && <p>Owner: {r.owner}</p>}
    </> : <p>Not applicable to this field: {r.reason}</p>}
  </div>
}

function RecordPlot({ series, scale, unit = '', dataOnly = false }: { series: SeriesPoint[]; scale?: 'linear' | 'log'; unit?: string; dataOnly?: boolean }) {
  return <>
    <p className="my-3 text-xs text-gray-500">{scale === 'log' ? 'Log scale' : 'Linear scale'}{unit && ` · ${unit === 'y' ? 'years' : unit}`}</p>
    {!dataOnly && <div className="gallery-plot"><Sparkline series={series} scale={scale} band={series.some(p => p.lo != null)} width={360} height={160} axis unit={unit} interactive /></div>}
    <div className="gallery-plot-axis mt-2 flex justify-between text-xs text-gray-500"><span>{series[0].x}</span><span>{series[series.length - 1].x}</span></div>
    {dataOnly && <details open className="mt-4 text-xs text-gray-600">
      <summary className="cursor-pointer py-2 font-medium text-blue">Chart data · {series.length} observations</summary>
      <table className="measurement-data w-full table-fixed text-left"><thead><tr><th scope="col">Date / horizon</th><th scope="col">Value{unit && ` (${unit})`}</th><th scope="col">Interval / status</th></tr></thead>
        <tbody>{series.map((p, i) => <tr key={i}><td>{p.x}</td><td>{p.y}</td><td>{p.lo != null && p.hi != null ? `${p.lo}–${p.hi}; ` : ''}{p.reliable === false ? 'Under-indexed (dashed)' : '—'}</td></tr>)}</tbody>
      </table>
    </details>}
  </>
}

function GalleryChart({ item, record, areaLabel, face }: { item: GalleryItem; record: InstrumentRecord; areaLabel: string; face: 'chart' | 'data' }) {
  const dataOnly = face === 'data'
  if (item.kind === 'reading') return <>
    <h3 className="text-xl font-semibold text-black">Historical reading</h3>
    <p className="my-3 text-xs text-gray-500">Single historical observation · not a time series</p>
    {dataOnly ? <RecordEvidence record={record} /> : <div className="space-y-3 text-sm text-gray-600">
      <p className="text-lg font-semibold leading-snug text-black">{record.value}</p>
      <p>{record.metric}</p>
      {record.measuredAt && <p className="text-xs">measured {shortDate(record.measuredAt)}</p>}
      <p>One historical observation does not establish the current level, rate, or acceleration.</p>
      {isStaleReading(record) && <StaleMarker />}
    </div>}
  </>
  if (item.kind === 'measurement') return <MeasurementChart measure={item.measure} face={face} />
  if (item.kind === 'market') return <>
    <CrowdForecast signal={item.market} />
    {!dataOnly && item.market.prob != null && <meter className="mt-4 h-5 w-full" min={0} max={1} value={item.market.prob} aria-label={item.market.question ?? undefined} />}
    <p className="mt-3 text-xs text-gray-500">Per-marker forecast, not a time series or a settled outcome. Market moves may partly reflect our own attention work.</p>
    {dataOnly && <p className="mt-3 text-sm text-gray-600">{item.market.prob != null ? `Probability: ${item.market.prob} (0–1 scale).` : `Readout: ${item.market.readout}.`} Question, venue and resolution date are retained above; the source link opens the original forecast.</p>}
  </>
  if (item.kind === 'example') return <>
    <p className="text-xs text-gray-500">OpenAlex paper vintage</p>
    <h3 className="mt-1 text-xl font-semibold text-black">{item.example.label}</h3>
    <RecordPlot series={item.example.series} scale={item.example.scale} unit="y" dataOnly={dataOnly} />
    <p className="mt-3 text-xs text-gray-500">Median reference age in years. Shading: 95% interval. Dashed tail: recent, under-indexed years.</p>
    {dataOnly && <>
      <p className="mt-3 text-sm text-gray-600">Compare the recent-segment slope, not the absolute age. See definition & methodology for sampling, frozen keyword cohorts and catalog-growth caveats. This is the paper-vintage reading for {areaLabel}.</p>
      <SourceLinks sources={[{ label: 'OpenAlex (CC0)', url: 'https://openalex.org' }, { label: 'Source method', url: 'https://github.com/protocol/plrd.org/blob/main/scripts/velocity/field_velocity_openalex.py' }]} />
    </>}
  </>
  if (item.kind === 'patent') {
    const pv = record.patentVintage!
    return <>
      <h3 className="text-xl font-semibold text-black">Patent vintage · invention side</h3>
      <RecordPlot series={pv.series!} unit="y" dataOnly={dataOnly} />
      <p className="mt-3 text-sm text-gray-600">{pv.value}</p>
      {pv.measuredAt && <p className="text-xs text-gray-500">measured {shortDate(pv.measuredAt)}</p>}
      {dataOnly && pv.sources && <SourceLinks sources={pv.sources} />}
    </>
  }
  const secondary = item.kind === 'secondary'
  return <>
    <h3 className="text-xl font-semibold text-black">{chartTitle(item, record, areaLabel)}</h3>
    <RecordPlot series={(secondary ? record.series2 : record.series)!} scale={secondary ? 'linear' : record.seriesScale} unit={record.instrument === 'idea_vintage' ? 'y' : ''} dataOnly={dataOnly} />
    {dataOnly ? <div className="mt-4"><RecordEvidence record={record} /></div> : <div className="mt-4 space-y-2 text-sm text-gray-600">
      {!secondary && <p>{record.value}</p>}
      {record.measuredAt && <p className="text-xs">measured {shortDate(record.measuredAt)}</p>}
      {isStaleReading(record) && <StaleMarker />}
      {shownDirection(record) && <DirectionChip direction={shownDirection(record)!} />}
      {record.series?.some(p => p.reliable === false) && <p className="text-xs">Shading: 95% interval. Dashed tail: recent, under-indexed years.</p>}
    </div>}
  </>
}

function GalleryFlipCard({ item, record, areaLabel, index }: { item: GalleryItem; record: InstrumentRecord; areaLabel: string; index: number }) {
  const [showData, setShowData] = useState(false)
  const faceId = useId()
  return <div data-gallery-item={item.id} data-is-chart={item.kind !== 'reading' && (item.kind !== 'market' || item.market.prob != null)} className="instrument-gallery-item">
    <div className="gallery-card-faces" id={faceId}>
      <div className="gallery-card-rotator" data-flipped={showData}>
        <div data-face="chart" aria-hidden={showData} inert={showData} className="gallery-card-face">
          <GalleryChart item={item} record={record} areaLabel={areaLabel} face="chart" />
        </div>
        <div data-face="data" aria-hidden={!showData} inert={!showData} className="gallery-card-face">
          <GalleryChart item={item} record={record} areaLabel={areaLabel} face="data" />
        </div>
      </div>
    </div>
    <div className="gallery-card-toolbar">
      <span className="text-xs text-gray-500" aria-hidden="true">{showData ? 'Evidence' : item.kind === 'reading' ? 'Reading' : 'Chart'} · {index + 1}</span>
      <button type="button" data-flip-action aria-controls={faceId} aria-pressed={showData} onClick={() => setShowData(value => !value)}>{showData ? item.kind === 'reading' ? 'Back to reading' : 'Back to chart' : 'Data & sources'}</button>
    </div>
  </div>
}

function VelocityModal({ area, record, markets, measurements, examples, itemId, onClose, onRestoreCover }: {
  area: FocusAreaKey
  record: InstrumentRecord
  markets: MarketSignal[]
  measurements: MeasurementSeries[]
  examples: IdeaVintageExample[]
  itemId: string
  onClose: () => void
  onRestoreCover: () => void
}) {
  const dialogRef = useGalleryDialog(onClose, () => {
    // A fresh URL has no clicked preview. Keep its fallback cover visibly closed
    // rather than immediately hiding the control we are returning focus to.
    onRestoreCover()
    return document.querySelector<HTMLElement>(`[data-instrument="${record.instrument}"]`)
  })
  const galleryRef = useGalleryFan()
  const titleId = useId()
  const [copyStatus, setCopyStatus] = useState('Copy link')
  const directUrl = new URL(chartHash(area, record.instrument, itemId), window.location.href).href
  const areaLabel = FOCUS_AREAS.find(f => f.key === area)!.label
  const inst = INSTRUMENT_BY_ID[record.instrument]
  const inventory = instrumentGallery(record, measurements, markets, examples, areaLabel)
  const items = inventory.items.filter(item => item.id === itemId)
  const chartCount = items.filter(item => item.kind !== 'reading' && (item.kind !== 'market' || item.market.prob != null)).length
  const columns = items.length <= 1 ? 1 : items.length === 2 || items.length === 4 ? 2 : 3
  const pv = record.instrument === 'idea_vintage' ? record.patentVintage : undefined
  return createPortal(
    <div className="instrument-gallery-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} data-columns={columns} className="instrument-gallery-dialog" tabIndex={-1}>
        <header className="instrument-gallery-header">
          <div><p className="text-xs text-gray-500">{areaLabel} · Field velocity · {chartCount} {chartCount === 1 ? 'chart' : 'charts'}</p>
            <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-black">{items[0] ? chartTitle(items[0], record, areaLabel) : inst.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{inst.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close gallery" className="gallery-close">×</button>
        </header>
        <div className="instrument-gallery-scroll">
          <div className="chart-share-controls">
            <a data-chart-direct href={directUrl} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault() }}>Direct link ↗</a>
            <button type="button" data-chart-copy onClick={async () => { try { await window.navigator.clipboard.writeText(directUrl); setCopyStatus('Copied') } catch { setCopyStatus('Copy failed — use Direct link') } }}>{copyStatus}</button>
            <span className="sr-only" role="status">{copyStatus === 'Copy link' ? '' : copyStatus}</span>
          </div>
          <div ref={galleryRef} data-columns={columns} className="instrument-gallery-grid">
            {items.map((item, index) => <GalleryFlipCard key={item.id} item={item} record={record} areaLabel={areaLabel} index={index} />)}
          </div>
          {!items.some(i => i.kind === 'primary' || i.kind === 'reading') && (record.state === 'reading' && chartCount > 0 ? <details className="mb-6 text-sm text-gray-600"><summary className="cursor-pointer py-2 text-blue">Reading context · {record.value}</summary><RecordEvidence record={record} /></details> : <div className="mb-6"><RecordEvidence record={record} /></div>)}
          {items.length === 0 && <p className="mb-5 text-sm text-gray-500">No chart is wired for this instrument. Evidence and status are shown without inventing a time series.</p>}
          {pv && !items.some(i => i.kind === 'patent') && <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-600">
            <h3 className="font-semibold text-black">Patent vintage · invention side</h3>
            {pv.state === 'unwired' ? <><p className="mt-2">Not yet wired. Intended metric: {pv.candidateMetric}</p><p>Blocked by: {pv.blocker}</p></> : pv.state === 'not_applicable' ? <p className="mt-2">Not applicable: {pv.reason}</p> : record.state === 'reading' ? <><p>{pv.value}</p>{pv.measuredAt && <p>measured {shortDate(pv.measuredAt)}</p>}{pv.sources && <SourceLinks sources={pv.sources} />}</> : <p>Not shown while this instrument is {record.state.replace('_', ' ')}.</p>}
          </div>}
        </div>
      </section>
    </div>, document.body,
  )
}

// ── Inflection cards (PR #29 design) ──────────────────────────────────────────

// Tone per derived label. Colors are chosen to stay legible on both the light
// card and the dark-mode surface.
function labelTone(label: string): { color: string; bg: string } {
  const color =
    label === 'reached — field moved'
      ? '#16a34a'
      : label === 'reached — no lift' || label === 'missed'
        ? '#dc2626'
        : label === 'missed — field moved another way'
          ? '#d0894b'
          : label === 'reached — lift unclear'
            ? '#6b7fb3'
            : '#6b7280' // pending, retired — superseded
  return { color, bg: `color-mix(in srgb, ${color} 14%, transparent)` }
}

function ResolutionChip({ point }: { point: InflectionPoint }) {
  const label = inflectionLabel(point)
  const tone = labelTone(label)
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: tone.color, backgroundColor: tone.bg }}
    >
      {label}
    </span>
  )
}

/** A single intervention-category tag. The label renders once; the description
 *  lives only in the hover tooltip (no visually-hidden duplicate). */
function CategoryTag({ role }: { role: PLRole }) {
  return (
    <span className="group/role relative inline-flex shrink-0">
      <span
        className="inline-flex cursor-help items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
        style={{
          color: HAND_COLOR,
          borderColor: 'color-mix(in srgb, var(--impact-hand) 34%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--impact-hand) 8%, transparent)',
        }}
      >
        {ROLE_META[role].label}
      </span>
      <span
        role="tooltip"
        className="hidden sm:block pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-60 rounded-lg bg-gray-900 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/role:opacity-100"
      >
        {ROLE_META[role].description}
      </span>
    </span>
  )
}

/** A few concrete example interventions, each tagged with its category. Falls
 *  back to bare category tags (from roles) when no examples are declared. */
function InterventionExamples({
  point,
  limit,
  tagsOnly,
}: {
  point: InflectionPoint
  limit?: number
  /** Preview mode: show only the intervention category pills inline, no
   *  named examples/links (those live in the detail modal). */
  tagsOnly?: boolean
}) {
  const items = point.interventions ?? []
  if (tagsOnly || !items.length) {
    const roles = items.length
      ? PL_ROLE_ORDER.filter((r) => items.some((it) => it.role === r))
      : point.roles
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {roles.map((r) => (
          <CategoryTag key={r} role={r} />
        ))}
      </div>
    )
  }
  const shown = limit ? items.slice(0, limit) : items
  // Group by category so multiple examples of one role sit behind a single pill,
  // comma-separated, rather than repeating the pill per example.
  const roles = PL_ROLE_ORDER.filter((r) => shown.some((it) => it.role === r))
  return (
    <ul className="flex flex-col gap-2">
      {roles.map((r) => {
        const group = shown.filter((it) => it.role === r)
        return (
          <li key={r} className="flex items-start gap-2">
            <CategoryTag role={r} />
            <span className="text-[13px] leading-snug text-gray-600">
              {group.map((it, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <InterventionLabel item={it} />
                </span>
              ))}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function InterventionLabel({ item }: { item: Intervention }) {
  if (!item.href) {
    return <span className="text-[13px] leading-snug text-gray-600">{item.label}</span>
  }
  const external = /^https?:\/\//.test(item.href)
  return (
    <a
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={(e) => e.stopPropagation()}
      className="text-[13px] leading-snug text-gray-700 underline decoration-dotted underline-offset-2 hover:text-black"
    >
      {item.label}
    </a>
  )
}

function InflectionCard({
  point,
  metrics,
  signal,
  onOpen,
}: {
  point: InflectionPoint
  metrics?: LiveMetric[]
  signal?: MarketSignal
  onOpen: () => void
}) {
  const fa = FOCUS_AREAS.find((f) => f.key === point.area)!
  const hasLiveSignal = !!(
    point.liveEvidence?.length ||
    (metrics && metrics.length) ||
    (signal && isRenderableMarket(signal))
  )

  return (
    <button
      type="button"
      id={inflectionSlug(point)}
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group relative flex scroll-mt-24 flex-col rounded-xl border border-gray-200 bg-white p-4 sm:p-5 text-left transition-all hover:border-gray-300 hover:shadow-md"
    >
      <span className="absolute right-4 top-4 inline-flex items-center gap-0.5 text-xs font-medium text-gray-300 transition-colors group-hover:text-blue">
        Detail
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </span>

      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        <span className="flex h-4 w-4 items-center justify-center text-gray-400">
          <AreaIcon type={FA_ICON[fa.key]} className="block h-3.5 w-3.5" />
        </span>
        {fa.label}
      </div>

      <div className="mb-1 text-xs uppercase tracking-wide text-gray-400">{point.opportunitySpace}</div>
      <h3 className="mb-2 text-lg font-medium leading-snug text-black">{point.title}</h3>
      <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{point.signal}</p>

      {/* Resolution: pending until a marker resolves. */}
      <div className="mb-3">
        <ResolutionChip point={point} />
      </div>

      <div className="mt-auto border-t border-gray-100 pt-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: HAND_COLOR }}>
            Our hand
          </span>
          <span className="text-[11px] text-gray-400">· PL R&D interventions</span>
        </div>
        <InterventionExamples point={point} tagsOnly />
      </div>

      {hasLiveSignal && (
        <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ backgroundColor: `${LIVE_COLOR}99` }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: LIVE_COLOR }} />
          </span>
          Live signal
        </div>
      )}
    </button>
  )
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${Math.round(n)}`
}

function CrowdForecast({ signal, divider = false }: { signal: MarketSignal; divider?: boolean }) {
  const pct = signal.prob != null ? Math.round(signal.prob * 100) : null
  return (
    <div className={divider ? 'mt-3 border-t border-gray-100 pt-3' : ''}>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Crowd forecast</span>
        {signal.platform && (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {PLATFORM_LABEL[signal.platform]}
            {signal.viaFallback ? ' (fallback)' : ''}
          </span>
        )}
        {signal.volume != null && (
          <span className="text-[11px] tabular-nums text-gray-400" title="Total money traded through this market">
            {formatUSD(signal.volume)} at stake
          </span>
        )}
        {signal.resolutionDate && (
          <span className="text-[11px] tabular-nums text-gray-400" title="When the market resolves">
            resolves {shortDate(signal.resolutionDate)}
          </span>
        )}
        <span className="ml-auto text-2xl font-semibold tabular-nums" style={{ color: FIELD_COLOR }}>
          {signal.readout ?? (pct != null ? `${pct}%` : '—')}
        </span>
      </div>
      {signal.url && (
        <a href={signal.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-700 hover:underline">
          {signal.question}
        </a>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
        {signal.note} An independent read on whether the field is moving, not a settled outcome.
      </p>
    </div>
  )
}

function useModalChrome(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
}

function InflectionModal({
  point,
  metrics,
  signal,
  onClose,
}: {
  point: InflectionPoint
  metrics?: LiveMetric[]
  signal?: MarketSignal
  onClose: () => void
}) {
  const fa = FOCUS_AREAS.find((f) => f.key === point.area)!
  useModalChrome(onClose)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={point.title}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6 lg:p-10"
      onClick={onClose}
    >
      <div className="relative my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
            <span className="flex h-5 w-5 items-center justify-center text-gray-400">
              <AreaIcon type={FA_ICON[fa.key]} className="block h-4 w-4" />
            </span>
            {fa.label}
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">{point.opportunitySpace}</span>
          </div>

          <div className="rounded-xl bg-gray-50 p-5 sm:p-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: FIELD_COLOR }}>
              The field
            </div>
            <h2 className="mb-4 text-2xl font-semibold leading-tight tracking-tight text-black">{point.title}</h2>
            <div className="mb-6 space-y-5">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Definition</div>
                <p className="text-sm leading-relaxed text-gray-600">{point.signal}</p>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Impact</div>
                <p className="text-sm leading-relaxed text-gray-600">{point.cascade}</p>
              </div>
            </div>
            {/* Resolution: pending until a marker resolves. */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <ResolutionChip point={point} />
                <span className="text-[11px] text-gray-400">not yet resolved</span>
              </div>
              {resolutionFor(point).matteredEvidence && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  <span className="font-medium text-black">Why it mattered:</span>{' '}
                  {resolutionFor(point).matteredEvidence}
                </p>
              )}
              {resolutionFor(point).retiredReason && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  <span className="font-medium text-black">Retired because:</span>{' '}
                  {resolutionFor(point).retiredReason}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-5 sm:p-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: HAND_COLOR }}>
              Our hand
            </div>
            <div className="mb-4 text-sm font-semibold text-black">PL R&D interventions</div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Examples</div>
            <InterventionExamples point={point} />
            <div className="mt-5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">In practice</div>
              <p className="text-sm leading-relaxed text-gray-600"><Linkify text={point.contribution.activities} /></p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500"><Linkify text={point.contribution.outputs} /></p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ backgroundColor: `${LIVE_COLOR}99` }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: LIVE_COLOR }} />
              </span>
              Live signal
            </div>
            {(point.liveEvidence?.length || (metrics && metrics.length) || (signal && isRenderableMarket(signal))) && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                {point.liveEvidence?.map((ev, i) => {
                  const external = /^https?:\/\//.test(ev.href)
                  return (
                    <a
                      key={ev.href}
                      href={ev.href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={`-m-1 block rounded-lg p-1 no-underline transition-colors hover:bg-gray-50 ${i > 0 ? 'mt-3 border-t border-gray-100 pt-3' : ''}`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-black">
                        {ev.label}
                        <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {i === 0 && metrics && metrics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                          {metrics.map((m) => (
                            <span key={m.label} className="flex items-baseline gap-1.5">
                              <span className="text-lg font-semibold text-black">{m.value}</span>
                              <span className="text-xs text-gray-500">{m.label}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">{ev.note}</p>
                    </a>
                  )
                })}

                {!point.liveEvidence?.length && metrics && metrics.length > 0 && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {metrics.map((m) => (
                      <span key={m.label} className="flex items-baseline gap-1.5">
                        <span className="text-lg font-semibold text-black">{m.value}</span>
                        <span className="text-xs text-gray-500">{m.label}</span>
                      </span>
                    ))}
                  </div>
                )}

                {signal && isRenderableMarket(signal) && (
                  <CrowdForecast signal={signal} divider={!!point.liveEvidence?.length} />
                )}
              </div>
            )}

            {signal && signal.match === 'gap' && (
              <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Crowd forecast</div>
                <p className="text-sm leading-relaxed text-gray-500">{signal.note}</p>
              </div>
            )}

            <a
              href={`/insights/?area=${point.area}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline"
            >
              See the latest {fa.label} insights
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ filter }: { filter: FocusAreaKey }) {
  const fa = FOCUS_AREAS.find((f) => f.key === filter)
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <p className="text-base font-medium text-black">
        {fa?.label ?? 'This focus area'} is forthcoming.
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        Its inflection points will appear here as the focus area comes online.
      </p>
    </div>
  )
}

// ── Team-name linkify (reuses the shared TEAM_LINKS map, read-only) ───────────
const TEAM_LINK_PATTERN = new RegExp(
  '(' +
    Object.keys(TEAM_LINKS)
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')',
  'g',
)

function Linkify({ text }: { text: string }) {
  const parts = text.split(TEAM_LINK_PATTERN)
  return (
    <>
      {parts.map((part, i) =>
        TEAM_LINKS[part] ? (
          <a
            key={i}
            href={TEAM_LINKS[part]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-black"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
