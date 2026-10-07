// Prediction-market "field" signal for each inflection point.
//
// Each inflection point can be paired with the prediction market that most
// closely matches its pre-registered threshold (Q2). The platform is chosen per
// point on match quality, NOT convenience:
//   - Polymarket — deepest liquidity for crypto/AI/identity/BCI-valuation themes.
//   - Kalshi     — regulated venue; better for US-regulatory / adoption-count themes.
//   - Metaculus  — reputation-weighted community forecasts for long-horizon,
//                  research-heavy bets no money market prices (e.g. WBE). Its API
//                  requires a token (METACULUS_API_TOKEN); without one we still
//                  link the question but show no live number.
//   - Bayes Market (futarchy.ai) — a live Bayesian belief network over AI
//                  futures (900+ linked markets). Play-money, so there is no USD
//                  volume to show, but it prices AI/robotics themes no money
//                  market touches. Read from its public /v1/net API; the node's
//                  marginal is the crowd "yes" probability.
//
// A market read is an *external, independent* estimate on the FIELD axis
// ("will it happen?") — it is never PL contribution (Q3) and never a settled Q2.
// Where no market exists, that gap is itself informative: the bet is early or
// contrarian enough that no one is pricing it yet.

export type Platform = 'polymarket' | 'kalshi' | 'metaculus' | 'futarchy'
export type SignalMatch = 'direct' | 'proxy' | 'gap'

type MarketRef =
  | { platform: 'polymarket'; slug: string; hint?: string; question: string; url: string }
  | { platform: 'kalshi'; ticker: string; question: string; url: string }
  | { platform: 'metaculus'; id: number; kind?: 'binary' | 'date'; question: string; url: string }
  // Bayes Market node, keyed by its stable variableId. resolutionDate is carried
  // on the ref because the /v1/net API does not return one (the year lives only
  // in the question text); a forecast without a resolution date is unrenderable.
  | { platform: 'futarchy'; variableId: string; resolutionDate: string; question: string; url: string }

export type MarketMapping = {
  /** Must match InflectionPoint.title exactly. */
  title: string
  match: SignalMatch
  /** Best-match market (drives the platform label). Omitted for gaps. */
  primary?: MarketRef
  /** Liquidity fallback used only if the primary returns no live price. */
  fallback?: MarketRef
  note: string
}

export type MarketSignal = {
  match: SignalMatch
  platform: Platform | null
  /** 0..1 crowd "yes" probability, or null when unavailable. */
  prob: number | null
  /** Total money traded through the market, in USD, or null when unavailable. */
  volume: number | null
  question: string | null
  url: string | null
  /** ISO resolution / close date. Required to render a market: a forecast without
   *  a resolution date is uninterpretable, so we suppress markets that lack one. */
  resolutionDate?: string | null
  /** Pre-formatted headline reading for non-probability markets (e.g. a Metaculus date estimate, “~2068”). */
  readout?: string
  /** True when prob came from the fallback rather than the best-match market. */
  viaFallback: boolean
  note: string
}

/** A market is renderable only with all four: a question, a venue (platform), an
 *  outbound URL, and a resolution date. Enforced at the render boundary. */
export function isRenderableMarket(s: MarketSignal): boolean {
  return !!(s.question && s.platform && s.url && s.resolutionDate)
}

// ── Mapping: inflection point → closest market ────────────────────────────────
export const MARKET_MAPPINGS: MarketMapping[] = [
  {
    title: 'Communication that cannot be switched off',
    match: 'gap',
    note: 'No liquid market prices a metadata-resistant messenger at scale or surviving a shutdown — a genuine white space.',
  },
  {
    title: 'Personhood without the state in the loop',
    match: 'proxy',
    primary: {
      platform: 'polymarket',
      slug: 'over-30m-humans-verified-on-world-network-by-december-31',
      question: 'Over 30M humans verified on World Network by Dec 31?',
      url: 'https://polymarket.com/event/over-30m-humans-verified-on-world-network-by-december-31',
    },
    note: 'Proof-of-human adoption at scale is the closest live analogue; Polymarket has the deepest World/identity liquidity.',
  },
  {
    title: 'Provenance becomes the default for truth',
    match: 'proxy',
    primary: {
      platform: 'kalshi',
      ticker: 'KXAILEGISLATION-27-JAN01',
      question: 'Will AI regulation become US law by 2027?',
      url: 'https://kalshi.com/markets/kxailegislation/ai-regulation',
    },
    note: 'Provenance mandates ride on AI regulation; Kalshi (regulated, US-policy focus) is the better-matched venue than any crypto market.',
  },
  {
    title: 'Agents run on open rails',
    match: 'proxy',
    primary: {
      platform: 'polymarket',
      slug: 'us-government-removes-public-access-to-another-major-ai-model-in-2026-20260703202936862',
      question: 'US government removes public access to another major AI model in 2026?',
      url: 'https://polymarket.com/event/us-government-removes-public-access-to-another-major-ai-model-in-2026-20260703202936862',
    },
    note: 'A contrarian, inverse read: if Washington moves to cut off public access to a major (open, largely Chinese) AI model, that is a headwind for open, permissionless rails — high odds here cut against this inflection point, not for it.',
  },
  {
    title: 'Programmable government in production',
    match: 'gap',
    note: 'No liquid market prices $1B/yr of public funds moving through programmable, real-time-auditable rails, or selective-disclosure credentials at national scale — a genuine white space.',
  },
  {
    title: 'A binding decision at scale',
    match: 'gap',
    note: 'No market prices a binding, at-scale computational decision. We already surface a live Simocracy signal here (Q3 contribution, not Q2).',
  },
  {
    title: 'Public goods become a financeable category',
    match: 'gap',
    note: 'No liquid market prices $1B/yr flowing through programmable allocation — long-horizon white space.',
  },
  {
    title: 'Capital that pays on verified outcomes',
    match: 'gap',
    note: 'No market prices a $1B+ outcomes-verified climate fund.',
  },
  {
    title: 'A frontier model trained off the hyperscalers',
    match: 'proxy',
    primary: {
      platform: 'futarchy',
      variableId: 'x_100b_ai_training_cluster_before_2029',
      resolutionDate: '2029-12-31',
      question: '$100B AI training cluster before 2029?',
      url: 'https://futarchy.ai/markets/x0186',
    },
    note: 'A contrarian, inverse read: no money market prices decentralized frontier training, but Bayes Market prices a single $100B centralized training cluster as near-certain — high odds here are a headwind for training off the hyperscalers, not for it.',
  },
  {
    title: 'Agents transact on open rails',
    match: 'gap',
    note: 'No market prices the share of agent-to-agent activity settling on open, permissionless rails — the category is too young to be priced.',
  },
  {
    title: 'A shared real-world robotics data network',
    match: 'proxy',
    primary: {
      platform: 'futarchy',
      variableId: 'x_2030_3_over_one_hundred_thousand_humanoid_robots_will_be_d',
      resolutionDate: '2030-12-31',
      question: 'Over 100,000 humanoid robots deployed in the real world by 2030?',
      url: 'https://futarchy.ai/markets/x0227',
    },
    note: 'The closest live analogue: Bayes Market prices a large embodied fleet reaching the real world. It reads embodied-AI momentum — the fleet that would generate the data — not the openness of the data itself, which no market yet prices.',
  },
  {
    title: 'Machine-native money moves at scale',
    match: 'gap',
    note: 'No market prices machine-native economic activity at scale — agent-native payment rails are still pre-market.',
  },
  {
    title: 'The BCI app store',
    match: 'proxy',
    primary: {
      platform: 'kalshi',
      ticker: 'KXNEURALINKCOUNT-26-40',
      question: 'Will Neuralink implant ≥40 people in 2026?',
      url: 'https://kalshi.com/markets/kxneuralinkcount/neuralink-count',
    },
    fallback: {
      platform: 'polymarket',
      slug: 'will-neuralinks-valuation-hit-by-december-31',
      hint: '$75B',
      question: "Will Neuralink's valuation hit $75B by Dec 31?",
      url: 'https://polymarket.com/event/will-neuralinks-valuation-hit-by-december-31',
    },
    note: 'Implant-count (Kalshi) is the best adoption/scaling proxy for a commercial BCI ecosystem; Polymarket valuation is the liquidity fallback.',
  },
  {
    title: 'Neural distillation',
    match: 'proxy',
    primary: {
      platform: 'metaculus',
      id: 372,
      question: 'Will brain emulation be the first successful route to human-level AI?',
      url: 'https://www.metaculus.com/questions/372/brain-emulation-produces-first-human-ai/',
    },
    note: 'The closest live forecast: Metaculus’ long-running question on whether brain emulation is the first route to human-level AI — a reputation-weighted proxy for how seriously the crowd takes neural-data-driven paths to frontier AI. No money at stake, and the crowd prices it in the low single digits.',
  },
  {
    title: 'The neuromorphic energy pivot',
    match: 'gap',
    note: 'No market prices a neuromorphic model matching SOTA at 1000× efficiency — pure white space.',
  },
  {
    title: 'Memory retrieval in simulation',
    match: 'proxy',
    primary: {
      platform: 'metaculus',
      id: 2813,
      kind: 'date',
      question: 'When will the first human whole-brain emulation happen?',
      url: 'https://www.metaculus.com/questions/2813/date-of-first-human-whole-brain-emulation/',
    },
    note: 'The closest live forecast: Metaculus’ community estimate for the date of the first human whole-brain emulation — the crowd currently places it decades out. A reputation-weighted forecast, no money at stake.',
  },
]

export function mappingByTitle(): Record<string, MarketMapping> {
  return Object.fromEntries(MARKET_MAPPINGS.map((m) => [m.title, m]))
}

// ── Fetchers ─────────────────────────────────────────────────────────────────
const GAMMA = 'https://gamma-api.polymarket.com'
const KALSHI = 'https://api.elections.kalshi.com/trade-api/v2'
const METACULUS = 'https://www.metaculus.com/api'
const FUTARCHY = 'https://api.futarchy.ai/v1'
const METACULUS_TOKEN = process.env.METACULUS_API_TOKEN
const REVALIDATE = 3600

function safeParse(s?: string): string[] | null {
  if (!s) return null
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v.map(String) : null
  } catch {
    return null
  }
}

function distinctiveToken(s?: string): string | null {
  if (!s) return null
  const money = s.match(/\$[0-9]+(?:\.[0-9]+)?[bmk]?/i)
  if (money) return money[0].toLowerCase()
  const num = s.match(/[0-9]+m\b|[0-9]{2,}/i)
  return num ? num[0].toLowerCase() : null
}

type Quote = { prob: number | null; volume: number | null; readout?: string; resolutionDate?: string | null }

/** Normalise an epoch-seconds / ISO / date string to an ISO date, or null. */
function toIsoDate(v: unknown): string | null {
  if (v == null) return null
  const d = typeof v === 'number' ? new Date(v * 1000) : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

async function fetchPolymarket(slug: string, hint?: string): Promise<Quote | null> {
  try {
    const res = await fetch(`${GAMMA}/events?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    const events = (await res.json()) as Array<{
      title?: string
      endDate?: string
      markets?: Array<{
        question?: string
        outcomes?: string
        outcomePrices?: string
        volumeNum?: number
        endDate?: string
        endDateIso?: string
      }>
    }>
    const eventEnd = events?.[0]?.endDate
    const markets = events?.[0]?.markets
    if (!markets?.length) return null
    const parsed = markets
      .map((m) => {
        const outcomes = safeParse(m.outcomes)
        const prices = safeParse(m.outcomePrices)
        if (!outcomes || !prices) return null
        const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === 'yes')
        if (yesIdx === -1) return null
        const yes = Number(prices[yesIdx])
        if (Number.isNaN(yes)) return null
        const volume = typeof m.volumeNum === 'number' && m.volumeNum > 0 ? m.volumeNum : null
        const end = m.endDateIso || m.endDate || eventEnd
        return { yes, volume, q: (m.question || '').toLowerCase(), end }
      })
      .filter((x): x is { yes: number; volume: number | null; q: string; end: string | undefined } => x != null)
    if (!parsed.length) return null
    const token = distinctiveToken(hint)
    const pick = (token && parsed.find((m) => m.q.includes(token))) || parsed[0]
    return { prob: pick.yes, volume: pick.volume, resolutionDate: toIsoDate(pick.end ?? eventEnd) }
  } catch {
    return null
  }
}

async function fetchKalshi(ticker: string): Promise<Quote | null> {
  try {
    const res = await fetch(`${KALSHI}/markets/${encodeURIComponent(ticker)}`, {
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    const m = ((await res.json()) as { market?: Record<string, number | string | null> }).market
    if (!m) return null
    const numOf = (v: unknown): number | null => (typeof v === 'number' ? v : null)
    // dollar_volume is in USD; volume is in contracts (each settles $0-$1), so the
    // contract count is a reasonable USD upper bound when no dollar figure is given.
    const dollarVol = numOf(m.dollar_volume)
    const contractVol = numOf(m.volume)
    const volume = dollarVol && dollarVol > 0 ? dollarVol : contractVol && contractVol > 0 ? contractVol : null
    const resolutionDate = toIsoDate(m.expiration_time ?? m.close_time)
    // Prices are in cents (0-100). Prefer last trade, else the bid/ask midpoint.
    const last = numOf(m.last_price)
    if (last && last > 0) return { prob: last / 100, volume, resolutionDate }
    const bid = numOf(m.yes_bid)
    const ask = numOf(m.yes_ask)
    if (bid != null && ask != null && (bid > 0 || ask > 0)) {
      return { prob: (bid + ask) / 2 / 100, volume, resolutionDate }
    }
    return null
  } catch {
    return null
  }
}

// Metaculus gates its API behind a token. With METACULUS_API_TOKEN set we read
// the recency-weighted community prediction for a binary question; without it,
// or on any failure, we return null and the caller still links the question
// (prob shows as “—”). Metaculus has no money at stake, so volume is always null.
async function fetchMetaculus(id: number, kind: 'binary' | 'date' = 'binary'): Promise<Quote | null> {
  if (!METACULUS_TOKEN) return null
  try {
    const res = await fetch(`${METACULUS}/posts/${id}/`, {
      headers: { Authorization: `Token ${METACULUS_TOKEN}` },
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    const d = (await res.json()) as {
      question?: {
        scheduled_close_time?: string
        scaling?: { range_min?: number; range_max?: number }
        aggregations?: { recency_weighted?: { latest?: { centers?: number[]; means?: number[] } } }
      }
    }
    const q = d.question
    const resolutionDate = toIsoDate(q?.scheduled_close_time)
    const latest = q?.aggregations?.recency_weighted?.latest
    const center = latest?.centers?.[0] ?? latest?.means?.[0]
    if (typeof center !== 'number') return null
    if (kind === 'date') {
      // Date questions report the community CDF location in 0..1; unscale it
      // linearly across the question's range (unix seconds) to a median year.
      const min = q?.scaling?.range_min
      const max = q?.scaling?.range_max
      if (typeof min !== 'number' || typeof max !== 'number') return null
      const year = new Date((min + center * (max - min)) * 1000).getFullYear()
      if (!Number.isFinite(year)) return null
      return { prob: null, volume: null, readout: `~${year}`, resolutionDate }
    }
    return { prob: center, volume: null, resolutionDate }
  } catch {
    return null
  }
}

// Bayes Market (futarchy.ai) publishes its whole belief network in one call. We
// fetch it once per render pass, cache it, and look up each node by variableId.
// It is play-money, so volume is always null (no USD is at stake); the node's
// `marginals.yes` is the crowd probability. resolutionDate is not in the payload,
// so the caller supplies it from the mapping.
type FutarchyNode = { variableId?: string; marginals?: { yes?: number } }
let futarchyCache: Promise<Map<string, number>> | null = null

function loadFutarchyMarginals(): Promise<Map<string, number>> {
  if (futarchyCache) return futarchyCache
  futarchyCache = (async () => {
    const map = new Map<string, number>()
    try {
      const res = await fetch(`${FUTARCHY}/net/markets`, { next: { revalidate: REVALIDATE } })
      if (!res.ok) return map
      const body = (await res.json()) as { markets?: FutarchyNode[] } | FutarchyNode[]
      const nodes = Array.isArray(body) ? body : (body.markets ?? [])
      for (const n of nodes) {
        const yes = n.marginals?.yes
        if (n.variableId && typeof yes === 'number') map.set(n.variableId, yes)
      }
    } catch {
      // leave the map empty; callers still link the question with prob = null
    }
    return map
  })()
  return futarchyCache
}

async function fetchFutarchy(variableId: string, resolutionDate: string): Promise<Quote | null> {
  const map = await loadFutarchyMarginals()
  const yes = map.get(variableId)
  if (typeof yes !== 'number') return null
  return { prob: yes, volume: null, resolutionDate }
}

async function fetchRef(ref: MarketRef): Promise<Quote | null> {
  switch (ref.platform) {
    case 'polymarket':
      return fetchPolymarket(ref.slug, ref.hint)
    case 'kalshi':
      return fetchKalshi(ref.ticker)
    case 'metaculus':
      return fetchMetaculus(ref.id, ref.kind)
    case 'futarchy':
      return fetchFutarchy(ref.variableId, ref.resolutionDate)
  }
}

/** Resolve one mapping into a display-ready signal (best-match, with fallback). */
export async function resolveSignal(m: MarketMapping): Promise<MarketSignal> {
  if (m.match === 'gap' || !m.primary) {
    return { match: 'gap', platform: null, prob: null, volume: null, question: null, url: null, viaFallback: false, note: m.note }
  }
  const primary = await fetchRef(m.primary)
  if (primary != null) {
    return {
      match: m.match,
      platform: m.primary.platform,
      prob: primary.prob,
      volume: primary.volume,
      readout: primary.readout,
      resolutionDate: primary.resolutionDate ?? null,
      question: m.primary.question,
      url: m.primary.url,
      viaFallback: false,
      note: m.note,
    }
  }
  if (m.fallback) {
    const fb = await fetchRef(m.fallback)
    if (fb != null) {
      return {
        match: m.match,
        platform: m.fallback.platform,
        prob: fb.prob,
        volume: fb.volume,
        readout: fb.readout,
        resolutionDate: fb.resolutionDate ?? null,
        question: m.fallback.question,
        url: m.fallback.url,
        viaFallback: true,
        note: m.note,
      }
    }
  }
  // Market exists but no live price available — still link it.
  return {
    match: m.match,
    platform: m.primary.platform,
    prob: null,
    volume: null,
    question: m.primary.question,
    url: m.primary.url,
    viaFallback: false,
    note: m.note,
  }
}

/** Resolve every mapping, keyed by inflection-point title. */
export async function resolveAllSignals(): Promise<Record<string, MarketSignal>> {
  const entries = await Promise.all(
    MARKET_MAPPINGS.map(async (m) => [m.title, await resolveSignal(m)] as const),
  )
  return Object.fromEntries(entries)
}
