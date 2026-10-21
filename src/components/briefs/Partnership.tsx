import type { PartnershipBrief } from '@/lib/briefs'
import Rich from './Rich'
import { Evidence, Kicker, LeadList, SectionLabel, Steps, WayIn, card } from './parts'

/**
 * The web edition of the partnership layout (government pilot partnership):
 * the gap beside the one figure that shows the demand; what PL R&D brings;
 * how a pilot runs and the bar it has to clear; where a pilot can start
 * beside why PL R&D; what we ask of a partner government beside the way in.
 * Same order as the printed page.
 */
export default function Partnership({ brief }: { brief: PartnershipBrief }) {
  const { gap, bring, steps, ask, wayIn } = brief
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

      <section className="mt-16">
        <SectionLabel label={bring.label} aside={bring.aside} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bring.items.map((x, i) => (
            <div key={x.title} className={`${card} p-5`}>
              <Kicker>{String(i + 1).padStart(2, '0')}</Kicker>
              <h3 className="mt-2 text-[20px] leading-tight text-black">{x.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                <Rich text={x.text} />
              </p>
            </div>
          ))}
        </div>
      </section>

      <Steps steps={steps} />

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <LeadList label={brief.starts.label} items={brief.starts.items} />
        <LeadList label={brief.why.label} items={brief.why.items} />
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
        <WayIn wayIn={wayIn} contact={brief.contact} />
      </section>
    </>
  )
}
