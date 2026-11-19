import type { Metadata } from 'next'
import { tutorials } from '@/lib/content'
import Breadcrumb from '@/components/Breadcrumb'
import MarkdownContent from '@/components/MarkdownContent'
import { ContentTile, ContentTileGrid } from '@/components/ContentTile'
import { fetchPage, getSection } from '@/lib/indexer'

export const metadata: Metadata = { title: 'Tutorials' }

const FALLBACK_HERO_TITLE = 'Tutorials'
const FALLBACK_HERO_SUBTITLE =
  'In-depth guides and educational materials on core research topics.'

export default async function TutorialsPage() {
  const page = await fetchPage('tutorials')
  const hero = getSection(page, 'hero')
  const heroTitle = hero?.title || FALLBACK_HERO_TITLE
  const heroSubtitle = hero?.subtitle || FALLBACK_HERO_SUBTITLE

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Research', href: '/research/' }, { label: 'Tutorials' }]} />
      {/* Hero */}
      <div className="relative pt-6 pb-10 mb-10 overflow-hidden">
        <PageGeo />
        <h1 className="relative z-10 text-xl lg:text-[40px] font-semibold leading-[1.15] tracking-tight mb-4 max-w-lg">
          {heroTitle}
        </h1>
        <MarkdownContent content={heroSubtitle} className="relative z-10 text-gray-600 leading-relaxed max-w-xl" />
      </div>

      {/* Tiles */}
      <ContentTileGrid>
        {tutorials.map((t) => (
          <ContentTile
            key={t.slug}
            href={`/tutorials/${t.slug}/`}
            eyebrow={t.date ? String(new Date(t.date).getFullYear()) : undefined}
            title={t.title || t.slug}
            description={t.summary}
          />
        ))}
      </ContentTileGrid>
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
      {/* Step-based learning path */}
      <rect x="400" y="80" width="120" height="80" rx="4" stroke="#C3E1FF" strokeWidth="0.75" />
      <rect x="460" y="200" width="120" height="80" rx="4" stroke="#C3E1FF" strokeWidth="0.75" />
      <rect x="520" y="320" width="120" height="80" rx="4" stroke="#C3E1FF" strokeWidth="0.75" />
      {/* Connecting arrows */}
      <line x1="460" y1="160" x2="520" y2="200" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="520" y1="280" x2="580" y2="320" stroke="#C3E1FF" strokeWidth="0.5" />
      {/* Step indicators */}
      <circle cx="460" cy="160" r="3" fill="#C3E1FF" />
      <circle cx="520" cy="280" r="3" fill="#C3E1FF" />
      <circle cx="580" cy="320" r="3" fill="#C3E1FF" />
      {/* Lines inside boxes */}
      <line x1="420" y1="110" x2="490" y2="110" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="420" y1="130" x2="500" y2="130" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="230" x2="550" y2="230" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="250" x2="560" y2="250" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="540" y1="350" x2="610" y2="350" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="540" y1="370" x2="620" y2="370" stroke="#C3E1FF" strokeWidth="0.5" />
    </svg>
  )
}
