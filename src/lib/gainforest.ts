import "server-only"
import { cacheProviderStats } from "./provider-stats-cache"
import { type MetricSeries, cumulativeOnAxis, dayAxis, ms } from "./trends"

/**
 * Read-only counts for the GainForest commons, surfaced on the FA2 Live
 * Dashboard:
 *
 *   · certified organizations  → `appCertifiedActorOrganization`
 *   · Bumicerts (hypercerts)   → `orgHypercertsClaimActivity`
 *
 * from the Hyperindex GraphQL API (api.hi.gainforest.app, CORS-open), cached via
 * Next ISR. A flaky upstream yields 0 + `degraded: true` rather than failing
 * the page. The dashboard *map* is a build-time snapshot of certified-org
 * locations (see `scripts/generate-gainforest-sites.mjs` →
 * `src/data/gainforest-sites.json`), not fetched here.
 */

const GAINFOREST_INDEXER_URL =
  process.env.GAINFOREST_INDEXER_URL ?? "https://api.hi.gainforest.app/graphql"

// 15-minute ISR — matches gainforest-app / Bumiscan's own cadence.
const REVALIDATE = 60 * 15

/** Recent-activity cumulative tails for the GainForest headline metrics: each
 *  is the newest ~1000 records anchored to the true total, so the line ends on
 *  the headline number without scanning a collection that has grown past the
 *  1000-record page limit (orgs, hypercerts, and ~330k observations all have). */
export type GainforestTrends = {
  certifiedOrgs: MetricSeries
  bumicerts: MetricSeries
  observations: MetricSeries
}

export type GainforestStats = {
  certifiedOrgs: number
  bumicerts: number
  /** Live total of Darwin Core occurrence records (species observations). */
  observations: number
  trends: GainforestTrends
  fetchedAt: string
  degraded: boolean
}

const EMPTY_TRENDS: GainforestTrends = {
  certifiedOrgs: { days: [], values: [] },
  bumicerts: { days: [], values: [] },
  observations: { days: [], values: [] },
}

/**
 * Cumulative series for the recent tail of a large collection: the running
 * total of the newest `times.length` records, offset so the last point equals
 * the real `total`. Used for species observations, whose full per-day history
 * (~330k records) is too expensive to build in request time but whose newest
 * page is cheap — the line shows the recent growth slope ending at the live
 * total. (Ports gainforest-explorer's `cumulativeTailSeries`.)
 */
function tailSeries(times: number[], total: number): MetricSeries {
  const valid = times.filter((t) => !Number.isNaN(t))
  const { days, isoDays } = dayAxis(valid)
  if (days.length === 0) return { days: [], values: [] }
  const baseline = total - valid.length
  const values = cumulativeOnAxis(
    days,
    valid.map((t) => ({ t, inc: 1 })),
    baseline,
  )
  return { days: isoDays, values }
}

// Every connection is capped at `first: 1000` and sorted newest-first, so the
// headline number always comes from `totalCount` (authoritative regardless of
// the page) and the trends are recent-activity tails of the newest 1000 records
// anchored to that total. Once a collection passes 1000 (orgs and hypercerts
// both have) an un-sorted page would return an arbitrary slice and a from-zero
// cumulative would plateau at 1000, undershooting the headline — see tailSeries.
const TOTALS_QUERY = `query PlrdGainforestTotals {
  actorOrg: appCertifiedActorOrganization(first: 1000, sortBy: createdAt, sortDirection: DESC) {
    totalCount
    edges { node { createdAt } }
  }
  act: orgHypercertsClaimActivity(first: 1000, sortBy: createdAt, sortDirection: DESC) {
    totalCount
    edges { node { createdAt } }
  }
  occ: appGainforestDwcOccurrence(first: 1000, sortBy: createdAt, sortDirection: DESC) {
    totalCount
    edges { node { createdAt } }
  }
}`

type EdgeList = { edges?: { node?: { createdAt?: string | null } | null }[] | null }

function times(conn: EdgeList | undefined): number[] {
  return (conn?.edges ?? [])
    .map((e) => ms(e?.node?.createdAt))
    .filter((t) => !Number.isNaN(t))
}

async function loadGainforestStats(signal = AbortSignal.timeout(20_000)): Promise<GainforestStats> {
  try {
    signal.throwIfAborted()
    const res = await fetch(GAINFOREST_INDEXER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal,
      body: JSON.stringify({ query: TOTALS_QUERY }),
    })
    // Hyperindex can return HTTP 400 with a *valid partial* `data` payload when
    // a batch references a dangling strongRef (a record missing a non-nullable
    // field). Honour GraphQL partial-data semantics — parse regardless of
    // status and only fail when `data` is truly absent (matches
    // gainforest-collections.ts + generate-gainforest-sites.mjs). Throwing on
    // every 400 is what falsely marked the dashboard `degraded`.
    const json = (await res.json().catch(() => null)) as {
      data?: {
        actorOrg?: ({ totalCount?: number | null } & EdgeList) | null
        act?: ({ totalCount?: number | null } & EdgeList) | null
        occ?: ({ totalCount?: number | null } & EdgeList) | null
      } | null
    } | null
    signal.throwIfAborted()
    const d = json?.data
    if (!d) throw new Error(`status ${res.status}: no data`)

    const orgTimes = times(d.actorOrg ?? undefined)
    const actTimes = times(d.act ?? undefined)
    const occTimes = times(d.occ ?? undefined)
    const certifiedOrgs = d.actorOrg?.totalCount ?? 0
    const bumicerts = d.act?.totalCount ?? 0
    const observations = d.occ?.totalCount ?? 0
    // Recent-activity tails: the newest ~1000 records of each collection,
    // anchored to the true `totalCount`. This keeps the trend line ending
    // exactly on the headline number even after a collection grows past the
    // 1000-record page limit (a from-zero cumulative would stop at 1000).
    const trends: GainforestTrends = {
      certifiedOrgs: tailSeries(orgTimes, certifiedOrgs),
      bumicerts: tailSeries(actTimes, bumicerts),
      observations: tailSeries(occTimes, observations),
    }

    return {
      certifiedOrgs,
      bumicerts,
      observations,
      trends,
      fetchedAt: new Date().toISOString(),
      degraded: false,
    }
  } catch (err) {
    console.warn("[gainforest] totals fetch failed:", err)
    return {
      certifiedOrgs: 0,
      bumicerts: 0,
      observations: 0,
      trends: EMPTY_TRENDS,
      fetchedAt: new Date().toISOString(),
      degraded: true,
    }
  }
}

export const fetchGainforestStats = cacheProviderStats("gainforest", REVALIDATE, loadGainforestStats)
