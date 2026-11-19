import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import MarkdownContent from '@/components/MarkdownContent'
import { fetchPage, getSection } from '@/lib/indexer'

export const metadata: Metadata = {
  title: 'Impact',
  description: 'Track the impact of decentralized economies and governance initiatives.',
}

export default async function ImpactOverviewPage() {
  const page = await fetchPage("area-eg-impact")
  const heroSection = getSection(page, "hero")
  const cardReport = getSection(page, "card-report-2025")
  const cardDashboard = getSection(page, "card-live-dashboard")
  const cardHypercerts = getSection(page, "card-hypercerts")

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[
        { label: 'Focus Areas', href: '/areas/' },
        { label: 'Economies & Governance', href: '/areas/economies-governance/' },
        { label: 'Impact' }
      ]} />

      {/* Hero */}
      <div className="pt-8 pb-12 mb-12">
        <h1 className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5 max-w-xl">
          {heroSection?.title || "Impact"}
        </h1>
        <MarkdownContent
          content={heroSection?.subtitle || "Track ecosystem growth, measure outcomes, and explore the real-world impact of decentralized economies and governance."}
          className="text-lg text-gray-600 leading-relaxed max-w-2xl"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/areas/economies-governance/impact/hypercerts/"
          className="group flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-blue/30 hover:shadow-md transition-all"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue/60 group-hover:text-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              <h2 className="text-lg font-medium text-black group-hover:text-blue transition-colors">
                {cardHypercerts?.title || "Hypercerts"}
              </h2>
            </div>
            <MarkdownContent
              content={cardHypercerts?.body || "Research Retreat editions as verifiable impact claims on the ATProto network, with evidence timelines."}
              className="text-base text-gray-500 leading-relaxed [&_p]:mb-0"
            />
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-blue group-hover:translate-x-1 transition-all shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/areas/economies-governance/impact/report-2025/"
          className="group flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-blue/30 hover:shadow-md transition-all"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue/60 group-hover:text-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-lg font-medium text-black group-hover:text-blue transition-colors">
                {cardReport?.title || "Impact Report 2025"}
              </h2>
            </div>
            <MarkdownContent
              content={cardReport?.body || "Annual report on ecosystem growth, key initiatives, and measurable outcomes."}
              className="text-base text-gray-500 leading-relaxed [&_p]:mb-0"
            />
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-blue group-hover:translate-x-1 transition-all shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/areas/economies-governance/impact/live-dashboard/"
          className="group flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-blue/30 hover:shadow-md transition-all"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue/60 group-hover:text-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-medium text-black group-hover:text-blue transition-colors">
                {cardDashboard?.title || "Live Dashboard"}
              </h2>
            </div>
            <MarkdownContent
              content={cardDashboard?.body || "Real-time metrics and data visualizations tracking ecosystem activity."}
              className="text-base text-gray-500 leading-relaxed [&_p]:mb-0"
            />
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-blue group-hover:translate-x-1 transition-all shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
