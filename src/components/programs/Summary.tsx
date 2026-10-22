import type { SummaryProgram } from '@/lib/programs'
import { ClaimCards, LeadList, Limit, NumberedCards, SectionLabel, Steps, WayIn } from './parts'

/**
 * The web edition of the summary layout (Sovereign AI for funders): the
 * reasons to care as cards, each with its evidence; what the funding pays
 * for; how the program runs and what every funder gets; how to take part
 * beside why PL R&D; the honest limit beside the way in. Same order as the
 * printed page.
 */
export default function Summary({ program }: { program: SummaryProgram }) {
  const { reasons } = program
  return (
    <>
      <section>
        <SectionLabel label={reasons.label} aside={reasons.aside} />
        <ClaimCards claims={reasons.items} columns="md:grid-cols-3" />
      </section>

      <NumberedCards cards={program.funding} />

      <Steps steps={program.steps} />

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <LeadList label={program.takePart.label} items={program.takePart.items} />
        <LeadList label={program.why.label} items={program.why.items} />
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="flex items-center">
          <Limit limit={program.limit} />
        </div>
        <WayIn wayIn={program.wayIn} contact={program.contact} />
      </section>
    </>
  )
}
