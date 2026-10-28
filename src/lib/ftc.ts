import "server-only"
import { type MetricSeries } from "./trends"

/**
 * Read-only Funding the Commons impact metrics for the FA2 Live Dashboard.
 *
 * FtC publishes its public dashboard numbers as ATProto records in its own repo
 * (`did:plc:ghilmzxkfzrg6zr4bglxvlio`) under the `io.fundingthecommons.impact.*`
 * lexicons. Rather than read FtC's PDS directly, we go through the PL Research
 * indexer, which now mirrors those collections (see ../plresearch-indexer:
 * the FtC DID is pulled on a periodic backfill because tap's signal collection
 * never matches FtC's repo) and exposes them over the same GraphQL surface as
 * org.plresearch.* — one endpoint, server-side paging, real-time-ish.
 *
 * Biodiversity stays on api.hi.gainforest.app (see gainforest.ts); this module is
 * FtC-only. A flaky/empty upstream yields 0 + `degraded: true` rather than
 * failing the page (same contract as fetchGlowStats / fetchGainforestStats).
 *
 * metricPoint.value is a string (Lexicon has no float primitive) and date is the
 * value's as-of date. FtC stores cumulative metrics as running totals already,
 * so we plot points as-is and take the latest as the headline — no re-accumulation.
 */

const PLRESEARCH_INDEXER_URL =
  process.env.INDEXER_URL ??
  process.env.NEXT_PUBLIC_INDEXER_URL ??
  "https://plresearch-indexer-production.up.railway.app/graphql"

// Align with the page's 60s ISR so a transient indexer error (which Next caches
// as the fetch Response) self-heals within a minute instead of sticking for 15.
const REVALIDATE = 60

export type FtcMetricKey =
  | "pgfDistributed"
  | "alumniFollowOn"
  | "residencyBuilders"
  | "hackathonBuilders"
  | "hackathonProjects"
  | "totalAudience"

// Curated headline set for the FA2 dashboard. `slug` is the FtC metric record
// key (io.fundingthecommons.impact.metric rkey) == metricPoint.metric.
const FTC_METRICS: { key: FtcMetricKey; slug: string }[] = [
  { key: "pgfDistributed", slug: "total-pgf-distributed" },
  { key: "alumniFollowOn", slug: "residency-alumni-follow-on-funding-received-verified-usd" },
  { key: "residencyBuilders", slug: "residency-builders-all-cohorts" },
  { key: "hackathonBuilders", slug: "hackathon-builders-total" },
  { key: "hackathonProjects", slug: "hackathon-projects-prototypes-total" },
  { key: "totalAudience", slug: "total-audience" },
]

export type FtcTotals = Record<FtcMetricKey, number>
export type FtcTrends = Record<FtcMetricKey, MetricSeries>

export type FtcStats = {
  totals: FtcTotals
  trends: FtcTrends
  /** ISO date (YYYY-MM-DD) of the freshest underlying point, or null. */
  asOf: string | null
  fetchedAt: string
  /** True when the indexer was unreachable or carried no FtC points. */
  degraded: boolean
}

type RawPoint = { metric?: string; value?: string; date?: string; type?: string }

const emptySeries = (): MetricSeries => ({ days: [], values: [] })

function emptyStats(degraded: boolean): FtcStats {
  const totals = {} as FtcTotals
  const trends = {} as FtcTrends
  for (const { key } of FTC_METRICS) {
    totals[key] = 0
    trends[key] = emptySeries()
  }
  return { totals, trends, asOf: null, fetchedAt: new Date().toISOString(), degraded }
}

/** Page through every io.fundingthecommons.impact.metricPoint record. */
async function fetchAllPoints(signal: AbortSignal): Promise<RawPoint[]> {
  const out: RawPoint[] = []
  let cursor: string | undefined
  for (let guard = 0; guard < 20; guard++) {
    signal.throwIfAborted()
    const after = cursor ? `, after: "${cursor}"` : ""
    const query = `{
      ioFundingthecommonsImpactMetricPoint(first: 100${after}) {
        edges { node { metric value date type } }
        pageInfo { hasNextPage endCursor }
      }
    }`
    const res = await fetch(PLRESEARCH_INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: REVALIDATE, tags: ["ftc"] },
      signal,
      body: JSON.stringify({ query }),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const json = (await res.json()) as {
      data?: {
        ioFundingthecommonsImpactMetricPoint?: {
          edges?: { node?: RawPoint }[]
          pageInfo?: { hasNextPage?: boolean; endCursor?: string }
        }
      }
      errors?: { message: string }[]
    }
    signal.throwIfAborted()
    if (json.errors?.length) throw new Error(json.errors[0].message)
    const conn = json.data?.ioFundingthecommonsImpactMetricPoint
    for (const e of conn?.edges ?? []) if (e.node) out.push(e.node)
    const page = conn?.pageInfo
    if (!page?.hasNextPage || !page.endCursor || page.endCursor === cursor) break
    cursor = page.endCursor
  }
  return out
}

export async function fetchFtcStats(): Promise<FtcStats> {
  const signal = AbortSignal.timeout(20_000)
  let points: RawPoint[] = []
  try {
    points = await fetchAllPoints(signal)
  } catch (err) {
    console.warn("[ftc] metricPoint fetch failed:", err)
    return emptyStats(true)
  }
  if (points.length === 0) return emptyStats(true)

  // Group actual readings by metric slug, dedup per day (last write wins).
  const bySlug = new Map<string, Map<string, number>>()
  let freshest = ""
  for (const p of points) {
    if (!p.metric || p.value == null || !p.date) continue
    if (p.type === "target") continue
    const value = Number(p.value)
    if (!Number.isFinite(value)) continue
    const day = p.date.slice(0, 10)
    if (!bySlug.has(p.metric)) bySlug.set(p.metric, new Map())
    bySlug.get(p.metric)!.set(day, value)
    if (day > freshest) freshest = day
  }

  const totals = {} as FtcTotals
  const trends = {} as FtcTrends
  let any = false
  for (const { key, slug } of FTC_METRICS) {
    const series = [...(bySlug.get(slug)?.entries() ?? [])].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )
    if (series.length > 0) any = true
    trends[key] = { days: series.map((s) => s[0]), values: series.map((s) => s[1]) }
    totals[key] = series.length ? series[series.length - 1][1] : 0
  }

  return {
    totals,
    trends,
    asOf: freshest || null,
    fetchedAt: new Date().toISOString(),
    degraded: !any,
  }
}
