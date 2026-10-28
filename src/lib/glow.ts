import "server-only"
import { type MetricSeries } from "./trends"

/**
 * Read-only weekly solar metrics for the FA2 Live Dashboard, sourced the same
 * way glow.org/archives reads them today: per-week static snapshots published
 * to Glow's public R2 bucket.
 *
 *   GET {GLOW_R2_BASE}/week-{n}/filtered-data.json
 *     → [{ powerOutput, carbonCreditsProduced, hexlifiedPublicKey, ... }, ...]
 *
 * Each element is one audited farm; `powerOutput` is its kWh for the week and
 * `carbonCreditsProduced` its metric tons CO₂. We sum those across farms to get
 * the per-week totals glow.org renders, then build a rolling weekly activity
 * series (last `TREND_WEEKS` audited weeks) for the trend charts.
 *
 * History: this module used to POST to the `headline_farm_stats` aggregator
 * against a hardcoded GCA server (http://95.217.194.59:35015). That GCA server
 * was retired — the aggregator still answers but returns zero farms — so the
 * dashboard silently degraded to 0. glow.org itself moved to the R2 snapshots
 * below, which is now the canonical public source.
 *
 * The snapshot files are large (~5 MB/week) because each farm carries 2016
 * per-slot sample arrays we don't need, so we sum the two scalar fields with a
 * targeted regex instead of JSON.parse-ing the whole graph. A flaky/empty
 * upstream yields 0 + `degraded: true` rather than failing the page (same
 * contract as `fetchGainforestStats`).
 */

const GLOW_R2_BASE =
  process.env.GLOW_R2_BASE ??
  "https://pub-7e0365747f054c9e85051df5f20fa815.r2.dev"

// Protocol week-0 start (unix seconds) + week length, from glow.org's bundle.
const GLOW_GENESIS = 1_700_352_000
const WEEK_SECONDS = 604_800
// Rolling window of recent protocol weeks to chart.
const TREND_WEEKS = 8
// Extra weeks to probe above the window: the freshest protocol weeks are not
// audited/published yet (404) and there can be the odd gap, so we over-fetch
// and keep the most recent `TREND_WEEKS` that actually resolved.
const WEEK_LOOKBACK = TREND_WEEKS + 4
// 15-minute ISR — weekly data only changes once per protocol week.
const REVALIDATE = 60 * 15

/** Per-week activity series for the Glow headline metrics (last N weeks). */
export type GlowTrends = {
  /** Weekly power output (kWh). */
  powerOutput: MetricSeries
  /** Weekly carbon credits produced (metric tons CO₂). */
  carbon: MetricSeries
  /** Active solar farms reporting each week. */
  activeFarms: MetricSeries
}

export type GlowStats = {
  /** Latest audited protocol week number. */
  week: number
  /** Total power output for the latest week (kWh). */
  powerOutput: number
  /** Total carbon credits produced for the latest week (metric tons CO₂). */
  carbon: number
  /** Active farms reporting in the latest week. */
  activeFarms: number
  trends: GlowTrends
  fetchedAt: string
  degraded: boolean
}

type WeekTotals = {
  week: number
  powerOutput: number
  carbon: number
  activeFarms: number
}

const EMPTY_TRENDS: GlowTrends = {
  powerOutput: { days: [], values: [] },
  carbon: { days: [], values: [] },
  activeFarms: { days: [], values: [] },
}

/** ISO date (YYYY-MM-DD) of a protocol week's start. */
function weekStartIso(week: number): string {
  return new Date((GLOW_GENESIS + week * WEEK_SECONDS) * 1000)
    .toISOString()
    .slice(0, 10)
}

/** Nominal current protocol week (the freshest week may not be audited yet). */
function currentWeek(): number {
  return Math.floor((Date.now() / 1000 - GLOW_GENESIS) / WEEK_SECONDS)
}

/**
 * Sum every occurrence of a scalar `"key":<number>` field in the raw snapshot
 * text. Glow's per-farm sample arrays use a sibling key that differs only by a
 * trailing "s" (e.g. `powerOutputs`), and an exact `"key":` match — with the
 * closing quote — never collides with `"keys":`, so this stays accurate
 * without materialising the multi-megabyte object graph.
 */
function sumScalarField(text: string, key: string): number {
  const re = new RegExp(`"${key}":\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`, "g")
  let total = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) total += Number(m[1])
  return total
}

/** Fetch + aggregate one protocol week from its R2 snapshot, or null when
 *  the week isn't published yet (404) or carries no farms. */
async function fetchWeek(week: number, signal: AbortSignal): Promise<WeekTotals | null> {
  if (week < 0) return null
  try {
    const res = await fetch(`${GLOW_R2_BASE}/week-${week}/filtered-data.json`, {
      next: { revalidate: REVALIDATE, tags: ["glow"] },
      signal,
    })
    if (!res.ok) return null
    const text = await res.text()
    signal.throwIfAborted()
    const activeFarms = (text.match(/"hexlifiedPublicKey"/g) ?? []).length
    if (activeFarms === 0) return null
    return {
      week,
      powerOutput: sumScalarField(text, "powerOutput"),
      carbon: sumScalarField(text, "carbonCreditsProduced"),
      activeFarms,
    }
  } catch {
    return null
  }
}

export async function fetchGlowStats(): Promise<GlowStats> {
  // One budget covers all concurrent weeks, including response bodies.
  const signal = AbortSignal.timeout(20_000)
  const nominal = currentWeek()
  const weeks = Array.from({ length: WEEK_LOOKBACK + 1 }, (_, i) => nominal - i)

  let results: WeekTotals[] = []
  try {
    results = (await Promise.all(weeks.map((week) => fetchWeek(week, signal))))
      .filter((w): w is WeekTotals => w !== null)
      .sort((a, b) => a.week - b.week)
  } catch (err) {
    console.warn("[glow] R2 weekly stats fetch failed:", err)
  }

  if (signal.aborted || results.length === 0) {
    return {
      week: nominal,
      powerOutput: 0,
      carbon: 0,
      activeFarms: 0,
      trends: EMPTY_TRENDS,
      fetchedAt: new Date().toISOString(),
      degraded: true,
    }
  }

  // Keep the most recent TREND_WEEKS once blanks are dropped, oldest → newest.
  const series = results.slice(-TREND_WEEKS)
  const days = series.map((w) => weekStartIso(w.week))
  const trends: GlowTrends = {
    powerOutput: { days, values: series.map((w) => Math.round(w.powerOutput)) },
    carbon: { days, values: series.map((w) => w.carbon) },
    activeFarms: { days, values: series.map((w) => w.activeFarms) },
  }
  const latest = series[series.length - 1]

  return {
    week: latest.week,
    powerOutput: latest.powerOutput,
    carbon: latest.carbon,
    activeFarms: latest.activeFarms,
    trends,
    fetchedAt: new Date().toISOString(),
    degraded: false,
  }
}
