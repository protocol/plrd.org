import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import FeaturedInterventions from '@/components/FeaturedInterventions'
import PortfolioMap from '@/components/PortfolioMap'
import { publishedInterventions, catalogHref } from '@/lib/interventions'

export default function InterventionsIndex() {
  const items = publishedInterventions()

  return (
    <div className="pb-8">
      <div className="mx-auto max-w-6xl px-6 pt-6 md:pt-8">
        <Breadcrumb items={[{ label: 'Interventions' }]} />

        <header className="max-w-4xl pb-12 pt-8 md:pb-16">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Public programs</p>
          <h1 className="max-w-[24ch] font-serif text-[32px] font-normal leading-[1.08] tracking-tight text-black md:text-[44px]">
            Turning bottlenecks into breakthroughs
          </h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-gray-600 md:text-[20px]">
            Observe. Diagnose. Intervene. Repeat. We observe each field’s velocity, diagnose its
            bottlenecks, deploy interventions, and measure whether they worked—then repeat.
          </p>
          <Link
            href={`${catalogHref()}methodology/`}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white no-underline transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            Explore how we accelerate fields
          </Link>
        </header>
      </div>
      <FeaturedInterventions />
      <div className="mx-auto max-w-6xl px-6">
        <PortfolioMap items={items} />
      </div>
    </div>
  )
}
