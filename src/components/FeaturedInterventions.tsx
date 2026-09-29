import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import InterventionCover from '@/components/InterventionCover'
import {
  INTERVENTION_AREA_LABEL,
  INTERVENTION_STAGE_LABEL,
  INTERVENTION_TYPES,
  featuredInterventions,
  publicInterventionHref,
} from '@/lib/interventions'

export default function FeaturedInterventions() {
  const items = featuredInterventions()
  if (items.length === 0) return null

  return (
    <section aria-labelledby="featured-interventions" className="border-t border-black/10 py-16 md:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 id="featured-interventions" className="scroll-mt-24 font-serif text-[32px] font-normal leading-tight tracking-tight text-black md:text-[36px]">
          Featured interventions
        </h2>
        <p className="text-xs leading-relaxed text-gray-500">Draft-source examples · Not approved commitments</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={publicInterventionHref(item.slug)}
            scroll={false}
            className="group flex min-w-0 flex-col overflow-hidden border border-black/10 bg-white no-underline transition-colors hover:border-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <InterventionCover slug={item.slug} />
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {INTERVENTION_AREA_LABEL[item.area]}
                </p>
                <span className="intervention-arrow text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" aria-hidden="true">↗</span>
              </div>
              <p className="mt-7 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                <InterventionTypeIcon type={item.type} className="h-3.5 w-3.5" />
                {INTERVENTION_TYPES[item.type].title}
              </p>
              <h3 className="mt-3 font-serif text-[28px] font-normal leading-[1.08] tracking-tight text-black">{item.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">{item.summary}</p>
              <div className="mt-auto pt-8">
                <p className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4 text-[11px] uppercase tracking-[0.14em] text-gray-500">
                  <span>{item.timing}</span>
                  <span>{INTERVENTION_STAGE_LABEL[item.stage]}</span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
