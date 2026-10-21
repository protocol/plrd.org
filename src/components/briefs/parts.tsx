import type { ReactNode } from 'react'
import { briefPdf, type Brief, type Lead, type Limit as LimitBlock, type Steps as StepsBlock, type WayIn as WayInBlock } from '@/lib/briefs'
import Rich from './Rich'

/*
 * The pieces every brief's web edition is made of. Hairlines are black at
 * 10% so they read in both themes (the dark theme remaps --color-black), and
 * the cream panel keeps the FA2 drawings' paper in light mode only.
 */

export const card = 'rounded-2xl border border-black/10 bg-white'
export const cream = 'rounded-2xl bg-[#F9F2E2] dark:bg-[#24221c]'

export function Kicker({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span className={`block text-xs uppercase tracking-widest ${muted ? 'text-gray-500' : 'text-pink'}`}>
      {children}
    </span>
  )
}

/** A section's small serif label, with its aside to the right on wider screens. */
export function SectionLabel({ label, aside }: { label: string; aside?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <h2 className="text-xs text-gray-400 uppercase tracking-widest">{label}</h2>
      {aside && <p className="text-sm text-gray-500">{aside}</p>}
    </div>
  )
}

/** A source line. The arrow runs on after the last word, however the line wraps. */
export function SourceLink({ label, url }: { label: string; url?: string }) {
  if (!url) return <p className="mt-2 text-xs leading-relaxed text-gray-500">{label}</p>
  return (
    <p className="mt-2 text-xs leading-relaxed">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 no-underline transition-colors hover:text-blue"
      >
        {label}
        <ArrowOut className="ml-1 inline-block h-3 w-3 align-[-1px]" />
      </a>
    </p>
  )
}

/** One figure with what it counts and where it comes from. */
export function Evidence({
  figure,
  caption,
  source,
  url,
  className = '',
  figureClassName = 'text-[32px] text-black',
}: {
  figure: string
  caption: string
  source: string
  url: string
  className?: string
  figureClassName?: string
}) {
  return (
    <div className={className}>
      <span className={`block whitespace-nowrap font-serif leading-none ${figureClassName}`}>{figure}</span>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        <Rich text={caption} />
      </p>
      <SourceLink label={source} url={url} />
    </div>
  )
}

/** Title, subtitle and standfirst beside the drawing, with both ways to keep it. */
export function BriefHero({ brief }: { brief: Brief }) {
  return (
    <div className="grid gap-10 pt-8 pb-12 md:grid-cols-[1.15fr_0.85fr] md:items-end">
      <div>
        <Kicker>
          {brief.kicker} · {brief.date}
        </Kicker>
        <h1 className="mt-4 text-[34px] lg:text-[44px] font-semibold leading-[1.08] tracking-tight">{brief.title}</h1>
        <p className="mt-3 font-serif italic text-[19px] lg:text-[22px] leading-snug text-blue">{brief.subtitle}</p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
          <Rich text={brief.standfirst} />
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={briefPdf(brief.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 font-medium text-white no-underline transition-colors hover:bg-blue/90"
          >
            Download the PDF
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-6-6m6 6l6-6" />
            </svg>
          </a>
          <a
            href={`mailto:${brief.contact}`}
            className="inline-flex items-center gap-2 rounded-full border border-blue/30 px-5 py-2.5 text-base text-blue no-underline transition-colors hover:border-black/30 hover:text-black"
          >
            {brief.contact}
          </a>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-[#F9F2E2]">
        <img
          src={brief.image}
          alt={brief.imageAlt}
          className="aspect-[4/3] w-full object-cover"
          style={brief.imagePosition ? { objectPosition: brief.imagePosition } : undefined}
        />
      </div>
    </div>
  )
}

/** What the paper prints at its foot: the other sources, who wrote it, when it was checked. */
export function BriefFoot({ brief }: { brief: Brief }) {
  return (
    <div className="mt-16 border-t border-black/10 pt-6 text-sm leading-relaxed text-gray-500">
      {brief.notes && (
        <p>
          {brief.notes.label}{' '}
          {brief.notes.items.map((note, i) => (
            <span key={note.url || note.label}>
              {i > 0 && ' · '}
              {note.url ? (
                <a
                  href={note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 no-underline transition-colors hover:text-blue"
                >
                  {note.label}
                </a>
              ) : (
                note.label
              )}
            </span>
          ))}
        </p>
      )}
      <p className="mt-3 max-w-3xl">
        <span className="font-semibold text-black">Protocol Labs R&amp;D</span> · <Rich text={brief.about} /> Evidence
        checked {brief.checked}.
      </p>
    </div>
  )
}

/** Numbered steps on a thread, and the bar or rule under them. */
export function Steps({ steps }: { steps: StepsBlock }) {
  return (
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
  )
}

/** A labelled list of lead-ins, each with its source under it when it has one. */
export function LeadList({ label, items }: { label: string; items: Lead[] }) {
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

/** The honest limit: a quiet rule on the left, no box. */
export function Limit({ limit }: { limit: LimitBlock }) {
  return (
    <div className="border-l-2 border-black/10 py-1 pl-5">
      <Kicker muted>{limit.kicker}</Kicker>
      <h3 className="mt-2 text-[22px] leading-tight text-black">{limit.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-gray-600">
        <Rich text={limit.text} />
      </p>
    </div>
  )
}

/** The way in: black on paper; the dark theme inverts it, like the site's
    other solid calls to action. */
export function WayIn({ wayIn, contact }: { wayIn: WayInBlock; contact: string }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl bg-black p-6 text-white">
      <span className="block text-xs uppercase tracking-widest text-[#ff7aa8] dark:text-pink">{wayIn.kicker}</span>
      <h3 className="mt-2 text-[24px] leading-tight text-white">{wayIn.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-white/75">
        <Rich text={wayIn.text} linkClassName="font-semibold text-white no-underline hover:underline" />{' '}
        <a href={`mailto:${contact}`} className="font-semibold text-white no-underline hover:underline">
          {contact}
        </a>
      </p>
      <p className="mt-2 text-base leading-relaxed text-white/75">
        <Rich text={wayIn.people} />
      </p>
    </div>
  )
}

export function ArrowOut({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}
