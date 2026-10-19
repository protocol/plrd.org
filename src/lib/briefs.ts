import whySovereignAi from '@/data/fa2/briefs/why-sovereign-ai.json'
import broadListeningSimocracy from '@/data/fa2/briefs/broad-listening-simocracy.json'
import governmentPilotPartnership from '@/data/fa2/briefs/government-pilot-partnership.json'

/**
 * FA2 briefs: one-page arguments with their evidence, published twice from
 * one JSON file in src/data/fa2/briefs/. The web edition renders it at
 * /areas/economies-governance/briefs/<slug>/, and `npm run build-briefs`
 * prints the same file to public/briefs/<slug>.pdf with a cover plate beside
 * it for the shelf on the FA2 page.
 *
 * Each brief names its layout (three-propositions, explainer or partnership),
 * and the layout fixes its shape. Prose fields may carry [label](href) links;
 * site paths stay on the site in the web edition and become full plrd.org
 * links on paper.
 *
 * Add a brief: write its JSON, add it to `briefs` below, and run
 * `npm run build-briefs <slug>`.
 */

export type Evidence = { figure: string; caption: string; source: string; url: string }
type Item = { title: string; text: string }
export type Lead = { lead: string; text: string; source?: string; url?: string }
type Labelled<T> = { label: string; aside?: string; items: T[] }
/** A claim card: a title, its promise, the claim, and the evidence at its foot. */
type Claim = { title: string; promise: string; text: string; evidence: Evidence[] }
/** Numbered steps on a thread, with the bar or rule printed under them. */
export type Steps = Labelled<Item> & { barLead: string; bar: string }
export type Limit = { kicker: string; title: string; text: string }
export type WayIn = { kicker: string; title: string; text: string; people: string }

type BriefBase = {
  slug: string
  /** Printed top right, before the date: "Economies & Governance · Brief". */
  kicker: string
  date: string
  /** The day every figure was last checked against its source. */
  checked: string
  title: string
  subtitle: string
  /** The brief's name on the shelf and in the breadcrumb. */
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

export type ThreePropositionsBrief = BriefBase & {
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

export type PartnershipBrief = BriefBase & {
  layout: 'partnership'
  gap: { paragraphs: string[] } & Evidence
  bring: Labelled<Item>
  steps: Steps
  starts: Labelled<Lead>
  why: Labelled<Lead>
  ask: Labelled<Lead>
  wayIn: WayIn
}

export type ExplainerBrief = BriefBase & {
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

export type Brief = ThreePropositionsBrief | ExplainerBrief | PartnershipBrief

/**
 * The JSON keeps its layout as a plain string, which the print build reads
 * too. Check it here so a brief cannot print one way and render another.
 */
function laidOut<L extends Brief['layout']>(json: { slug: string; layout: string }, layout: L) {
  if (json.layout !== layout) throw new Error(`brief ${json.slug}: layout is ${json.layout}, expected ${layout}`)
  return layout
}

/** On the shelf in this order: why, then what, then how. */
export const briefs: Brief[] = [
  { ...whySovereignAi, layout: laidOut(whySovereignAi, 'three-propositions') },
  { ...broadListeningSimocracy, layout: laidOut(broadListeningSimocracy, 'explainer') },
  { ...governmentPilotPartnership, layout: laidOut(governmentPilotPartnership, 'partnership') },
]

export const briefHref = (slug: string) => `/areas/economies-governance/briefs/${slug}/`
export const briefPdf = (slug: string) => `/briefs/${slug}.pdf`
export const briefCover = (slug: string) => `/briefs/${slug}.webp`

/** "Brief" or "Partnership": the last word of the printed kicker. */
export const briefKind = (brief: Brief) => brief.kicker.split(' · ').pop() ?? 'Brief'

/** Brief prose without its link syntax, for metadata and other plain text. */
export const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
