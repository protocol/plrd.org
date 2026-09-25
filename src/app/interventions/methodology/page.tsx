import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import {
  INTERVENTION_METHOD_STEPS,
  INTERVENTION_TYPES,
  catalogHref,
  type InterventionTypeId,
} from '@/lib/interventions'

export const metadata: Metadata = {
  title: 'Intervention methodology',
  description:
    'How PL R&D chooses interventions: diagnose the bottleneck, intervene, then learn from the evidence.',
  alternates: { canonical: '/interventions/methodology/' },
}

const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export default function InterventionMethodologyPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
      <Breadcrumb
        items={[
          { label: 'Interventions', href: '/interventions/' },
          { label: 'Methodology' },
        ]}
      />
      <div className="max-w-3xl pb-10 pt-8">
        <p className="mb-3 text-xs uppercase tracking-widest text-gray-400">Our methodology</p>
        <h1 className="mb-5 text-2xl font-semibold leading-[1.1] tracking-tight lg:text-[44px]">
          Diagnose. Intervene. Learn.
        </h1>
        <p className="text-lg leading-relaxed text-gray-600">
          We read field velocity, name the constraint holding a field back, match an intervention
          that could loosen it, and examine what actually changed. An intervention can combine more
          than one tool.
        </p>
      </div>

      <div className="mb-16 grid gap-6 md:grid-cols-3">
        {INTERVENTION_METHOD_STEPS.map((step) => (
          <div key={step.n} className="rounded-xl border border-gray-200 p-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-blue">{step.n}</div>
            <h2 className="mb-2 text-lg font-semibold">{step.title}</h2>
            <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-xl font-semibold tracking-tight lg:text-2xl">Six tools, used in combination</h2>
      <p className="mb-8 max-w-3xl text-base leading-relaxed text-gray-600">
        A program has one primary type and can draw on supporting types. Narrative, culture, and talent
        cut across the work.
      </p>
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_ORDER.map((id) => {
          const tool = INTERVENTION_TYPES[id]
          return (
            <div key={id} className="rounded-xl border border-gray-200 p-5">
              <div className="mb-3 flex items-center gap-2 text-gray-700">
                <InterventionTypeIcon type={id} className="h-4 w-4" />
                <h3 className="text-base font-medium text-black">{tool.title}</h3>
              </div>
              <p className="mb-4 text-sm text-gray-500">{tool.summary}</p>
              <Link href={`${catalogHref()}?type=${id}`} className="text-sm text-blue hover:underline">
                Browse {tool.title.toLowerCase()} interventions →
              </Link>
            </div>
          )
        })}
      </div>

      <div className="mb-10 max-w-3xl rounded-xl border border-gray-200 p-6">
        <h3 className="mb-2 text-base font-semibold">One taxonomy still needs to be agreed</h3>
        <p className="text-sm leading-relaxed text-gray-600">
          This catalog uses Orient, Coordinate, Resource, Build, Prove, and Enable from the Economies
          &amp; Governance draft. The unpublished Impact Preview and the Interventions Console currently
          use seven labels: Legibility, Connection, Funding, Policy, Infrastructure, Translation, and
          Culture. Public classification here is reviewed edition metadata. Operational Console types
          are unchanged.
        </p>
      </div>

      <div className="max-w-3xl">
        <h3 className="mb-2 text-lg font-semibold">Evidence is not attribution</h3>
        <p className="mb-6 text-base leading-relaxed text-gray-600">
          Fields move with or without PL. We name the work we run and watch whether the field moves.
          Field-level attribution is not cleanly identifiable; making that link clearer remains research
          work. A hypercert, dataset, or report can evidence a program — it is not the intervention itself.
        </p>
        <Link href="/interventions/" className="font-medium text-blue hover:underline">
          Browse the catalog →
        </Link>
      </div>
    </div>
  )
}
