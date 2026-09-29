import Link from 'next/link'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import InterventionStatusTag from '@/components/InterventionStatusTag'
import {
  INTERVENTION_AREA_ACCENT,
  INTERVENTION_AREA_LABEL,
  INTERVENTION_TYPES,
  featuredInterventions,
  publicInterventionHref,
  type InterventionAreaSlug,
} from '@/lib/interventions'

function FieldTexture({ area }: { area: InterventionAreaSlug }) {
  const accent = INTERVENTION_AREA_ACCENT[area]
  if (area === 'neurotech') {
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 320 220" aria-hidden="true">
        <path d="M20 160 C70 40, 120 200, 170 90 S260 30, 300 120" fill="none" stroke={accent} strokeWidth="1" />
        <path d="M30 180 C90 80, 140 190, 200 110" fill="none" stroke={accent} strokeWidth="0.6" />
        <circle cx="170" cy="90" r="2" fill={accent} />
        <circle cx="90" cy="128" r="1.5" fill={accent} />
      </svg>
    )
  }
  if (area === 'ai-robotics') {
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" viewBox="0 0 320 220" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 8 }).map((__, col) => (
            <rect key={`${row}-${col}`} x={24 + col * 36} y={28 + row * 28} width="10" height="10" fill="none" stroke={accent} strokeWidth="0.6" />
          )),
        )}
      </svg>
    )
  }
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" viewBox="0 0 320 220" aria-hidden="true">
      <circle cx="48" cy="48" r="2" fill={accent} />
      <circle cx="140" cy="36" r="2" fill={accent} />
      <circle cx="220" cy="78" r="2" fill={accent} />
      <circle cx="86" cy="120" r="2" fill={accent} />
      <circle cx="188" cy="150" r="2" fill={accent} />
      <path d="M48 48 L140 36 L220 78 L188 150 L86 120 Z" fill="none" stroke={accent} strokeWidth="0.7" />
      <path d="M140 36 L86 120" fill="none" stroke={accent} strokeWidth="0.5" />
    </svg>
  )
}

export default function FeaturedInterventions() {
  const items = featuredInterventions()
  if (items.length === 0) return null

  return (
    <section aria-labelledby="featured-interventions" className="bg-gray-100 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 id="featured-interventions" className="font-serif text-[32px] font-normal leading-tight tracking-tight text-black md:text-[36px]">
              Featured interventions
            </h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {items.map((item) => {
            const accent = INTERVENTION_AREA_ACCENT[item.area]
            return (
              <Link
                key={item.slug}
                href={publicInterventionHref(item.slug)}
                scroll={false}
                className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-6 no-underline transition-all hover:border-blue hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
              >
                <FieldTexture area={item.area} />
                <span
                  className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-current transition-transform duration-300 group-hover:scale-y-100 motion-reduce:transition-none motion-reduce:scale-y-100"
                  style={{ color: accent }}
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                    {INTERVENTION_AREA_LABEL[item.area]}
                  </p>
                  <span className="intervention-arrow text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" aria-hidden="true">
                    ↗
                  </span>
                </div>
                <p className="relative mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>
                  <InterventionTypeIcon type={item.type} className="h-3.5 w-3.5" />
                  {INTERVENTION_TYPES[item.type].title}
                </p>
                <h3 className="relative mt-3 max-w-[16ch] font-serif text-[28px] font-normal leading-[1.08] tracking-tight text-black">
                  {item.title}
                </h3>
                <p className="relative mt-4 max-w-sm text-sm leading-relaxed text-gray-600">{item.summary}</p>
                <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 pt-8 text-[11px] text-gray-400">
                  <span>{item.timing}</span>
                  <InterventionStatusTag item={item} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
