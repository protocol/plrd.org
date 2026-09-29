import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import {
  INTERVENTION_AREA_LABEL,
  INTERVENTION_AREA_ORDER,
  INTERVENTION_TYPES,
  type InterventionTypeId,
  type PublicIntervention,
} from '@/lib/interventions'

export default function PortfolioOverview({ items }: { items: PublicIntervention[] }) {
  const types = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

  return (
    <section aria-labelledby="portfolio-map" className="py-16 md:py-20">
      <h2 id="portfolio-map" className="scroll-mt-24 font-serif text-[32px] font-normal leading-tight tracking-tight text-black md:text-[40px]">
        Portfolio map
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
        Focus Areas are where we work. Interventions are how we move those fields.
      </p>
      <div className="mt-8 overflow-x-auto" role="region" aria-label="Portfolio by focus area and primary intervention type" tabIndex={0}>
        <table className="portfolio-overview w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="caption-bottom pt-4 text-left text-xs leading-relaxed text-gray-500">
            {items.length} draft-source examples, counted once by primary intervention type. Not approved commitments.
          </caption>
          <thead>
            <tr className="border-b border-black/15">
              <th scope="col" className="w-1/5 py-4 pr-4 align-top font-medium text-gray-500">Intervention type</th>
              {INTERVENTION_AREA_ORDER.map((area) => (
                <th key={area} scope="col" className="w-1/5 px-3 py-4 align-top font-medium text-black">
                  {INTERVENTION_AREA_LABEL[area]}
                  {items.every((item) => item.area !== area) && (
                    <span className="mt-1 block text-xs font-normal text-gray-500">Coming soon</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type} className="border-b border-black/[0.08]">
                <th scope="row" className="py-4 pr-4 font-medium text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <InterventionTypeIcon type={type} className="h-3.5 w-3.5" />
                    {INTERVENTION_TYPES[type].title}
                  </span>
                </th>
                {INTERVENTION_AREA_ORDER.map((area) => {
                  const count = items.filter((item) => item.area === area && item.type === type).length
                  return (
                    <td key={area} className="px-3 py-4 tabular-nums text-gray-600">
                      {count > 0 ? count : <span aria-label="No interventions" className="text-gray-400">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
