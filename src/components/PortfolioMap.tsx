'use client'

import { useId, useState } from 'react'
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
  const [active, setActive] = useState<string | null>(null)
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
          Columns are focus areas. Rows are intervention types. Hover or focus a mark to open the program.
        </p>
      </div>

      <div className="portfolio-map-scroll -mx-6 overflow-x-auto px-6 md:mx-0 md:overflow-visible md:px-0">
        <div
          className="portfolio-map min-w-[720px] border-t border-black/10 md:min-w-0"
          role="grid"
          aria-label="Interventions by focus area and type"
        >
          <div className="grid grid-cols-[7.5rem_repeat(2,minmax(0,1fr))] border-b border-black/10" role="row">
            <div role="columnheader" className="py-4 pr-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Type
            </div>
            {populated.map((area) => (
              <div key={area} role="columnheader" className="px-3 py-4">
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: INTERVENTION_AREA_ACCENT[area] }}
                    aria-hidden="true"
                  />
                  {INTERVENTION_AREA_LABEL[area]}
                </span>
              </div>
            ))}
          </div>

          {TYPE_ORDER.map((type) => (
            <div
              key={type}
              role="row"
              className="grid grid-cols-[7.5rem_repeat(2,minmax(0,1fr))] border-b border-black/[0.06]"
            >
              <div role="rowheader" className="flex items-center gap-2 py-4 pr-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                <InterventionTypeIcon type={type} className="h-3.5 w-3.5 text-gray-500" />
                {INTERVENTION_TYPES[type].title}
              </div>
              {populated.map((area) => {
                const cell = items.filter((item) => item.area === area && item.type === type)
                return (
                  <div key={area} role="gridcell" className="flex min-h-[3.25rem] flex-wrap items-center gap-2 px-3 py-3">
                    {cell.length === 0 ? (
                      <span className="text-[11px] text-gray-300" aria-hidden="true">
                        ·
                      </span>
                    ) : (
                      cell.map((item) => (
                        <MapMark
                          key={item.slug}
                          item={item}
                          open={active === item.slug}
                          onOpen={() => setActive(item.slug)}
                          onClose={() => setActive((current) => (current === item.slug ? null : current))}
                        />
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
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

function MapMark({
  item,
  open,
  onOpen,
  onClose,
}: {
  item: PublicIntervention
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const accent = INTERVENTION_AREA_ACCENT[item.area]
  return (
    <span className="relative inline-flex" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <Link
        href={publicInterventionHref(item.slug)}
        scroll={false}
        aria-label={item.title}
        onFocus={onOpen}
        onBlur={onClose}
        className="portfolio-mark group inline-flex h-7 min-w-7 items-center justify-center rounded-full border bg-white px-1.5 no-underline transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ borderColor: accent, color: accent, outlineColor: accent }}
      >
        <InterventionTypeIcon type={item.type} className="h-3.5 w-3.5" />
      </Link>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-max max-w-[16rem] -translate-x-1/2 border border-black/10 bg-white px-2.5 py-1.5 text-[12px] leading-snug text-black shadow-[0_8px_24px_rgba(19,19,22,0.06)] ${
          open ? 'block' : 'hidden'
        }`}
      >
        <span className="block font-medium">{item.title}</span>
        <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-gray-400">
          {INTERVENTION_AREA_LABEL[item.area]} · {item.timing}
        </span>
      </span>
    </span>
  )
}

export function comingNextAreas(items: PublicIntervention[]): InterventionAreaSlug[] {
  return INTERVENTION_AREA_ORDER.filter((area) => !items.some((item) => item.area === area))
}
