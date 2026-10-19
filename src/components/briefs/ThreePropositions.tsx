import type { ThreePropositionsBrief } from '@/lib/briefs'
import Rich from './Rich'
import { Evidence, Kicker, SectionLabel, SourceLink, card, cream } from './parts'

/**
 * The web edition of the three-propositions layout (Why sovereign AI): three
 * reasons as cards, each a claim with two pieces of evidence at its foot;
 * then what sovereign AI lets an institution do differently, beside a worked
 * example; then the honest limit beside where to start. Same order as the
 * printed page, with every source a link.
 */
export default function ThreePropositions({ brief }: { brief: ThreePropositionsBrief }) {
  const { innovation, limit, start } = brief
  return (
    <>
      <section>
        <SectionLabel label={brief.propositionsLabel} aside={brief.propositionsAside} />
        {/* Each card is a four-row subgrid (head, claim, two pieces of
            evidence), so the evidence lines up across the row. */}
        <div className="grid gap-6 md:grid-cols-3">
          {brief.propositions.map((p, i) => (
            <article key={p.title} className={`${card} row-span-4 grid grid-rows-subgrid gap-0 p-6`}>
              <div>
                <Kicker>{String(i + 1).padStart(2, '0')}</Kicker>
                <h3 className="mt-2 text-[24px] leading-tight text-black">{p.title}</h3>
                <p className="mt-1 font-serif text-[17px] italic leading-snug text-blue">{p.promise}</p>
              </div>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                <Rich text={p.text} />
              </p>
              {p.evidence.map((e) => (
                <Evidence key={e.figure} {...e} className="mt-5 border-t border-black/10 pt-4" />
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionLabel label={innovation.label} aside={innovation.aside} />
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.15fr]">
          {innovation.modes.map((m) => (
            <div key={m.word} className="border-t border-black pt-4">
              <h3 className="text-[22px] leading-tight text-black">
                Act more <i className="text-blue">{m.word}</i>
              </h3>
              <p className="mt-2 text-base leading-relaxed text-gray-600">
                <Rich text={m.text} />
              </p>
              {m.source && <SourceLink label={m.source} url={m.url} />}
            </div>
          ))}
          <div className={`${cream} p-6`}>
            <Kicker>{innovation.example.kicker}</Kicker>
            <h3 className="mt-2 text-[22px] leading-tight text-black">{innovation.example.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-gray-700">
              <Rich text={innovation.example.text} />
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="border-l-2 border-black/10 py-1 pl-5">
          <Kicker muted>{limit.kicker}</Kicker>
          <h3 className="mt-2 text-[22px] leading-tight text-black">{limit.title}</h3>
          <p className="mt-2 text-base leading-relaxed text-gray-600">
            <Rich text={limit.text} />
          </p>
        </div>
        <div className="rounded-2xl bg-gray-200 p-6">
          <Kicker>{start.kicker}</Kicker>
          <h3 className="mt-2 text-[22px] leading-tight text-black">{start.title}</h3>
          <p className="mt-2 text-base leading-relaxed text-gray-600">
            <Rich text={start.text} />{' '}
            <span className="font-semibold text-black">
              <Rich text={start.next} />
            </span>
          </p>
        </div>
      </section>
    </>
  )
}
