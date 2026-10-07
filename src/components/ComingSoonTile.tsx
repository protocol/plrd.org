import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import { INTERVENTION_AREA_ICON, INTERVENTION_AREA_LABEL, type InterventionAreaSlug } from '@/lib/interventions'

export default function ComingSoonTile({ area }: { area: InterventionAreaSlug }) {
  const label = INTERVENTION_AREA_LABEL[area]
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="pointer-events-none select-none p-5 blur-[2.5px] opacity-50" aria-hidden="true">
        <div className="mb-3 flex gap-1.5">
          <span className="h-5 w-16 rounded-full bg-gray-200" />
          <span className="h-5 w-14 rounded-full bg-gray-100" />
        </div>
        <div className="mb-3 h-3 w-28 rounded bg-gray-200" />
        <div className="mb-2 h-5 w-4/5 rounded bg-gray-300" />
        <div className="mb-1.5 h-3.5 w-full rounded bg-gray-100" />
        <div className="mb-1.5 h-3.5 w-5/6 rounded bg-gray-100" />
        <div className="h-3.5 w-2/3 rounded bg-gray-100" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 px-4 text-center">
        <AreaIcon
          type={INTERVENTION_AREA_ICON[area] as AreaIconType}
          className="h-8 w-8 text-gray-400"
        />
        <p className="mt-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">Coming soon</p>
        <p className="mt-1 text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
