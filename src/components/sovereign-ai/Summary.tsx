import type { SummarySheet } from '@/lib/sovereign-ai'
import { ClaimCards, LeadList, Limit, NumberedCards, SectionLabel, Steps, WayIn } from './parts'

/**
 * The web edition of the summary layout (Sovereign AI for funders): the
 * reasons to care as cards, each with its evidence; what the funding pays
 * for; how the program runs and what every funder gets; how to take part
 * beside why PL R&D; the honest limit beside the way in. Same order as the
 * printed page.
 */
export default function Summary({ sheet }: { sheet: SummarySheet }) {
  const { reasons } = sheet
  return (
    <>
      <section>
        <SectionLabel label={reasons.label} aside={reasons.aside} />
        <ClaimCards claims={reasons.items} columns="md:grid-cols-3" />
      </section>

      <NumberedCards cards={sheet.funding} />

      <Steps steps={sheet.steps} />

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <LeadList label={sheet.takePart.label} items={sheet.takePart.items} />
        <LeadList label={sheet.why.label} items={sheet.why.items} />
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="flex items-center">
          <Limit limit={sheet.limit} />
        </div>
        <WayIn wayIn={sheet.wayIn} contact={sheet.contact} />
      </section>
    </>
  )
}
