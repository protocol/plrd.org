import Link from 'next/link'
import type { Metadata } from 'next'

import EditPageButton from '@/components/EditPageButton'
import { PageEditHistoryByline } from '@/components/EditHistoryByline'
import AuthorCard from '@/components/AuthorCard'
import Breadcrumb from '@/components/Breadcrumb'
import AreaHeroGraphic from '@/components/AreaHeroGraphic'
import { AreaIcon } from '@/components/AreaIcons'
import MarkdownContent from '@/components/MarkdownContent'
import FA2LiveStatsBand from '@/components/FA2LiveStatsBand'
import opportunityData from '@/data/fa2/opportunityspaces.json'
import { FOCUS_AREA_DESCRIPTIONS } from '@/lib/focus-area-descriptions'
import { fetchPage, getSection, fetchOpportunitySpaces } from '@/lib/indexer'
import { fetchSimocracyStats } from '@/lib/simocracy'
import { fetchGainforestStats } from '@/lib/gainforest'
import { fetchGlowStats } from '@/lib/glow'

type OpportunityCard = {
  id: string
  title: string
  tagline?: string
  image?: string
  description: string
  subfields: string[]
}

async function loadOpportunityCards(): Promise<OpportunityCard[]> {
  const remote = await fetchOpportunitySpaces('economies-governance')
  if (remote.length > 0) {
    return remote.map((o) => ({
      id: o.id,
      title: o.title,
      tagline: o.tagline ?? '',
      image: opportunityData.opportunities.find((s) => s.id === o.id)?.image ?? o.image ?? '',
      description: o.description,
      subfields: o.subfields ?? [],
    }))
  }
  return opportunityData.opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    tagline: o.tagline,
    image: o.image,
    description: o.description,
    subfields: o.subfields,
  }))
}

export const metadata: Metadata = {
  title: 'Economies & Governance',
  description: FOCUS_AREA_DESCRIPTIONS['economies-governance'],
}

// Refresh the live ecosystem stats on the same 60s window the dashboard uses.
export const revalidate = 60

export default async function FA2MainPage() {
  const [page, opportunities, simStats, gainforest, glow] = await Promise.all([
    fetchPage("area-economies-governance"),
    loadOpportunityCards(),
    fetchSimocracyStats(),
    fetchGainforestStats(),
    fetchGlowStats(),
  ])

  const heroSection = getSection(page, "hero")
  const bodySection = getSection(page, "body")

  const exploreSubareas = getSection(page, "explore-subareas")
  const exploreImpact = getSection(page, "explore-impact")
  const exploreProjects = getSection(page, "explore-projects")
  const exploreDepgraph = getSection(page, "explore-depgraph")

  const engFeedback = getSection(page, "engage-feedback")
  const engCases = getSection(page, "engage-cases")
  const engPartners = getSection(page, "engage-partners")
  const engTechnical = getSection(page, "engage-technical")
  const engStrategic = getSection(page, "engage-strategic")

  const bodyContent = bodySection?.body || "This focus area rectifies the inadequacies of current macro systems, which often struggle to coordinate and solve monumental challenges like climate change. By leveraging cryptoeconomics and improved governance tools, we are rethinking how capital is formed and deployed.\n\nThis movement harnesses mechanism design to align millions of people worldwide toward shared goals, creating structures that can allocate resources at the scale of nation-states for the benefit of all humanity."
  return (
    <div className="area-overview pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Focus Areas', href: '/areas/' }, { label: 'Economies & Governance' }]} />
      <div className="mt-4 empty:hidden">
        <PageEditHistoryByline rkey="area-economies-governance" />
      </div>
      {/* Hero */}
      <div className="relative pt-8 pb-12 mb-12 overflow-hidden">
        {/* Hero render with hover hexagon-pixelation lens */}
        <AreaHeroGraphic slug="economies-governance" className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block w-[300px] md:w-[380px] lg:w-[460px] select-none" />

        <div className="flex items-center gap-4 sm:gap-5 mb-6">
          <AreaIcon type="hexagon" className="w-14 h-14 lg:w-16 lg:h-16 shrink-0 text-blue/70" />
          <h1 className="relative z-10 text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight max-w-xl">
            Economies & Governance
          </h1>
        </div>
        <MarkdownContent
          content={heroSection?.subtitle || FOCUS_AREA_DESCRIPTIONS['economies-governance']}
          className="relative z-10 text-lg text-gray-600 leading-relaxed max-w-2xl mb-8"
        />
        <div className="relative z-10 flex flex-wrap gap-4 mb-10">
          <a
            href="#opportunity-spaces"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-medium"
          >
            Opportunity Spaces
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-6-6m6 6l6-6" />
            </svg>
          </a>
        </div>
        <div className="relative z-10 flex flex-wrap gap-4">
          <AuthorCard slug="david-dao" variant="lead" />
          <AuthorCard slug="james-tunningley" variant="lead" />
        </div>
      </div>

      {/* Live ecosystem stats preview */}
      <FA2LiveStatsBand
        href="/areas/economies-governance/impact/live-dashboard/"
        sim={{
          totalSims: { value: simStats.totals.totalSims, series: simStats.trends.totalSims.values },
          totalGatherings: { value: simStats.totals.totalGatherings, series: simStats.trends.totalGatherings.values },
        }}
        gainforest={{
          observations: { value: gainforest.observations, series: gainforest.trends.observations.values },
          bumicerts: { value: gainforest.bumicerts, series: gainforest.trends.bumicerts.values },
          certifiedOrgs: { value: gainforest.certifiedOrgs, series: gainforest.trends.certifiedOrgs.values },
        }}
        glow={{
          powerOutput: { value: glow.powerOutput, series: glow.trends.powerOutput.values },
          activeFarms: { value: glow.activeFarms, series: glow.trends.activeFarms.values },
        }}
      />

      {/* Content */}
      <div className="mb-12 pb-12 border-b border-gray-100">
        <MarkdownContent content={bodyContent} className="page-content text-base text-gray-700 leading-relaxed max-w-3xl" />
      </div>

      {/* Featured Work */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">In Practice</h2>
          <h3 className="text-2xl lg:text-[32px] font-semibold mb-3">Featured Work</h3>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
            Two initiatives where we put these ideas to work, turning collective input into
            legitimate decisions and building the research field that stands behind them.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Broad Listening & Simocracy */}
          <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]">
            <div className="aspect-[4/3] overflow-hidden bg-[#F9F2E2]">
              <img
                src="/images/featured/simocracy.webp"
                alt="A classical Greek temple whose columns shelter rows of server racks — Simocracy"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex flex-1 flex-col p-8">
              <span className="text-xs uppercase tracking-widest text-pink mb-2">Deliberation</span>
              <h4 className="text-lg font-medium text-black mb-3">Broad Listening &amp; Simocracy</h4>
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                AI-assisted sensemaking at the scale of a community or a nation. Broad Listening turns
                thousands of voices on contested questions, such as climate, AI, and public-goods funding,
                into a clear, shared picture, building on a lineage of civic technology like Pol.is and
                Talk to the City. Simocracy takes the next step: at our Funding the Commons experiment in
                San Francisco, structured deliberation surfaced weighted preferences and drove real budget
                allocation, with sims at the table and humans on the wheel.
              </p>
              <div className="mt-auto flex flex-wrap gap-3">
                <FeaturedLink href="https://www.youtube.com/watch?v=kdwHnRJUtTg">Watch the documentary</FeaturedLink>
                <FeaturedLink href="https://www.fundingthecommons.io/post/comparative-floor-governance-at-funding-the-commons-sf">Read the FtC research</FeaturedLink>
                <FeaturedLink href="https://simocracy.org">Explore Simocracy</FeaturedLink>
              </div>
            </div>
          </div>
          {/* AI4PG */}
          <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]">
            <div className="aspect-[4/3] overflow-hidden bg-[#F9F2E2]">
              <img
                src="/images/featured/ai4pg.webp"
                alt="A classical domed rotunda rendered in pencil — AI for Public Goods"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex flex-1 flex-col p-8">
              <span className="text-xs uppercase tracking-widest text-blue mb-2">Research</span>
              <h4 className="text-lg font-medium text-black mb-3">AI for Public Goods (AI4PG)</h4>
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                The academic engine behind the work. AI4PG grows the field of mechanism design for public
                goods in the age of AI, co-funded with Gitcoin and co-led by PL Research. It funds
                grants, convenes workshops with leading universities, and produces open research that gives
                policymakers and communities trustworthy ground to stand on.
              </p>
              <div className="mt-auto flex flex-wrap gap-3">
                <FeaturedLink href="https://ai4pg.com">Visit AI4PG</FeaturedLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunity Spaces (inlined) */}
      <section id="opportunity-spaces" className="mb-16 scroll-mt-24">
        <div className="mb-8">
          <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Strategy</h2>
          <h3 className="text-2xl lg:text-[32px] font-semibold mb-3">{opportunityData.meta.title}</h3>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
            {opportunityData.meta.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
          {opportunities.map((opp) => (
            <Link
              key={opp.id}
              href={`/areas/economies-governance/${opp.id}/`}
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
        </div>
      </section>

      {/* Field velocity is preview-only until a separate public launch. */}

      {/* Explore */}
      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Explore</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <ExploreCard
          href="/areas/economies-governance/subareas/"
          label="Domains"
          title={exploreSubareas?.title || "Subareas"}
          description={exploreSubareas?.subtitle || "9 interconnected subfields driving systemic change."}
        />
        <ExploreCard
          href="/areas/economies-governance/impact/"
          label="Metrics"
          title={exploreImpact?.title || "Impact Dashboard"}
          description={exploreImpact?.subtitle || "Ecosystem impact across villages and funding."}
        />
        <ExploreCard
          href="/areas/economies-governance/projects/"
          label="Ecosystem"
          title={exploreProjects?.title || "Project Explorer"}
          description={exploreProjects?.subtitle || "399 teams building public goods infrastructure."}
        />
        <ExploreCard
          href="/areas/economies-governance/dependency-graph/"
          label="Architecture"
          title={exploreDepgraph?.title || "Dependency Graph"}
          description={exploreDepgraph?.subtitle || "Strategic dependency trees across 4 inflection points."}
        />
      </div>

      {/* How to Engage */}
      <div className="mt-16">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">How to Engage</h2>
        <p className="text-base text-gray-600 mb-6">We are actively seeking:</p>
        <div className="grid md:grid-cols-2 gap-6">
          <EngageItem
            title={engFeedback?.title || "Feedback on this framing"}
            description={engFeedback?.body || "Does this opportunity space resonate? What's missing? What's wrong?"}
          />
          <EngageItem
            title={engCases?.title || "Case studies and examples"}
            description={engCases?.body || "What sovereign DPI deployments, DeSci infrastructure, DePIN projects, or PGF mechanisms should we be learning from?"}
          />
          <EngageItem
            title={engPartners?.title || "Partner identification"}
            description={engPartners?.body || "Who else should be at the table? What institutions, teams, or individuals are essential to this work?"}
          />
          <EngageItem
            title={engTechnical?.title || "Technical input"}
            description={engTechnical?.body || "What reference architectures, standards, or specifications would be most valuable?"}
          />
          <EngageItem
            title={engStrategic?.title || "Strategic counsel"}
            description={engStrategic?.body || "What have we gotten wrong about the field, the opportunity, or the approach?"}
          />
        </div>
        <a
          href="https://forms.gle/xfuuf8U6UPX3obnh8"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-8 text-base text-blue hover:text-black border border-blue/30 hover:border-black/30 px-5 py-2.5 rounded-full transition-colors"
        >
          Share feedback
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </a>
      </div>
      <EditPageButton rkey="area-economies-governance" />
    </div>
  )
}

function FeaturedLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-blue hover:text-black border border-blue/30 hover:border-black/30 px-4 py-2 rounded-full transition-colors no-underline"
    >
      {children}
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
    </a>
  )
}

function EngageItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-l-2 border-gray-100 pl-5">
      <h3 className="text-base font-medium text-black mb-1">{title}</h3>
      <MarkdownContent content={description} className="text-sm text-gray-500 leading-relaxed [&_p]:mb-0" />
    </div>
  )
}

function NavPill({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-2xl hover:border-blue hover:shadow-sm transition-all no-underline"
    >
      <span className="flex flex-col">
        <span className="text-base font-medium text-black group-hover:text-blue transition-colors">{label}</span>
        <span className="text-xs text-gray-400">{description}</span>
      </span>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
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

function ExploreCard({ href, label, title, description }: { href: string; label: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-blue/30 hover:shadow-md transition-all no-underline"
    >
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</div>
        <h3 className="text-base font-medium text-black group-hover:text-blue transition-colors mb-1">{title}</h3>
        <MarkdownContent content={description} className="text-sm text-gray-500 leading-relaxed [&_p]:mb-0" />
      </div>
      <svg className="w-5 h-5 text-gray-300 group-hover:text-blue group-hover:translate-x-1 transition-all shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function AreaGeo() {
  return (
    <svg
      className="absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"
      viewBox="0 0 700 500"
      fill="none"
      aria-hidden="true"
    >
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
