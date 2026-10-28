import "server-only"

/**
 * Read-only Ma Earth crowdfunding stats for the FA2 Live Dashboard: total live
 * donations across every project in the current quadratic-funding round, plus
 * the matching-pool size that sits next to it.
 *
 * Ma Earth's public app talks to an oRPC endpoint at `/rpc`. Each procedure is
 * POSTed as `{"json": <input>}` and answers `{"json": <output>}`. We use three
 * public procedures:
 *
 *   · rounds.getCurrent            → the active round ({ id, name, ... })
 *   · rounds.getMatchingEstimates  → per-project QF computation for that round;
 *                                    `estE` sums to the pool, and each project's
 *                                    `directDonations` (cents) + `donorCount`
 *                                    are the live crowdfunding totals.
 *   · rounds.getMatchingPoolOrNull → the pool record; `algorithm_params
 *                                    .matching_funds` (cents) is the base pool.
 *
 * We sum `directDonations`/`donorCount` across the round's projects — the same
 * matching-eligible set whose `estE` totals the pool — to get round donations
 * across all projects. This round-scoped figure runs a little below
 * maearth.com's headline banner, which adds donor-covered processing fees via
 * the operator-only (auth-gated) `rounds.getStats`.
 *
 * When the round is closed, `rounds.getCurrent` answers `{"json": null}` and
 * the live path has nothing to sum. In that case (or any upstream failure) we
 * fall back to CLOSED_ROUND_SNAPSHOT — the final headline totals from
 * maearth.com's homepage banner — with `degraded: true`, rather than showing
 * zeros. Same never-fail contract as fetchGainforestStats / fetchGlowStats /
 * fetchFtcStats.
 */

const MAEARTH_RPC_BASE =
  process.env.MAEARTH_RPC_BASE ?? "https://maearth.com/rpc"

// A browser-like UA — the edge in front of Ma Earth 403s some default
// server-side agents.
const UA =
  "Mozilla/5.0 (compatible; plresearch-dashboard/1.0; +https://www.plrd.org)"

// 15-minute ISR — donation totals drift slowly; the dashboard page also caps
// its own revalidate window.
const REVALIDATE = 60 * 15

// Fallback pool when the pool record can't be read: Round 3 base is $1.2M.
const FALLBACK_POOL_USD = 1_200_000

/**
 * Final Round 3 totals, snapshotted from maearth.com's homepage banner
 * ("$996,804 raised · 11,701 donors · 201 projects funded") after the round
 * closed. The round's matching pool was $1.2M. Used whenever the live RPC has
 * no current round (round closed) or is unreachable, so the dashboard never
 * regresses to 0/0.
 * Snapshot taken: see `SNAPSHOT_AS_OF`.
 */
const SNAPSHOT_AS_OF = "2026-08-03"
const CLOSED_ROUND_SNAPSHOT = {
  round: "Round 3",
  donations: 996_804,
  donors: 11_701,
  projects: 201,
  matchingPool: FALLBACK_POOL_USD,
} as const

export type MaEarthStats = {
  /** Active round name, e.g. "Round 3". */
  round: string
  /** Total live crowdfunding donations across the round's projects (USD). */
  donations: number
  /** Total donors across the round's projects. */
  donors: number
  /** Number of projects in the round's matching computation. */
  projects: number
  /** Base quadratic-funding matching pool for the round (USD). */
  matchingPool: number
  fetchedAt: string
  degraded: boolean
}

type Round = { id: string; name?: string | null }
type MatchingEstimates = {
  projects?: { directDonations?: number | null; donorCount?: number | null }[] | null
}
type MatchingPool = {
  algorithm_params?: { matching_funds?: number | null } | null
}

/** POST one oRPC procedure. oRPC wraps I/O in a `{ json }` envelope and can
 *  answer non-2xx with a valid body; parse regardless and only fail when the
 *  `json` payload is truly absent. */
async function rpc<T>(procedure: string, input: unknown, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${MAEARTH_RPC_BASE}/${procedure}`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": UA },
    next: { revalidate: REVALIDATE, tags: ["maearth"] },
    signal,
    body: JSON.stringify({ json: input }),
  })
  const body = (await res.json().catch(() => null)) as { json?: T } | null
  if (!body || body.json === undefined) {
    throw new Error(`maearth ${procedure}: status ${res.status}, no json`)
  }
  return body.json
}

export async function fetchMaEarthStats(): Promise<MaEarthStats> {
  // Includes current-round discovery and both dependent RPCs, not 20s each.
  const signal = AbortSignal.timeout(20_000)
  try {
    const round = await rpc<Round>("rounds/getCurrent", {}, signal)
    if (!round?.id) throw new Error("no current round")

    const [estimates, pool] = await Promise.all([
      rpc<MatchingEstimates>("rounds/getMatchingEstimates", { id: round.id }, signal),
      rpc<MatchingPool | null>("rounds/getMatchingPoolOrNull", {
        id: round.id,
      }, signal).catch(() => null),
    ])

    signal.throwIfAborted()
    const projects = estimates.projects ?? []
    const donationCents = projects.reduce((s, p) => s + (p.directDonations ?? 0), 0)
    const donors = projects.reduce((s, p) => s + (p.donorCount ?? 0), 0)
    const poolCents = pool?.algorithm_params?.matching_funds ?? null

    return {
      round: round.name ?? "Round 3",
      donations: Math.round(donationCents / 100),
      donors,
      projects: projects.length,
      matchingPool: poolCents != null ? Math.round(poolCents / 100) : FALLBACK_POOL_USD,
      fetchedAt: new Date().toISOString(),
      degraded: false,
    }
  } catch (err) {
    console.warn(
      `[maearth] live stats unavailable, using closed-round snapshot (${SNAPSHOT_AS_OF}):`,
      err,
    )
    return {
      ...CLOSED_ROUND_SNAPSHOT,
      fetchedAt: new Date().toISOString(),
      degraded: true,
    }
  }
}
