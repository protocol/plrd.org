// ── Market term-structure ingestion (build-time, server only) ─────────────────
//
// Reads the committed Full Takeoff Model snapshot (src/data/velocity/ftm-takeoff.json,
// written by scripts/velocity/ftm_takeoff_snapshot.mjs from Bayes Market's
// public /v1/net API) and turns the AGI-by-year family into the AI & Robotics
// `markets` reading: a term structure — the same milestone (AGI arrives) priced
// across many horizons — read as an implied arrival date, which is exactly the
// aggregation the markets instrument describes.
//
// Play-money, model-derived priors: an external forecast instrument, not a
// settled outcome or a deep real-money market. Parsing happens here at build
// time, never in the browser. No snapshot -> null -> the record stays `unwired`.

import fs from 'node:fs'
import path from 'node:path'
import type { FocusAreaKey } from '@/lib/inflection-points'
import type { InstrumentRecord } from '@/lib/velocity-instruments'

const SNAPSHOT = path.join(process.cwd(), 'src', 'data', 'velocity', 'ftm-takeoff.json')

// Which snapshot family is the headline term structure, and which is the muted
// secondary line, for a field's markets instrument.
const PRIMARY_KEY = 'ftm_agi'
const SECONDARY_KEY = 'ftm_full_auto'

type SnapshotPoint = { year: number; prob: number }
type SnapshotSeries = { key: string; label: string; points: SnapshotPoint[] }
type Snapshot = {
  _provenance?: { source?: string; api?: string; generatedAt?: string }
  series?: SnapshotSeries[]
}

export type MarketCurvePayload = {
  /** Term-structure CDF, y in percent, for the sparkline. */
  series: { x: number; y: number }[]
  /** Optional muted secondary CDF (e.g. full economic automation). */
  series2?: { x: number; y: number }[]
  series2Label?: string
  /** Interpolated year the primary milestone crosses 50%, or null if it never does. */
  impliedFiftyYear: number | null
  firstYear: number
  lastYear: number
  firstProb: number
  lastProb: number
  nHorizons: number
  generatedAt: string
  source: string
}

/** Linear-interpolate the year at which a rising CDF first crosses 0.5. */
function crossingYear(points: SnapshotPoint[]): number | null {
  const sorted = [...points].sort((a, b) => a.year - b.year)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].prob >= 0.5) {
      if (i === 0) return sorted[0].year
      const lo = sorted[i - 1]
      const hi = sorted[i]
      const span = hi.prob - lo.prob
      if (span <= 0) return hi.year
      return Math.round(lo.year + ((0.5 - lo.prob) / span) * (hi.year - lo.year))
    }
  }
  return null // never reaches a coin flip within the horizon
}

function toCdf(points: SnapshotPoint[]): { x: number; y: number }[] {
  return [...points]
    .sort((a, b) => a.year - b.year)
    .map((p) => ({ x: p.year, y: Number((p.prob * 100).toFixed(1)) }))
}

export function loadMarketCurve(): Partial<Record<FocusAreaKey, MarketCurvePayload>> {
  let snap: Snapshot
  try {
    snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as Snapshot
  } catch {
    return {}
  }
  const series = snap.series ?? []
  const primary = series.find((s) => s.key === PRIMARY_KEY)
  if (!primary || primary.points.length < 3) return {}
  const secondary = series.find((s) => s.key === SECONDARY_KEY)

  const pts = [...primary.points].sort((a, b) => a.year - b.year)
  const payload: MarketCurvePayload = {
    series: toCdf(pts),
    series2: secondary && secondary.points.length > 1 ? toCdf(secondary.points) : undefined,
    series2Label: secondary && secondary.points.length > 1 ? secondary.label : undefined,
    impliedFiftyYear: crossingYear(pts),
    firstYear: pts[0].year,
    lastYear: pts[pts.length - 1].year,
    firstProb: pts[0].prob,
    lastProb: pts[pts.length - 1].prob,
    nHorizons: pts.length,
    generatedAt: snap._provenance?.generatedAt ?? new Date().toISOString(),
    source: snap._provenance?.source ?? 'Bayes Market (futarchy.ai)',
  }
  // Only AI & Robotics carries this today; other fields have no FTM term structure.
  return { 'ai-robotics': payload }
}

/** Merge a term-structure payload into a field's `markets` record, converting it
 *  to a reading. Absent payload is a no-op (the record stays `unwired`). */
export function withMarketCurve(records: InstrumentRecord[], data?: MarketCurvePayload | null): InstrumentRecord[] {
  if (!data) return records
  const pct = (p: number) => `${Math.round(p * 100)}%`
  const implied = data.impliedFiftyYear
  const measuredAt = data.generatedAt.slice(0, 10)
  return records.map((r) => {
    if (r.instrument !== 'markets') return r
    return {
      instrument: 'markets',
      state: 'reading',
      metric: `AGI arrival priced across ${data.nHorizons} horizons (Bayes Market term structure)`,
      value: implied ? `Implied 50/50 by ~${implied}` : `Below 50% through ${data.lastYear}`,
      trend: `${pct(data.firstProb)} by ${data.firstYear} rising to ${pct(data.lastProb)} by ${data.lastYear}. Play-money, model-calibrated priors — a second snapshot shows whether the implied date is pulling in.`,
      // No direction: a single snapshot has no time trend to read (the chart is a
      // CDF over horizons, not a reading over time). Honest until we snapshot twice.
      window: `${data.firstYear} \u2192 ${data.lastYear}`,
      measuredAt,
      checkedAt: measuredAt,
      series: data.series,
      seriesScale: 'linear',
      series2: data.series2,
      series2Label: data.series2Label,
      // Only `generated` here: the shared provenance renderer prefixes `query`
      // with idea-vintage's "keyword cohort" copy, which does not fit a market
      // term structure. The cohort is named in `metric` instead.
      provenance: { generated: measuredAt },
      sources: [
        { label: 'Bayes Market — AI-futures belief network', url: 'https://futarchy.ai/' },
        {
          label: 'Snapshot: src/data/velocity/ftm-takeoff.json',
          url: 'https://github.com/protocol/plrd.org/blob/main/src/data/velocity/ftm-takeoff.json',
        },
      ],
    }
  })
}
