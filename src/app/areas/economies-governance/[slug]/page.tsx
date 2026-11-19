import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import opportunityData from '@/data/fa2/opportunityspaces.json'
import { fetchOpportunitySpace } from '@/lib/indexer'
import { opportunitySpaceRkey } from '@/lib/lexicons'

type Props = {
  params: Promise<{ slug: string }>
}

type Opportunity = (typeof opportunityData)['opportunities'][number]

export function generateStaticParams() {
  return opportunityData.opportunities.map((opp) => ({
    slug: opp.id,
  }))
}

async function loadOpp(slug: string): Promise<Opportunity | null> {
  const rkey = opportunitySpaceRkey('economies-governance', slug)
  const staticOpp = opportunityData.opportunities.find((o) => o.id === slug)
  const remote = await fetchOpportunitySpace(rkey)
  if (remote) {
    return {
      id: remote.id,
      title: remote.title,
      tagline: remote.tagline ?? '',
      image: staticOpp?.image ?? remote.image ?? '',
      description: remote.description,
      inflectionPoint: remote.inflectionPoint ?? '',
      shift: remote.shift ?? '',
      theOpportunity: remote.theOpportunity ?? '',
      subfields: remote.subfields ?? [],
      tippingSignals: remote.tippingSignals ?? [],
      keyAssumptions: remote.keyAssumptions ?? [],
      observations: remote.observations ?? [],
      fieldSignals: remote.fieldSignals ?? [],
    } as Opportunity
  }
  return staticOpp ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const opp = await loadOpp(slug)
  if (!opp) return { title: 'Not Found' }
  return {
    title: opp.title,
    description: opp.description.slice(0, 160),
  }
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { slug } = await params
  const opp = await loadOpp(slug)
  if (!opp) notFound()

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Areas', href: '/areas' },
          { label: 'Economies & Governance', href: '/areas/economies-governance' },
          { label: opp.title },
        ]}
      />

      {/* Hero */}
      <div className="relative pt-12 pb-12 mb-12 overflow-hidden">
        <OppGeo />
        <p className="relative z-10 text-xs text-blue uppercase tracking-widest mb-3">
          Economies & Governance
        </p>
        <h1 className="relative z-10 text-2xl lg:text-[40px] font-semibold leading-[1.1] tracking-tight mb-4 whitespace-nowrap">
          {opp.title}
        </h1>
        {opp.tagline && (
          <p className="relative z-10 text-base text-gray-400 mb-5">{opp.tagline}</p>
        )}

        {/* Opportunity space image */}
        {opp.image && (
          <div className="relative z-10 mb-8 h-64 lg:h-80 bg-gray-100 overflow-hidden rounded-sm">
            <img
              src={opp.image}
              alt={opp.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <p className="relative z-10 text-lg text-gray-600 leading-relaxed">{opp.description}</p>

        {/* Subfields */}
        {opp.subfields.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-2 mt-6">
            {opp.subfields.map((sf) => (
              <span key={sf} className="text-xs text-gray-400 border border-gray-200 px-2.5 py-1 rounded-sm">
                {sf}
              </span>
            ))}
          </div>
        )}

        {/* Dependency Graph link */}
        <Link
          href={`/areas/economies-governance/dependency-graph/${opp.id}`}
          className="relative z-10 group inline-flex items-center gap-3 mt-8 px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-blue/30 hover:shadow-md transition-all no-underline"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gray-400 group-hover:text-blue transition-colors shrink-0">
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="3.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" />
            <circle cx="14.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" />
            <circle cx="3.5" cy="14" r="1.5" stroke="currentColor" strokeWidth="1" />
            <circle cx="14.5" cy="14" r="1.5" stroke="currentColor" strokeWidth="1" />
            <line x1="5" y1="5.8" x2="7" y2="7.8" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <line x1="13" y1="5.8" x2="11" y2="7.8" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <line x1="5" y1="13" x2="7" y2="10.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <line x1="13" y1="13" x2="11" y2="10.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          </svg>
          <div>
            <div className="text-sm font-medium text-black group-hover:text-blue transition-colors">Dependency Graph</div>
            <div className="text-xs text-gray-400">Explore our knowledge graph</div>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-blue group-hover:translate-x-0.5 transition-all shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Inflection Point */}
      {opp.inflectionPoint && (
        <div className="mb-12 pb-12 border-b border-gray-100">
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-5">Inflection Point</h2>
          <p className="text-base text-black leading-relaxed font-medium mb-6 max-w-3xl">{opp.inflectionPoint}</p>

          {opp.shift && (
            <div className="border-l-2 border-blue/40 pl-5 mb-6">
              <p className="text-base text-gray-600 italic">{opp.shift}</p>
            </div>
          )}

          {opp.tippingSignals && opp.tippingSignals.length > 0 && (
            <div>
              <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Tipping Signals</h3>
              <div className="flex flex-wrap gap-2">
                {opp.tippingSignals.map((signal, i) => (
                  <span key={i} className="text-sm text-gray-500 border border-gray-200 px-3 py-1 rounded-sm">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* The Opportunity (vision) */}
      {opp.theOpportunity && (
        <div className="mb-12 pb-12 border-b border-gray-100">
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-5">The Opportunity</h2>
          <p className="text-base text-gray-700 leading-relaxed max-w-3xl">{opp.theOpportunity}</p>
        </div>
      )}

      {/* Context & Friction side by side */}
      <div className="mb-12 pb-12 border-b border-gray-100 grid md:grid-cols-2 gap-12">
        {/* Context */}
        {opp.keyAssumptions.length > 0 && (
          <div>
            <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-5">Context</h2>
            <div className="space-y-4">
              {opp.keyAssumptions.map((assumption, i) => (
                <p key={i} className="text-base text-gray-600 leading-relaxed">{assumption}</p>
              ))}
            </div>
          </div>
        )}

        {/* Friction */}
        {opp.observations.length > 0 && (
          <div>
            <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-5">Friction</h2>
            <div className="space-y-4">
              {opp.observations.map((obs, i) => (
                <p key={i} className="text-base text-gray-600 leading-relaxed">{obs}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Field Signals */}
      {opp.fieldSignals && opp.fieldSignals.length > 0 && (
        <div>
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-5">Field Signals</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {opp.fieldSignals.map((signal, i) => (
              <div key={i} className="border-l-2 border-gray-100 pl-5 py-2">
                <span className="text-base font-medium text-black">{signal.kpi}</span>
                <p className="text-sm text-gray-400 mt-1">{signal.measurement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OppGeo() {
  return (
    <svg
      className="absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"
      viewBox="0 0 700 500"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="500" cy="120" r="65" stroke="#C3E1FF" strokeWidth="1" />
      <circle cx="580" cy="260" r="50" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="420" cy="300" r="70" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="540" cy="400" r="45" stroke="#C3E1FF" strokeWidth="1" />
      <line x1="500" y1="120" x2="580" y2="260" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="580" y1="260" x2="540" y2="400" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="420" y1="300" x2="500" y2="120" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="420" y1="300" x2="540" y2="400" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="500" y1="120" x2="540" y2="400" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="500" cy="120" r="3" fill="#C3E1FF" />
      <circle cx="580" cy="260" r="3" fill="#C3E1FF" />
      <circle cx="420" cy="300" r="3" fill="#C3E1FF" />
      <circle cx="540" cy="400" r="3" fill="#C3E1FF" />
    </svg>
  )
}
