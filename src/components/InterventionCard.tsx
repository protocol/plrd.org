import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import InterventionStatusTag from '@/components/InterventionStatusTag'
import {
  INTERVENTION_AREA_ACCENT,
  INTERVENTION_AREA_LABEL,
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
  const accent = INTERVENTION_AREA_ACCENT[item.area]
  return (
    <Link
      href={publicInterventionHref(item.slug)}
      scroll={false}
      className="group flex h-full flex-col rounded-lg border border-black/10 bg-white p-5 no-underline transition-all hover:border-blue hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          {showArea ? INTERVENTION_AREA_LABEL[item.area] : INTERVENTION_TYPES[item.type].title}
        </p>
        <span
          className="intervention-arrow text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black motion-reduce:transform-none"
          aria-hidden="true"
        >
          ↗
        </span>
      </div>
      <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>
        <InterventionTypeIcon type={item.type} className="h-3.5 w-3.5" />
        {INTERVENTION_TYPES[item.type].title}
      </p>
      <h3 className="font-serif text-[22px] font-normal leading-[1.12] tracking-tight text-black">
        {item.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500">{item.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4 text-[11px] uppercase tracking-[0.14em] text-gray-400">
        <span>{item.timing}</span>
        <InterventionStatusTag item={item} />
      </div>
    </Link>
  )
}
