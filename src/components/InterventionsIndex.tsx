import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import FeaturedInterventions from '@/components/FeaturedInterventions'
import InterventionMethod from '@/components/InterventionMethod'
import InterventionsCatalog from '@/components/InterventionsCatalog'
import PortfolioMap from '@/components/PortfolioMap'
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
    <div className="mx-auto max-w-6xl px-6 pb-8 pt-10 md:pt-16">
      <Breadcrumb items={[{ label: 'Interventions' }]} />

      <header className="max-w-4xl pb-16 pt-14 md:pb-24 md:pt-20">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Public programs</p>
        <h1 className="max-w-[14ch] font-serif text-[44px] font-normal leading-[0.98] tracking-tight text-black md:text-[68px] lg:text-[76px]">
          Turning bottlenecks into breakthroughs
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-600 md:text-xl">
          Fields don&apos;t stall in general. They stall on a specific constraint. These are the
          programs we run to loosen those — and the evidence we look at next.
        </p>
        <Link
          href="/interventions/methodology/"
          className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-black no-underline"
        >
          How we choose the work
          <span className="intervention-arrow transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true">
            →
          </span>
        </Link>
      </header>

      <InterventionMethod />
      <PortfolioMap items={items} />
      <FeaturedInterventions />

      <section id="explore" className="border-t border-black/10 py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-serif text-[32px] font-normal leading-tight tracking-tight text-black md:text-[40px]">
            Explore all interventions
          </h2>
          <p className="mt-3 text-sm text-gray-400">Draft-source examples. Not approved commitments.</p>
        </div>
        <InterventionsCatalog items={items} initialAreas={initialAreas} initialType={initialType} />
      </section>

      <section className="border-t border-black/10 py-16 md:py-24">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          From intervention to evidence
        </p>
        <h2 className="max-w-xl font-serif text-[32px] font-normal leading-[1.08] tracking-tight text-black md:text-[42px]">
          Running a program is only the beginning.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
          We track whether an intervention changes the underlying field — and update the hypothesis accordingly.
        </p>
        <Link
          href="/interventions/methodology/"
          className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-black no-underline"
        >
          Explore how we measure field velocity
          <span className="intervention-arrow transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true">
            →
          </span>
        </Link>
      </section>
    </div>
  )
}
