import Link from 'next/link'
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
    <section id="interventions" className="mb-12 pb-12 border-b border-gray-100 scroll-mt-24">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Interventions</h2>
        <h3 className="text-2xl lg:text-[32px] font-semibold mb-3">How we move this field forward</h3>
        <p className="text-base text-gray-600 leading-relaxed">
          Each program names a bottleneck in {label}, the work proposed to loosen it, and what would count as progress.
          These are the same records as the{' '}
          <Link href={catalogHref(area)} className="text-blue hover:underline">
            global catalog
          </Link>
          — not a second list.
        </p>
        <Link href="/interventions/methodology/" className="text-sm text-blue hover:underline mt-3 inline-block">
          What is an intervention? →
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <InterventionCard key={item.slug} item={item} showArea={false} />
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500 max-w-2xl">
            No published programs for {label} yet. The current public edition only includes draft examples from
            Economies & Governance and Neurotech. That is a catalog gap, not a claim that no work exists here.
          </p>
          <Link href="/interventions/" className="text-sm text-blue hover:underline mt-3 inline-block">
            Browse the full catalog →
          </Link>
        </div>
      )}
    </section>
  )
}
