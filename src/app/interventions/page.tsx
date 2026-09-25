import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import InterventionsCatalog from '@/components/InterventionsCatalog'
import { INTERVENTION_AREA_ORDER, publishedInterventions, type InterventionAreaSlug } from '@/lib/interventions'

export const metadata: Metadata = {
  title: 'Interventions',
  description:
    'Browse PL R&D interventions across Digital Human Rights, Economies & Governance, AI & Robotics, and Neurotech. Start with the bottleneck, then the work.',
  alternates: { canonical: '/interventions/' },
  openGraph: {
    type: 'website',
    url: '/interventions/',
    title: 'Interventions',
    description:
      'Browse PL R&D interventions across four focus areas. Start with the bottleneck, then the work.',
  },
}

export default async function InterventionsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[]; type?: string | string[] }>
}) {
  const query = await searchParams
  const raw = typeof query.area === 'string' ? query.area : undefined
  const initialArea =
    raw && INTERVENTION_AREA_ORDER.includes(raw as InterventionAreaSlug) ? raw : undefined
  const initialType = typeof query.type === 'string' ? query.type : undefined
  const items = publishedInterventions()

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Interventions' }]} />
      <div className="pt-8 pb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">The interventions catalog</p>
        <h1 className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5">
          Turning bottlenecks into breakthroughs
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          PL R&D helps frontier ideas move from open research to deployment — one field-level constraint
          at a time. Browse the public programs below, or read how we choose the work.
        </p>
        <Link href="/interventions/methodology/" className="mt-5 inline-block text-blue hover:underline font-medium">
          How we choose our interventions →
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 py-5 mb-10 border-y border-gray-100 text-sm text-gray-600">
        <div className="flex flex-wrap items-center gap-2">
          <span>Find the bottleneck</span>
          <span aria-hidden="true" className="text-gray-300">
            →
          </span>
          <span>Choose the intervention</span>
          <span aria-hidden="true" className="text-gray-300">
            →
          </span>
          <span>Learn from the evidence</span>
        </div>
        <span className="text-xs text-gray-400">One method. Four focus areas.</span>
      </div>

      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">Explore the portfolio</h2>
        <p className="text-sm text-gray-400 mt-2">
          Draft-source examples. Not approved commitments.
        </p>
      </div>

      <InterventionsCatalog items={items} initialArea={initialArea} initialType={initialType} />
    </div>
  )
}
