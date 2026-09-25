'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FilterPill } from '@/components/FilterPill'
import InterventionCard from '@/components/InterventionCard'
import {
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
  initialArea?: string
  initialType?: string
}

export default function InterventionsCatalog({ items, initialArea, initialType }: Props) {
  const validInitial =
    initialArea && INTERVENTION_AREA_ORDER.includes(initialArea as InterventionAreaSlug)
      ? (initialArea as InterventionAreaSlug)
      : ALL
  const validType =
    initialType && initialType in INTERVENTION_TYPES ? (initialType as InterventionTypeId) : ALL
  const [area, setArea] = useState<InterventionAreaSlug | typeof ALL>(validInitial)
  const [type, setType] = useState<InterventionTypeId | typeof ALL>(validType)
  const [stage, setStage] = useState<InterventionStage | typeof ALL>(ALL)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (area !== ALL && item.area !== area) return false
      if (type !== ALL && item.type !== type && !item.support.includes(type)) return false
      if (stage !== ALL && item.stage !== stage) return false
      if (!q) return true
      return [item.title, item.summary, item.bottleneck, item.work].join(' ').toLowerCase().includes(q)
    })
  }, [area, items, query, stage, type])

  const areaCount = (slug: InterventionAreaSlug | typeof ALL) =>
    slug === ALL ? items.length : items.filter((item) => item.area === slug).length

  const typeCount = (id: InterventionTypeId) =>
    items.filter((item) => {
      if (area !== ALL && item.area !== area) return false
      return item.type === id || item.support.includes(id)
    }).length

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterPill
          label="All focus areas"
          count={areaCount(ALL)}
          active={area === ALL}
          onClick={() => setArea(ALL)}
        />
        {INTERVENTION_AREA_ORDER.map((slug) => (
          <FilterPill
            key={slug}
            label={INTERVENTION_AREA_LABEL[slug]}
            count={areaCount(slug)}
            active={area === slug}
            disabled={areaCount(slug) === 0}
            onClick={() => setArea(slug)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="intervention-search">
          Search interventions
        </label>
        <input
          id="intervention-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search interventions or bottlenecks"
          className="w-full sm:max-w-sm rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-400 focus:border-blue focus:outline-none"
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

      <p className="text-sm text-gray-400 mb-6" aria-live="polite">
        {filtered.length} published {filtered.length === 1 ? 'example' : 'examples'}
        {area !== ALL ? ` in ${INTERVENTION_AREA_LABEL[area]}` : ''}. Draft-source programs, labeled as proposed — not a verified active inventory.
      </p>

      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <InterventionCard key={item.slug} item={item} showArea={area === ALL} />
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-8">
          <h3 className="text-lg font-medium text-black mb-2">No matching examples</h3>
          <p className="text-sm text-gray-500 max-w-xl">
            {area !== ALL && areaCount(area) === 0
              ? 'This catalog currently includes draft programs from Economies & Governance and Neurotech. Empty here is not a claim that no work exists in this focus area.'
              : 'Try another search, type, or stage. Every current example is a proposed public edition.'}
          </p>
          <button
            type="button"
            className="mt-4 text-sm text-blue hover:underline"
            onClick={() => {
              setArea(ALL)
              setType(ALL)
              setStage(ALL)
              setQuery('')
            }}
          >
            Reset filters
          </button>
        </div>
      )}

      <p className="text-sm text-gray-400 mt-8">
        Public types here follow the FA2 draft vocabulary. See the{' '}
        <Link href="/interventions/methodology/" className="text-blue hover:underline">
          methodology
        </Link>{' '}
        for how they relate to the Console toolkit.
      </p>
    </div>
  )
}
