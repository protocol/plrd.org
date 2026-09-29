'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import InterventionCover from '@/components/InterventionCover'
import {
  INTERVENTION_AREA_LABEL,
  INTERVENTION_AREA_ORDER,
  INTERVENTION_STAGE_LABEL,
  INTERVENTION_TYPES,
  publicInterventionHref,
  type InterventionTypeId,
  type PublicIntervention,
} from '@/lib/interventions'

const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export type MapGroupBy = 'type' | 'area'

type Props = {
  items: PublicIntervention[]
}

export default function PortfolioMap({ items }: Props) {
  const [groupBy, setGroupBy] = useState<MapGroupBy>('type')

  const groups = useMemo(() => {
    if (groupBy === 'type') {
      return TYPE_ORDER.map((id) => ({
        key: id,
        title: INTERVENTION_TYPES[id].title,
        type: id,
        programs: items.filter((item) => item.type === id),
      })).filter((group) => group.programs.length > 0)
    }
    return INTERVENTION_AREA_ORDER.map((slug) => ({
      key: slug,
      title: INTERVENTION_AREA_LABEL[slug],
      type: undefined as InterventionTypeId | undefined,
      programs: items.filter((item) => item.area === slug),
    })).filter((group) => group.programs.length > 0)
  }, [groupBy, items])

  return (
    <section aria-labelledby="explore-all-interventions" className="border-t border-black/10 py-16 md:py-24">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 id="explore-all-interventions" className="scroll-mt-24 font-serif text-[32px] font-normal leading-[1.08] tracking-tight text-black md:text-[40px]">
            Explore all interventions
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            {groupBy === 'type'
              ? 'Each row is an intervention type. The programs in that type sit underneath.'
              : 'Each row is a focus area. The programs in that field sit underneath.'}{' '}
            Draft-source examples. Not approved commitments.
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
          <div key={group.key} className="border-b border-black/[0.08] py-6 md:py-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
              {group.type ? (
                <InterventionTypeIcon type={group.type} className="h-3.5 w-3.5 text-gray-500" label={group.title} />
              ) : null}
              {group.title}
              <span className="font-normal text-gray-400">{group.programs.length}</span>
            </div>
            <ul className="mt-4 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.programs.map((item) => (
                <li key={item.slug} className="flex min-w-0">
                  <ProgramTile item={item} groupBy={groupBy} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-gray-400">
        Public types here follow the FA2 draft vocabulary. See the{' '}
        <Link href="/interventions/methodology/" className="text-black underline decoration-black/20 underline-offset-4 hover:decoration-black">
          methodology
        </Link>{' '}
        for how they relate to the Console toolkit.
      </p>
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
      className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
        active ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
      }`}
    >
      {children}
    </button>
  )
}

function ProgramTile({ item, groupBy }: { item: PublicIntervention; groupBy: MapGroupBy }) {
  const types = [item.type, ...item.support.filter((id) => id !== item.type)]
  const secondary =
    groupBy === 'type' ? INTERVENTION_AREA_LABEL[item.area] : INTERVENTION_TYPES[item.type].title
  const iconReserve = types.length > 2 ? 'pr-28' : 'pr-20'
  return (
    <Link
      href={publicInterventionHref(item.slug)}
      scroll={false}
      className="group relative flex h-full w-full min-w-0 flex-col border border-black/10 bg-white p-4 no-underline transition-colors hover:border-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      <span className="absolute right-3 top-3 flex items-center gap-1">
        {types.map((type) => (
          <InterventionTypeIcon
            key={type}
            type={type}
            label={INTERVENTION_TYPES[type].title}
            className="h-3.5 w-3.5 text-gray-500"
          />
        ))}
      </span>
      <span className={`block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 ${iconReserve}`}>
        {secondary}
      </span>
      <span className="mt-3 flex min-w-0 items-start gap-3">
        <InterventionCover slug={item.slug} compact />
        <span className="min-w-0 font-serif text-[20px] font-normal leading-[1.15] tracking-tight text-black group-hover:underline">
          {item.title}
        </span>
      </span>
      <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">{item.summary}</span>
      <span className="mt-auto flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 text-[11px] uppercase tracking-[0.14em] text-gray-400">
        <span>{item.timing}</span>
        <span>{INTERVENTION_STAGE_LABEL[item.stage]}</span>
      </span>
    </Link>
  )
}
