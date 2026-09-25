import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import InterventionsCatalog from '@/components/InterventionsCatalog'
import { publishedInterventions, type InterventionAreaSlug } from '@/lib/interventions'

export default function InterventionsIndex({
  initialAreas,
  initialType,
}: {
  initialAreas?: InterventionAreaSlug[]
  initialType?: string
}) {
  const items = publishedInterventions()

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
      <Breadcrumb items={[{ label: 'Interventions' }]} />

      <div className="max-w-3xl pb-8 pt-8">
        <p className="mb-3 text-xs uppercase tracking-widest text-blue/80">Public programs</p>
        <h1 className="mb-5 text-2xl font-semibold leading-[1.1] tracking-tight lg:text-[44px]">
          Turning bottlenecks into breakthroughs
        </h1>
        <p className="text-lg leading-relaxed text-gray-600">
          Fields don&apos;t stall in general. They stall on a specific constraint. These are the
          programs we run to loosen those — and the evidence we look at next.
        </p>
        <Link href="/interventions/methodology/" className="mt-5 inline-block font-medium text-blue hover:underline">
          How we choose the work →
        </Link>
      </div>

      <div className="mb-10 grid gap-6 border-y border-gray-100 py-7 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-blue">Diagnose</p>
          <p className="font-medium text-black">Identify the bottlenecks</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Read field velocity. Name the constraint that is actually in the way.
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-blue">Intervene</p>
          <p className="font-medium text-black">Match the work</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Orient, coordinate, resource, build, prove, or enable — whatever loosens that bottleneck.
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-blue">Learn</p>
          <p className="font-medium text-black">Examine the evidence</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Watch whether the field moved. Update the hypothesis, continue, or stop.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Explore the portfolio</h2>
        <p className="mt-2 text-sm text-gray-400">Draft-source examples. Not approved commitments.</p>
      </div>

      <InterventionsCatalog items={items} initialAreas={initialAreas} initialType={initialType} />
    </div>
  )
}
