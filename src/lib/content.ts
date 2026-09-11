import publicationsData from '@/data/generated/publications.json'
import authorsData from '@/data/generated/authors.json'
import talksData from '@/data/generated/talks.json'
import tutorialsData from '@/data/generated/tutorials.json'
import blogData from '@/data/generated/blog.json'
import areasData from '@/data/generated/areas.json'
import sectionsData from '@/data/generated/sections.json'
import depGraphData from '@/data/generated/dependency-graph.json'

export type ContentVisibility = {
  version: number
  denied: boolean
  notBefore: string | null
}

export type Publication = {
  visibility: ContentVisibility
  slug: string
  title: string
  date: string
  authors: string[]
  venue: string
  doi: string
  publication_types: string[]
  areas: string[]
  abstract: string
  url_pdf: string
  url_source: string
  html: string
}

export type Author = {
  visibility: ContentVisibility
  slug: string
  name: string
  role: string
  groups: string[]
  user_groups: string[]
  interests: string[]
  quote: string
  social: { icon?: string; link?: string }[]
  education: { courses?: { course?: string; institution?: string; year?: number }[] } | null
  avatarPath: string | null
  html: string
}

export type Talk = {
  visibility: ContentVisibility
  slug: string
  title: string
  date: string
  venue: string
  venue_url: string
  venue_location: string
  authors: string[]
  areas: string[]
  abstract: string
  html: string
}

export type Tutorial = {
  markdown: string
  visibility: ContentVisibility
  slug: string
  title: string
  date: string
  summary: string
  html: string
}

export type BlogPost = {
  visibility: ContentVisibility
  /** Readable build-time rendering of the same native article body. */
  markdown: string
  slug: string
  title: string
  date: string
  summary: string
  /** Optional dedicated meta/OG description; falls back to `summary` when empty. */
  description?: string
  authors: string[]
  /** Focus-area slugs (e.g. 'neurotech') — drives the Insights focus-area filter. */
  areas: string[]
  external_url: string
  /**
   * URL of the post's cover image. For external blog posts (the common case
   * — `external_url` set, body empty), `scripts/build-content.mjs` fetches
   * the remote page at build time and extracts og:image / twitter:image /
   * first <img>. Empty string when nothing was found, in which case the
   * landing-page card falls back to the procedural GeoIllustration.
   */
  coverImage: string
  html: string
  /**
   * When true the post still renders at its URL but is hidden from every
   * listing, the sitemap, RSS, the search index, and is marked noindex —
   * i.e. reachable only via its (deliberately cryptic) direct link.
   */
  unlisted?: boolean
}

export type Area = {
  visibility: ContentVisibility
  slug: string
  title: string
  date: string
  summary: string
  leads: string[]
  advisors: string[]
  html: string
}

export type Section = {
  title: string
  html: string
}

export type DependencyGraphTooltip = {
  title: string
  body: string
  context: string
}

export type DependencyGraphEntry = {
  config: {
    id: string
    label: string
    sub: string
    color: string
    num: string
    bottlenecks: { id: string; label: string }[]
    gates: { id: string; label: string; quarter: string }[]
    strands: { id: string; label: string; sub: string }[]
    interventions: { id: string; label: string; sub: string; strands: string[] }[]
    feedbackLoops: { id: string; from: string; to: string; label: string }[]
  }
  tooltips: Record<string, DependencyGraphTooltip>
}

export const publications = publicationsData as Publication[]
export const authors = authorsData as Author[]
export const talks = talksData as Talk[]
export const tutorials = tutorialsData as Tutorial[]
export const blogPosts = blogData as BlogPost[]
/** Blog posts safe to surface in listings (excludes unlisted/preview posts). */
export const listedBlogPosts = blogPosts.filter((b) => !b.unlisted)
export const areas = areasData as Area[]

/**
 * Focus-area filter definitions, ordered to match the site nav. Shared by the
 * Insights explorer and the /blog, /publications, /talks listing pages so the
 * focus-area filter stays consistent everywhere.
 */
const FOCUS_AREA_ORDER = ['digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech']
export const focusAreaDefs = FOCUS_AREA_ORDER.map((slug) => areas.find((a) => a.slug === slug))
  .filter((a): a is Area => Boolean(a))
  .map((a) => ({ slug: a.slug, title: a.title }))
export const sections = sectionsData as Record<string, Section>
export const dependencyGraphs = depGraphData as Record<string, DependencyGraphEntry>
