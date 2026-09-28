'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import {
  INTERVENTION_AREA_LABEL,
  INTERVENTION_AREA_ORDER,
  INTERVENTION_TYPES,
  publicInterventionHref,
  type InterventionAreaSlug,
  type InterventionTypeId,
  type PublicIntervention,
} from '@/lib/interventions'

const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export type MapGroupBy = 'type' | 'area'

export default function PortfolioMap({ items }: { items: PublicIntervention[] }) {
  const labelId = useId()
  const [groupBy, setGroupBy] = useState<MapGroupBy>('type')
  const groups =
    groupBy === 'type'
      ? TYPE_ORDER.map((type) => ({
          key: type,
          title: INTERVENTION_TYPES[type].title,
          type,
          programs: items.filter((item) => item.type === type),
        }))
      : INTERVENTION_AREA_ORDER.map((area) => ({
          key: area,
          title: INTERVENTION_AREA_LABEL[area],
          type: undefined as InterventionTypeId | undefined,
          programs: items.filter((item) => item.area === area),
        }))

  return (
    <section aria-labelledby={labelId} className="py-16 md:py-24">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Portfolio map</p>
          <h2 id={labelId} className="font-serif text-[32px] font-normal leading-[1.08] tracking-tight text-black md:text-[40px]">
            How current interventions sit across fields.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            {groupBy === 'type'
              ? 'Each row is an intervention type. The programs in that type are named underneath.'
              : 'Each row is a focus area. The programs in that field are named underneath.'}
          </p>
        </div>
        <div className="flex shrink-0 border border-black/10" role="group" aria-label="Group the map">
          <GroupButton active={groupBy === 'type'} onClick={() => setGroupBy('type')}>
            Intervention type
          </GroupButton>
          <GroupButton active={groupBy === 'area'} onClick={() => setGroupBy('area')}>
            Focus area
          </GroupButton>
        </div>
      </div>

      <div className="border-t border-black/10">
        {groups.map((group) => (
          <div key={group.key} className="border-b border-black/[0.08] py-5 md:py-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
              {group.type ? (
                <InterventionTypeIcon type={group.type} className="h-3.5 w-3.5 text-gray-500" />
              ) : null}
              {group.title}
            </div>
            {group.programs.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">None in the current catalog.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.programs.map((item) => (
                  <li key={item.slug}>
                    <ProgramName item={item} groupBy={groupBy} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function GroupButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
        active ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
      }`}
    >
      {children}
    </button>
  )
}

function ProgramName({ item, groupBy }: { item: PublicIntervention; groupBy: MapGroupBy }) {
  const types = [item.type, ...item.support.filter((id) => id !== item.type)]
  return (
    <Link
      href={publicInterventionHref(item.slug)}
      scroll={false}
      className="group flex min-h-11 items-start gap-2.5 border border-black/10 bg-white px-3 py-2.5 no-underline transition-colors hover:border-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      <span className="flex shrink-0 items-center gap-1 pt-0.5" aria-hidden="true">
        {types.map((type) => (
          <InterventionTypeIcon key={type} type={type} className="h-3.5 w-3.5 text-gray-500" />
        ))}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-snug text-black group-hover:underline">
          {item.title}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          {groupBy === 'type' ? INTERVENTION_AREA_LABEL[item.area] : INTERVENTION_TYPES[item.type].title}
        </span>
      </span>
    </Link>
  )
}

export function comingNextAreas(items: PublicIntervention[]): InterventionAreaSlug[] {
  return INTERVENTION_AREA_ORDER.filter((area) => !items.some((item) => item.area === area))
}
