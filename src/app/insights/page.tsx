import type { Metadata } from 'next'
import { sections, publications, talks, listedBlogPosts as blogPosts, areas, focusAreaDefs } from '@/lib/content'
import Breadcrumb from '@/components/Breadcrumb'
import EditPageButton from '@/components/EditPageButton'
import { PageEditHistoryByline } from '@/components/EditHistoryByline'
import MarkdownContent from '@/components/MarkdownContent'
import InsightsExplorer, { type InsightSection, type AreaDef } from '@/components/InsightsExplorer'
import PLRadar, { type RadarItem } from '@/components/PLRadar'
import { FIELD_SIGNALS } from '@/lib/radar-signals'
import { fetchPage, getSection } from '@/lib/indexer'
import { formatDate } from '@/lib/format'

/** Pull a YouTube id out of a talk body ({{< youtube ID >}}) for its thumbnail. */
function youtubeThumb(html: string): string | undefined {
  const m = html?.match(/\{\{[<&].*?youtube\s+([a-zA-Z0-9_-]+)\s*[>&].*?\}\}/)
  return m ? `https://i.ytimg.com/vi/${m[1]}/maxresdefault.jpg` : undefined
}

export const metadata: Metadata = { title: 'Insights' }

const FALLBACK_HERO_TITLE = 'Insights'
const FALLBACK_HERO_SUBTITLE =
  'Exploring the frontiers of computing, networking, and knowledge systems to build infrastructure that empowers humanity.'
const FALLBACK_CARDS = {
  'card-publications': { title: 'Publications' },
  'card-talks': { title: 'Talks & Podcasts' },
  'card-blog': { title: 'Blog' },
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>
}) {
  const { area: initialArea } = await searchParams
  const page = await fetchPage('insights')
  const hero = getSection(page, 'hero')
  const heroTitle = hero?.title || FALLBACK_HERO_TITLE
  const heroSubtitle = hero?.subtitle || FALLBACK_HERO_SUBTITLE

  const cardPublications = getSection(page, 'card-publications')
  const cardTalks = getSection(page, 'card-talks')
  const cardBlog = getSection(page, 'card-blog')

  // Focus-area chips, ordered to match the site nav.
  const areaDefs: AreaDef[] = focusAreaDefs

  const insightSections: InsightSection[] = [
    {
      key: 'blog',
      label: cardBlog?.title || FALLBACK_CARDS['card-blog'].title,
      heading: 'From the Blog',
      allHref: '/blog/',
      allLabel: 'All posts →',
      items: blogPosts.map((post) => {
        const isExternal = !!post.external_url
        return {
          key: post.slug,
          href: post.external_url || `/blog/${post.slug}/`,
          external: isExternal,
          eyebrow: [formatDate(post.date), isExternal && 'protocol.ai'].filter(Boolean).join(' · '),
          title: post.title,
          description: post.summary,
          areas: post.areas ?? [],
          image: post.coverImage || '',
          date: post.date || '',
        }
      }),
    },
    {
      key: 'publications',
      label: cardPublications?.title || FALLBACK_CARDS['card-publications'].title,
      heading: 'Recent Publications',
      allHref: '/publications/',
      allLabel: 'All publications →',
      items: publications.map((p) => ({
        key: p.slug,
        href: `/publications/${p.slug}/`,
        eyebrow: [p.venue, formatDate(p.date)].filter(Boolean).join(' · '),
        title: p.title,
        areas: p.areas ?? [],
        image: '/images/publication-cover.png',
        date: p.date || '',
      })),
    },
    {
      key: 'talks',
      label: cardTalks?.title || FALLBACK_CARDS['card-talks'].title,
      heading: 'Recent Talks & Podcasts',
      allHref: '/talks/',
      allLabel: 'All talks →',
      items: talks.map((t) => ({
        key: t.slug,
        href: `/talks/${t.slug}/`,
        eyebrow: [t.venue, t.venue_location, formatDate(t.date)].filter(Boolean).join(' · '),
        title: t.title,
        description: t.abstract,
        areas: t.areas ?? [],
        image: youtubeThumb(t.html) || (/podcast/i.test(`${t.venue} ${t.venue_location}`) ? '/images/podcast.webp' : ''),
        date: t.date || '',
      })),
    },
  ].filter((s) => s.items.length > 0)

  // --- PL R&D Radar: a monthly "catch up in a minute" digest of the newest items ---
  const areaTitle = (slug?: string) => areas.find((a) => a.slug === slug)?.title || 'PL R&D'
  type Dated = { date: string }
  const byDateDesc = (a: Dated, b: Dated) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)

  const contentPool = [
    ...talks.map((t) => {
      const isPodcast = /podcast/i.test(`${t.venue} ${t.venue_location}`)
      return {
        key: `talk-${t.slug}`,
        title: t.title,
        description: t.abstract as string | undefined,
        href: `/talks/${t.slug}/`,
        external: false,
        type: isPodcast ? 'Podcast' : 'Talk',
        areaLabel: [areaTitle(t.areas?.[0]), t.venue].filter(Boolean).join(' · '),
        areaSlug: t.areas?.[0] || 'default',
        date: t.date || '',
        image: youtubeThumb(t.html) || (isPodcast ? '/images/podcast.webp' : undefined),
        _sort: t.date || '',
      }
    }),
    ...publications.map((p) => ({
      key: `pub-${p.slug}`,
      title: p.title,
      description: undefined as string | undefined,
      href: `/publications/${p.slug}/`,
      external: false,
      type: 'Publication',
      areaLabel: [areaTitle(p.areas?.[0]), p.venue].filter(Boolean).join(' · '),
      areaSlug: p.areas?.[0] || 'default',
      date: p.date || '',
      image: undefined as string | undefined,
      _sort: p.date || '',
    })),
    ...blogPosts.map((b) => ({
      key: `blog-${b.slug}`,
      title: b.title,
      description: b.summary as string | undefined,
      href: b.external_url || `/blog/${b.slug}/`,
      external: !!b.external_url,
      type: 'Blog',
      areaLabel: areaTitle(b.areas?.[0]),
      areaSlug: b.areas?.[0] || 'default',
      date: b.date || '',
      image: b.coverImage || undefined,
      _sort: b.date || '',
    })),
  ].sort(byDateDesc)

  // Curated third-party "field signals" — external reads we're watching, shown
  // alongside our own output but clearly marked. Newest first.
  const signalPool = FIELD_SIGNALS.map((s) => ({
    key: s.key,
    title: s.title,
    description: s.description as string | undefined,
    href: s.href,
    external: true,
    type: 'Signal',
    areaLabel: ['Field signal', s.source].filter(Boolean).join(' · '),
    areaSlug: s.areaSlug,
    date: s.date,
    image: undefined as string | undefined,
    _sort: s.date,
  })).sort(byDateDesc)

  // Reserve one slot for the newest field signal so the Radar always carries at
  // least one external read, then fill the rest with our newest local content.
  const signalItems = signalPool.slice(0, 1)
  const rawRadarPool: RadarItem[] = [...contentPool.slice(0, 6 - signalItems.length), ...signalItems]
    .sort(byDateDesc)
    .map(({ _sort, ...item }) => ({ ...item, date: formatDate(item.date) }))

  const radarEdition = (() => {
    const newest = rawRadarPool[0]?.date
    const d = newest ? new Date(newest) : new Date()
    return `${d.toLocaleDateString('en-US', { month: 'long' })} Radar`
  })()

  // Always surface PL R&D's own output (talks, publications, posts on PL
  // properties) ahead of third-party "field signals", while preserving each
  // group's date order. Array.sort is stable, so items keep
  // their relative order within the PL and signal groups.
  const isFieldSignal = (it: RadarItem) => it.type === 'Signal'
  const radarPool: RadarItem[] = [...rawRadarPool].sort(
    (a, b) => Number(isFieldSignal(a)) - Number(isFieldSignal(b)),
  )

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Insights' }]} />
      <div className="mt-4 empty:hidden">
        <PageEditHistoryByline rkey="insights" />
      </div>

      {radarPool.length > 0 && (
        <div className="mt-6">
          <PLRadar edition={radarEdition} items={radarPool} />
        </div>
      )}
      {/* Hero */}
      <div className="relative pt-8 pb-12 mb-12 overflow-hidden">
        <PageGeo />
        <h1 className="relative z-10 text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5 max-w-xl">
          {heroTitle}
        </h1>
        <MarkdownContent content={heroSubtitle} className="relative z-10 text-lg text-gray-600 leading-relaxed max-w-2xl" />
      </div>

      {/* Section content if any */}
      {sections.research?.html && (
        <div className="mb-12 pb-12 border-b border-gray-100">
          <div className="page-content text-base text-gray-700 leading-relaxed max-w-3xl" dangerouslySetInnerHTML={{ __html: sections.research.html }} />
        </div>
      )}

      <InsightsExplorer sections={insightSections} areas={areaDefs} initialArea={initialArea} />

      <EditPageButton rkey="insights" />
    </div>
  )
}

function PageGeo() {
  return (
    <svg
      className="absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"
      viewBox="0 0 700 500"
      fill="none"
      aria-hidden="true"
    >
      <polygon points="480,80 580,250 380,250" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="520,180 620,350 420,350" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="450,260 550,430 350,430" stroke="#C3E1FF" strokeWidth="0.75" />
      <line x1="480" y1="80" x2="520" y2="180" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="580" y1="250" x2="620" y2="350" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="420" y1="350" x2="450" y2="260" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="480" cy="80" r="3" fill="#C3E1FF" />
      <circle cx="520" cy="180" r="3" fill="#C3E1FF" />
      <circle cx="450" cy="260" r="3" fill="#C3E1FF" />
      <circle cx="580" cy="250" r="3" fill="#C3E1FF" />
      <circle cx="620" cy="350" r="3" fill="#C3E1FF" />
    </svg>
  )
}
