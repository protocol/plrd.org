import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import FeaturedInterventions from '@/components/FeaturedInterventions'
import PortfolioMap from '@/components/PortfolioMap'
import { publishedInterventions, catalogHref } from '@/lib/interventions'

export default function InterventionsIndex() {
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
          Fields get stuck at specific bottlenecks. We intervene there, then look for signals that
          the constraint is loosening and the field is moving.
        </p>
      </header>

      <section aria-labelledby="intervention-method" className="rounded-lg bg-gray-100 px-6 py-8 md:px-8">
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <h2 id="intervention-method" className="scroll-mt-24 font-serif text-[28px] font-normal leading-tight tracking-tight text-black md:text-[32px]">
            Observe. Diagnose. Intervene. Repeat.
          </h2>
          <Link
            href={`${catalogHref()}methodology/`}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white no-underline transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            Explore how we accelerate fields
          </Link>
        </div>
      </section>
      <FeaturedInterventions />
      <PortfolioMap items={items} />
    </div>
  )
}
