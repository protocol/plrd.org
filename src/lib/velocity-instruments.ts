// ── Velocity instruments — the single source of truth ─────────────────────────
//
// The five instruments we read a field's velocity with. The full description
// prose lives HERE and is rendered in exactly one place: the individual
// instrument definition modal. The aggregate "Field velocity" modal shows
// readings and charts only, and links each instrument title back here.
//
// Instrument records are declared PER FOCUS AREA and are deliberately ragged: a
// field declares only the instruments that apply to it. Where a reading is not
// live, the record is `unwired` (a named candidate metric plus its blocker) or
// `not_applicable` (a reason). We never fabricate a value, trend, date, or
// series — an honest `unwired` is a correct answer.

import type { FocusAreaKey } from '@/lib/inflection-points'
import { LIVE_COLOR } from '@/lib/inflection-points'

export type InstrumentId =
  | 'performance_curves'
  | 'latency_compression'
  | 'idea_vintage'
  | 'revealed_commitments'
  | 'markets'

export type VelocityInstrument = {
  id: InstrumentId
  label: string
  /** Short, scannable description of what the instrument is. */
  subtitle: string
  /** Fuller description — the only copy of this prose in the codebase. */
  description: string
}

// Prose moved verbatim from the previous VELOCITY_MEASURES.
export const VELOCITY_INSTRUMENTS: VelocityInstrument[] = [
  {
    id: 'performance_curves',
    label: 'Performance curves',
    subtitle: 'Cost or capability per unit, tracked over time.',
    description:
      'How much a fixed unit of output costs, or how much capability one unit buys, tracked over time: dollars per genome sequenced, per watt of solar, per kWh of battery, transistors per chip. These are real rates with units attached, and they tend to fall along steady curves, which makes them the most predictable trend in a field. Multiple field-specific cost and capability measures can coexist; a field need not have a single gating unit. Compare like-for-like units and observation windows before reading a rate of change.',
  },
  {
    id: 'latency_compression',
    label: 'Latency compression',
    subtitle: 'The lag between pipeline stages, and whether it is shrinking.',
    description:
      'The time it takes work to move from one stage to the next, and whether that lag is getting shorter: a preprint to a replication, a published method to a working open-source implementation, a demo to a shipped product. This tracks the pipeline itself rather than how much is flowing through it, so a shrinking lag is a direct read on acceleration.',
  },
  {
    id: 'idea_vintage',
    label: 'Idea vintage',
    subtitle: 'Whether the age of the ideas new work builds on is turning.',
    description:
      'The median age of the references cited by new work in a field, computed from the text a field already produces. We do not read the level, because a field accumulates its own canon and reference age drifts upward as a literature ages, so the level says more about a field’s age than its pace. Instead we fit a two-segment trend and read the slope of the most recent segment only: a falling recent median (newer work leaning on fresher ideas) reads as accelerating, a rising one as decelerating, and we say so only when the slope clears its own noise band. Two honest caveats. A rising reference age is not always stagnation: it is also what a field does as it grows by absorbing entrants from adjacent disciplines, who bring older foundational citations with them. And the reliable window structurally excludes the two most recent years, which OpenAlex has not finished indexing, so the freshest reading a field can have is always about two years old. Because that lag is built in rather than a sign the reading was never refreshed, this instrument is exempt from the staleness flag the other instruments carry; it still only shows a direction when the recent-segment trend is statistically clear. We read this two ways. Paper vintage uses academic references (the live reading). Patent vintage is the invention-side twin: the median age of the patents a new patent cites as prior art, which is examiner-curated and venue-neutral, so it does not drift as a field adopts preprints, though it carries the same lag. It does not apply to open-source, public-goods native fields, which deliberately do not patent, so a low patent reading there would measure enclosure rather than slowness.',
  },
  {
    id: 'revealed_commitments',
    label: 'Revealed commitments',
    subtitle: 'Where people put money and careers, not just attention.',
    description:
      'Where people actually place bets: talent switching into the field, external capital forming around it, and job postings that name the technology. Money and careers are commitments and carry more signal than press or social attention, which is easy to manufacture.',
  },
  {
    id: 'markets',
    label: 'Markets',
    subtitle: 'What forecast markets imply about when a milestone arrives.',
    description:
      'What forecast markets and prediction platforms imply about when a milestone will arrive, and whether that date is pulling in. Asking the same milestone at several time horizons gives a term structure, a kind of yield curve for a field, where an earlier implied date means expected acceleration. These need careful reading: markets can be thin, questions can resolve ambiguously, and for an org whose main channel is attention, our own work can move the very markets we are reading.',
  },
]

export const INSTRUMENT_BY_ID: Record<InstrumentId, VelocityInstrument> = Object.fromEntries(
  VELOCITY_INSTRUMENTS.map((i) => [i.id, i]),
) as Record<InstrumentId, VelocityInstrument>

// Rendered as an extra definition card alongside the five instruments in the
// methodology. Not an instrument, so it is never part of a reading record.
export const INFLECTION_EXPLAINER = {
  id: 'inflection_points',
  label: 'Inflection points',
  subtitle: 'Dated, falsifiable shifts we expect an accelerating field to produce.',
  description:
    'Alongside the five instruments, each field names a small set of inflection points: specific, dated, falsifiable shifts that an accelerating field should produce, each paired with a live signal. They are markers rather than targets. Reaching one is evidence the field is moving, and the live signal shows how close it is.',
}

// ── Instrument records ────────────────────────────────────────────────────────

export type InstrumentState = 'reading' | 'unwired' | 'not_applicable'
export type Direction = 'accelerating' | 'flat' | 'decelerating' | 'unclear'

export type InstrumentRecord = {
  instrument: InstrumentId
  state: InstrumentState

  // state: 'reading'
  metric?: string
  value?: string
  trend?: string
  direction?: Direction
  window?: string
  /** The date the underlying OBSERVATION refers to (e.g. the latest reliable
   *  year, or the month a survey counted). Distinct from checkedAt. Required on
   *  every reading. A reading whose measuredAt is older than STALE_AFTER_MONTHS
   *  renders a stale marker and has its direction chip suppressed. */
  measuredAt?: string // ISO date
  /** The date the pipeline last RAN / the source was last consulted. May be much
   *  more recent than measuredAt when the observation itself is inherently
   *  lagged (idea vintage's reliable window ends ~2 years back). */
  checkedAt?: string // ISO date
  /** Primary series. `lo`/`hi` drive an optional confidence band; `reliable:false`
   *  marks trailing points that render dashed and are excluded from direction. */
  series?: { x: string | number; y: number; lo?: number; hi?: number; reliable?: boolean }[]
  /** Rendering hint for the sparkline; doubling trends read best on a log axis. */
  seriesScale?: 'linear' | 'log'
  /** Optional secondary line (e.g. a normalizer), rendered dashed and muted. */
  series2?: { x: string | number; y: number }[]
  series2Label?: string
  /** Frozen provenance surfaced in the modal so a series stays self-comparable. */
  provenance?: { query?: string; generated?: string }
  sources?: { label: string; url: string }[]

  // state: 'unwired'
  candidateMetric?: string
  blocker?: string
  owner?: string

  // state: 'not_applicable'
  reason?: string

  /** Idea vintage only: the patent-side twin reading (median age of the patents a
   *  new patent cites as prior art). Read the same way as paper vintage, from an
   *  examiner-curated, venue-neutral source. Rendered as a second chart in the
   *  idea-vintage modal. Injected per focus area (unwired for patenting fields,
   *  not_applicable for open-source / public-goods native ones). */
  patentVintage?: PatentVintage
}

export type PatentVintage = {
  state: InstrumentState
  // state: 'reading'
  value?: string
  series?: { x: number; y: number }[]
  direction?: Direction
  measuredAt?: string
  sources?: { label: string; url: string }[]
  // state: 'unwired'
  candidateMetric?: string
  blocker?: string
  // state: 'not_applicable'
  reason?: string
}

export const DIRECTION_META: Record<
  Direction,
  { label: string; glyph: string; color: string }
> = {
  accelerating: { label: 'Accelerating', glyph: '↗', color: LIVE_COLOR },
  flat: { label: 'Flat', glyph: '→', color: '#6b7280' },
  decelerating: { label: 'Decelerating', glyph: '↘', color: '#d0894b' },
  unclear: { label: 'Unclear', glyph: '~', color: '#9ca3af' },
}

// ── Staleness policy ──────────────────────────────────────────────────────────
// A reading is only reported as current for a bounded time after the observation
// it refers to. Past that, we keep showing the number (with a stale marker) but
// suppress the direction chip: a metric that has not been re-measured is
// unmeasured, not "flat". This policy is published verbatim in the methodology.
export const STALE_AFTER_MONTHS = 12

/** Whole-ish months between an ISO date and `now` (default: build time). */
export function monthsSince(iso: string | undefined, now: Date = new Date()): number | null {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
}

// Instruments whose freshest possible reading is inherently lagged: their
// reliable window structurally trails ~2 years (OpenAlex finishes indexing a
// year's references only ~2 years later), so a 2-year-old reading here is the
// current one, not a neglected one. These are exempt from the staleness policy;
// their direction still only renders when the changepoint math is confident.
const STALENESS_EXEMPT: ReadonlySet<InstrumentId> = new Set(['idea_vintage'])

/** A reading is stale when its measured observation is older than the policy,
 *  unless the instrument is inherently lagged (see STALENESS_EXEMPT). */
export function isStaleReading(r: InstrumentRecord, now: Date = new Date()): boolean {
  if (r.state !== 'reading') return false
  if (STALENESS_EXEMPT.has(r.instrument)) return false
  const m = monthsSince(r.measuredAt, now)
  return m != null && m > STALE_AFTER_MONTHS
}

/** The direction to actually render: suppressed (undefined) for a series shorter
 *  than three points, an absent series, or a stale reading. Never invents 'flat'
 *  for a single observation. */
export function shownDirection(r: InstrumentRecord, now: Date = new Date()): Direction | undefined {
  if (r.state !== 'reading' || !r.direction) return undefined
  if (!r.series || r.series.length < 3) return undefined
  if (isStaleReading(r, now)) return undefined
  return r.direction
}

// Per-focus-area instrument sets. Ragged by design: a field lists only the
// instruments that apply. Every `reading` is sourced; everything else is an
// honest `unwired` or `not_applicable`. See the seeding notes per field.
export const INSTRUMENT_RECORDS: Partial<Record<FocusAreaKey, InstrumentRecord[]>> = {
  'digital-human-rights': [
    {
      instrument: 'performance_curves',
      state: 'unwired',
      candidateMetric: 'Cost of verifiable storage per TB-year (Filecoin / Arweave vs. a centralized baseline)',
      blocker: 'No apples-to-apples public series exists yet across providers and durability guarantees.',
    },
    {
      instrument: 'latency_compression',
      state: 'unwired',
      candidateMetric:
        'Lag from a cryptographic primitive being published to a production open-source implementation (SNARK libraries are the cleanest series)',
      blocker: 'Needs a curated corpus of primitive-to-implementation dates before a lag can be computed.',
    },
    {
      instrument: 'idea_vintage',
      state: 'unwired',
      candidateMetric: 'median reference age from OpenAlex',
      blocker: 'awaiting first run of scripts/velocity/field_velocity_openalex.py',
      owner: 'Lukas',
    },
    {
      instrument: 'revealed_commitments',
      state: 'reading',
      metric: 'Open-source crypto-ecosystem developers (a proxy for the builder base this field draws on)',
      value: '23,613 monthly active developers (Nov 2024)',
      trend: 'Total developers down ~7% year over year; established developers (2+ years) up 27%',
      // No `direction`: this is a two-point annual snapshot, not a series we can
      // read a trend from, and it has not been re-measured since. The chip is
      // suppressed rather than showing a false "flat".
      window: '2023 → 2024',
      measuredAt: '2024-11-01', // the report counts developers active in Nov 2024
      checkedAt: '2024-12-12', // the date the report was published / last consulted
      sources: [
        { label: 'Electric Capital — 2024 Developer Report', url: 'https://www.developerreport.com/developer-report' },
        {
          label: 'CoinDesk — coverage of the 2024 report',
          url: 'https://www.coindesk.com/tech/2024/12/12/solana-was-the-biggest-draw-for-new-crypto-developers-in-2024-electric-capital',
        },
      ],
    },
    {
      instrument: 'markets',
      state: 'unwired',
      candidateMetric: 'Implied arrival dates across the identity and AI-regulation markets mapped to this field',
      blocker: 'The term-structure aggregation is not built; the live crowd forecasts are shown per market below.',
    },
  ],
  'economies-governance': [
    {
      instrument: 'performance_curves',
      state: 'unwired',
      candidateMetric: 'Cost or capability of comparable programmable-allocation and governance processes',
      blocker:
        'Comparable units, quality thresholds and observation windows are not yet defined; no series is wired. The absence of a single manufactured gating unit does not rule out domain-specific capability curves.',
    },
    {
      instrument: 'latency_compression',
      state: 'unwired',
      candidateMetric: 'Pilot-to-production lag for digital public infrastructure',
      blocker: 'Too few completed pilot-to-production transitions exist yet to time a lag.',
    },
    {
      instrument: 'idea_vintage',
      state: 'unwired',
      candidateMetric: 'median reference age from OpenAlex',
      blocker: 'awaiting first run of scripts/velocity/field_velocity_openalex.py',
      owner: 'Lukas',
    },
    {
      instrument: 'revealed_commitments',
      state: 'unwired',
      candidateMetric: 'Capital moved through programmable allocation (Gitcoin, Hypercerts, retroactive funding rounds)',
      blocker: 'Figures are scattered across rounds with no single audited time series.',
    },
    {
      instrument: 'markets',
      state: 'not_applicable',
      reason:
        'No liquid forecast market prices programmable-allocation or digital-public-infrastructure milestones, so there is no market signal to read.',
    },
  ],
  'ai-robotics': [
    {
      instrument: 'performance_curves',
      state: 'reading',
      metric: '50%-task-completion time horizon on software tasks (the task length an agent finishes half the time)',
      value: 'Doubling roughly every 7 months',
      trend: '≈7-month doubling over six years',
      // The METR doubling series is not yet encoded as `series` points here, so
      // the direction chip is intentionally suppressed (no chip without ≥3
      // plotted points). The claim lives in the sourced prose, not a live arrow.
      // TODO(lukas): transcribe the METR time-horizon points so the chip earns back in.
      window: '2019 → 2025',
      measuredAt: '2025-03-19',
      checkedAt: '2025-03-19',
      sources: [
        {
          label: 'METR — Measuring AI Ability to Complete Long Tasks',
          url: 'https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/',
        },
        { label: 'arXiv:2503.14499', url: 'https://arxiv.org/abs/2503.14499' },
      ],
    },
    {
      instrument: 'latency_compression',
      state: 'unwired',
      candidateMetric:
        "Median days from a paper's arXiv publication to the first commit of a linked open-source implementation, per year (a falling lag = faster paper-to-code)",
      blocker:
        'Generator is built (scripts/velocity/latency_pwc.py, over the CC-BY-SA Papers With Code link archive + arXiv + GitHub first-commit dates); awaiting a run against the archived links file to emit src/data/velocity/latency/ai-robotics.csv.',
      owner: 'Lukas',
    },
    {
      instrument: 'idea_vintage',
      state: 'unwired',
      candidateMetric: 'median reference age from OpenAlex',
      blocker: 'awaiting first run of scripts/velocity/field_velocity_openalex.py',
      owner: 'Lukas',
    },
    {
      instrument: 'revealed_commitments',
      state: 'unwired',
      candidateMetric:
        'Job postings naming the technology, plus the parameter scale trained on decentralized compute',
      blocker: 'No single audited public series exists yet.',
    },
    {
      instrument: 'markets',
      state: 'unwired',
      candidateMetric: 'Implied arrival date across the mapped AI milestone markets (their term structure)',
      blocker:
        'The term-structure aggregation is not built, and the reflexivity caveat bites hardest here: our own work can move these markets.',
    },
  ],
  neurotech: [
    {
      instrument: 'performance_curves',
      state: 'reading',
      metric: 'Simultaneously recorded neurons',
      // Headline reconciled to the series' final plotted point (2014, ~3,200);
      // the old value said ~3,000 "as of 2022" while the chart ended at 2014,
      // which disagreed. measuredAt now matches the last point.
      // TODO(lukas): add post-2014 frontier points from the Stevenson tracked
      // dataset (stevenson.lab.uconn.edu/scaling) if newer maxima can be sourced;
      // until then the curve ends where the data does.
      value: 'Up to ~3,200 neurons (2014 dataset record)',
      trend: 'Doubling roughly every 7 years, 1957 to 2014',
      direction: 'accelerating',
      window: '1957 → 2014',
      measuredAt: '2014-01-01',
      checkedAt: '2022-10-01',
      // Frontier (running-maximum) points transcribed from the tracked dataset;
      // plotted on a log axis, which is how this doubling trend is standardly shown.
      series: [
        { x: 1957, y: 2 },
        { x: 1970, y: 8 },
        { x: 1981, y: 18 },
        { x: 1991, y: 82 },
        { x: 1993, y: 148 },
        { x: 2009, y: 744 },
        { x: 2014, y: 3200 },
      ],
      seriesScale: 'log',
      sources: [
        { label: 'Stevenson — Tracking Advances in Neural Recording (UConn)', url: 'https://stevenson.lab.uconn.edu/scaling/' },
        {
          label: 'Stevenson & Kording (2011), Nature Neuroscience',
          url: 'https://www.nature.com/articles/nn.2731',
        },
      ],
    },
    {
      instrument: 'latency_compression',
      state: 'unwired',
      candidateMetric: 'Lag from animal study to first human trial, and from IDE approval to first implant',
      blocker: 'The sample of completed transitions is too small to trend.',
    },
    {
      instrument: 'idea_vintage',
      state: 'unwired',
      candidateMetric: 'median reference age from OpenAlex',
      blocker: 'awaiting first run of scripts/velocity/field_velocity_openalex.py',
      owner: 'Lukas',
    },
    {
      instrument: 'revealed_commitments',
      state: 'reading',
      metric: 'Cumulative participants in implantable BCI studies (peer-reviewed count)',
      value: '67 participants through December 2023',
      // A cumulative adoption/commitment stock, not a year-by-year rate.
      // The review includes intracortical, endovascular and ECoG systems.
      trend:
        'The review identified participants receiving implantable BCIs for communication, motor or sensory restoration, including endovascular and ECoG systems as well as intracortical implants. It excludes short-term diagnostic ECoG studies, but includes some dedicated assistive studies lasting one month. This is a historical cohort, not the current active installed base. Data collection ended in December 2023. This single cumulative observation does not establish current enrollment velocity or acceleration; comparable annual additions are not yet wired.',
      window: 'Through December 2023',
      measuredAt: '2023-12-31',
      checkedAt: '2026-09-09',
      sources: [
        {
          label: 'Patrick-Krueger et al. (2024), Nature Reviews Bioengineering',
          url: 'https://doi.org/10.1038/s44222-024-00239-5',
        },
      ],
    },
    {
      instrument: 'markets',
      state: 'unwired',
      candidateMetric:
        'Implied arrival dates across the mapped BCI and whole-brain-emulation questions (Metaculus, Polymarket, Kalshi)',
      blocker: 'The term-structure aggregation is not built; the live crowd forecasts are shown per market below.',
    },
  ],
}

export function instrumentsForArea(area: FocusAreaKey): InstrumentRecord[] {
  return INSTRUMENT_RECORDS[area] ?? []
}

// ── Patent vintage (idea-vintage's invention-side twin) ───────────────────────
// Injected per focus area rather than typed into each identical idea_vintage
// record. Open-source / public-goods native fields deliberately do not patent,
// so a patent reading there would measure enclosure, not velocity: mark it n/a.
const OPEN_SOURCE_NATIVE: ReadonlySet<FocusAreaKey> = new Set([
  'digital-human-rights',
  'economies-governance',
])

function patentVintageFor(area: FocusAreaKey): PatentVintage {
  if (OPEN_SOURCE_NATIVE.has(area)) {
    return {
      state: 'not_applicable',
      reason:
        'This field is open-source and public-goods native, so it deliberately does not patent. A low patent-vintage reading here would measure enclosure by incumbents, not the velocity of the field itself.',
    }
  }
  const assignee =
    area === 'neurotech'
      ? ', plus an assignee-country split to show where neurotech IP is forming'
      : ''
  return {
    state: 'unwired',
    candidateMetric: `Median age of the patents cited as prior art on new ${
      area === 'neurotech' ? 'neurotech' : 'AI / robotics'
    } patents, per year (USPTO PatentsView), read with the same recent-segment changepoint as paper vintage${assignee}`,
    blocker:
      'PatentsView bulk ingestion is not built, and the patent cohort (a frozen CPC + keyword query) is not yet defined.',
  }
}

/** Attach the patent-vintage twin to a field's idea_vintage record. */
export function withPatentVintage(records: InstrumentRecord[], area: FocusAreaKey): InstrumentRecord[] {
  return records.map((r) =>
    r.instrument === 'idea_vintage' ? { ...r, patentVintage: patentVintageFor(area) } : r,
  )
}

// ── OpenAlex ingestion merge ──────────────────────────────────────────────────
// A serializable payload (built server-side from a CSV) merged into the static
// records at render. Pure — no filesystem access here, so this module stays
// safe to import from the client bundle.

export type OpenAlexArea = {
  ideaVintage?: {
    series: { x: number; y: number; lo?: number; hi?: number; reliable: boolean }[]
    latest: { year: number; median: number } | null
    early: { mean: number; from: number; to: number } | null
    recent: { mean: number; from: number; to: number } | null
    reliableWindow: string
    direction: Direction
    query?: string
    generated?: string
  }
  revealed?: {
    entrants: { x: number; y: number }[]
    corpusShare: { x: number; y: number }[]
    latest: { year: number; entrants: number } | null
    window: string
    direction: Direction
    query?: string
    generated?: string
  }
}

const OPENALEX_SOURCE = { label: 'OpenAlex (CC0)', url: 'https://openalex.org' }
const GENERATOR_SOURCE = {
  label: 'scripts/velocity/field_velocity_openalex.py',
  url: 'https://github.com/protocol/plrd.org/blob/main/scripts/velocity/field_velocity_openalex.py',
}

/** Merge OpenAlex readings into a field's static records. Absent data is a no-op. */
export function withOpenAlex(records: InstrumentRecord[], data?: OpenAlexArea | null): InstrumentRecord[] {
  if (!data) return records
  return records.map((r) => {
    if (r.instrument === 'idea_vintage' && data.ideaVintage && data.ideaVintage.latest) {
      const iv = data.ideaVintage
      const latest = iv.latest as { year: number; median: number }
      const early = iv.early
      const recent = iv.recent
      const trend =
        early && recent && early.to !== recent.from
          ? `${early.mean.toFixed(1)}y avg (${early.from}–${early.to}) → ${recent.mean.toFixed(1)}y avg (${recent.from}–${recent.to}); lower = fresher ideas`
          : 'a falling median means the field is building on fresher ideas'
      return {
        instrument: 'idea_vintage',
        state: 'reading',
        metric: 'median age of references in new work (years)',
        value: `${latest.median.toFixed(1)} years (${latest.year})`,
        trend,
        direction: iv.direction,
        window: iv.reliableWindow,
        // The observation refers to the latest RELIABLE year (the reliable window
        // structurally ends ~2 years back); the pipeline last ran at `generated`.
        measuredAt: `${latest.year}-12-31`,
        checkedAt: iv.generated,
        series: iv.series,
        seriesScale: 'linear',
        provenance: { query: iv.query, generated: iv.generated },
        sources: [OPENALEX_SOURCE, GENERATOR_SOURCE],
        patentVintage: r.patentVintage, // carry the injected patent-side twin through the merge
      }
    }
    if (r.instrument === 'revealed_commitments' && data.revealed) {
      const rv = data.revealed
      const talentNote =
        'chart shows first-time authors entering the field (the talent-entry component); capital formation and job postings remain unwired'
      const shared = {
        series: rv.entrants,
        seriesScale: 'linear' as const,
        series2: rv.corpusShare,
        series2Label: 'corpus share per 100k (normalizer)',
        provenance: { query: rv.query, generated: rv.generated },
      }
      if (r.state === 'reading') {
        // Augment an existing sourced reading (e.g. DHR's Electric Capital figure)
        // with the OpenAlex talent-entry chart; keep its own value and sources.
        return {
          ...r,
          ...shared,
          metric: r.metric ? `${r.metric} (${talentNote})` : talentNote,
          sources: [...(r.sources ?? []), OPENALEX_SOURCE, GENERATOR_SOURCE],
        }
      }
      return {
        instrument: 'revealed_commitments',
        state: 'reading',
        metric:
          'First-time authors entering the field each year: the talent-entry component of revealed commitments. Capital formation and job postings remain unwired.',
        value: rv.latest ? `${rv.latest.entrants.toLocaleString()} first-time authors (${rv.latest.year})` : '—',
        direction: rv.direction,
        window: rv.window,
        measuredAt: rv.latest ? `${rv.latest.year}-12-31` : undefined,
        checkedAt: rv.generated,
        ...shared,
        sources: [OPENALEX_SOURCE, GENERATOR_SOURCE],
      }
    }
    return r
  })
}

// ── Build-time assertion ──────────────────────────────────────────────────────
// Runs when the data is imported during `next build`; a malformed record fails
// the build rather than shipping a silent gap. This is the enforcement the spec
// asks for (no test runner is configured in this repo).

export function assertInstrumentRecords(): void {
  const ids = new Set<InstrumentId>(VELOCITY_INSTRUMENTS.map((i) => i.id))
  for (const [area, records] of Object.entries(INSTRUMENT_RECORDS)) {
    const seen = new Set<InstrumentId>()
    for (const r of records ?? []) {
      const where = `${area}/${r.instrument}`
      if (!ids.has(r.instrument)) throw new Error(`velocity-instruments: unknown instrument ${where}`)
      if (seen.has(r.instrument)) throw new Error(`velocity-instruments: duplicate instrument ${where}`)
      seen.add(r.instrument)

      if (r.state === 'reading') {
        if (!r.value) throw new Error(`velocity-instruments: reading ${where} needs a value`)
        if (!r.measuredAt) throw new Error(`velocity-instruments: reading ${where} needs a measuredAt date`)
        if (!r.sources || r.sources.length < 1)
          throw new Error(`velocity-instruments: reading ${where} needs >=1 source`)
        for (const s of r.sources) {
          if (!s.url || !/^https?:\/\//.test(s.url))
            throw new Error(`velocity-instruments: reading ${where} has a source without a valid URL`)
        }
      } else if (r.state === 'unwired') {
        if (!r.candidateMetric) throw new Error(`velocity-instruments: unwired ${where} needs a candidateMetric`)
        if (!r.blocker) throw new Error(`velocity-instruments: unwired ${where} needs a blocker`)
      } else if (r.state === 'not_applicable') {
        if (!r.reason) throw new Error(`velocity-instruments: not_applicable ${where} needs a reason`)
      } else {
        throw new Error(`velocity-instruments: unknown state at ${where}`)
      }
    }
  }
}

assertInstrumentRecords()
