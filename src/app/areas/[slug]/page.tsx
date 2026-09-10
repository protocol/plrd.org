import type { Metadata } from 'next'

import EditPageButton from '@/components/EditPageButton'
import { PageEditHistoryByline } from '@/components/EditHistoryByline'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { areas, publications, talks, listedBlogPosts as blogPosts } from '@/lib/content'
import { FOCUS_AREA_DESCRIPTIONS, type FocusAreaSlug } from '@/lib/focus-area-descriptions'
import { stripFaPrefix, formatDate } from '@/lib/format'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import AreaHeroGraphic from '@/components/AreaHeroGraphic'
import AreaHeroActions from '@/components/AreaHeroActions'
import AuthorCard from '@/components/AuthorCard'
import Breadcrumb from '@/components/Breadcrumb'
import MarkdownContent from '@/components/MarkdownContent'
import aiOpportunityData from '@/data/fa2/ai-opportunityspaces.json'
import dhrOpportunityData from '@/data/fa2/dhr-opportunityspaces.json'
import neuroOpportunityData from '@/data/fa2/neuro-opportunityspaces.json'

export const revalidate = 300

type OpportunityCard = {
  id: string
  title: string
  tagline?: string
  image?: string
  description: string
  subfields: string[]
}

type OpportunityDataset = {
  meta: { title: string; subtitle: string }
  opportunities: OpportunityCard[]
}

const SLUG_TO_OPPORTUNITY_DATA: Record<string, OpportunityDataset> = {
  'ai-robotics': aiOpportunityData as OpportunityDataset,
  'digital-human-rights': dhrOpportunityData as OpportunityDataset,
  'neurotech': neuroOpportunityData as OpportunityDataset,
}

async function loadOpportunityCards(slug: string): Promise<{
  meta: OpportunityDataset['meta']
  cards: OpportunityCard[]
}> {
  const dataset = SLUG_TO_OPPORTUNITY_DATA[slug]
  if (!dataset) return { meta: { title: '', subtitle: '' }, cards: [] }

  // Source of truth is the repo (src/data/fa2/*.json), edited via PRs.
  return {
    meta: dataset.meta,
    cards: dataset.opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      tagline: o.tagline,
      image: o.image,
      description: o.description,
      subfields: o.subfields,
    })),
  }
}

type Props = { params: Promise<{ slug: string }> }

const HARDCODED_AREA_SLUGS = ['economies-governance']

// Leads are now defined in each area's Markdown frontmatter (leads: [...])
// and flow through the build pipeline into area.leads

const SLUG_TO_ICON: Record<string, AreaIconType> = {
  'digital-human-rights': 'shield',
  'ai-robotics': 'neural',
  'neurotech': 'brain',
}

// Per-area hero-graphic widths (tuned to each render's aspect so the square
// globe isn't too tall and the wide hand/brain aren't overpowering).
const HERO_WIDTH: Record<string, string> = {
  'digital-human-rights': 'w-[240px] md:w-[300px] lg:w-[360px]',
  'ai-robotics': 'w-[320px] md:w-[420px] lg:w-[500px]',
  'neurotech': 'w-[300px] md:w-[380px] lg:w-[440px]',
}

export function generateStaticParams() {
  return areas
    .filter((a) => !HARDCODED_AREA_SLUGS.includes(a.slug))
    .map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const area = areas.find((a) => a.slug === slug)
  if (!area) return { title: 'Not Found' }
  const title = stripFaPrefix(area.title)
  const canonical = `/areas/${area.slug}/`
  return {
    title,
    description: area.summary,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description: area.summary,
    },
  }
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params
  const area = areas.find((a) => a.slug === slug)
  if (!area) notFound()

  // Content is sourced from the repo (Markdown frontmatter + src/data/fa2),
  // edited via PRs. FOCUS_AREA_DESCRIPTIONS is the canonical subtitle; the
  // Markdown frontmatter summary is the fallback.
  const summary = FOCUS_AREA_DESCRIPTIONS[slug as FocusAreaSlug] || area.summary
  const leads = area.leads
  const advisors = area.advisors

  // Unified "Insights" feed for this focus area — the same mix of blog posts,
  // publications, and talks/podcasts surfaced on /insights, newest first.
  type AreaInsight = {
    key: string
    href: string
    external: boolean
    title: string
    type: string
    meta: string
    date: string
  }
  const areaInsights: AreaInsight[] = [
    ...blogPosts
      .filter((b) => b.areas?.includes(slug))
      .map((b) => ({
        key: `blog-${b.slug}`,
        href: b.external_url || `/blog/${b.slug}/`,
        external: !!b.external_url,
        title: b.title,
        type: 'Blog',
        meta: [b.external_url ? 'protocol.ai' : null, formatDate(b.date)].filter(Boolean).join(' · '),
        date: b.date || '',
      })),
    ...publications
      .filter((p) => p.areas?.includes(slug))
      .map((p) => ({
        key: `pub-${p.slug}`,
        href: `/publications/${p.slug}/`,
        external: false,
        title: p.title,
        type: 'Publication',
        meta: [p.venue, formatDate(p.date)].filter(Boolean).join(' · '),
        date: p.date || '',
      })),
    ...talks
      .filter((t) => t.areas?.includes(slug))
      .map((t) => {
        const isPodcast = /podcast/i.test(`${t.venue} ${t.venue_location}`)
        return {
          key: `talk-${t.slug}`,
          href: `/talks/${t.slug}/`,
          external: false,
          title: t.title,
          type: isPodcast ? 'Podcast' : 'Talk',
          meta: [t.venue, formatDate(t.date)].filter(Boolean).join(' · '),
          date: t.date || '',
        }
      }),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 6)

  const { meta: oppMeta, cards: opportunities } = await loadOpportunityCards(slug)

  return (
    <div className="area-overview pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Focus Areas', href: '/areas/' }, { label: stripFaPrefix(area.title) }]} />
      <div className="mt-4 empty:hidden">
        <PageEditHistoryByline rkey={`area-${slug}`} />
      </div>
      {/* Hero */}
      <div className="relative pt-8 pb-12 mb-12 overflow-hidden">
        {slug in HERO_WIDTH ? (
          <AreaHeroGraphic
            slug={slug}
            className={`absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block select-none ${HERO_WIDTH[slug] || 'w-[300px] md:w-[400px] lg:w-[460px]'}`}
          />
        ) : (
          <>
            <AreaHexImage slug={slug} />
            <AreaGeo slug={slug} />
          </>
        )}
        <div className="flex items-center gap-4 sm:gap-5 mb-6">
          <AreaIcon type={SLUG_TO_ICON[slug] || 'hexagon'} className="w-14 h-14 lg:w-16 lg:h-16 shrink-0 text-blue/70" />
          <h1 className="relative z-10 text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight max-w-xl">
            {stripFaPrefix(area.title)}
          </h1>
        </div>
        {summary && (
          <MarkdownContent content={summary} className="relative z-10 text-lg text-gray-600 leading-relaxed max-w-2xl mb-8" />
        )}
        <AreaHeroActions
          areaSlug={slug}
          showOpportunitySpaces={opportunities.length > 0}
          opportunityHref="#opportunity-spaces"
        />
        {leads.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-4">
            {leads.map((authorSlug) => (
              <AuthorCard key={authorSlug} slug={authorSlug} variant="lead" />
            ))}
          </div>
        )}
      </div>

      {/* Content (from the area's Markdown body) */}
      {area.html && (
        <div className="mb-12 pb-12 border-b border-gray-100">
          <div className="page-content text-base text-gray-700 leading-relaxed max-w-3xl" dangerouslySetInnerHTML={{ __html: area.html }} />
        </div>
      )}

      {/* Advisors */}
      {advisors && advisors.length > 0 && (
        <div className="mb-12 pb-12 border-b border-gray-100 max-w-3xl">
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-4">
            {slug === 'neurotech' ? 'Science Advisory Board' : 'Advisors'}
          </h2>
          <div className="flex flex-wrap gap-3">
            {advisors.map((authorSlug) => (
              <AuthorCard key={authorSlug} slug={authorSlug} variant="advisor" />
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Spaces (inlined) */}
      {opportunities.length > 0 && (
        <section id="opportunity-spaces" className="mb-12 pb-12 border-b border-gray-100 scroll-mt-24">
          <div className="mb-8">
            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Strategy</h2>
            <h3 className="text-2xl lg:text-[32px] font-semibold mb-3">{oppMeta.title}</h3>
            <p className="text-base text-gray-600 leading-relaxed max-w-3xl">{oppMeta.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/areas/${slug}/${opp.id}/`}
                className="bg-white p-8 hover:bg-gray-50 transition-colors relative overflow-hidden group no-underline"
              >
                <OppCardGeo />
                {opp.image && (
                  <div className="h-28 mb-5 bg-gray-100 overflow-hidden rounded-sm">
                    <img
                      src={opp.image}
                      alt={opp.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                )}
                <h4 className="relative z-10 text-lg font-medium text-black group-hover:text-blue transition-colors mb-1">
                  {opp.title}
                </h4>
                {opp.tagline && (
                  <p className="relative z-10 text-sm text-gray-400 mb-3">{opp.tagline}</p>
                )}
                <p className="relative z-10 text-base text-gray-600 leading-relaxed mb-4">
                  {opp.description.slice(0, 140)}...
                </p>
                {opp.subfields.length > 0 && (
                  <div className="relative z-10 flex flex-wrap gap-1.5">
                    {opp.subfields.map((sf) => (
                      <span key={sf} className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-sm">
                        {sf}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
            {slug === 'neurotech' && opportunities.length % 2 !== 0 && (
              <div aria-hidden={true} className="hidden md:block bg-white" />
            )}
          </div>
        </section>
      )}

      {/* Field velocity is preview-only until a separate public launch. */}

      {/* Insights — latest posts, publications, and talks for this focus area */}
      {areaInsights.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Insights</h2>
          <div className="divide-y divide-gray-100">
            {areaInsights.map((item) => (
              <div key={item.key} className="py-4">
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-black hover:text-blue transition-colors"
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link href={item.href} className="text-base text-black hover:text-blue transition-colors">
                    {item.title}
                  </Link>
                )}
                <div className="text-sm text-gray-400 mt-1">
                  {[item.type, item.meta].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>
          <Link href="/insights/" className="text-sm text-blue hover:underline mt-6 inline-block">
            All insights →
          </Link>
        </div>
      )}
      <EditPageButton rkey={`area-${slug}`} />
    </div>
  )
}

function OppCardGeo() {
  return (
    <svg
      className="absolute right-2 top-2 w-14 h-14 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-500 ease-out pointer-events-none select-none"
      viewBox="0 0 60 60"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="30" cy="30" r="24" stroke="#C3E1FF" strokeWidth="0.75" strokeDasharray="3 2" />
      <circle cx="30" cy="30" r="16" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="30" cy="6" r="2" fill="#C3E1FF" />
      <circle cx="54" cy="30" r="2" fill="#C3E1FF" />
      <circle cx="6" cy="30" r="2" fill="#C3E1FF" />
      <line x1="30" y1="6" x2="30" y2="14" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="46" y1="30" x2="54" y2="30" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="6" y1="30" x2="14" y2="30" stroke="#C3E1FF" strokeWidth="0.5" />
    </svg>
  )
}

const AREA_IMAGES: Record<string, string> = {
  'neurotech':           '/images/fa2/neurotech.jpg',
  'ai-robotics':         '/images/fa2/ai-robotics.jpg',
  'digital-human-rights':'/images/fa2/digital-human-rights.jpg',
}

function AreaHexImage({ slug }: { slug: string }) {
  const src = AREA_IMAGES[slug]
  if (!src) return null
  // Unique IDs per slug to avoid SVG conflicts when multiple areas render
  const clipId = `hexClip-${slug}`
  const gradId = `hexGrad-${slug}`
  const maskId = `hexMask-${slug}`
  return (
    <div
      className="absolute right-0 top-1/2 -translate-y-1/2 w-[260px] h-[260px] md:w-[360px] md:h-[360px] lg:w-[440px] lg:h-[440px] pointer-events-none select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <clipPath id={clipId}>
            <polygon points="200,40 330,110 330,290 200,360 70,290 70,110">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="45 200 200"
                to="405 200 200"
                dur="60s"
                repeatCount="indefinite"
              />
            </polygon>
          </clipPath>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="50%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id={maskId}>
            <circle cx="200" cy="200" r="200" fill={`url(#${gradId})`} />
          </mask>
        </defs>
        <image
          href={src}
          x="0" y="0"
          width="400" height="400"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          mask={`url(#${maskId})`}
          opacity="0.35"
        />
      </svg>
    </div>
  )
}

function AreaGeo({ slug }: { slug: string }) {
  const cls = "absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"

  if (slug === 'digital-human-rights') {
    // Grid/lattice pattern suggesting digital infrastructure
    return (
      <svg className={cls} viewBox="0 0 700 500" fill="none" aria-hidden="true">
        <rect x="400" y="80" width="120" height="120" stroke="#C3E1FF" strokeWidth="0.75" />
        <rect x="520" y="200" width="100" height="100" stroke="#C3E1FF" strokeWidth="0.75" />
        <rect x="380" y="240" width="80" height="80" stroke="#C3E1FF" strokeWidth="0.75" />
        <rect x="460" y="340" width="110" height="110" stroke="#C3E1FF" strokeWidth="0.75" />
        <line x1="460" y1="140" x2="570" y2="250" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="520" y1="200" x2="460" y2="280" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="460" y1="320" x2="515" y2="340" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="400" y1="200" x2="520" y2="200" stroke="#C3E1FF" strokeWidth="0.5" />
        <circle cx="460" cy="140" r="3" fill="#C3E1FF" />
        <circle cx="520" cy="200" r="3" fill="#C3E1FF" />
        <circle cx="460" cy="280" r="3" fill="#C3E1FF" />
        <circle cx="570" cy="250" r="3" fill="#C3E1FF" />
        <circle cx="515" cy="340" r="3" fill="#C3E1FF" />
      </svg>
    )
  }

  if (slug === 'ai-robotics') {
    // Branching tree pattern suggesting neural networks / AI
    return (
      <svg className={cls} viewBox="0 0 700 500" fill="none" aria-hidden="true">
        <circle cx="500" cy="100" r="40" stroke="#C3E1FF" strokeWidth="0.75" />
        <circle cx="420" cy="220" r="30" stroke="#C3E1FF" strokeWidth="0.75" />
        <circle cx="580" cy="200" r="35" stroke="#C3E1FF" strokeWidth="0.75" />
        <circle cx="380" cy="350" r="25" stroke="#C3E1FF" strokeWidth="0.75" />
        <circle cx="470" cy="370" r="28" stroke="#C3E1FF" strokeWidth="0.75" />
        <circle cx="560" cy="340" r="32" stroke="#C3E1FF" strokeWidth="0.75" />
        <circle cx="620" cy="400" r="20" stroke="#C3E1FF" strokeWidth="0.75" />
        <line x1="500" y1="140" x2="420" y2="190" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="500" y1="140" x2="580" y2="165" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="420" y1="250" x2="380" y2="325" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="420" y1="250" x2="470" y2="342" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="580" y1="235" x2="560" y2="308" stroke="#C3E1FF" strokeWidth="0.5" />
        <line x1="580" y1="235" x2="620" y2="380" stroke="#C3E1FF" strokeWidth="0.5" />
        <circle cx="500" cy="100" r="3" fill="#C3E1FF" />
        <circle cx="420" cy="220" r="3" fill="#C3E1FF" />
        <circle cx="580" cy="200" r="3" fill="#C3E1FF" />
        <circle cx="380" cy="350" r="3" fill="#C3E1FF" />
        <circle cx="470" cy="370" r="3" fill="#C3E1FF" />
        <circle cx="560" cy="340" r="3" fill="#C3E1FF" />
        <circle cx="620" cy="400" r="3" fill="#C3E1FF" />
      </svg>
    )
  }

  if (slug === 'neurotech') {
    // Organic curved paths suggesting neural pathways
    return (
      <svg className={cls} viewBox="0 0 700 500" fill="none" aria-hidden="true">
        <ellipse cx="480" cy="150" rx="60" ry="45" stroke="#C3E1FF" strokeWidth="0.75" />
        <ellipse cx="560" cy="280" rx="50" ry="40" stroke="#C3E1FF" strokeWidth="0.75" />
        <ellipse cx="420" cy="320" rx="55" ry="35" stroke="#C3E1FF" strokeWidth="0.75" />
        <ellipse cx="520" cy="420" rx="45" ry="38" stroke="#C3E1FF" strokeWidth="0.75" />
        <path d="M 480 195 Q 520 230 560 240" stroke="#C3E1FF" strokeWidth="0.5" fill="none" />
        <path d="M 450 185 Q 420 250 420 285" stroke="#C3E1FF" strokeWidth="0.5" fill="none" />
        <path d="M 540 310 Q 530 360 520 382" stroke="#C3E1FF" strokeWidth="0.5" fill="none" />
        <path d="M 440 350 Q 470 380 500 400" stroke="#C3E1FF" strokeWidth="0.5" fill="none" />
        <circle cx="480" cy="150" r="3" fill="#C3E1FF" />
        <circle cx="560" cy="280" r="3" fill="#C3E1FF" />
        <circle cx="420" cy="320" r="3" fill="#C3E1FF" />
        <circle cx="520" cy="420" r="3" fill="#C3E1FF" />
        <circle cx="480" cy="195" r="2" fill="#C3E1FF" />
        <circle cx="560" cy="240" r="2" fill="#C3E1FF" />
      </svg>
    )
  }

  // Default fallback
  return (
    <svg className={cls} viewBox="0 0 700 500" fill="none" aria-hidden="true">
      <circle cx="480" cy="130" r="70" stroke="#C3E1FF" strokeWidth="1" />
      <circle cx="560" cy="250" r="50" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="400" cy="260" r="90" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="520" cy="380" r="55" stroke="#C3E1FF" strokeWidth="1" />
      <line x1="480" y1="130" x2="560" y2="250" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="560" y1="250" x2="520" y2="380" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="400" y1="260" x2="480" y2="130" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="400" y1="260" x2="520" y2="380" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="480" cy="130" r="3" fill="#C3E1FF" />
      <circle cx="560" cy="250" r="3" fill="#C3E1FF" />
      <circle cx="400" cy="260" r="3" fill="#C3E1FF" />
      <circle cx="520" cy="380" r="3" fill="#C3E1FF" />
    </svg>
  )
}
