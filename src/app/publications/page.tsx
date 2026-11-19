import type { Metadata } from 'next'
import { publications, authors, focusAreaDefs } from '@/lib/content'
import { slugToName } from '@/lib/format'
import Breadcrumb from '@/components/Breadcrumb'
import BackToInsights from '@/components/BackToInsights'
import MarkdownContent from '@/components/MarkdownContent'
import AreaFilteredListing, { type FilterableTile } from '@/components/AreaFilteredListing'
import { fetchPage, getSection } from '@/lib/indexer'

function resolveAuthorName(slug: string): string {
  return authors.find((a) => a.slug === slug)?.name || slugToName(slug)
}

export const metadata: Metadata = { title: 'Publications' }

const FALLBACK_HERO_TITLE = 'Publications'
const FALLBACK_HERO_SUBTITLE =
  'Papers and articles advancing the frontiers of decentralized systems, cryptography, and distributed computing.'

export default async function PublicationsPage() {
  const page = await fetchPage('publications')
  const hero = getSection(page, 'hero')
  const heroTitle = hero?.title || FALLBACK_HERO_TITLE
  const heroSubtitle = hero?.subtitle || FALLBACK_HERO_SUBTITLE

  const tiles: FilterableTile[] = publications.map((pub) => ({
    key: pub.slug,
    href: `/publications/${pub.slug}/`,
    eyebrow: [pub.venue, pub.date && new Date(pub.date).getFullYear()].filter(Boolean).join(' · '),
    title: pub.title,
    description: pub.authors?.map(resolveAuthorName).join(', '),
    areas: pub.areas ?? [],
  }))

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Research', href: '/research/' }, { label: 'Publications' }]} />
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
      <AreaFilteredListing areas={focusAreaDefs} tiles={tiles} noun="publications" />
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
      {/* Stacked pages/documents */}
      <rect x="420" y="80" width="180" height="240" rx="4" stroke="#C3E1FF" strokeWidth="0.75" />
      <rect x="440" y="100" width="180" height="240" rx="4" stroke="#C3E1FF" strokeWidth="0.75" />
      <rect x="460" y="120" width="180" height="240" rx="4" stroke="#C3E1FF" strokeWidth="0.75" />
      {/* Lines on top page */}
      <line x1="480" y1="160" x2="600" y2="160" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="185" x2="620" y2="185" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="210" x2="590" y2="210" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="235" x2="610" y2="235" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="260" x2="570" y2="260" stroke="#C3E1FF" strokeWidth="0.5" />
      {/* Nodes */}
      <circle cx="420" cy="80" r="3" fill="#C3E1FF" />
      <circle cx="640" cy="360" r="3" fill="#C3E1FF" />
      <circle cx="460" cy="120" r="2" fill="#C3E1FF" />
    </svg>
  )
}
