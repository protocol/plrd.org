import type { PartnershipBrief } from '@/lib/briefs'
import Rich from './Rich'
import { Evidence, Kicker, SectionLabel, SourceLink, card } from './parts'

type Lead = PartnershipBrief['starts']['items'][number]

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

      <section className="mt-16">
        <SectionLabel label={steps.label} aside={steps.aside} />
        <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.items.map((x, i) => (
            <li key={x.title} className="relative">
              {/* The thread from one step to the next, on one row only. */}
              {i < steps.items.length - 1 && (
                <span aria-hidden className="absolute left-10 -right-6 top-4 hidden h-px bg-blue-200 dark:bg-blue/40 lg:block" />
              )}
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue font-serif text-base text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-[20px] leading-tight text-black">{x.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                <Rich text={x.text} />
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 rounded-xl bg-gray-200 px-5 py-3 text-base leading-relaxed text-gray-700">
          <span className="font-semibold text-black">{steps.barLead}</span> <Rich text={steps.bar} />
        </p>
      </section>

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
        {/* Black on paper; the dark theme inverts it, like the site's other
            solid calls to action. */}
        <div className="flex flex-col justify-center rounded-2xl bg-black p-6 text-white">
          <span className="block text-xs uppercase tracking-widest text-[#ff7aa8] dark:text-pink">{wayIn.kicker}</span>
          <h3 className="mt-2 text-[24px] leading-tight text-white">{wayIn.title}</h3>
          <p className="mt-2 text-base leading-relaxed text-white/75">
            <Rich text={wayIn.text} />{' '}
            <a href={`mailto:${brief.contact}`} className="font-semibold text-white no-underline hover:underline">
              {brief.contact}
            </a>
          </p>
          <p className="mt-2 text-base leading-relaxed text-white/75">
            <Rich text={wayIn.people} />
          </p>
        </div>
      </section>
    </>
  )
}

function LeadList({ label, items }: { label: string; items: Lead[] }) {
  return (
    <div>
      <SectionLabel label={label} />
      <ul className="divide-y divide-black/5">
        {items.map((x) => (
          <li key={x.lead} className="py-3 text-base leading-relaxed text-gray-600 first:pt-0">
            <span className="font-semibold text-black">{x.lead}</span> <Rich text={x.text} />
            {x.source && <SourceLink label={x.source} url={x.url} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
