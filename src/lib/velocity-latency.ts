// ── Latency-compression ingestion (build-time, server only) ───────────────────
//
// Reads a curated, human-reviewable corpus of (from -> to) dated transitions from
// src/data/velocity/corpora/ and turns it into a latency_compression reading,
// merged into a field's instrument records (see withLatency). Parsing happens
// here at build time, never in the browser. No corpus -> the instrument stays the
// documented `unwired` record.
//
// Each field measures a different pipeline, so each corpus names its own date
// keys and reading copy in `meta`; this loader is generic. Real data only: every
// entry carries source URLs for both ends of the transition. We never synthesise.

import fs from 'node:fs'
import path from 'node:path'
import type { FocusAreaKey } from '@/lib/inflection-points'
import type { Direction, InstrumentRecord } from '@/lib/velocity-instruments'

const CORPORA_DIR = path.join(process.cwd(), 'src', 'data', 'velocity', 'corpora')

// Which corpus file feeds which field's latency instrument.
const LATENCY_CORPUS: Partial<Record<FocusAreaKey, string>> = {
  'digital-human-rights': 'dhr-latency-crypto.json',
  neurotech: 'neuro-latency-modalities.json',
}

type CorpusMeta = {
  /** Entry keys holding the two ISO dates whose gap is the lag. */
  fromKey: string
  toKey: string
  /** Reading copy (kept in the corpus so this loader stays field-agnostic). */
  metric: string
  valueNoun: string // e.g. "standard to first open implementation"
  unitNoun: string // e.g. "primitives" | "modalities"
  trendVerb: string // e.g. "ships standards faster" | "reaches humans faster"
  provenanceQuery: string
  sources: { label: string; url: string }[]
  splitYear?: number
  generated?: string
  readingCaveat?: string
  /** A reviewed evidence hold overrides even otherwise parseable dates. */
  approvedForPlot?: boolean
}
type Corpus = { meta: CorpusMeta; entries: Record<string, unknown>[] }

const DAY = 24 * 60 * 60 * 1000

function yearsBetween(a: string, b: string): number | null {
  const t0 = new Date(a).getTime()
  const t1 = new Date(b).getTime()
  if (Number.isNaN(t0) || Number.isNaN(t1)) return null
  return (t1 - t0) / DAY / 365.25
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const n = s.length
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

export type LatencyPayload = {
  series: { x: number; y: number }[]
  overallMedianYears: number
  earlyMedianYears: number
  recentMedianYears: number
  splitYear: number
  n: number
  window: string
  lastToDate: string
  direction: Direction
  meta: CorpusMeta
}

function toPayload(corpus: Corpus): LatencyPayload | null {
  const { meta } = corpus
  if (meta.approvedForPlot === false) return null
  const rows = corpus.entries
    .map((e) => {
      const from = e[meta.fromKey]
      const to = e[meta.toKey]
      if (typeof from !== 'string' || typeof to !== 'string') return null
      const lag = yearsBetween(from, to)
      const year = new Date(from).getUTCFullYear()
      return lag != null && Number.isFinite(year) ? { year, lag, to } : null
    })
    .filter((x): x is { year: number; lag: number; to: string } => x != null)
  if (rows.length < 3) return null

  // Per-from-year median lag → a clean, monotone-x series for the sparkline.
  const byYear = new Map<number, number[]>()
  for (const r of rows) byYear.set(r.year, [...(byYear.get(r.year) ?? []), r.lag])
  const series = [...byYear.entries()]
    .map(([x, lags]) => ({ x, y: Number(median(lags).toFixed(2)) }))
    .sort((a, b) => a.x - b.x)

  // Direction from an early vs recent cohort split (falling lag = accelerating).
  // This is descriptive of the selected cohort, not a field-wide causal estimate.
  const splitYear = meta.splitYear ?? 2017
  const early = rows.filter((r) => r.year <= splitYear).map((r) => r.lag)
  const recent = rows.filter((r) => r.year > splitYear).map((r) => r.lag)
  const earlyMed = early.length ? median(early) : NaN
  const recentMed = recent.length ? median(recent) : NaN
  const BAND = 0.5 // years
  let direction: Direction = 'unclear'
  if (early.length >= 2 && recent.length >= 2 && Number.isFinite(earlyMed) && Number.isFinite(recentMed)) {
    const delta = recentMed - earlyMed
    direction = Math.abs(delta) <= BAND ? 'flat' : delta < 0 ? 'accelerating' : 'decelerating'
  }

  const years = rows.map((r) => r.year)
  const lastToDate = rows.map((r) => r.to).sort().at(-1) as string
  return {
    series,
    overallMedianYears: Number(median(rows.map((r) => r.lag)).toFixed(2)),
    earlyMedianYears: Number((Number.isFinite(earlyMed) ? earlyMed : 0).toFixed(2)),
    recentMedianYears: Number((Number.isFinite(recentMed) ? recentMed : 0).toFixed(2)),
    splitYear,
    n: rows.length,
    window: `${Math.min(...years)} \u2192 ${new Date(lastToDate).getUTCFullYear()}`,
    lastToDate,
    direction,
    meta,
  }
}

function loadCorpus(file: string): LatencyPayload | null {
  try {
    const text = fs.readFileSync(path.join(CORPORA_DIR, file), 'utf8')
    return toPayload(JSON.parse(text) as Corpus)
  } catch {
    return null
  }
}

export function loadAllLatency(): Partial<Record<FocusAreaKey, LatencyPayload>> {
  const out: Partial<Record<FocusAreaKey, LatencyPayload>> = {}
  for (const [area, file] of Object.entries(LATENCY_CORPUS)) {
    const payload = loadCorpus(file)
    if (payload) out[area as FocusAreaKey] = payload
  }
  return out
}

/** Merge a latency payload into a field's records, converting the
 *  latency_compression record to a reading. Absent payload is a no-op. */
export function withLatency(records: InstrumentRecord[], data?: LatencyPayload | null): InstrumentRecord[] {
  if (!data) return records
  const m = data.meta
  return records.map((r) => {
    if (r.instrument !== 'latency_compression') return r
    return {
      instrument: 'latency_compression',
      state: 'reading',
      metric: m.metric,
      value: `Median ~${data.overallMedianYears.toFixed(1)} years, ${m.valueNoun} (${data.n} ${m.unitNoun})`,
      trend: `Early cohort (\u2264${data.splitYear}) ~${data.earlyMedianYears.toFixed(1)}y; recent (>${data.splitYear}) ~${data.recentMedianYears.toFixed(1)}y. A falling lag ${m.trendVerb}.${m.readingCaveat ? ` ${m.readingCaveat}` : ''}`,
      direction: data.direction,
      window: data.window,
      measuredAt: data.lastToDate,
      checkedAt: m.generated,
      series: data.series,
      seriesScale: 'linear',
      provenance: { query: m.provenanceQuery, generated: m.generated },
      sources: m.sources,
    }
  })
}
