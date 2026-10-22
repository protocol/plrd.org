import type { PartnershipProgram } from '@/lib/programs'
import Rich from './Rich'
import { Evidence, LeadList, NumberedCards, SectionLabel, Steps, WayIn, card } from './parts'

/**
 * The web edition of the partnership layout (government pilot partnership):
 * the gap beside the one figure that shows the demand; what PL R&D brings;
 * how a pilot runs and the bar it has to clear; where a pilot can start
 * beside why PL R&D; what we ask of a partner government beside the way in.
 * Same order as the printed page.
 */
export default function Partnership({ program }: { program: PartnershipProgram }) {
  const { gap, bring, steps, ask, wayIn } = program
  return (
    <>
      <section className="grid gap-6 md:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4 border-l-2 border-black py-1 pl-5">
          {gap.paragraphs.map((p) => (
            <p key={p} className="text-lg leading-relaxed text-gray-600">
              <Rich text={p} />
            </p>
          ))}
        </div>
        <Evidence
          figure={gap.figure}
          caption={gap.caption}
          source={gap.source}
          url={gap.url}
          className={`${card} flex flex-col justify-center p-6`}
          figureClassName="text-[44px] text-blue"
        />
      </section>

      <NumberedCards cards={bring} />

      <Steps steps={steps} />

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <LeadList label={program.starts.label} items={program.starts.items} />
        <LeadList label={program.why.label} items={program.why.items} />
      </section>

      <section className="mt-16 grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionLabel label={ask.label} />
          <ol className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {ask.items.map((x, i) => (
              <li key={x.lead} className="grid grid-cols-[1.5rem_1fr] items-baseline gap-x-2 text-base leading-relaxed text-gray-600">
                <span className="font-serif text-[22px] leading-none text-blue">{i + 1}</span>
                <span>
                  <span className="font-semibold text-black">{x.lead}</span> <Rich text={x.text} />
                </span>
              </li>
            ))}
          </ol>
        </div>
        <WayIn wayIn={wayIn} contact={program.contact} />
      </section>
    </>
  )
}
