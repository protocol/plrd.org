import "server-only"
import pagesData from "@/data/site-content/pages.json"
import opportunitiesData from "@/data/site-content/opportunities.json"
import editEventsData from "@/data/site-content/edit-events.json"
import publicationData from "@/data/site-content/publication.json"

/** The existing published discovery identity, now owned by GitHub rather than env config. */
export const REPO_PUBLICATION_URI: string = publicationData.uri

// ---- Types ----

export type IndexerPageSection = {
  sectionId: string
  label?: string | null
  title?: string | null
  subtitle?: string | null
  body?: string | null
}

export type IndexerPage = {
  uri?: string
  rkey?: string
  pageId: string
  iconType?: string | null
  leads?: string[] | null
  advisors?: string[] | null
  sections: IndexerPageSection[]
  updatedAt: string
}

export type IndexerFieldSignal = {
  kpi: string
  measurement: string
}

export type IndexerOpportunitySpace = {
  uri?: string
  rkey?: string
  areaSlug: string
  id: string
  title: string
  tagline?: string | null
  image?: string | null
  description: string
  inflectionPoint?: string | null
  shift?: string | null
  theOpportunity?: string | null
  subfields: string[]
  tippingSignals?: string[] | null
  keyAssumptions?: string[] | null
  observations?: string[] | null
  fieldSignals?: IndexerFieldSignal[] | null
  updatedAt: string
}

export type IndexerEditEvent = {
  uri?: string
  did?: string           // the editor's DID (repo owner)
  target: string         // AT-URI of the edited record
  targetCid?: string | null
  collection?: string | null
  editor: string         // DID of the editor (usually same as did above)
  editorHandle?: string | null
  changedFields?: string[] | null
  note?: string | null
  editedAt: string
}

// ---- GitHub-owned page reads (legacy function names retained) ----

const pages: IndexerPage[] = pagesData

/** GitHub-owned content; no deployment environment or CMS fallback participates. */
export async function fetchPage(rkey: string): Promise<IndexerPage | null> {
  // Compatibility for the existing Collaboration consumer, not the retired About page.
  // Its only section is owned by collaborate in pages.json; historical About stays archived.
  if (rkey === "about") {
    const collaboration = pages.find(page => page.pageId === "collaborate")!
    return structuredClone({
      pageId: "about", rkey: "about", updatedAt: collaboration.updatedAt,
      sections: collaboration.sections.filter(section => section.sectionId === "collaborations"),
    })
  }
  const page = pages.find(page => page.pageId === rkey)
  return page ? structuredClone(page) : null
}

export async function fetchAllPages(): Promise<IndexerPage[]> {
  return structuredClone(pages)
}

// ---- Opportunity Space queries ----

const opportunities: IndexerOpportunitySpace[] = opportunitiesData

export async function fetchOpportunitySpaces(areaSlug: string): Promise<IndexerOpportunitySpace[]> {
  return structuredClone(opportunities.filter(opportunity => opportunity.areaSlug === areaSlug))
}

export async function fetchOpportunitySpace(rkey: string): Promise<IndexerOpportunitySpace | null> {
  const opportunity = opportunities.find(opportunity => opportunity.rkey === rkey)
  return opportunity ? structuredClone(opportunity) : null
}

// ---- Edit event queries ----

const editEvents: IndexerEditEvent[] = editEventsData

/** Frozen public audit history; new content changes are reviewed in Git. */
export async function fetchEditEvents(targetUri: string): Promise<IndexerEditEvent[]> {
  return structuredClone(editEvents.filter(event => event.target === targetUri))
    .sort((a, b) => (b.editedAt ?? '').localeCompare(a.editedAt ?? ''))
}

// ---- Legacy post read contract ----

export type IndexerPost = {
  rkey: string
  uri: string
  title: string
  description?: string | null
  publishedAt: string
  path?: string | null
  tags?: string[] | null
  content?: {
    $type: string
    markdown?: string
    postType?: string
  } | null
}

/**
 * All public standard.site documents resolve to existing repo blog posts.
 * The blog listing already renders those (including its unlisted policy).
 * Do not append archival copies, overwrite approved bodies, or surface new posts.
 * See site-content provenance and docs/content-migration.md.
 */
export async function fetchAtproPosts(): Promise<IndexerPost[]> {
  return []
}

// ---- Helpers ----

/** Get a specific section from a page by sectionId */
export function getSection(page: IndexerPage | null, sectionId: string): IndexerPageSection | null {
  return page?.sections?.find(s => s.sectionId === sectionId) ?? null
}

/** Get all sections matching a prefix (e.g. "approach-" for all approach sections) */
export function getSectionsWithPrefix(page: IndexerPage | null, prefix: string): IndexerPageSection[] {
  return page?.sections?.filter(s => s.sectionId.startsWith(prefix)) ?? []
}
