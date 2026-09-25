import Link from 'next/link'
import {
  INTERVENTION_AREA_LABEL,
  INTERVENTION_STAGE_LABEL,
  INTERVENTION_TYPES,
  publicInterventionHref,
  type PublicIntervention,
} from '@/lib/interventions'

export default function InterventionCard({
  item,
  showArea = true,
}: {
  item: PublicIntervention
  showArea?: boolean
}) {
  return (
    <Link
      href={publicInterventionHref(item.slug)}
      className="group flex h-full flex-col border border-gray-200 rounded-lg p-5 hover:border-blue hover:shadow-sm transition-all no-underline"
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          {INTERVENTION_TYPES[item.type].title}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          {INTERVENTION_STAGE_LABEL[item.stage]}
        </span>
      </div>
      {showArea && (
        <div className="text-xs text-gray-400 mb-2">{INTERVENTION_AREA_LABEL[item.area]}</div>
      )}
      <h3 className="text-base font-medium text-black leading-snug group-hover:text-blue transition-colors">
        {item.title}
      </h3>
      <p className="text-sm text-gray-500 mt-2 line-clamp-3">{item.summary}</p>
      <div className="mt-auto pt-4 text-xs text-gray-400">{item.timing}</div>
    </Link>
  )
}
