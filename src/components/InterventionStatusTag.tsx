import {
  INTERVENTION_STATUS_DESCRIPTION,
  INTERVENTION_STATUS_LABEL,
  interventionStatus,
  type PublicIntervention,
} from '@/lib/interventions'

export default function InterventionStatusTag({ item }: { item: PublicIntervention }) {
  const status = interventionStatus(item)
  return (
    <span
      data-intervention-status={status}
      title={INTERVENTION_STATUS_DESCRIPTION[status]}
      className="inline-flex shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium normal-case tracking-normal text-gray-600"
    >
      {INTERVENTION_STATUS_LABEL[status]}
    </span>
  )
}
