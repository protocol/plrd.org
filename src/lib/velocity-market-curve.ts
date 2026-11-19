// ── Market term-structure ingestion (build-time, server only) ─────────────────
//
// The committed Full Takeoff Model snapshot retains its source history. The
// public projection includes economic automation only: the AGI forecast and its
// implied-date headline were retired at the owner's request on November 6, 2026.
// Keep the automation chart's existing `secondary` identity so old links retain
// their meaning and the retired `primary` link cannot open a different forecast.
//
// Play-money, model-derived priors: an external forecast instrument, not a
// settled outcome or a deep real-money market. Parsing happens at build time.

import fs from 'node:fs'
import path from 'node:path'
import type { FocusAreaKey } from '@/lib/inflection-points'
import type { InstrumentRecord } from '@/lib/velocity-instruments'

const SNAPSHOT = path.join(process.cwd(), 'src', 'data', 'velocity', 'ftm-takeoff.json')
const AUTOMATION_KEY = 'ftm_full_auto'

type SnapshotPoint = { year: number; prob: number }
type SnapshotSeries = { key: string; label: string; points: SnapshotPoint[] }
type Snapshot = {
  _provenance?: { source?: string; api?: string; generatedAt?: string }
  series?: SnapshotSeries[]
}

export type MarketCurvePayload = {
  /** Economic-automation CDF, y in percent; retains the existing secondary ID. */
  series2: { x: number; y: number }[]
  series2Label: string
  firstYear: number
  lastYear: number
  firstProb: number
  lastProb: number
  nHorizons: number
  generatedAt: string
  source: string
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
  const automation = snap.series?.find((s) => s.key === AUTOMATION_KEY)
  if (!automation || automation.points.length < 3) return {}
  const pts = [...automation.points].sort((a, b) => a.year - b.year)
  return {
    'ai-robotics': {
      series2: toCdf(pts),
      series2Label: automation.label,
      firstYear: pts[0].year,
      lastYear: pts[pts.length - 1].year,
      firstProb: pts[0].prob,
      lastProb: pts[pts.length - 1].prob,
      nHorizons: pts.length,
      generatedAt: snap._provenance?.generatedAt ?? new Date().toISOString(),
      source: snap._provenance?.source ?? 'Bayes Market (futarchy.ai)',
    },
  }
}

/** Absent source data is a no-op; the record retains its existing state. */
export function withMarketCurve(records: InstrumentRecord[], data?: MarketCurvePayload | null): InstrumentRecord[] {
  if (!data) return records
  const pct = (p: number) => `${Math.round(p * 100)}%`
  const measuredAt = data.generatedAt.slice(0, 10)
  return records.map((r) => {
    if (r.instrument !== 'markets') return r
    return {
      instrument: 'markets',
      state: 'reading',
      metric: `Full automation of the economy across ${data.nHorizons} horizons (Bayes Market forecast)`,
      value: data.series2Label,
      trend: `${pct(data.firstProb)} by ${data.firstYear} rising to ${pct(data.lastProb)} by ${data.lastYear}. Play-money, model-calibrated priors.`,
      // A CDF over future deadlines is not a historical trend.
      window: `${data.firstYear} \u2192 ${data.lastYear}`,
      measuredAt,
      checkedAt: measuredAt,
      seriesScale: 'linear',
      series2: data.series2,
      series2Label: data.series2Label,
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
