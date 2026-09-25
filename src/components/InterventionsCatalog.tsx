'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import ComingSoonTile from '@/components/ComingSoonTile'
import InterventionCard from '@/components/InterventionCard'
import {
  INTERVENTION_AREA_ICON,
  INTERVENTION_AREA_LABEL,
  INTERVENTION_AREA_ORDER,
  INTERVENTION_STAGE_LABEL,
  INTERVENTION_TYPES,
  type InterventionAreaSlug,
  type InterventionStage,
  type InterventionTypeId,
  type PublicIntervention,
} from '@/lib/interventions'

const ALL = 'all'

type Props = {
  items: PublicIntervention[]
  initialAreas?: InterventionAreaSlug[]
  initialType?: string
}

export default function InterventionsCatalog({ items, initialAreas = [], initialType }: Props) {
  const validInitial = initialAreas.filter((slug) => INTERVENTION_AREA_ORDER.includes(slug))
  const validType =
    initialType && initialType in INTERVENTION_TYPES ? (initialType as InterventionTypeId) : ALL
  const [areas, setAreas] = useState<InterventionAreaSlug[]>(validInitial)
  const [type, setType] = useState<InterventionTypeId | typeof ALL>(validType)
  const [stage, setStage] = useState<InterventionStage | typeof ALL>(ALL)
  const [query, setQuery] = useState('')

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

  const areaCount = (slug: InterventionAreaSlug) => items.filter((item) => item.area === slug).length

  const typeCount = (id: InterventionTypeId) =>
    items.filter((item) => {
      if (areas.length > 0 && !areas.includes(item.area)) return false
      return item.type === id || item.support.includes(id)
    }).length

  const comingSoonAreas =
    !query && type === ALL && stage === ALL
      ? (areas.length > 0 ? areas : INTERVENTION_AREA_ORDER).filter((slug) => areaCount(slug) === 0)
      : []

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {INTERVENTION_AREA_ORDER.map((slug) => {
          const active = areas.includes(slug)
          const count = areaCount(slug)
          return (
            <button
              key={slug}
              type="button"
              aria-pressed={active}
              onClick={() => toggleArea(slug)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] transition-colors ${
                active
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <AreaIcon
                type={INTERVENTION_AREA_ICON[slug] as AreaIconType}
                className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-gray-500'}`}
              />
              {INTERVENTION_AREA_LABEL[slug]}
              {count > 0 && (
                <span className={active ? 'text-white/70' : 'text-gray-400'}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="intervention-search">
          Search interventions
        </label>
        <input
          id="intervention-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search interventions or bottlenecks"
          className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-400 focus:border-blue focus:outline-none sm:max-w-sm"
        />
        <label className="sr-only" htmlFor="intervention-type">
          Intervention type
        </label>
        <select
          id="intervention-type"
          value={type}
          onChange={(event) => setType(event.target.value as InterventionTypeId | typeof ALL)}
          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
        >
          <option value={ALL}>All types</option>
          {(Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]).map((id) => (
            <option key={id} value={id}>
              {INTERVENTION_TYPES[id].title} ({typeCount(id)})
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="intervention-stage">
          Intervention stage
        </label>
        <select
          id="intervention-stage"
          value={stage}
          onChange={(event) => setStage(event.target.value as InterventionStage | typeof ALL)}
          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
        >
          <option value={ALL}>All stages</option>
          {(Object.keys(INTERVENTION_STAGE_LABEL) as InterventionStage[]).map((id) => (
            <option key={id} value={id}>
              {INTERVENTION_STAGE_LABEL[id]}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-6 text-sm text-gray-400" aria-live="polite">
        {filtered.length === 0
          ? `No published examples${areas.length === 1 ? ` in ${INTERVENTION_AREA_LABEL[areas[0]]}` : areas.length > 1 ? ' in selected focus areas' : ''} yet.`
          : `${filtered.length} published ${filtered.length === 1 ? 'example' : 'examples'}${areas.length === 1 ? ` in ${INTERVENTION_AREA_LABEL[areas[0]]}` : areas.length > 1 ? ' in selected focus areas' : ''}.`}
        {' '}Draft-source programs, labeled as proposed — not a verified active inventory.
      </p>

      {filtered.length > 0 || comingSoonAreas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <InterventionCard key={item.slug} item={item} showArea={areas.length !== 1} />
          ))}
          {comingSoonAreas.map((slug) => (
            <ComingSoonTile key={slug} area={slug} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 p-8">
          <h3 className="mb-2 text-lg font-medium text-black">No matching examples</h3>
          <p className="max-w-xl text-sm text-gray-500">
            Try another search, type, or stage. Every current example is a proposed public edition.
          </p>
          <button
            type="button"
            className="mt-4 text-sm text-blue hover:underline"
            onClick={() => {
              setAreas([])
              setType(ALL)
              setStage(ALL)
              setQuery('')
            }}
          >
            Reset filters
          </button>
        </div>
      )}

      <p className="mt-8 text-sm text-gray-400">
        Public types here follow the FA2 draft vocabulary. See the{' '}
        <Link href="/interventions/methodology/" className="text-blue hover:underline">
          methodology
        </Link>{' '}
        for how they relate to the Console toolkit.
      </p>
    </div>
  )
}
