import ImpactDashboardV2 from '@/components/ImpactDashboardV2'
import { fetchLiveOutputs } from '@/lib/field-velocity-live'
import { FIELD_VELOCITY_OVERVIEW, type FocusAreaKey } from '@/lib/field-velocity'
import { fieldVelocityForArea, loadFieldVelocity } from '@/lib/field-velocity-data'

/** One field, using exactly the overview's records, chart interactions and modals. */
export default async function AreaFieldVelocity({ area }: { area: FocusAreaKey }) {
  const [data, liveOutputs] = await Promise.all([
    loadFieldVelocity(),
    area === 'economies-governance' ? fetchLiveOutputs() : Promise.resolve({}),
  ])
  const field = fieldVelocityForArea(data, area)
  const overview = `${FIELD_VELOCITY_OVERVIEW}?area=${area}`
  return (
    <section id="field-velocity" aria-labelledby="field-velocity-heading" className="mb-12 border-y border-gray-200 bg-gray-50 px-4 py-8 sm:px-6 sm:py-10 scroll-mt-24">
      <div className="mb-7">
        <h2 id="field-velocity-heading" className="text-2xl lg:text-[32px] font-semibold tracking-tight mb-3">Field velocity</h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
          How {field.area.label} is moving: the same instruments and inflection points tracked in our cross-field overview.
          Field progress is not a claim of PL attribution.
        </p>
        <p className="mt-2 text-sm text-gray-500">Open a reading or inflection point for its evidence. Click, hold and drag across a spark line to compare two points.</p>
        <nav aria-label="Field velocity context" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href={`${overview}#field-velocity`} className="text-blue hover:underline">Cross-field overview →</a>
          <a href={`${overview}#methodology`} className="text-blue hover:underline">Our methodology →</a>
          <a href={`${overview}#toolkit`} className="text-blue hover:underline">PL R&amp;D toolkit →</a>
        </nav>
      </div>
      <ImpactDashboardV2
        fixedArea={area}
        liveOutputs={liveOutputs}
        recordsByArea={{ [area]: field.records }}
        marketSignals={field.marketSignals}
        ideaVintageExamples={data.ideaVintageExamples}
      />
    </section>
  )
}
