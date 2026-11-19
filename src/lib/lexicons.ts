/**
 * ATProto Lexicon Collection NSIDs for PL R&D
 */

// Public record identity; never an authorization role or allowlist.
export const PUBLIC_CONTENT_DID = 'did:plc:pgwr6hkosgznfl5nz7egajei'

// Post collection (write page / blog posts authored on this PDS)
export const POST_COLLECTION = 'org.plresearch.post'

export type PostType = 'blog' | 'publication' | 'talk' | 'tutorial'

export type PostRecord = {
  $type: string
  title: string
  content: string
  summary?: string
  postType: PostType
  venue?: string
  authors?: string[]
  doi?: string
  createdAt: string
}

// standard.site lexicons for long-form publishing
export const STANDARD_PUBLICATION_COLLECTION = "site.standard.publication"
export const STANDARD_DOCUMENT_COLLECTION = "site.standard.document"

// Content format for our markdown posts (custom type embedded in the open union)
export const PLRESEARCH_CONTENT_TYPE = "org.plresearch.markdownContent"

export type StandardDocumentRecord = {
  $type: "site.standard.document"
  site: string          // AT-URI of publication or URL
  title: string
  publishedAt: string   // ISO datetime
  path: string          // e.g. /blog/my-post
  description?: string
  textContent?: string  // plaintext for indexing
  tags?: string[]
  updatedAt?: string
  content?: {
    $type: string       // org.plresearch.markdownContent
    markdown: string    // the markdown body
    postType?: string   // blog | publication | talk | tutorial
    venue?: string
    authors?: string[]
    doi?: string
  }
}

export type StandardPublicationRecord = {
  $type: "site.standard.publication"
  url: string
  name: string
  description?: string
}

// Page collections
export const PAGE_COLLECTION = "org.plresearch.page"
export const OPPORTUNITY_COLLECTION = "org.plresearch.opportunitySpace"
// Opportunity space record (stored on plresearch.org PDS, indexed by the indexer)
export type OpportunitySpaceFieldSignal = {
  kpi: string
  measurement: string
}

export type OpportunitySpaceRecord = {
  $type: string
  areaSlug: string
  id: string
  title: string
  tagline?: string
  image?: string
  description: string
  inflectionPoint?: string
  shift?: string
  theOpportunity?: string
  subfields?: string[]
  tippingSignals?: string[]
  keyAssumptions?: string[]
  observations?: string[]
  fieldSignals?: OpportunitySpaceFieldSignal[]
  updatedAt: string
}

// Map a focus-area slug + opportunity-space id to the record's rkey.
// Rkeys on the PDS use short per-area prefixes (see commit bb88ffa).
const OPP_RKEY_PREFIX: Record<string, string> = {
  'ai-robotics': 'ai',
  'digital-human-rights': 'dhr',
  'economies-governance': 'eg',
  'neurotech': 'neuro',
}

export function opportunitySpaceRkey(areaSlug: string, id: string): string {
  const prefix = OPP_RKEY_PREFIX[areaSlug]
  if (!prefix) throw new Error(`Unknown areaSlug for opportunity space: ${areaSlug}`)
  return `${prefix}--${id}`
}

// Page section
export type PageSection = {
  sectionId: string
  label?: string
  title?: string
  subtitle?: string
  body?: string
}

// Page record stored on ATProto
export type PageRecord = {
  $type: string
  pageId: string
  iconType?: string
  leads?: string[]
  advisors?: string[]
  sections: PageSection[]
  updatedAt: string
}

// All known page rkeys
export const PAGE_RKEYS = [
  "landing", "about", "areas", "collaborate",
  "area-ai-robotics", "area-digital-human-rights", "area-neurotech",
  "area-economies-governance", "area-eg-subareas", "area-eg-impact",
  "insights", "publications", "talks", "tutorials", "blog", "authors",
] as const

export type PageRkey = typeof PAGE_RKEYS[number]
