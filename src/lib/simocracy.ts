import "server-only"
import { type MetricSeries, cumulativeOnAxis, dayAxis, ms } from "./trends"

export type { MetricSeries }

/**
 * Read-only client for the Simocracy indexer at
 *   https://simocracy-indexer-production.up.railway.app/graphql
 *
 * Powers the FA2 Live Dashboard. We pull three collections
 * (history, sim, gathering) and aggregate them into a small set of
 * headline metrics + cumulative trend series + leaderboards.
 *
 * Schema mirrors simocracy-v2's `lib/indexer.ts` and `lib/lexicon-types.ts`,
 * but we deliberately keep this self-contained so plresearch.org doesn't
 * take a build-time dep on the simocracy-v2 source tree.
 *
 * Private fields (chat content, user prompts) are stripped before they ever
 * leave this module — the public dashboard only sees aggregate metadata.
 */

function graphqlEndpoint(url: string) {
  const trimmed = url.replace(/\/+$/, "")
  return trimmed.endsWith("/graphql") ? trimmed : `${trimmed}/graphql`
}

const SIMOCRACY_INDEXER_URL = graphqlEndpoint(
  process.env.SIMOCRACY_INDEXER_URL ??
    "https://simocracy-indexer-production.up.railway.app",
)

// -- FtC SF tower treasury (canonical example tower not yet represented as
// a gathering record). Mirrors TOWER_TREASURY in simocracy-v2/lib/ftc-sf-data.ts.
const FTC_SF_TOWER_TREASURY_USD = 15_000

// ---------------------------------------------------------------------------
// Lexicon shapes (subset)
// ---------------------------------------------------------------------------

export type SimocracyEvent =
  | {
      type: "chat"
      actorDid: string
      simNames: string[]
      simUris?: string[]
      createdAt: string
      hearingId?: string
      // chat content + userMessage are stripped before reaching this type
    }
  | {
      type: "sprocess"
      actorDid: string
      simNames: string[]
      simUris?: string[]
      createdAt: string
      proposalTitle?: string
      hearingId?: string
      round?: number
    }

type RawHistoryRecord = SimocracyEvent & {
  content?: string
  userMessage?: string
}

type RawGatheringRecord = {
  name?: string
  treasuryUsd?: number
  status?: string
  createdAt?: string
}

type RawSimRecord = {
  name?: string
  createdAt?: string
}

interface PageInfo {
  hasNextPage: boolean
  endCursor?: string
}

interface GqlResponse {
  data?: Record<
    string,
    { edges: { node: Record<string, unknown> }[]; pageInfo: PageInfo }
  >
  errors?: { message: string }[]
}

/**
 * Pull every node out of one of the Simocracy indexer's typed roots
 * (e.g. `orgSimocracyHistory`). The indexer uses lex-gql-style schema where
 * each lexicon collection becomes a top-level Relay connection — there is no
 * generic `records` query.
 *
 * Field names on `node` are the lexicon's record fields plus indexer-managed
 * fields (`uri`, `cid`, `did`, `collection`, `indexedAt`).
 */
async function fetchRoot<T extends Record<string, unknown>>(
  rootField: string,
  selection: string,
  limit: number,
  signal: AbortSignal,
): Promise<T[]> {
  const out: T[] = []
  let cursor: string | undefined = undefined
  while (out.length < limit) {
    signal.throwIfAborted()
    const first = Math.min(100, limit - out.length)
    const after = cursor ? `, after: "${cursor}"` : ""
    const query = `{
      ${rootField}(first: ${first}${after}) {
        edges { node { ${selection} } }
        pageInfo { hasNextPage endCursor }
      }
    }`
    const res = await fetch(SIMOCRACY_INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60, tags: ["simocracy"] },
      signal,
      body: JSON.stringify({ query }),
    })
    if (!res.ok) break
    const json = (await res.json()) as GqlResponse
    signal.throwIfAborted()
    if (json.errors?.length) {
      console.warn(`[simocracy] GraphQL errors for ${rootField}:`, json.errors)
      break
    }
    const conn = json.data?.[rootField]
    const edges = conn?.edges ?? []
    for (const e of edges) out.push(e.node as T)
    const page = conn?.pageInfo
    if (!page?.hasNextPage || !page.endCursor || page.endCursor === cursor) break
    cursor = page.endCursor
  }
  return out
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type SimocracyTotals = {
  treasuryUsd: number
  uniqueHumans: number
  totalSims: number
  totalGatherings: number
  totalProposals: number
  totalComments: number
  totalSProcesses: number
  totalChats: number
}

export type SimLeaderboardEntry = { name: string; chats: number }
export type UserLeaderboardEntry = { did: string; total: number; chats: number }

/** Cumulative daily series for every headline metric (keys mirror SimocracyTotals). */
export type SimocracyTrends = {
  treasuryUsd: MetricSeries
  uniqueHumans: MetricSeries
  totalSims: MetricSeries
  totalGatherings: MetricSeries
  totalProposals: MetricSeries
  totalComments: MetricSeries
  totalSProcesses: MetricSeries
  totalChats: MetricSeries
}

export type SimocracyStats = {
  totals: SimocracyTotals
  /** Per-metric cumulative daily series, oldest → newest, on a shared date axis. */
  trends: SimocracyTrends
  topSims: SimLeaderboardEntry[]
  topUsers: UserLeaderboardEntry[]
  recentEvents: SimocracyEvent[]
  /** Best-effort wall-clock time the underlying GraphQL fetches completed. */
  fetchedAt: string
  /** True when the indexer was unreachable or returned no data. */
  degraded: boolean
}

function sanitize(raw: RawHistoryRecord): SimocracyEvent {
  // Strip private fields (chat content, user prompt) before they leak out.
  if (raw.type === "chat") {
    return {
      type: "chat",
      actorDid: raw.actorDid,
      simNames: raw.simNames ?? [],
      simUris: raw.simUris,
      createdAt: raw.createdAt,
      hearingId: raw.hearingId,
    }
  }
  return {
    type: "sprocess",
    actorDid: raw.actorDid,
    simNames: raw.simNames ?? [],
    simUris: raw.simUris,
    createdAt: raw.createdAt,
    proposalTitle: raw.proposalTitle,
    hearingId: raw.hearingId,
    round: raw.round,
  }
}

/**
 * Build cumulative daily series for every headline metric on one shared date
 * axis spanning the earliest recorded event through today.
 */
function buildTrends(args: {
  simTimes: number[]
  userFirstSeen: number[]
  gatherings: { createdAt?: string; treasuryUsd?: number }[]
  proposalTimes: number[]
  commentTimes: number[]
  events: SimocracyEvent[]
  treasuryBaseline: number
}): SimocracyTrends {
  const { simTimes, userFirstSeen, gatherings, proposalTimes, commentTimes, events, treasuryBaseline } = args

  const gatheringTimes = gatherings.map((g) => ms(g.createdAt)).filter((t) => !Number.isNaN(t))
  const eventTimes = events.map((e) => ms(e.createdAt)).filter((t) => !Number.isNaN(t))
  const allTimes = [
    ...simTimes,
    ...userFirstSeen,
    ...gatheringTimes,
    ...proposalTimes,
    ...commentTimes,
    ...eventTimes,
  ]

  const empty: MetricSeries = { days: [], values: [] }
  const { days, isoDays } = dayAxis(allTimes)
  if (days.length === 0) {
    return {
      treasuryUsd: empty,
      uniqueHumans: empty,
      totalSims: empty,
      totalGatherings: empty,
      totalProposals: empty,
      totalComments: empty,
      totalSProcesses: empty,
      totalChats: empty,
    }
  }

  // S-Process increments: first time each hearingId appears among sprocess events.
  const seenHearings = new Set<string>()
  const sprocessEvents: { t: number; inc: number }[] = []
  for (const e of [...events].sort((a, b) => ms(a.createdAt) - ms(b.createdAt))) {
    if (e.type === "sprocess" && e.hearingId && !seenHearings.has(e.hearingId)) {
      seenHearings.add(e.hearingId)
      sprocessEvents.push({ t: ms(e.createdAt), inc: 1 })
    }
  }

  const series = (values: number[]): MetricSeries => ({ days: isoDays, values })

  return {
    treasuryUsd: series(
      cumulativeOnAxis(
        days,
        gatherings.map((g) => ({ t: ms(g.createdAt), inc: g.treasuryUsd ?? 0 })),
        treasuryBaseline,
      ),
    ),
    uniqueHumans: series(cumulativeOnAxis(days, userFirstSeen.map((t) => ({ t, inc: 1 })))),
    totalSims: series(cumulativeOnAxis(days, simTimes.map((t) => ({ t, inc: 1 })))),
    totalGatherings: series(
      cumulativeOnAxis(days, gatheringTimes.map((t) => ({ t, inc: 1 }))),
    ),
    totalProposals: series(cumulativeOnAxis(days, proposalTimes.map((t) => ({ t, inc: 1 })))),
    totalComments: series(cumulativeOnAxis(days, commentTimes.map((t) => ({ t, inc: 1 })))),
    totalSProcesses: series(cumulativeOnAxis(days, sprocessEvents)),
    totalChats: series(
      cumulativeOnAxis(
        days,
        events.filter((e) => e.type === "chat").map((e) => ({ t: ms(e.createdAt), inc: 1 })),
      ),
    ),
  }
}

/**
 * Fetch + aggregate Simocracy data for the live dashboard. Falls back to a
 * `degraded: true` empty result if the indexer is unreachable.
 */
export async function fetchSimocracyStats(): Promise<SimocracyStats> {
  // A per-request timeout would restart on each page; share one whole-read budget.
  const signal = AbortSignal.timeout(20_000)
  type HistoryNode = RawHistoryRecord
  type SimNode = RawSimRecord & { did?: string; uri?: string }
  type GatheringNode = RawGatheringRecord & { did?: string }
  type TimedNode = { createdAt?: string }

  let historyNodes: HistoryNode[] = []
  let simNodes: SimNode[] = []
  let gatheringNodes: GatheringNode[] = []
  // Proposals are org.hypercerts.claim.activity records; comments on proposals
  // are org.impactindexer.review.comment records (see ../simocracy-v2).
  let proposalNodes: TimedNode[] = []
  let commentNodes: TimedNode[] = []

  try {
    ;[historyNodes, simNodes, gatheringNodes, proposalNodes, commentNodes] = await Promise.all([
      fetchRoot<HistoryNode>(
        "orgSimocracyHistory",
        "type actorDid simNames simUris proposalTitle round hearingId createdAt",
        5_000,
        signal,
      ),
      fetchRoot<SimNode>("orgSimocracySim", "did uri name createdAt", 1_000, signal),
      fetchRoot<GatheringNode>(
        "orgSimocracyGathering",
        "did name treasuryUsd status createdAt",
        500,
        signal,
      ),
      fetchRoot<TimedNode>("orgHypercertsClaimActivity", "createdAt", 2_000, signal),
      fetchRoot<TimedNode>("orgImpactindexerReviewComment", "createdAt", 2_000, signal),
    ])
  } catch (err) {
    console.warn("[simocracy] fetch failed:", err)
  }

  const events: SimocracyEvent[] = historyNodes
    .map((n) => sanitize(n))
    .filter((e) => !!e.createdAt)

  const gatherings = gatheringNodes

  // Treasury = sum(gathering.treasuryUsd) + canonical FtC SF tower
  const treasuryFromGatherings = gatherings.reduce(
    (s, g) => s + (typeof g.treasuryUsd === "number" ? g.treasuryUsd : 0),
    0,
  )
  const treasuryUsd = treasuryFromGatherings + FTC_SF_TOWER_TREASURY_USD

  // Unique humans = DIDs that own a sim ∪ DIDs that triggered any event.
  // Track first-seen timestamp per DID for the cumulative growth series.
  const firstSeen = new Map<string, number>()
  const noteFirst = (did: string | undefined, createdAt: string | undefined) => {
    if (!did || !createdAt) return
    const t = new Date(createdAt).getTime()
    if (Number.isNaN(t)) return
    const prev = firstSeen.get(did)
    if (prev == null || t < prev) firstSeen.set(did, t)
  }
  for (const node of simNodes) noteFirst(node.did, node.createdAt)
  for (const e of events) noteFirst(e.actorDid, e.createdAt)
  const humanDids = firstSeen

  const simTimes = simNodes
    .map((s) => new Date(s.createdAt ?? "").getTime())
    .filter((t) => !Number.isNaN(t))

  const proposalTimes = proposalNodes.map((p) => ms(p.createdAt)).filter((t) => !Number.isNaN(t))
  const commentTimes = commentNodes.map((c) => ms(c.createdAt)).filter((t) => !Number.isNaN(t))

  const trends = buildTrends({
    simTimes,
    userFirstSeen: [...firstSeen.values()],
    gatherings,
    proposalTimes,
    commentTimes,
    events,
    treasuryBaseline: FTC_SF_TOWER_TREASURY_USD,
  })

  // S-processes = unique hearingId among sprocess events
  const sProcessRunIds = new Set<string>()
  for (const e of events) {
    if (e.type === "sprocess" && e.hearingId) sProcessRunIds.add(e.hearingId)
  }

  const totalChats = events.filter((e) => e.type === "chat").length

  // Leaderboards
  const chatBySim = new Map<string, number>()
  const eventsByUser = new Map<string, number>()
  const chatsByUser = new Map<string, number>()
  for (const e of events) {
    eventsByUser.set(e.actorDid, (eventsByUser.get(e.actorDid) ?? 0) + 1)
    if (e.type === "chat") {
      chatsByUser.set(e.actorDid, (chatsByUser.get(e.actorDid) ?? 0) + 1)
      for (const name of e.simNames) {
        chatBySim.set(name, (chatBySim.get(name) ?? 0) + 1)
      }
    }
  }

  const topSims: SimLeaderboardEntry[] = [...chatBySim.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, chats]) => ({ name, chats }))

  const topUsers: UserLeaderboardEntry[] = [...eventsByUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([did, total]) => ({
      did,
      total,
      chats: chatsByUser.get(did) ?? 0,
    }))

  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 25)

  const degraded =
    historyNodes.length === 0 &&
    simNodes.length === 0 &&
    gatheringNodes.length === 0

  return {
    totals: {
      treasuryUsd,
      uniqueHumans: humanDids.size,
      totalSims: simNodes.length,
      totalGatherings: gatheringNodes.length,
      totalProposals: proposalNodes.length,
      totalComments: commentNodes.length,
      totalSProcesses: sProcessRunIds.size,
      totalChats,
    },
    trends,
    topSims,
    topUsers,
    recentEvents,
    fetchedAt: new Date().toISOString(),
    degraded,
  }
}

// ---------------------------------------------------------------------------
// Bluesky profile resolution (parallel, best-effort, server-side)
// ---------------------------------------------------------------------------

export type BlueskyProfile = {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

export async function resolveBlueskyProfiles(
  dids: string[],
): Promise<Record<string, BlueskyProfile>> {
  const out: Record<string, BlueskyProfile> = {}
  const unique = [...new Set(dids)].slice(0, 25)
  const results = await Promise.allSettled(
    unique.map(async (did) => {
      const r = await fetch(
        `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`,
        { next: { revalidate: 300 }, signal: AbortSignal.timeout(5_000) },
      )
      if (!r.ok) return null
      const j = (await r.json()) as {
        handle: string
        displayName?: string
        avatar?: string
      }
      return {
        did,
        handle: j.handle,
        displayName: j.displayName,
        avatar: j.avatar,
      } satisfies BlueskyProfile
    }),
  )
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) out[r.value.did] = r.value
  }
  return out
}
