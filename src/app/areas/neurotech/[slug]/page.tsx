import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import opportunityData from '@/data/fa2/neuro-opportunityspaces.json'

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
  // Source of truth is the repo JSON, edited via PRs.
  return opportunityData.opportunities.find((o) => o.id === slug) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const opp = await loadOpp(slug)
  if (!opp) return { title: 'Not Found' }
  return {
    title: `${opp.title} – Neurotech`,
    description: opp.description.slice(0, 160),
    alternates: { canonical: `/areas/neurotech/${slug}/` },
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
          { label: 'Neurotech', href: '/areas/neurotech' },
          { label: opp.title },
        ]}
      />

      {/* Hero */}
      <div className="relative pt-12 pb-12 mb-12 overflow-hidden">
        <OppGeo />
        <p className="relative z-10 text-xs text-blue uppercase tracking-widest mb-3">
          Neurotech
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

      {/* The Opportunity */}
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
