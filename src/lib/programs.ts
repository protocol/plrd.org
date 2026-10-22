import whySovereignAi from '@/data/fa2/programs/why-sovereign-ai.json'
import broadListeningSimocracy from '@/data/fa2/programs/broad-listening-simocracy.json'
import hypercerts from '@/data/fa2/programs/hypercerts.json'
import governmentPilotPartnership from '@/data/fa2/programs/government-pilot-partnership.json'
import sovereignAiForFunders from '@/data/fa2/programs/sovereign-ai-for-funders.json'

/**
 * FA2 programs: one-page sheets with their evidence, published twice from
 * one JSON file in src/data/fa2/programs/. The web edition renders it at
 * /areas/economies-governance/programs/<slug>/, and `npm run build-programs`
 * prints the same file to public/programs/<slug>.pdf with a cover plate
 * beside it for the shelf on the FA2 page.
 *
 * Each sheet names its layout (three-propositions, explainer, partnership or
 * summary), and the layout fixes its shape. Prose fields may carry
 * [label](href) links; site paths stay on the site in the web edition and
 * become full plrd.org links on paper.
 *
 * Add a sheet: write its JSON, add it to `programs` below, and run
 * `npm run build-programs <slug>`.
 */

export type Evidence = { figure: string; caption: string; source: string; url: string }
type Item = { title: string; text: string }
export type Lead = { lead: string; text: string; source?: string; url?: string }
type Labelled<T> = { label: string; aside?: string; items: T[] }
/** A claim card: a title, its promise, the claim, and the evidence at its foot. */
type Claim = { title: string; promise: string; text: string; evidence: Evidence[] }
/** Numbered cards, each a title and its text. */
export type Cards = Labelled<Item>
/** Numbered steps on a thread, with the bar or rule printed under them. */
export type Steps = Labelled<Item> & { barLead: string; bar: string }
export type Limit = { kicker: string; title: string; text: string }
export type WayIn = { kicker: string; title: string; text: string; people: string }

type ProgramBase = {
  slug: string
  /** Printed top right, before the date: "Economies & Governance · Program". */
  kicker: string
  date: string
  /** The day every figure was last checked against its source. */
  checked: string
  title: string
  subtitle: string
  /** The sheet's name on the shelf and in the breadcrumb. */
  label: string
  /** One sentence for the shelf and for search. */
  summary: string
  standfirst: string
  image: string
  imageAlt: string
  imagePosition?: string
  about: string
  contact: string
  footerCta?: { label: string; href: string }
  notes?: { label: string; items: { label: string; url: string }[] }
}

export type ThreePropositionsProgram = ProgramBase & {
  layout: 'three-propositions'
  propositionsLabel: string
  propositionsAside: string
  propositions: Claim[]
  innovation: {
    label: string
    aside: string
    modes: { word: string; text: string; source: string; url: string }[]
    example: { kicker: string; title: string; text: string }
  }
  limit: Limit
  start: { kicker: string; title: string; text: string; next: string }
}

export type PartnershipProgram = ProgramBase & {
  layout: 'partnership'
  gap: { paragraphs: string[] } & Evidence
  bring: Cards
  steps: Steps
  starts: Labelled<Lead>
  why: Labelled<Lead>
  ask: Labelled<Lead>
  wayIn: WayIn
}

export type ExplainerProgram = ProgramBase & {
  layout: 'explainer'
  toolsLabel: string
  toolsAside: string
  tools: Claim[]
  steps: Steps
  ran: Labelled<Lead>
  uses: Labelled<Lead>
  limit: Limit
  wayIn: WayIn
}

/** A program summed up for one audience, such as funders. */
export type SummaryProgram = ProgramBase & {
  layout: 'summary'
  reasons: Labelled<Claim>
  funding: Cards
  steps: Steps
  takePart: Labelled<Lead>
  why: Labelled<Lead>
  limit: Limit
  wayIn: WayIn
}

export type Program = ThreePropositionsProgram | ExplainerProgram | PartnershipProgram | SummaryProgram

/**
 * The JSON keeps its layout as a plain string, which the print build reads
 * too. Check it here so a sheet cannot print one way and render another.
 */
function laidOut<L extends Program['layout']>(json: { slug: string; layout: string }, layout: L) {
  if (json.layout !== layout) throw new Error(`program ${json.slug}: layout is ${json.layout}, expected ${layout}`)
  return layout
}

/** On the shelf in this order: why, then what, then how governments and funders take part. */
export const programs: Program[] = [
  { ...whySovereignAi, layout: laidOut(whySovereignAi, 'three-propositions') },
  { ...broadListeningSimocracy, layout: laidOut(broadListeningSimocracy, 'explainer') },
  { ...hypercerts, layout: laidOut(hypercerts, 'explainer') },
  { ...governmentPilotPartnership, layout: laidOut(governmentPilotPartnership, 'partnership') },
  { ...sovereignAiForFunders, layout: laidOut(sovereignAiForFunders, 'summary') },
]

export const programHref = (slug: string) => `/areas/economies-governance/programs/${slug}/`
export const programPdf = (slug: string) => `/programs/${slug}.pdf`
export const programCover = (slug: string) => `/programs/${slug}.webp`

/** "Program" or "Partnership": the last word of the printed kicker. */
export const programKind = (program: Program) => program.kicker.split(' · ').pop() ?? 'Program'

/** Program prose without its link syntax, for metadata and other plain text. */
export const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
