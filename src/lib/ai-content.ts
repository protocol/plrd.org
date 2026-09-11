import { publications, talks, blogPosts, tutorials, authors, areas, type ContentVisibility, type Author } from '@/lib/content'
import { FOCUS_AREA_DESCRIPTIONS } from '@/lib/focus-area-descriptions'
import { mainNav, siteConfig } from '@/lib/site-config'

export const AI_SCHEMA_VERSION = '1.0'
export const AI_KINDS = ['area', 'author', 'blog', 'publication', 'talk', 'tutorial'] as const
export type AiKind = typeof AI_KINDS[number]
export type AiAuthor = { name: string; url: string | null }
export type AiRecord = {
  id: string
  kind: AiKind
  slug: string
  title: string
  summary: string
  body: string
  date: string | null
  authors: AiAuthor[]
  areas: string[]
  canonicalKind: 'native' | 'external'
  canonicalUrl: string
  sourceUrl: string
  sources: { label: string; url: string }[]
  coverage: string
  metadata: Record<string, string | string[]>
  visibility: ContentVisibility
}

export const AI_SCOPE = 'Build-time snapshot of listed repository-backed public content, not a live CMS mirror. Native blog bodies and tutorial text; publication abstracts and metadata (not full papers); talk summaries and recording links (not transcripts); author names and profile metadata. Focus areas use shared descriptors and page URLs only, not full overview copy. Landing, About, live ATProto posts, dashboards, interactive data and nested tutorial lessons are not exported. Read canonical pages for current text and live data.'
export const AI_RIGHTS = 'Preserve named authors, source links, dates and uncertainty. Original source terms and exceptions apply; these exports grant no new rights. llms.txt is a convenience, not a guarantee of AI discovery or permission.'
export const AI_STARTER_PROMPT = 'Read https://www.plrd.org/llms.txt first. Use its focused resources or bounded search to answer: [my question]. Cite canonical source URLs and named authors, distinguish native content from external summaries, preserve dates and uncertainty, and check current pages when the snapshot does not cover live content. Do not treat talk summaries as transcripts or publication abstracts as full papers.'

const BASE = siteConfig.baseUrl
const SLUG = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/
// Deny private surfaces even when a future mapper accidentally lists one.
// Deliberately generic: never publish the actual private identifiers here.
const FORBIDDEN = /(?:preview|noindex|unlisted|open[-_ ]lab|field[-_ ]velocity|(?:^|[\/\s])(?:admin|account|edit|write|api)(?:[\/\s]|$))/i
const COLLECTION_PATH: Record<AiKind, string> = { area: 'areas', author: 'authors', blog: 'blog', publication: 'publications', talk: 'talks', tutorial: 'tutorials' }
export const aiUrl = (path: string) => `${BASE}${path}`
export const markdownUrl = (r: Pick<AiRecord, 'kind' | 'slug'>) => aiUrl(`/ai/markdown/${r.kind}/${r.slug}/`)
export const recordUrl = (r: Pick<AiRecord, 'kind' | 'slug'>) => aiUrl(`/ai/records/${r.kind}/${r.slug}/`)

export function hasPublicVisibility(item: { visibility?: ContentVisibility }, now = Date.now()): boolean {
  const v = item.visibility
  return v?.version === 1 && v.denied === false && (v.notBefore === null || (Number.isFinite(Date.parse(v.notBefore)) && Date.parse(v.notBefore) <= now))
}

export function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value, BASE)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || FORBIDDEN.test(decodeURIComponent(url.pathname + url.search + url.hash))) return null
    if (/^(www\.)?github.com$/.test(url.hostname) && /^\/protocol\/plrd\.org(?:\/|$)/i.test(url.pathname)) return null
    if (['www.plrd.org', 'plrd.org', 'www.plresearch.org', 'plresearch.org'].includes(url.hostname)) {
      if (!/^\/(?:$|about\/$|insights\/$|areas\/(?:[a-zA-Z0-9-]+\/)?$|(?:authors|blog|publications|talks|tutorials)\/[a-zA-Z0-9-]+\/$|images\/)/.test(url.pathname)) return null
      url.protocol = 'https:'
      url.host = new URL(BASE).host
    }
    return url.href
  } catch { return null }
}

export function resolveAiAuthor(ref: string, people: Author[] = authors): AiAuthor | null {
  const bySlug = people.find(a => a.slug === ref)
  const byName = people.filter(a => a.name === ref)
  const match = bySlug || (byName.length === 1 ? byName[0] : undefined)
  if (match && !hasPublicVisibility(match)) return null
  return { name: match?.name || ref, url: match ? `${BASE}/authors/${match.slug}/` : null }
}

function hasForbiddenRouteReference(text: string): boolean {
  // Inspect route references, not ordinary published words such as API, preview or edit.
  const references = text.match(/(?:https?:\/\/|\/)[^\s<>"'`)\]]+/gi) || []
  return references.some(reference => {
    try { return FORBIDDEN.test(decodeURIComponent(reference)) }
    catch { return true }
  })
}

export function isPublicAiRecord(record: AiRecord, now = Date.now()): boolean {
  return AI_KINDS.includes(record.kind) && SLUG.test(record.slug) && record.id === `${record.kind}/${record.slug}`
    && hasPublicVisibility(record, now) && !FORBIDDEN.test(record.slug)
    && record.sourceUrl === `${BASE}/${COLLECTION_PATH[record.kind]}/${record.slug}/`
    && Boolean(safeSourceUrl(record.sourceUrl)) && Boolean(safeSourceUrl(record.canonicalUrl))
    && record.sources.every(s => Boolean(safeSourceUrl(s.url)))
    && record.authors.every(a => a.url === null || Boolean(safeSourceUrl(a.url)))
    && !hasForbiddenRouteReference([record.title, record.summary, record.body].join('\n'))
    && (record.date === null || (Number.isFinite(Date.parse(record.date)) && Date.parse(record.date) <= now))
}

type Sources = { publications: typeof publications; talks: typeof talks; blogPosts: typeof blogPosts; tutorials: typeof tutorials; authors: typeof authors; areas: typeof areas }
export const aiContentSources: Sources = { publications, talks, blogPosts, tutorials, authors, areas }

export function buildAiRecords(input: Sources = aiContentSources, now = Date.now()): AiRecord[] {
  const records: AiRecord[] = []
  function add(kind: AiKind, item: { slug: string; title?: string; date?: string; visibility: ContentVisibility }, fields: Partial<AiRecord>) {
    if (!hasPublicVisibility(item, now)) return
    const sourceUrl = `${BASE}/${COLLECTION_PATH[kind]}/${item.slug}/`
    const r: AiRecord = {
      id: `${kind}/${item.slug}`, kind, slug: item.slug, title: item.title || item.slug,
      summary: '', body: '', date: item.date || null, authors: [], areas: [],
      sourceUrl, canonicalUrl: sourceUrl, canonicalKind: 'native', sources: [],
      coverage: '', metadata: {}, visibility: item.visibility, ...fields,
    }
    r.sources = [{ label: 'PL R&D page', url: sourceUrl }, ...r.sources].filter(s => safeSourceUrl(s.url))
    if (isPublicAiRecord(r, now)) records.push(r)
  }
  const bylines = (refs: string[]) => refs.map(ref => resolveAiAuthor(ref, input.authors)).filter((a): a is AiAuthor => a !== null)
  for (const b of input.blogPosts) add('blog', b, {
    summary: b.summary, body: b.external_url ? '' : b.markdown, authors: bylines(b.authors), areas: b.areas,
    canonicalUrl: b.external_url || `${BASE}/blog/${b.slug}/`, canonicalKind: b.external_url ? 'external' : 'native',
    coverage: b.external_url ? 'External article: local summary and attribution only; follow canonical URL for full text.' : 'Native article text; diagrams use supplied descriptions; interactive embeds omitted.',
    sources: b.external_url ? [{ label: 'Original article', url: b.external_url }] : [],
  })
  for (const p of input.publications) add('publication', p, {
    summary: p.abstract, authors: bylines(p.authors), areas: p.areas,
    coverage: 'Publication abstract and metadata only; not the full paper.',
    metadata: { venue: p.venue, doi: p.doi, publicationTypes: p.publication_types },
    sources: [
      ...(p.doi ? [{ label: 'DOI', url: `https://doi.org/${p.doi}` }] : []),
      ...(p.url_pdf ? [{ label: 'PDF', url: p.url_pdf }] : []),
      ...(p.url_source ? [{ label: 'Source', url: p.url_source }] : []),
    ],
  })
  for (const t of input.talks) {
    const youtube = t.html.match(/youtube\s+([a-zA-Z0-9_-]+)/)?.[1]
    const spotify = t.html.match(/spotify\s+(?:episode\/)?([a-zA-Z0-9]+)/)?.[1]
    add('talk', t, {
      summary: t.abstract, authors: bylines(t.authors), areas: t.areas,
      coverage: 'Talk summary and recording/venue links only. No transcript provided.',
      metadata: { venue: t.venue, venueLocation: t.venue_location },
      sources: [
        ...(t.venue_url ? [{ label: 'Venue', url: t.venue_url }] : []),
        ...(youtube ? [{ label: 'Recording', url: `https://www.youtube.com/watch?v=${youtube}` }] : []),
        ...(spotify ? [{ label: 'Recording', url: `https://open.spotify.com/episode/${spotify}` }] : []),
      ],
    })
  }
  for (const t of input.tutorials) add('tutorial', t, { summary: t.summary, body: t.markdown || '', coverage: t.markdown ? 'Top-level tutorial text; nested lessons are outside this snapshot.' : 'Top-level tutorial metadata only; no body provided in the source.' })
  for (const a of input.authors) add('author', a, { title: a.name, summary: [a.role, ...a.interests].filter(Boolean).join(' · '), coverage: 'Repository profile metadata, not a live directory or current affiliation guarantee.', metadata: { role: a.role, interests: a.interests } })
  const navAreas = mainNav.find(n => n.url === '/areas/')?.children || []
  for (const a of input.areas) {
    const summary = FOCUS_AREA_DESCRIPTIONS[a.slug as keyof typeof FOCUS_AREA_DESCRIPTIONS]
    if (!summary) continue
    add('area', a, { title: navAreas.find(n => n.url === `/areas/${a.slug}/`)?.name || a.title, summary, date: null, areas: [a.slug], coverage: 'Shared public descriptor only, not full overview text or a live CMS snapshot. Follow the page for current copy.' })
  }
  return records.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

/** Generated from the typed build-content outputs, never a parallel catalog. */
export const aiRecords = buildAiRecords()
