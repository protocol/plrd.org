import Link from 'next/link'
import ComingSoonTile from '@/components/ComingSoonTile'
import InterventionCard from '@/components/InterventionCard'
import {
  INTERVENTION_AREA_LABEL,
  catalogHref,
  interventionsForArea,
  type InterventionAreaSlug,
} from '@/lib/interventions'

export default function FocusAreaInterventions({ area }: { area: InterventionAreaSlug }) {
  const items = interventionsForArea(area)
  const label = INTERVENTION_AREA_LABEL[area]

  return (
    <section id="interventions" className="mb-12 scroll-mt-24 border-b border-gray-100 pb-12">
      <div className="mb-8 max-w-3xl">
        <h2 className="mb-2 text-xs uppercase tracking-widest text-gray-400">Interventions</h2>
        <h3 className="mb-3 text-2xl font-semibold lg:text-[32px]">How we move this field forward</h3>
        <p className="text-base leading-relaxed text-gray-600">
          Diagnose the bottleneck in {label}, match the intervention, then learn from the evidence.
          These are the same records as the{' '}
          <Link href={catalogHref(area)} className="text-blue hover:underline">
            global catalog
          </Link>
          — not a second list.
        </p>
        <Link href="/interventions/methodology/" className="mt-3 inline-block text-sm text-blue hover:underline">
          What is an intervention? →
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <InterventionCard key={item.slug} item={item} showArea={false} />
          ))}
        </div>
      ) : (
        <div className="max-w-sm">
          <ComingSoonTile area={area} />
          <Link href="/interventions/" className="mt-4 inline-block text-sm text-blue hover:underline">
            Browse the full catalog →
          </Link>
        </div>
      )}
    </section>
  )
}
