import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  INTERVENTION_METHOD_STEPS,
  INTERVENTION_TYPES,
  catalogHref,
  type InterventionTypeId,
} from '@/lib/interventions'

export const metadata: Metadata = {
  title: 'Intervention methodology',
  description:
    'How PL R&D chooses interventions: map the field, name the bottleneck, intervene, and examine the evidence.',
  alternates: { canonical: '/interventions/methodology/' },
}

const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export default function InterventionMethodologyPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Interventions', href: '/interventions/' },
          { label: 'Methodology' },
        ]}
      />
      <div className="pt-8 pb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Our methodology</p>
        <h1 className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5">
          Start with the constraint. Use the right tool.
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          We look for bottlenecks holding a field back, choose an intervention that could loosen them,
          and test what changes. An intervention can combine more than one tool.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        {INTERVENTION_METHOD_STEPS.map((step) => (
          <div key={step.n} className="border border-gray-200 rounded-lg p-6">
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">{step.n}</div>
            <h2 className="text-lg font-semibold mb-2">{step.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl lg:text-2xl font-semibold tracking-tight mb-3">Six tools, used in combination</h2>
      <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
        A program has one primary type and can draw on supporting types. Narrative, culture, and talent
        cut across the work.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {TYPE_ORDER.map((id) => {
          const tool = INTERVENTION_TYPES[id]
          return (
            <div key={id} className="border border-gray-200 rounded-lg p-5">
              <h3 className="text-base font-medium text-black mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{tool.summary}</p>
              <Link href={`${catalogHref()}?type=${id}`} className="text-sm text-blue hover:underline">
                Browse {tool.title.toLowerCase()} interventions →
              </Link>
            </div>
          )
        })}
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-10 max-w-3xl">
        <h3 className="text-base font-semibold mb-2">One taxonomy still needs to be agreed</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          This catalog uses Orient, Coordinate, Resource, Build, Prove, and Enable from the Economies
          &amp; Governance draft. The unpublished Impact Preview and the Interventions Console currently
          use seven labels: Legibility, Connection, Funding, Policy, Infrastructure, Translation, and
          Culture. Public classification here is reviewed edition metadata. Operational Console types
          are unchanged.
        </p>
      </div>

      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold mb-2">Evidence is not attribution</h3>
        <p className="text-base text-gray-600 leading-relaxed mb-6">
          Fields move with or without PL. We name the work we run and watch whether the field moves.
          Field-level attribution is not cleanly identifiable; making that link clearer remains research
          work. A hypercert, dataset, or report can evidence a program — it is not the intervention itself.
        </p>
        <Link href="/interventions/" className="text-blue hover:underline font-medium">
          Browse the catalog →
        </Link>
      </div>
    </div>
  )
}
