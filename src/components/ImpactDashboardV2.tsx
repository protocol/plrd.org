'use client'

// Impact Dashboard — field velocity. Horizontal, sticky focus-area tabs sit
// above a wide "field velocity" box (the five velocity instruments, each with a
// direction indicator, opening a modal) and the inflection points we track,
// laid out as four cards in two rows with their live signals. The inflection
// cards mirror the PR #29 design; shared primitives are imported, never forked.

import { useEffect, useMemo, useState } from 'react'
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
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import { Sparkline, GhostChart, type SeriesPoint } from '@/components/VelocitySparkline'
import { IdeaVintageExamples, type IdeaVintageExample } from '@/components/velocity-explainers'
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
  /** Idea-vintage small multiples, so the field-velocity instrument modal shows
   *  the same rich card as the methodology section. */
  ideaVintageExamples?: IdeaVintageExample[]
}) {
  const [selectedArea, setFilter] = useState<FocusAreaKey>(initialArea)
  const filter = fixedArea ?? selectedArea
  const [active, setActive] = useState<InflectionPoint | null>(null)
  const [velocityOpen, setVelocityOpen] = useState(false)
  const [defInstrument, setDefInstrument] = useState<InstrumentId | null>(null)

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

  return (
    <>
      <div className={fixedArea ? '' : 'lg:grid lg:grid-cols-[248px_1fr] lg:gap-10'}>
        {/* Vertical tabs (PR #29 layout), sticky so they stay visible while
            scrolling the field. */}
        {!fixedArea && <div className="-mx-1 mb-6 flex flex-col gap-1.5 px-1 pb-2 lg:mx-0 lg:mb-0 lg:self-start lg:px-0 lg:pb-0 lg:sticky lg:top-20">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Filter by focus area"
            className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible"
          >
            {FOCUS_AREAS.map((fa) => (
              <Tab
                key={fa.key}
                label={fa.label}
                count={INFLECTION_POINTS.filter((p) => p.area === fa.key).length}
                forthcoming={fa.forthcoming}
                icon={FA_ICON[fa.key]}
                active={filter === fa.key}
                onClick={() => setFilter(fa.key)}
              />
            ))}
          </div>
        </div>}
        {/* Content: field velocity box + inflection points */}
        <div>
          {/* Field velocity — label outside the box; the box previews the five
              instruments and opens a modal. */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: FIELD_COLOR }}>
              Field velocity
            </span>
            <span className="text-[11px] text-gray-400">· Is the field speeding up?</span>
          </div>
          <FieldVelocityBox records={records} markets={fieldMarkets} onOpen={() => setVelocityOpen(true)} />

          {/* Inflection points — four cards in two rows, with live signals. */}
          <div className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Inflection points we&rsquo;re tracking
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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
      {velocityOpen && (
        <VelocityModal
          area={filter}
          records={records}
          markets={fieldMarkets}
          onClose={() => setVelocityOpen(false)}
          onOpenDef={setDefInstrument}
        />
      )}
      {defInstrument && (
        <InstrumentDefinitionModal
          id={defInstrument}
          ideaVintageExamples={ideaVintageExamples}
          onClose={() => setDefInstrument(null)}
        />
      )}
    </>
  )
}

// ── Focus-area tab (vertical, PR #29 layout) ─────────────────────────────────
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
      className={`flex shrink-0 items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm font-medium transition-all lg:w-full ${
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
      <span className="flex-1 whitespace-nowrap lg:whitespace-normal">{label}</span>
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

function InstrumentCell({ record, markets }: { record: InstrumentRecord; markets?: MarketSignal[] }) {
  const inst = INSTRUMENT_BY_ID[record.instrument]
  // When the markets instrument carries an aggregated term structure (a reading
  // with a series — the same milestone priced across horizons), show that curve
  // and its implied date via the normal reading path below. Otherwise fall back
  // to counting the field's live mapped bets, which reads better than a single
  // point-in-time probability.
  const isMarketsTermStructure =
    record.instrument === 'markets' && record.state === 'reading' && !!record.series && record.series.length > 1
  if (record.instrument === 'markets' && markets && markets.length && !isMarketsTermStructure) {
    const totalVolume = markets.reduce((sum, s) => sum + (s.volume ?? 0), 0)
    return (
      <div className="flex flex-col gap-1.5 border-l-2 border-gray-100 pl-3">
        <span className="text-sm font-medium leading-snug text-black">{inst.label}</span>
        <span className="text-sm font-semibold leading-snug text-black">
          {markets.length} bet{markets.length === 1 ? '' : 's'} tracked
        </span>
        {totalVolume > 0 && (
          <span className="text-[11px] text-gray-400">{formatUSD(totalVolume)} at stake</span>
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5 border-l-2 border-gray-100 pl-3">
      <span className="text-sm font-medium leading-snug text-black">{inst.label}</span>
      {record.state === 'reading' && (
        <>
          {record.series && record.series.length > 1 && (
            <Sparkline
              series={record.series as SeriesPoint[]}
              scale={record.seriesScale}
              band={record.series.some((p) => (p as SeriesPoint).lo != null)}
              axis
              unit={record.instrument === 'idea_vintage' ? 'y' : ''}
              interactive
            />
          )}
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-black">{record.value}</span>
          {record.trend && (
            <span className="line-clamp-2 text-[11px] leading-snug text-gray-400">{record.trend}</span>
          )}
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400">
            {shownDirection(record) && <DirectionChip direction={shownDirection(record)!} />}
            {isStaleReading(record) && <StaleMarker />}
            {record.measuredAt && <span className="tabular-nums">measured {shortDate(record.measuredAt)}</span>}
            {record.instrument === 'markets' && markets && markets.length > 0 && (
              <span>+ {markets.length} bet{markets.length === 1 ? '' : 's'} tracked</span>
            )}
          </span>
        </>
      )}
      {record.state === 'unwired' && (
        <>
          <GhostChart />
          <span className="text-[11px] font-medium text-gray-400">not yet wired</span>
        </>
      )}
      {record.state === 'not_applicable' && (
        <span className="text-[11px] italic text-gray-400">not applicable to this field</span>
      )}
    </div>
  )
}

function FieldVelocityBox({
  records,
  markets,
  onOpen,
}: {
  records: InstrumentRecord[]
  markets?: MarketSignal[]
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group relative flex w-full flex-col rounded-xl border border-gray-200 bg-white p-6 pt-10 text-left transition-all hover:border-gray-300 hover:shadow-md"
    >
      <span className="absolute right-4 top-4 inline-flex items-center gap-0.5 text-xs font-medium text-gray-300 transition-colors group-hover:text-blue">
        Detail
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </span>

      {/* Ragged by design — a field lists only the instruments that apply. */}
      <div className="grid grid-cols-2 items-start gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
        {records.map((r) => (
          <InstrumentCell key={r.instrument} record={r} markets={r.instrument === 'markets' ? markets : undefined} />
        ))}
      </div>
    </button>
  )
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

/** Idea vintage's second chart: the patent-side (invention) twin. Reading shows a
 *  sparkline; unwired shows a ghost + blocker; not_applicable shows the reason. */
function PatentVintagePanel({ pv }: { pv: NonNullable<InstrumentRecord['patentVintage']> }) {
  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Patent vintage <span className="font-normal text-gray-400">· invention side</span>
      </div>
      {pv.state === 'reading' && (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          {pv.series && pv.series.length > 1 && (
            <Sparkline series={pv.series as SeriesPoint[]} width={200} height={56} axis unit="y" interactive />
          )}
          <div className="min-w-[10rem] flex-1">
            {pv.value && <div className="text-lg font-semibold leading-tight text-black">{pv.value}</div>}
            {pv.measuredAt && (
              <div className="mt-1 text-[11px] tabular-nums text-gray-400">measured {shortDate(pv.measuredAt)}</div>
            )}
            {pv.sources && <SourceLinks sources={pv.sources} />}
          </div>
        </div>
      )}
      {pv.state === 'unwired' && (
        <div className="flex items-start gap-4">
          <div className="shrink-0 pt-1">
            <GhostChart width={140} height={44} />
          </div>
          <div className="text-sm leading-relaxed text-gray-500">
            <p><span className="font-medium text-gray-700">Intended metric:</span> {pv.candidateMetric}</p>
            <p className="mt-1"><span className="font-medium text-gray-700">Blocked by:</span> {pv.blocker}</p>
          </div>
        </div>
      )}
      {pv.state === 'not_applicable' && (
        <p className="text-sm italic leading-relaxed text-gray-400">{pv.reason}</p>
      )}
    </div>
  )
}

function MarketsPanel({ markets, hasTermStructure = false }: { markets: MarketSignal[]; hasTermStructure?: boolean }) {
  return (
    <div>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        {markets.map((s, i) => (
          <CrowdForecast key={i} signal={s} divider={i > 0} />
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
        Per-marker forecasts mapped to this field.{' '}
        {hasTermStructure
          ? 'The term structure across horizons is shown above.'
          : 'A term structure across horizons is not yet aggregated.'}{' '}
        Read with care: market moves partly reflect our own attention work.
      </p>
    </div>
  )
}

function VelocityModal({
  area,
  records,
  markets,
  onClose,
  onOpenDef,
}: {
  area: FocusAreaKey
  records: InstrumentRecord[]
  markets?: MarketSignal[]
  onClose: () => void
  onOpenDef: (id: InstrumentId) => void
}) {
  useModalChrome(onClose)
  const fa = FOCUS_AREAS.find((f) => f.key === area)!
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Field velocity"
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
          </div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: FIELD_COLOR }}>
            Field velocity
          </div>
          <h2 className="mb-2 text-2xl font-semibold leading-tight tracking-tight text-black">
            The rate the field is moving
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            The five instruments we read velocity with. Where a reading is live, it carries a date and a
            source. Where it is not, we name the metric we intend to use and what is blocking it. Where an
            instrument does not fit this field, we say so.
          </p>

          <div className="space-y-5">
            {records.map((r) => {
              const inst = INSTRUMENT_BY_ID[r.instrument]
              const liveMarkets = r.instrument === 'markets' && markets ? markets : []
              const isLiveMarkets = liveMarkets.length > 0
              // The markets instrument can now carry BOTH an aggregated term
              // structure (a reading with a series) and the per-point live bets.
              const isTermStructure = r.instrument === 'markets' && r.state === 'reading' && !!r.series && r.series.length > 1
              return (
                <div key={r.instrument} className="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDef(r.instrument)}
                      className="group inline-flex items-center gap-1 text-base font-semibold tracking-tight text-black hover:text-blue"
                    >
                      {inst.label}
                      <svg className="h-3.5 w-3.5 text-gray-300 transition-colors group-hover:text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {isLiveMarkets && (
                      <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ backgroundColor: `${LIVE_COLOR}99` }} />
                          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: LIVE_COLOR }} />
                        </span>
                        {liveMarkets.length} live market{liveMarkets.length === 1 ? '' : 's'}
                      </span>
                    )}
                    {!isLiveMarkets && r.state === 'reading' && (shownDirection(r) || isStaleReading(r)) && (
                      <span className="ml-auto inline-flex items-center gap-2">
                        {isStaleReading(r) && <StaleMarker size="lg" />}
                        {shownDirection(r) && <DirectionChip direction={shownDirection(r)!} size="lg" />}
                      </span>
                    )}
                    {!isLiveMarkets && r.state === 'unwired' && (
                      <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-gray-400">not yet wired</span>
                    )}
                    {!isLiveMarkets && r.state === 'not_applicable' && (
                      <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-gray-400">not applicable to this field</span>
                    )}
                  </div>

                  {(isTermStructure || !isLiveMarkets) && r.state === 'reading' && (
                    <div>
                      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                        {r.series && r.series.length > 1 && (
                          <div className="shrink-0">
                            <Sparkline
                              series={r.series as SeriesPoint[]}
                              scale={r.seriesScale}
                              band={r.series.some((p) => (p as SeriesPoint).lo != null)}
                              width={200}
                              height={56}
                              axis
                              unit={r.instrument === 'idea_vintage' ? 'y' : ''}
                              interactive
                            />
                          </div>
                        )}
                        {r.series2 && r.series2.length > 1 && (
                          <div className="shrink-0">
                            <Sparkline series={r.series2 as SeriesPoint[]} width={140} height={44} interactive />
                            <div className="mt-1 text-[10px] text-gray-400">{r.series2Label ?? 'normalizer'}</div>
                          </div>
                        )}
                        <div className="min-w-[10rem] flex-1">
                          <div className="text-lg font-semibold leading-tight text-black">{r.value}</div>
                          {r.metric && <div className="mt-0.5 text-xs text-gray-500">{r.metric}</div>}
                          {r.trend && <div className="mt-1 text-xs text-gray-500">{r.trend}</div>}
                          <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-gray-400">
                            {r.window && <span>window {r.window}</span>}
                            {r.measuredAt && (
                              <span className="tabular-nums">measured {shortDate(r.measuredAt)}</span>
                            )}
                            {r.checkedAt && r.checkedAt !== r.measuredAt && (
                              <span className="tabular-nums">last checked {shortDate(r.checkedAt)}</span>
                            )}
                          </div>
                          {isStaleReading(r) && (
                            <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                              Last measured over {STALE_AFTER_MONTHS} months ago and not re-measured since,
                              so no current direction is claimed.
                            </p>
                          )}
                        </div>
                      </div>
                      {r.provenance && (r.provenance.query || r.provenance.generated) && (
                        <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                          {r.provenance.query && (
                            <>
                              Keyword cohort (title + abstract): <span className="font-mono">{r.provenance.query}</span>
                              {r.provenance.generated ? ' · ' : ''}
                            </>
                          )}
                          {r.provenance.generated && <>retrieved {shortDate(r.provenance.generated)}</>}
                        </p>
                      )}
                      {r.sources && <SourceLinks sources={r.sources} />}
                      {r.instrument === 'idea_vintage' && r.patentVintage && (
                        <PatentVintagePanel pv={r.patentVintage} />
                      )}
                    </div>
                  )}

                  {isLiveMarkets && (
                    <div className={isTermStructure ? 'mt-4' : undefined}>
                      <MarketsPanel markets={liveMarkets} hasTermStructure={isTermStructure} />
                    </div>
                  )}

                  {!isLiveMarkets && r.state === 'unwired' && (
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 pt-1">
                        <GhostChart width={140} height={44} />
                      </div>
                      <div className="text-sm leading-relaxed text-gray-500">
                        <p><span className="font-medium text-gray-700">Intended metric:</span> {r.candidateMetric}</p>
                        <p className="mt-1"><span className="font-medium text-gray-700">Blocked by:</span> {r.blocker}</p>
                      </div>
                    </div>
                  )}

                  {!isLiveMarkets && r.state === 'not_applicable' && (
                    <p className="text-sm italic leading-relaxed text-gray-400">{r.reason}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function InstrumentDefinitionModal({
  id,
  ideaVintageExamples = [],
  onClose,
}: {
  id: InstrumentId
  ideaVintageExamples?: IdeaVintageExample[]
  onClose: () => void
}) {
  useModalChrome(onClose)
  const inst = INSTRUMENT_BY_ID[id]
  const researchSide = id === 'idea_vintage' || id === 'revealed_commitments'
  const isIdeaVintage = id === 'idea_vintage'
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={inst.label}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6 lg:p-10"
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
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: FIELD_COLOR }}>
            Field velocity
          </div>
          <h2 className="mb-1 text-2xl font-semibold leading-tight tracking-tight text-black">{inst.label}</h2>
          <div className="mb-5 text-sm text-gray-500">{inst.subtitle}</div>
          <p className="text-sm leading-relaxed text-gray-700">{inst.description}</p>
          {researchSide && (
            <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm italic leading-relaxed text-gray-500">
              This reads the research side of the field. It does not observe invention directly, and the
              two can decouple.
            </p>
          )}
          {isIdeaVintage && <IdeaVintageExamples examples={ideaVintageExamples} />}
        </div>
      </div>
    </div>
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
      className="group relative flex scroll-mt-24 flex-col rounded-xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-gray-300 hover:shadow-md"
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
      <div className="mb-5">
        <ResolutionChip point={point} />
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4">
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
      <div className="mb-1 flex items-center gap-2">
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
