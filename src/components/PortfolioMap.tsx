'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import {
  INTERVENTION_AREA_LABEL,
  INTERVENTION_AREA_ORDER,
  INTERVENTION_STAGE_LABEL,
  INTERVENTION_TYPES,
  publicInterventionHref,
  type InterventionAreaSlug,
  type InterventionStage,
  type InterventionTypeId,
  type PublicIntervention,
} from '@/lib/interventions'

const ALL = 'all'
const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export type MapGroupBy = 'type' | 'area'

type Props = {
  items: PublicIntervention[]
  initialAreas?: InterventionAreaSlug[]
  initialType?: string
}

export default function PortfolioMap({ items, initialAreas = [], initialType }: Props) {
  const validInitial = initialAreas.filter((slug) => INTERVENTION_AREA_ORDER.includes(slug))
  const validType =
    initialType && initialType in INTERVENTION_TYPES ? (initialType as InterventionTypeId) : ALL
  const [areas, setAreas] = useState<InterventionAreaSlug[]>(validInitial)
  const [type, setType] = useState<InterventionTypeId | typeof ALL>(validType)
  const [stage, setStage] = useState<InterventionStage | typeof ALL>(ALL)
  const [query, setQuery] = useState('')
  const [groupBy, setGroupBy] = useState<MapGroupBy>('type')

  const toggleArea = (slug: InterventionAreaSlug) => {
    setAreas((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    )
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (areas.length > 0 && !areas.includes(item.area)) return false
      if (type !== ALL && item.type !== type && !item.support.includes(type)) return false
      if (stage !== ALL && item.stage !== stage) return false
      if (!q) return true
      return [item.title, item.summary, item.bottleneck, item.work].join(' ').toLowerCase().includes(q)
    })
  }, [areas, items, query, stage, type])

  const groups = useMemo(() => {
    if (groupBy === 'type') {
      return TYPE_ORDER.map((id) => ({
        key: id,
        title: INTERVENTION_TYPES[id].title,
        type: id,
        programs: filtered.filter((item) => item.type === id),
      })).filter((group) => group.programs.length > 0)
    }
    return INTERVENTION_AREA_ORDER.map((slug) => ({
      key: slug,
      title: INTERVENTION_AREA_LABEL[slug],
      type: undefined as InterventionTypeId | undefined,
      programs: filtered.filter((item) => item.area === slug),
    })).filter((group) => group.programs.length > 0)
  }, [filtered, groupBy])

  const filtersActive = query.trim().length > 0 || areas.length > 0 || type !== ALL || stage !== ALL

  return (
    <section aria-labelledby="portfolio-map" className="py-16 md:py-24">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Portfolio map</p>
        <h2 id="portfolio-map" className="font-serif text-[32px] font-normal leading-[1.08] tracking-tight text-black md:text-[40px]">
          How current interventions sit across fields.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-500">
          {groupBy === 'type'
            ? 'Each row is an intervention type. The programs in that type sit underneath.'
            : 'Each row is a focus area. The programs in that field sit underneath.'}{' '}
          Draft-source examples. Not approved commitments.
        </p>
      </div>

      <div className="sticky top-16 z-30 -mx-6 border-y border-black/10 bg-white/95 px-6 py-3 backdrop-blur-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="sr-only" htmlFor="intervention-search">
            Search interventions
          </label>
          <input
            id="intervention-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search interventions or bottlenecks..."
            className="w-full border-0 bg-transparent px-0 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none lg:max-w-sm"
          />
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <div className="flex border border-black/10" role="group" aria-label="Group the map">
              <GroupButton active={groupBy === 'type'} onClick={() => setGroupBy('type')}>
                Intervention type
              </GroupButton>
              <GroupButton active={groupBy === 'area'} onClick={() => setGroupBy('area')}>
                Focus area
              </GroupButton>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Focus areas">
              {INTERVENTION_AREA_ORDER.map((slug) => {
                const active = areas.includes(slug)
                return (
                  <button
                    key={slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleArea(slug)}
                    className={`border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] transition-colors ${
                      active
                        ? 'border-black bg-black text-white'
                        : 'border-black/10 bg-white text-gray-500 hover:border-black/30 hover:text-black'
                    }`}
                  >
                    {INTERVENTION_AREA_LABEL[slug]}
                  </button>
                )
              })}
            </div>
            <FilterSelect
              id="intervention-type"
              label="Type"
              value={type}
              onChange={(value) => setType(value as InterventionTypeId | typeof ALL)}
            >
              <option value={ALL}>Type</option>
              {TYPE_ORDER.map((id) => (
                <option key={id} value={id}>
                  {INTERVENTION_TYPES[id].title}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              id="intervention-stage"
              label="Stage"
              value={stage}
              onChange={(value) => setStage(value as InterventionStage | typeof ALL)}
            >
              <option value={ALL}>Stage</option>
              {(Object.keys(INTERVENTION_STAGE_LABEL) as InterventionStage[]).map((id) => (
                <option key={id} value={id}>
                  {INTERVENTION_STAGE_LABEL[id]}
                </option>
              ))}
            </FilterSelect>
            <p className="ml-1 text-[12px] uppercase tracking-[0.12em] text-gray-400" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'intervention' : 'interventions'}
            </p>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 border-t border-black/10">
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
                  <li key={item.slug} className="flex">
                    <ProgramTile item={item} groupBy={groupBy} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 border border-black/10 p-8">
          <h3 className="mb-2 font-serif text-2xl font-normal text-black">No matching interventions</h3>
          <p className="max-w-xl text-sm text-gray-500">
            Try another search, field, type, or stage. Every current example is a proposed public edition.
          </p>
          {filtersActive && (
            <button
              type="button"
              className="mt-4 text-sm text-black underline decoration-black/30 underline-offset-4 hover:decoration-black"
              onClick={() => {
                setAreas([])
                setType(ALL)
                setStage(ALL)
                setQuery('')
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      )}

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

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none border border-black/10 bg-white py-1.5 pl-3 pr-7 text-[12px] uppercase tracking-[0.12em] text-gray-600 focus:border-black focus:outline-none"
      >
        {children}
      </select>
    </label>
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
      className="group relative flex h-full w-full flex-col border border-black/10 bg-white p-4 no-underline transition-colors hover:border-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
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
        <span>{INTERVENTION_STAGE_LABEL[item.stage]}</span>
      </span>
    </Link>
  )
}
