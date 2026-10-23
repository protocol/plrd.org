import type { ExplainerSheet } from '@/lib/sovereign-ai'
import Rich from './Rich'
import { Evidence, Kicker, LeadList, Limit, SectionLabel, Steps, WayIn, card } from './parts'

/**
 * The web edition of the explainer layout (Broad Listening & Simocracy): two
 * tools as cards, each a claim with two pieces of evidence side by side at
 * its foot; how a round runs and the rule under it; where the tools have run
 * beside where a government can use them; the honest limit beside the way
 * in. Same order as the printed page.
 */
export default function Explainer({ sheet }: { sheet: ExplainerSheet }) {
  return (
    <>
      <section>
        <SectionLabel label={sheet.toolsLabel} aside={sheet.toolsAside} />
        {/* Each card is a three-row subgrid (head, claim, evidence), so the
            evidence lines up across the row. */}
        <div className="grid gap-6 md:grid-cols-2">
          {sheet.tools.map((t, i) => (
            <article key={t.title} className={`${card} row-span-3 grid grid-rows-subgrid gap-0 p-6`}>
              <div>
                <Kicker>{String(i + 1).padStart(2, '0')}</Kicker>
                <h3 className="mt-2 text-[26px] leading-tight text-black">{t.title}</h3>
                <p className="mt-1 font-serif text-[17px] italic leading-snug text-blue">{t.promise}</p>
              </div>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                <Rich text={t.text} />
              </p>
              <div className="mt-5 grid gap-6 border-t border-black/10 pt-4 sm:grid-cols-2">
                {t.evidence.map((e) => (
                  <Evidence key={e.figure} {...e} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Steps steps={sheet.steps} />

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <LeadList label={sheet.ran.label} items={sheet.ran.items} />
        <LeadList label={sheet.uses.label} items={sheet.uses.items} />
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
