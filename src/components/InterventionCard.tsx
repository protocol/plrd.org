import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
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
      scroll={false}
      className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 no-underline shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-all hover:-translate-y-0.5 hover:border-blue hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
          <InterventionTypeIcon type={item.type} className="h-3 w-3" />
          {INTERVENTION_TYPES[item.type].title}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {INTERVENTION_STAGE_LABEL[item.stage]}
        </span>
      </div>
      {showArea && (
        <div className="mb-2 text-xs text-gray-400">{INTERVENTION_AREA_LABEL[item.area]}</div>
      )}
      <h3 className="text-base font-medium leading-snug text-black transition-colors group-hover:text-blue">
        {item.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-gray-500">{item.summary}</p>
      <div className="mt-auto pt-4 text-xs text-gray-400">{item.timing}</div>
    </Link>
  )
}
