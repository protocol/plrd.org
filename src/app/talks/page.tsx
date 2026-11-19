import type { Metadata } from 'next'
import { talks, focusAreaDefs } from '@/lib/content'
import Breadcrumb from '@/components/Breadcrumb'
import BackToInsights from '@/components/BackToInsights'
import MarkdownContent from '@/components/MarkdownContent'
import AreaFilteredListing, { type FilterableTile } from '@/components/AreaFilteredListing'
import { fetchPage, getSection } from '@/lib/indexer'

export const metadata: Metadata = { title: 'Talks' }

/** Pull a YouTube id out of a talk body ({{< youtube ID >}}) for its thumbnail. */
function youtubeThumb(html: string): string | undefined {
  const m = html?.match(/\{\{[<&].*?youtube\s+([a-zA-Z0-9_-]+)\s*[>&].*?\}\}/)
  return m ? `https://i.ytimg.com/vi/${m[1]}/maxresdefault.jpg` : undefined
}

const FALLBACK_HERO_TITLE = 'Talks'
const FALLBACK_HERO_SUBTITLE =
  'Presentations and lectures from conferences and events around the world.'

export default async function TalksPage() {
  const page = await fetchPage('talks')
  const hero = getSection(page, 'hero')
  const heroTitle = hero?.title || FALLBACK_HERO_TITLE
  const heroSubtitle = hero?.subtitle || FALLBACK_HERO_SUBTITLE

  const tiles: FilterableTile[] = talks.map((talk) => ({
    key: talk.slug,
    href: `/talks/${talk.slug}/`,
    eyebrow: [talk.venue, talk.venue_location, talk.date && new Date(talk.date).getFullYear()]
      .filter(Boolean)
      .join(' · '),
    title: talk.title,
    description: talk.abstract,
    areas: talk.areas ?? [],
    image:
      youtubeThumb(talk.html) ||
      (/podcast/i.test(`${talk.venue ?? ''} ${talk.venue_location ?? ''}`) ? '/images/podcast.webp' : ''),
  }))

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Research', href: '/research/' }, { label: 'Talks' }]} />
      <BackToInsights />
      {/* Hero */}
      <div className="relative pt-6 pb-10 mb-10 overflow-hidden">
        <PageGeo />
        <h1 className="relative z-10 text-xl lg:text-[40px] font-semibold leading-[1.15] tracking-tight mb-4 max-w-lg">
          {heroTitle}
        </h1>
        <MarkdownContent content={heroSubtitle} className="relative z-10 text-gray-600 leading-relaxed max-w-xl" />
      </div>

      {/* Tiles */}
      <AreaFilteredListing areas={focusAreaDefs} tiles={tiles} noun="talks" />
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
      {/* Podium / broadcast pattern */}
      <circle cx="520" cy="200" r="80" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="520" cy="200" r="50" stroke="#C3E1FF" strokeWidth="0.5" />
      {/* Radiating lines */}
      <line x1="520" y1="120" x2="520" y2="60" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="590" y1="150" x2="640" y2="100" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="600" y1="200" x2="660" y2="200" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="590" y1="250" x2="640" y2="300" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="520" y1="280" x2="520" y2="340" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="450" y1="250" x2="400" y2="300" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="440" y1="200" x2="380" y2="200" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="450" y1="150" x2="400" y2="100" stroke="#C3E1FF" strokeWidth="0.5" />
      {/* Nodes */}
      <circle cx="520" cy="60" r="3" fill="#C3E1FF" />
      <circle cx="640" cy="100" r="3" fill="#C3E1FF" />
      <circle cx="660" cy="200" r="3" fill="#C3E1FF" />
      <circle cx="640" cy="300" r="3" fill="#C3E1FF" />
      <circle cx="520" cy="340" r="3" fill="#C3E1FF" />
      <circle cx="400" cy="300" r="2" fill="#C3E1FF" />
      <circle cx="380" cy="200" r="2" fill="#C3E1FF" />
      <circle cx="400" cy="100" r="2" fill="#C3E1FF" />
    </svg>
  )
}
