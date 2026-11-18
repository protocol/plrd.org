import Link from 'next/link'
import type { Metadata } from 'next'

import FA2LiveStatsBand from '@/components/FA2LiveStatsBand'
import { facts, fieldSeries, landscape, notTrackedYet, type FieldSeries } from '@/lib/eg-atlas'
import { fetchSimocracyStats } from '@/lib/simocracy'
import { fetchGainforestStats } from '@/lib/gainforest'
import { fetchGlowStats } from '@/lib/glow'
import { sheets, sovAiHref } from '@/lib/sovereign-ai'

// A trial, shared by link only: not in the navigation, the sitemap or the search index.
export const metadata: Metadata = {
  title: 'E&G Atlas (trial)',
  description: 'A first map of the Economies & Governance field, starting with Sovereign AI. Unlisted trial.',
  robots: { index: false, follow: false },
}

// The live signals refresh on the same 60s window as the FA2 page.
export const revalidate = 60

const count = (n: number) => n.toLocaleString('en-US')

function day(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export default async function EGAtlasTrial() {
  const [simStats, gainforest, glow] = await Promise.all([fetchSimocracyStats(), fetchGainforestStats(), fetchGlowStats()])
  const evidence = facts()
  const field = landscape()
  const series = fieldSeries()
  const settled = series?.years.filter((y) => y.reliable).at(-1)
  const busiest = field.tags[0]?.teams ?? 1

  return (
    <div className="pt-8 pb-16">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Trial v1.0 · unlisted preview</p>
      <h1 className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight mb-5">E&amp;G Atlas</h1>
      <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-4">
        A first map of the Economies &amp; Governance field. It starts with Sovereign AI.
      </p>
      <p className="text-base text-gray-600 leading-relaxed max-w-2xl mb-10">
        This version adds no data of its own. Every number below is one this site already publishes with its source.
        What an atlas of the field would need next is listed at the end as not tracked yet.
      </p>

      {/* Headline numbers, each counted from the sections below */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-16">
        <Stat value={count(evidence.length)} label="sourced figures on Sovereign AI" />
        <Stat value={count(sheets.length)} label="one-pagers for governments and funders" />
        <Stat value={count(field.teams)} label="teams in the ecosystem directory" />
        {settled ? (
          <Stat value={count(settled.works)} label={`papers matching the field query in ${settled.year}`} />
        ) : (
          <Stat value="n/a" label="research series not loaded" />
        )}
      </dl>

      {/* 1. Evidence */}
      <section id="evidence" aria-labelledby="evidence-title" className="mb-16 scroll-mt-24">
        <SectionHead
          id="evidence-title"
          kicker="Sovereign AI"
          title="Evidence"
          text="The figures the Sovereign AI program stands on, once each. Each links to where it comes from and to the one-pager that uses it."
        />
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {evidence.map((fact) => (
            <li key={`${fact.url} ${fact.figure}`} className="bg-white p-6 flex flex-col">
              <p className="text-[28px] font-semibold leading-tight tracking-tight text-black mb-2">{fact.figure}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{fact.caption}</p>
              <p className="mt-auto text-xs text-gray-500 leading-relaxed">
                <a href={fact.url} target="_blank" rel="noopener noreferrer" className="text-dark-blue dark:text-blue-200 underline underline-offset-4 hover:decoration-2">
                  {fact.source} <span aria-hidden="true">↗</span>
                </a>
              </p>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Used in{' '}
                {fact.sheets.map((sheet, i) => (
                  <span key={sheet.href}>
                    {i > 0 && ', '}
                    <Link href={sheet.href} className="underline underline-offset-4 hover:decoration-2">{sheet.label}</Link>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gray-500">
          The program itself is at{' '}
          <a href={sovAiHref} target="_blank" rel="noopener noreferrer" className="text-dark-blue dark:text-blue-200 underline underline-offset-4 hover:decoration-2">
            Sovereign AI <span aria-hidden="true">↗</span>
          </a>.
        </p>
      </section>

      {/* 2. Field velocity */}
      <section id="field-velocity" aria-labelledby="velocity-title" className="mb-16 scroll-mt-24">
        <SectionHead
          id="velocity-title"
          kicker="Field velocity"
          title="Research output"
          text="How much of the world's published research is about this field, year by year."
        />
        {series ? <FieldChart series={series} /> : <p className="text-base text-gray-600">The research series is not loaded, so nothing is drawn.</p>}
      </section>

      {/* 3. Landscape */}
      <section id="landscape" aria-labelledby="landscape-title" className="mb-16 scroll-mt-24">
        <SectionHead
          id="landscape-title"
          kicker="Landscape"
          title="Who is building"
          text={`The ${count(field.teams)} teams in the ecosystem directory, by the directory's own tags. A team can carry several, so the bars add up to more than the teams.`}
        />
        <ul className="max-w-3xl">
          {field.tags.map(({ tag, teams }) => (
            <li key={tag} className="grid grid-cols-[9rem_1fr_3rem] sm:grid-cols-[12rem_1fr_3rem] items-center gap-3 py-2 border-b border-gray-100">
              <span className="text-sm text-black">{tag}</span>
              <span className="h-2 bg-gray-100" aria-hidden="true">
                <span className="block h-2 bg-blue" style={{ width: `${Math.max(2, Math.round((teams / busiest) * 100))}%` }} />
              </span>
              <span className="text-sm text-gray-600 text-right tabular-nums">{count(teams)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/areas/economies-governance/projects/" className="text-dark-blue dark:text-blue-200 underline underline-offset-4 hover:decoration-2">
            Open the Project Explorer
          </Link>
        </p>
      </section>

      {/* 4. Live signals */}
      <section id="live" aria-labelledby="live-title" className="mb-16 scroll-mt-24">
        <SectionHead
          id="live-title"
          kicker="Live"
          title="Signals from the network"
          text="Counted live from Simocracy, GainForest and Glow, the same numbers as the E&G live dashboard. A source that cannot be reached is left out."
        />
        <FA2LiveStatsBand
          href="/areas/economies-governance/impact/live-dashboard/"
          sim={{
            totalSims: { value: simStats.totals.totalSims, series: simStats.trends.totalSims.values },
            totalGatherings: { value: simStats.totals.totalGatherings, series: simStats.trends.totalGatherings.values },
          }}
          gainforest={{
            observations: { value: gainforest.observations, series: gainforest.trends.observations.values },
            bumicerts: { value: gainforest.bumicerts, series: gainforest.trends.bumicerts.values },
            certifiedOrgs: { value: gainforest.certifiedOrgs, series: gainforest.trends.certifiedOrgs.values },
          }}
          glow={{
            powerOutput: { value: glow.powerOutput, series: glow.trends.powerOutput.values },
            activeFarms: { value: glow.activeFarms, series: glow.trends.activeFarms.values },
          }}
        />
      </section>

      {/* 5. Not tracked yet */}
      <section id="next" aria-labelledby="next-title" className="scroll-mt-24">
        <SectionHead
          id="next-title"
          kicker="Not tracked yet"
          title="What the atlas would need next"
          text="Three things a full atlas of this field would track. None of them has data here yet, so none is drawn."
        />
        <ul className="grid md:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {notTrackedYet.map((item) => (
            <li key={item.title} className="bg-white p-6">
              <h3 className="text-lg font-medium text-black mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.text}</p>
              <p className="text-xs text-gray-500 leading-relaxed"><span className="uppercase tracking-widest">Needs</span> {item.needs}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-gray-500">
          Back to{' '}
          <Link href="/areas/economies-governance/" className="text-dark-blue dark:text-blue-200 underline underline-offset-4 hover:decoration-2">Economies &amp; Governance</Link>.
        </p>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-6 flex flex-col-reverse">
      <dt className="text-sm text-gray-600 leading-snug">{label}</dt>
      <dd className="text-[28px] lg:text-[32px] font-semibold leading-tight tracking-tight text-black mb-1 tabular-nums">{value}</dd>
    </div>
  )
}

function SectionHead({ id, kicker, title, text }: { id: string; kicker: string; title: string; text: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{kicker}</p>
      <h2 id={id} className="text-2xl lg:text-[32px] font-semibold mb-3">{title}</h2>
      <p className="text-base text-gray-600 leading-relaxed max-w-3xl">{text}</p>
    </div>
  )
}

/** The field's share of all indexed papers. Years the index has not settled are dashed. */
function FieldChart({ series }: { series: FieldSeries }) {
  const W = 720, H = 260, left = 48, right = 16, top = 16, bottom = 32
  const years = series.years
  const first = years[0].year, last = years[years.length - 1].year
  const peak = Math.max(...years.map((y) => y.sharePer100k))
  const ceiling = Math.ceil(peak / 250) * 250
  const x = (year: number) => left + ((year - first) / (last - first)) * (W - left - right)
  const y = (share: number) => top + (1 - share / ceiling) * (H - top - bottom)
  const line = (rows: typeof years) => rows.map((row) => `${x(row.year).toFixed(1)},${y(row.sharePer100k).toFixed(1)}`).join(' ')
  const settled = years.filter((row) => row.year <= series.reliableUntil)
  const open = years.filter((row) => row.year >= series.reliableUntil)
  const start = settled[0], end = settled[settled.length - 1]
  const ticks = [0, ceiling / 2, ceiling]
  const marks = [...new Set([first, series.reliableUntil, last])]

  return (
    <figure className="max-w-3xl">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Papers matching the field query per 100,000 indexed papers, ${first} to ${last}: ${start.sharePer100k.toFixed(0)} in ${start.year}, ${end.sharePer100k.toFixed(0)} in ${end.year}.`}
        className="w-full h-auto text-gray-500"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={W - right} y1={y(tick)} y2={y(tick)} stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
            <text x={left - 8} y={y(tick) + 4} textAnchor="end" fontSize="12" fill="currentColor">{tick}</text>
          </g>
        ))}
        {marks.map((year) => (
          <text key={year} x={x(year)} y={H - 10} textAnchor={year === first ? 'start' : year === last ? 'end' : 'middle'} fontSize="12" fill="currentColor">{year}</text>
        ))}
        <polyline points={line(open)} fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeDasharray="5 5" strokeOpacity="0.6" />
        <polyline points={line(settled)} fill="none" stroke="var(--color-blue)" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={x(end.year)} cy={y(end.sharePer100k)} r="4" fill="var(--color-blue)" />
      </svg>
      <figcaption className="mt-3 text-sm text-gray-600 leading-relaxed">
        Papers matching the field query, per 100,000 papers indexed that year: {start.sharePer100k.toFixed(0)} in {start.year}, {end.sharePer100k.toFixed(0)} in {end.year} ({count(end.works)} papers).
        Years after {series.reliableUntil} are dashed, because the index is still filling in and those counts will change.
      </figcaption>
      <details className="mt-3 text-sm text-gray-600">
        <summary className="cursor-pointer text-dark-blue dark:text-blue-200">Source and query</summary>
        <p className="mt-2 leading-relaxed">
          {series.source}. Generated {day(series.generated)}. The query, kept fixed so the series compares with itself:
        </p>
        <p className="mt-1 font-mono text-xs leading-relaxed break-words">{series.query.split('|').join(' | ')}</p>
      </details>
    </figure>
  )
}
