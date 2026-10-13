import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { briefs } from '@/lib/briefs'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return briefs.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brief = briefs.find((b) => b.slug === slug)
  if (!brief) return { title: 'Not Found' }
  return { title: brief.title, description: brief.summary }
}

/**
 * An FA2 brief's web edition. The printed A4 version is built from the same
 * JSON by `npm run build-briefs`; this page keeps its shape (six reasons,
 * each a claim with its evidence at the foot, then what to do, the red line
 * and the honest limit) and adds what paper cannot: a link behind every
 * source.
 */
export default async function BriefPage({ params }: Props) {
  const { slug } = await params
  const brief = briefs.find((b) => b.slug === slug)
  if (!brief) notFound()

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Focus Areas', href: '/areas/' },
          { label: 'Economies & Governance', href: '/areas/economies-governance/' },
          { label: brief.title },
        ]}
      />

      {/* Hero: the title beside the FA2 drawing, as on the printed page */}
      <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-end pt-8 pb-12">
        <div>
          <p className="text-xs uppercase tracking-widest text-pink mb-4">
            {brief.kicker} · {brief.date}
          </p>
          <h1 className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-3">
            {brief.title}
          </h1>
          <p className="font-serif italic text-[22px] leading-snug text-blue mb-6">{brief.subtitle}</p>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-8">{brief.standfirst}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={brief.pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-medium no-underline"
            >
              Download the PDF
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-6-6m6 6l6-6" />
              </svg>
            </a>
            <a
              href={`mailto:${brief.contact}`}
              className="inline-flex items-center gap-2 text-base text-blue hover:text-black border border-blue/30 hover:border-black/30 px-5 py-2.5 rounded-full transition-colors no-underline"
            >
              {brief.contact}
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl bg-[#F9F2E2]">
          <img src={brief.image} alt={brief.imageAlt} className="w-full aspect-[4/3] object-cover" />
        </div>
      </div>

      {/* Six reasons. Each card is a three-row subgrid (head, claim, evidence),
          so the evidence of a row of cards lines up however long the claims. */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {brief.reasons.map((reason, i) => (
          <article
            key={reason.title}
            className="row-span-3 grid grid-rows-subgrid gap-0 rounded-2xl border border-gray-200 bg-white p-6"
          >
            <div>
              <span className="text-xs uppercase tracking-widest text-pink">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-2 text-[22px] leading-tight font-medium text-black">{reason.title}</h2>
            </div>
            <p className="mt-3 text-base text-gray-600 leading-relaxed">{reason.text}</p>
            <div className="mt-6 border-t border-gray-200 pt-4">
              <span className="block font-serif text-[34px] leading-none text-black">{reason.figure}</span>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{reason.caption}</p>
              <a
                href={reason.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-start gap-1 text-xs text-gray-500 hover:text-blue transition-colors no-underline"
              >
                <span>{reason.source}</span>
                <ArrowOut className="mt-0.5 h-3 w-3 shrink-0" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* What a country can do · the red line and the honest limit */}
      <div className="mt-16 grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        <section>
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">{brief.stepsTitle}</h2>
          <ol className="divide-y divide-gray-200">
            {brief.steps.map((step, i) => (
              <li key={step.lead} className="grid grid-cols-[2rem_1fr] items-baseline py-3 first:pt-0">
                <span className="font-serif text-[22px] leading-none text-blue">{i + 1}</span>
                <p className="text-base text-gray-600 leading-relaxed">
                  <span className="font-semibold text-black">{step.lead}</span> {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-8">
          <section className="rounded-2xl bg-gray-200 p-6">
            <span className="text-xs uppercase tracking-widest text-pink">{brief.redLine.kicker}</span>
            <h3 className="mt-2 text-[22px] leading-tight font-medium text-black">{brief.redLine.title}</h3>
            <p className="mt-3 text-base text-gray-600 leading-relaxed">{brief.redLine.text}</p>
          </section>
          <section className="border-l-2 border-gray-200 pl-5">
            <span className="text-xs uppercase tracking-widest text-gray-500">{brief.limit.kicker}</span>
            <h3 className="mt-2 text-[22px] leading-tight font-medium text-black">{brief.limit.title}</h3>
            <p className="mt-3 text-base text-gray-600 leading-relaxed">{brief.limit.text}</p>
          </section>
        </div>
      </div>

      {/* Every source, linked */}
      <section className="mt-16 border-t border-gray-200 pt-8">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-4">{brief.sourcesTitle}</h2>
        <ol className="grid gap-x-10 gap-y-2 md:grid-cols-2">
          {brief.sources.map((source) => (
            <li key={source.url + source.label}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 text-sm text-gray-500 hover:text-blue transition-colors no-underline"
              >
                <span>{source.label}</span>
                <ArrowOut className="mt-1 h-3 w-3 shrink-0" />
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-gray-500 leading-relaxed max-w-3xl">
          {brief.about} Evidence checked {brief.checked}.
        </p>
      </section>
    </div>
  )
}

function ArrowOut({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}
