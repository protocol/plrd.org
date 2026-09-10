// ── Impact Dashboard — the field-velocity data model ──────────────────────────
//
// The page names the interventions PL R&D runs, then reads whether the fields we
// back are speeding up. It imports focus-area metadata, inflection points, and
// the two-axis colors from `@/lib/inflection-points` as the single source of
// truth.
//
// The model, in one line:
//   Interventions    = a fixed toolkit we push on, per field.
//   Field velocity   = the rate a field is moving, read through five instruments
//                      (performance curves, latency compression, idea vintage,
//                      revealed commitments, markets).
//   Inflection points = the specific, dated markers we track, each with its live
//                      signal.
//
// Where we do not yet have a reading, a metric renders "n/a" rather than an
// invented value.

import {
  INFLECTION_POINTS,
  FOCUS_AREAS,
  FIELD_COLOR,
  FIELD_INK,
  HAND_COLOR,
  LIVE_COLOR,
  type FocusAreaKey,
  type InflectionPoint,
} from '@/lib/inflection-points'

// Re-export the shared color + two-axis primitives so components import from one
// place and the theme-aware dark-mode handling is reused verbatim.
export { FIELD_COLOR, FIELD_INK, HAND_COLOR, LIVE_COLOR }
export { FOCUS_AREAS, INFLECTION_POINTS }
export type { FocusAreaKey, InflectionPoint }

export const FIELD_VELOCITY_OVERVIEW = '/impact-preview-eb61fba1b98e/'
export const FIELD_VELOCITY_ORIGIN = 'https://www.plrd.org'

// Shared public copy: the overview and API must explain the same reading rules.
export const FIELD_VELOCITY_METHODOLOGY = {
  intro: 'We document the interventions PL R&D runs, then observe how each field changes. The toolkit describes our work; field velocity and inflection points describe the field, not a causal score for PL.',
  attribution: 'Fields move with or without PL. We do not claim these interventions directly cause a field to accelerate: field-level attribution is not cleanly identifiable. We name what we run and watch whether the field moves; making that link clearer remains research work.',
  observedVelocity: 'Field velocity is the rate a field is moving. We read it through five instrument categories, each able to hold multiple field-specific measures, plus dated, falsifiable markers. Not every measure fits every field. Having no single gating cost does not mean there is no capability curve: comparable cost, scale, quality or capability measures can still be tracked. An unpriced milestone has no market signal; missing data is not evidence of no progress.',
  stocksAndFlows: 'Stocks are not velocity. Compare annual additions or changes using comparable units, definitions and observation windows; acceleration requires a change in that rate, not just a larger total. Mapped-volume frontiers can measure capability; available data-hours are a data resource stock; cumulative implants are an adoption and commitment stock. They are not all pure performance curves. Keep coverage, quality, access and the observation cutoff explicit before comparing them.',
} as const

// ── The toolkit — PL R&D interventions ────────────────────────────────────────
// Seven interventions we run to move a field. The short entry (title, subtitle,
// oneLiner) renders in the methodology grid; the full description renders in the
// modal.

export type ToolId =
  | 'legibility'
  | 'connection'
  | 'funding'
  | 'policy'
  | 'infrastructure'
  | 'translation'
  | 'culture'

export type ToolkitEntry = {
  id: ToolId
  title: string
  subtitle: string
  proposed?: boolean
  /** One-line description for the scannable methodology grid. */
  oneLiner: string
  /** A few concrete example instances (label + link + short blurb), shown as
   *  boxes in the detail modal. */
  examples: { label: string; href: string; blurb?: string }[]
  /** Fuller, published-style description shown in the modal. */
  description: string
}

export const TOOLKIT_V2: ToolkitEntry[] = [
  {
    id: 'legibility',
    title: 'Legibility',
    subtitle: 'field-building communications',
    oneLiner: 'Maps, roadmaps, benchmarks, and tutorials that make a field navigable.',
    examples: [
      { label: 'Insights', href: '/insights/', blurb: 'Roadmaps, essays, and field maps from PL R&D.' },
    ],
    description:
      'Many early fields are blocked by illegibility, to both internal and external audiences. The progress is real, but the map is missing. Researchers cannot easily find adjacent teams. Founders cannot tell which problems are ready for company formation. Funders cannot distinguish noise from signal. Policymakers cannot see which interventions would help rather than slow progress. Written artifacts like a field map, taxonomy, roadmap, whitepaper, benchmark, policy brief, or public research agenda can turn a loose collection of teams, researchers, and funders into a field with sustained momentum. Legibility also has a second audience: working builders. A field is fully legible only when a competent outsider can build in it, so tutorials, reference builds, teardowns, and partnerships with hands-on educators count as field-building communications alongside the papers.',
  },
  {
    id: 'connection',
    title: 'Connection',
    subtitle: 'convenings & sustained cohorts',
    oneLiner: 'Rooms that keep the right people in contact over time.',
    examples: [
      {
        label: 'PL Neuro events',
        href: 'https://www.plneuro.xyz/events/',
        blurb: 'PL Neuro’s convenings and event series.',
      },
      {
        label: 'Funding the Commons',
        href: 'https://www.fundingthecommons.io/',
        blurb: 'A convening series on funding public goods.',
      },
    ],
    description:
      'Some bottlenecks are social instead of technical. The right talent may already exist to unlock a breakthrough, but the field has not yet connected them. PL R&D runs and supports convenings, retreats, workshops, residencies, hackathons, and advisory networks that bring high-context people together around specific bottlenecks. Two design rules do most of the work. Mix kinds, not just seniority: the productive rooms pair researchers with builders and operators, because that pairing is where research turns into working systems. And sustain the contact: innovation spreads person to person, so recurring cohorts, alumni networks, and apprenticeship-style pairings matter more than one-off events. The goal is not to host events, but to forge new collaborations, companies, grants, pilots, and enable shared roadmaps to emerge.',
  },
  {
    id: 'funding',
    title: 'Funding',
    subtitle: 'grants, prizes & fellowships',
    oneLiner: 'Early money and prizes where small amounts unlock outsized effort.',
    examples: [
      {
        label: 'FIL-PropGF',
        href: 'https://www.filecoin.io/blog/introducing-fil-propgf-a-new-era-in-community-led-public-goods-funding-for-the-filecoin-ecosystem',
        blurb: 'Community-led public goods funding for the Filecoin ecosystem.',
      },
    ],
    description:
      'Many important ideas are too early for venture capital and too applied for traditional academic funding. Some need small grants to test whether a primitive works. Others need prizes, RFPs, fellowships, or retroactive funding to pull effort into an underbuilt area. A well-designed prize does more than pay out: it defines what counts as "first" in a field and sets the ambition bar for everyone watching. Where breakthrough variance is the goal, we prefer funding people over projects, with longer horizons and tolerance for early failure. Some of the highest-return grants buy entry rather than output: fellowships, residencies with equipment access, and support for the educators who give newcomers their first hands-on contact with a field. PL R&D deploys and helps coordinate early funding where a field-level bottleneck is clear and where small early funding can unlock much larger downstream effort.',
  },
  {
    id: 'policy',
    title: 'Policy',
    subtitle: 'standards & experimentation rights',
    oneLiner: 'Adoption paths for working tech, and room to experiment.',
    examples: [
      { label: 'SAFT', href: 'https://saft-project.org/', blurb: 'A framework for safe, legal experimentation.' },
    ],
    description:
      'Frontier technologies often reach a point where the rules do not yet recognize what is possible. That can block adoption even when the technology works. In those cases, progress may require standards bodies, regulatory sandboxes, procurement pathways, model frameworks, or partnerships with public institutions. Adoption is half the job. Fields also need legal room to experiment at small scale: sandbox access for individuals and not only companies, hardware that may be repaired and modified, and workable pathways for citizen science in regulated domains. Many of the people a field will depend on in 10 years are amateurs today, and rules written only for incumbents quietly price them out. PL R&D engages in research, thought leadership, and participation in policy and standards-setting discussions with the goal of creating better rules, which, in turn, help responsible technologies reach users faster.',
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    subtitle: 'primitives, rails & cheap tools',
    oneLiner: 'Open protocols and cheap tools that collapse the cost of trying things.',
    examples: [
      { label: 'atproto', href: 'https://atproto.com/', blurb: 'The open protocol behind Bluesky.' },
      { label: 'IPFS', href: 'https://ipfs.tech/', blurb: 'The content-addressed storage protocol.' },
    ],
    description:
      'Sometimes the missing piece is open protocols, public-good infrastructure, or neutral rails that no single company has sufficient incentive to build alone. When a missing primitive or shared infrastructure layer is blocking a field, PL R&D may help build it directly, support the teams building it, or coordinate an ecosystem capable of maintaining it over time. Two kinds of rails get special attention. Tool-cost infrastructure: open reference designs, shared facilities, and instrument cost-down programs that collapse the price of trying things, especially in hardware fields where a single experiment can cost a career. And attribution infrastructure: content-addressed, timestamped records of who built what, and when, so that priority and credit work for protocols, designs, datasets, and negative results the way they already work for papers.',
  },
  {
    id: 'translation',
    title: 'Translation',
    subtitle: 'venture conversion & visibility',
    oneLiner: 'Routing validated work to pilots, production, and capital.',
    examples: [
      { label: 'Simocracy', href: 'https://www.simocracy.org/', blurb: 'Routing validated work toward deployment.' },
    ],
    description:
      'Some work reaches the point where the bottleneck is no longer research but translation into pilot, production, and scale. PL R&D connects projects within the broader Protocol Labs network, including venture, capital, platform, and ecosystem support, to help promising work find the right deployment path, talent, and resources to succeed. Translation also has a scouting side: much of the most promising invention happens outside institutions and stays invisible until someone surfaces it. Part of this tool is finding independent builders before the market can see them and lending them the network\u2019s visibility, alongside converting the projects we already know.',
  },
  {
    id: 'culture',
    title: 'Culture',
    subtitle: 'celebrating the improving mentality',
    oneLiner: 'Open-ended creative bets that recruit people into building.',
    examples: [
      { label: 'Film', href: 'https://www.youtube.com/watch?v=l44z35vabvA', blurb: 'A creative bet that recruits people into building.' },
    ],
    description:
      'Every sustained acceleration of invention has run on a culture that treats improvement as a personal calling, spread from person to person. That culture is the hardest condition to engineer, so we treat this tool as our wildcard: deliberately open-ended creative bets that recruit people into building. That might mean backing a film or a book, a photography prize that rewards human ingenuity, or a worldbuilding competition that makes a field\u2019s future concrete enough to want. Ask inventors where they started and they often name an artifact: a book, a film, a kit. Most of these bets will miss. The hits compound for decades, and we will track them on the same scoreboard as everything else we fund.',
  },
]

// The five velocity instruments and their per-focus-area readings now live in
// `@/lib/velocity-instruments` (the single source of truth for that prose).
