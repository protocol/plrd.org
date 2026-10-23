import whySovereignAi from '@/data/fa2/sovereign-ai/why-sovereign-ai.json'
import broadListeningSimocracy from '@/data/fa2/sovereign-ai/broad-listening-simocracy.json'
import hypercerts from '@/data/fa2/sovereign-ai/hypercerts.json'
import governmentPilotPartnership from '@/data/fa2/sovereign-ai/government-pilot-partnership.json'
import sovereignAiForFunders from '@/data/fa2/sovereign-ai/sovereign-ai-for-funders.json'

/**
 * The Sovereign AI program's one-page sheets: each an argument with its
 * evidence, published twice from one JSON file in src/data/fa2/sovereign-ai/.
 * The web edition renders it at /areas/economies-governance/sovereign-ai/<slug>/,
 * and `npm run build-sheets` prints the same file to
 * public/sovereign-ai/<slug>.pdf with a cover plate beside it for the shelf
 * on the FA2 page.
 *
 * Each sheet names its layout (three-propositions, explainer, partnership or
 * summary), and the layout fixes its shape. Prose fields may carry
 * [label](href) links; site paths stay on the site in the web edition and
 * become full plrd.org links on paper.
 *
 * Add a sheet: write its JSON, add it to `sheets` below, and run
 * `npm run build-sheets <slug>`.
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

type SheetBase = {
  slug: string
  /** Printed top right, before the date: "Economies & Governance · Sovereign AI program". */
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

export type ThreePropositionsSheet = SheetBase & {
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

export type PartnershipSheet = SheetBase & {
  layout: 'partnership'
  gap: { paragraphs: string[] } & Evidence
  bring: Cards
  steps: Steps
  starts: Labelled<Lead>
  why: Labelled<Lead>
  ask: Labelled<Lead>
  wayIn: WayIn
}

export type ExplainerSheet = SheetBase & {
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

/** The program summed up for one audience, such as funders. */
export type SummarySheet = SheetBase & {
  layout: 'summary'
  reasons: Labelled<Claim>
  funding: Cards
  steps: Steps
  takePart: Labelled<Lead>
  why: Labelled<Lead>
  limit: Limit
  wayIn: WayIn
}

export type Sheet = ThreePropositionsSheet | ExplainerSheet | PartnershipSheet | SummarySheet

/**
 * The JSON keeps its layout as a plain string, which the print build reads
 * too. Check it here so a sheet cannot print one way and render another.
 */
function laidOut<L extends Sheet['layout']>(json: { slug: string; layout: string }, layout: L) {
  if (json.layout !== layout) throw new Error(`sheet ${json.slug}: layout is ${json.layout}, expected ${layout}`)
  return layout
}

/** On the shelf in this order: why, then the tools, then how governments and funders take part. */
export const sheets: Sheet[] = [
  { ...whySovereignAi, layout: laidOut(whySovereignAi, 'three-propositions') },
  { ...broadListeningSimocracy, layout: laidOut(broadListeningSimocracy, 'explainer') },
  { ...hypercerts, layout: laidOut(hypercerts, 'explainer') },
  { ...governmentPilotPartnership, layout: laidOut(governmentPilotPartnership, 'partnership') },
  { ...sovereignAiForFunders, layout: laidOut(sovereignAiForFunders, 'summary') },
]

/** The program's section on the FA2 page, where its shelf stands. */
export const programHref = '/areas/economies-governance/#sovereign-ai'
export const sheetHref = (slug: string) => `/areas/economies-governance/sovereign-ai/${slug}/`
export const sheetPdf = (slug: string) => `/sovereign-ai/${slug}.pdf`
export const sheetCover = (slug: string) => `/sovereign-ai/${slug}.webp`

/** Sheet prose without its link syntax, for metadata and other plain text. */
export const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
