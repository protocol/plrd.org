'use client'

import { useId } from 'react'
import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import {
  INTERVENTION_AREA_ACCENT,
  INTERVENTION_AREA_LABEL,
  INTERVENTION_AREA_ORDER,
  INTERVENTION_TYPES,
  publicInterventionHref,
  type InterventionAreaSlug,
  type InterventionTypeId,
  type PublicIntervention,
} from '@/lib/interventions'

const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export default function PortfolioMap({ items }: { items: PublicIntervention[] }) {
  const labelId = useId()
  const populated = INTERVENTION_AREA_ORDER.filter((area) => items.some((item) => item.area === area))
  const quiet = INTERVENTION_AREA_ORDER.filter((area) => !populated.includes(area))

  return (
    <section aria-labelledby={labelId} className="py-16 md:py-24">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Portfolio map</p>
        <h2 id={labelId} className="font-serif text-[32px] font-normal leading-[1.08] tracking-tight text-black md:text-[40px]">
          How current interventions sit across fields.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-500">
          Each row is an intervention type. The programs in that type are named underneath.
        </p>
      </div>

      <div className="border-t border-black/10">
        {TYPE_ORDER.map((type) => {
          const programs = items.filter((item) => item.type === type)
          return (
            <div key={type} className="border-b border-black/[0.08] py-5 md:py-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                <InterventionTypeIcon type={type} className="h-3.5 w-3.5 text-gray-500" />
                {INTERVENTION_TYPES[type].title}
              </div>
              {programs.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">None in the current catalog.</p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {programs.map((item) => (
                    <li key={item.slug}>
                      <ProgramName item={item} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {quiet.length > 0 && (
        <p className="mt-5 text-[12px] uppercase tracking-[0.14em] text-gray-400">
          Coming next in the map{' '}
          <span className="text-gray-500">
            {quiet.map((area) => INTERVENTION_AREA_LABEL[area]).join(' · ')}
          </span>
        </p>
      )}
    </section>
  )
}

function ProgramName({ item }: { item: PublicIntervention }) {
  const accent = INTERVENTION_AREA_ACCENT[item.area]
  return (
    <Link
      href={publicInterventionHref(item.slug)}
      scroll={false}
      className="group flex min-h-11 items-start gap-2.5 border border-black/10 bg-white px-3 py-2.5 no-underline transition-colors hover:border-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      <span
        className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-snug text-black group-hover:underline">
          {item.title}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          {INTERVENTION_AREA_LABEL[item.area]}
        </span>
      </span>
    </Link>
  )
}

export function comingNextAreas(items: PublicIntervention[]): InterventionAreaSlug[] {
  return INTERVENTION_AREA_ORDER.filter((area) => !items.some((item) => item.area === area))
}
