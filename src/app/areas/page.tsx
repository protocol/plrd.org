import type { Metadata } from 'next'
import Link from 'next/link'
import { areas, authors } from '@/lib/content'
import { stripFaPrefix, slugToName } from '@/lib/format'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import Breadcrumb from '@/components/Breadcrumb'
import MarkdownContent from '@/components/MarkdownContent'
import { fetchPage, getSection } from '@/lib/indexer'
import aiOpportunityData from '@/data/fa2/ai-opportunityspaces.json'
import dhrOpportunityData from '@/data/fa2/dhr-opportunityspaces.json'
import neuroOpportunityData from '@/data/fa2/neuro-opportunityspaces.json'
import econOpportunityData from '@/data/fa2/opportunityspaces.json'

export const metadata: Metadata = { title: 'Focus Areas' }

const AREA_ORDER = ['digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech']

const AREA_ICONS: Record<string, AreaIconType> = {
  'digital-human-rights': 'shield',
  'economies-governance': 'hexagon',
  'ai-robotics': 'neural',
  'neurotech': 'brain',
}

// Opportunity-space names per focus area, sourced from the same datasets that
// power each area's detail page, so this listing stays in sync.
const AREA_OPPORTUNITIES: Record<string, string[]> = {
  'ai-robotics': aiOpportunityData.opportunities.map((o) => o.title),
  'digital-human-rights': dhrOpportunityData.opportunities.map((o) => o.title),
  'neurotech': neuroOpportunityData.opportunities.map((o) => o.title),
  'economies-governance': econOpportunityData.opportunities.map((o) => o.title),
}

// Econ & Gov leads live in the hardcoded detail page rather than frontmatter,
// so mirror them here to keep the listing complete.
const AREA_LEAD_FALLBACK: Record<string, string[]> = {
  'economies-governance': ['david-dao', 'james-tunningley'],
}

function LeadChip({ slug }: { slug: string }) {
  const author = authors.find((a) => a.slug === slug)
  const name = author?.name || slugToName(slug)
  const role = author?.role || 'Area Lead'
  const avatar = author?.avatarPath || null
  return (
    <Link
      href={`/authors/${slug}`}
      className="inline-flex items-center gap-2.5 py-1.5 pl-1.5 pr-4 rounded-full bg-white border border-gray-200 hover:border-blue/40 hover:shadow-sm transition-all no-underline group/lead"
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover grayscale group-hover/lead:grayscale-0 transition-all shrink-0" />
      ) : (
        <span className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-sm font-medium">
          {name.charAt(0)}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-black group-hover/lead:text-blue transition-colors">{name}</span>
        <span className="text-[11px] text-gray-500">{role}</span>
      </span>
    </Link>
  )
}

export default async function AreasPage() {
  const page = await fetchPage("areas")
  const heroSection = getSection(page, "hero")
  const sortedAreas = [...areas].sort(
    (a, b) => AREA_ORDER.indexOf(a.slug) - AREA_ORDER.indexOf(b.slug)
  )
  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Focus Areas' }]} />
      {/* Hero */}
      <div className="relative pt-8 pb-12 mb-12 overflow-hidden">
        <AreasGeo />
        <h1 className="relative z-10 text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5 max-w-xl">
          Focus Areas
        </h1>
        <MarkdownContent
          content={heroSection?.subtitle || "Four research directions driving breakthroughs in computing, coordination, and human capability."}
          className="relative z-10 text-lg text-gray-600 leading-relaxed max-w-2xl"
        />
      </div>

      {/* Stacked focus-area cards */}
      <div className="flex flex-col gap-6">
        {sortedAreas.map((area, i) => {
          const opportunities = AREA_OPPORTUNITIES[area.slug] || []
          const leads = (area.leads && area.leads.length > 0)
            ? area.leads
            : (AREA_LEAD_FALLBACK[area.slug] || [])
          return (
            <div
              key={area.slug}
              className="group relative rounded-2xl border border-gray-200 bg-white hover:border-blue/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden"
            >
              {/* Accent rail */}
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue/40 to-violet/30 opacity-60 group-hover:opacity-100 transition-opacity" />
              <CardGeo />
              <div className="relative flex flex-col md:flex-row gap-6 md:gap-8 p-7 md:p-9">
                {/* Icon + index */}
                <div className="flex md:flex-col items-center md:items-start gap-4 shrink-0">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-blue/[0.04] border border-blue/10 group-hover:bg-blue/[0.07] transition-colors">
                    <AreaIcon type={AREA_ICONS[area.slug] || 'shield'} />
                  </div>
                  <span className="text-xs font-mono text-gray-300 tracking-widest">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/areas/${area.slug}`}
                    className="inline-flex items-center gap-2 no-underline"
                  >
                    <h2 className="text-xl lg:text-2xl font-semibold text-black group-hover:text-blue transition-colors">
                      {stripFaPrefix(area.title)}
                    </h2>
                    <svg className="w-5 h-5 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {area.summary && (
                    <p className="mt-2 text-base text-gray-600 leading-relaxed max-w-2xl">
                      {area.summary}
                    </p>
                  )}

                  {/* Opportunity spaces */}
                  {opportunities.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-2.5">
                        Opportunity spaces
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {opportunities.map((title) => (
                          <span
                            key={title}
                            className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full group-hover:border-gray-300 transition-colors"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leads */}
                  {leads.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-2.5">
                      <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mr-1">
                        {leads.length > 1 ? 'Leads' : 'Lead'}
                      </span>
                      {leads.map((leadSlug) => (
                        <LeadChip key={leadSlug} slug={leadSlug} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CardGeo() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-[220px] opacity-[0.35] group-hover:opacity-60 transition-opacity duration-500 pointer-events-none select-none"
      viewBox="0 0 300 240"
      fill="none"
      aria-hidden="true"
    >
      <polygon points="200,40 240,80 200,120 160,80" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="250,110 280,145 250,180 220,145" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="160,140 200,180 160,220 120,180" stroke="#C3E1FF" strokeWidth="0.75" />
      <line x1="200" y1="120" x2="160" y2="140" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="240" y1="80" x2="250" y2="110" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="200" cy="40" r="2.5" fill="#C3E1FF" />
      <circle cx="250" cy="110" r="2.5" fill="#C3E1FF" />
      <circle cx="160" cy="140" r="2.5" fill="#C3E1FF" />
    </svg>
  )
}

function AreasGeo() {
  return (
    <svg
      className="absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"
      viewBox="0 0 700 500"
      fill="none"
      aria-hidden="true"
    >
      <polygon points="480,80 540,150 480,220 420,150" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="580,180 630,240 580,300 530,240" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="400,280 460,350 400,420 340,350" stroke="#C3E1FF" strokeWidth="0.75" />
      <polygon points="540,330 590,390 540,450 490,390" stroke="#C3E1FF" strokeWidth="0.75" />
      <line x1="480" y1="220" x2="530" y2="240" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="540" y1="150" x2="580" y2="180" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="420" y1="150" x2="400" y2="280" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="460" y1="350" x2="490" y2="390" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="580" y1="300" x2="540" y2="330" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="480" cy="80" r="3" fill="#C3E1FF" />
      <circle cx="580" cy="180" r="3" fill="#C3E1FF" />
      <circle cx="400" cy="280" r="3" fill="#C3E1FF" />
      <circle cx="540" cy="330" r="3" fill="#C3E1FF" />
    </svg>
  )
}
