import type { ThreePropositionsSheet } from '@/lib/sovereign-ai'
import Rich from './Rich'
import { ClaimCards, Kicker, Limit, SectionLabel, SourceLink, cream } from './parts'

/**
 * The web edition of the three-propositions layout (Why sovereign AI): three
 * reasons as cards, each a claim with two pieces of evidence at its foot;
 * then what sovereign AI lets an institution do differently, beside a worked
 * example; then the honest limit beside where to start. Same order as the
 * printed page, with every source a link.
 */
export default function ThreePropositions({ sheet }: { sheet: ThreePropositionsSheet }) {
  const { innovation, limit, start } = sheet
  return (
    <>
      <section>
        <SectionLabel label={sheet.propositionsLabel} aside={sheet.propositionsAside} />
        <ClaimCards claims={sheet.propositions} columns="md:grid-cols-3" />
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
        <Limit limit={limit} />
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
