'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import InterventionStatusTag from '@/components/InterventionStatusTag'
import {
  INTERVENTION_AREA_LABEL,
  INTERVENTION_AREA_ORDER,
  INTERVENTION_TYPES,
  INTERVENTION_STATUS_ORDER,
  INTERVENTION_STATUS_LABEL,
  INTERVENTION_STATUS_DESCRIPTION,
  interventionStatus,
  publicInterventionHref,
  type InterventionTypeId,
  type PublicIntervention,
} from '@/lib/interventions'

// SiteHeader's h-16 navigation plus its 1px bottom border.
const SITE_HEADER_HEIGHT = 65
const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export type MapGroupBy = 'type' | 'area' | 'status'

type Props = {
  items: PublicIntervention[]
}

export default function PortfolioMap({ items }: Props) {
  const [groupBy, setGroupBy] = useState<MapGroupBy>('type')
  const libraryStartRef = useRef<HTMLDivElement>(null)
  const anchorAfterGrouping = useRef(false)

  function changeGrouping(next: MapGroupBy) {
    if (next === groupBy) return
    const start = libraryStartRef.current
    anchorAfterGrouping.current = Boolean(start && start.getBoundingClientRect().top < SITE_HEADER_HEIGHT)
    setGroupBy(next)
  }

  useLayoutEffect(() => {
    if (!anchorAfterGrouping.current) return
    // Regrouping can shorten the page. Anchor after the new layout, before paint,
    // rather than leaving the reader below the results or animating a long jump.
    libraryStartRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    anchorAfterGrouping.current = false
  }, [groupBy])

  const groups = useMemo(() => {
    if (groupBy === 'type') {
      return TYPE_ORDER.map((id) => ({
        key: id,
        title: INTERVENTION_TYPES[id].title,
        type: id,
        description: INTERVENTION_TYPES[id].summary,
        programs: items.filter((item) => item.type === id),
      })).filter((group) => group.programs.length > 0)
    }
    if (groupBy === 'status') {
      return INTERVENTION_STATUS_ORDER.map((status) => ({
        key: status,
        title: INTERVENTION_STATUS_LABEL[status],
        description: INTERVENTION_STATUS_DESCRIPTION[status],
        type: undefined as InterventionTypeId | undefined,
        programs: items.filter((item) => interventionStatus(item) === status),
      })).filter((group) => group.programs.length > 0)
    }
    return INTERVENTION_AREA_ORDER.map((slug) => ({
      key: slug,
      title: INTERVENTION_AREA_LABEL[slug],
      description: undefined,
      type: undefined as InterventionTypeId | undefined,
      programs: items.filter((item) => item.area === slug),
    })).filter((group) => group.programs.length > 0)
  }, [groupBy, items])

  return (
    <section aria-labelledby="explore-all-interventions" className="py-12 md:py-16">
      <div ref={libraryStartRef} data-catalogue-start className="scroll-mt-[65px]" aria-hidden="true" />
      <div className="sticky top-[65px] z-30 -mx-6 flex flex-col gap-3 bg-white/95 px-6 py-3 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <h2 id="explore-all-interventions" className="scroll-mt-[81px] font-serif text-[24px] font-normal leading-[1.08] tracking-tight text-black md:text-[32px]">
          Explore all interventions
        </h2>
        <div className="flex shrink-0 flex-wrap gap-2" role="group" aria-label="Group the map">
          <GroupButton active={groupBy === 'type'} onClick={() => changeGrouping('type')}>
            Intervention type
          </GroupButton>
          <GroupButton active={groupBy === 'area'} onClick={() => changeGrouping('area')}>
            Focus area
          </GroupButton>
          <GroupButton active={groupBy === 'status'} onClick={() => changeGrouping('status')}>
            Status
          </GroupButton>
        </div>
      </div>

      <p className="mb-6 mt-4 text-sm leading-relaxed text-gray-500">
        {groupBy === 'type'
          ? 'Browse every intervention, grouped by intervention type.'
          : groupBy === 'area'
            ? 'Browse every intervention, grouped by focus area.'
            : 'Browse every intervention, grouped by status.'}
      </p>

      <div id="intervention-library" className="border-t border-black/10">
        {groups.map((group) => (
          <div key={group.key} data-catalogue-group={group.key} className="border-b border-black/[0.08] py-6 md:py-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
              {group.type ? (
                <InterventionTypeIcon type={group.type} className="h-3.5 w-3.5 text-gray-500" label={group.title} />
              ) : null}
              {group.title}
              <span className="font-normal text-gray-400">{group.programs.length}</span>
            </div>
            {group.description && <p className="mt-2 text-sm text-gray-500">{group.description}</p>}
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
      className={`rounded-full px-3 py-1 text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue ${
        active ? 'bg-black text-white hover:bg-gray-800 cursor-pointer' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
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
      data-intervention-slug={item.slug}
      scroll={false}
      className="group relative flex h-full w-full min-w-0 flex-col rounded-lg border border-black/10 bg-white p-4 no-underline transition-all hover:border-blue hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
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
      <span className={`mt-2 block font-serif text-[20px] font-normal leading-[1.15] tracking-tight text-black group-hover:underline ${iconReserve}`}>
        {item.title}
      </span>
      <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">{item.summary}</span>
      <span className="mt-auto flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 text-[11px] uppercase tracking-[0.14em] text-gray-400">
        <span>{item.timing}</span>
        <InterventionStatusTag item={item} />
      </span>
    </Link>
  )
}
