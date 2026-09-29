'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import InterventionStatusTag from '@/components/InterventionStatusTag'
import {
  INTERVENTION_AREA_HREF,
  INTERVENTION_AREA_ICON,
  INTERVENTION_AREA_LABEL,
  INTERVENTION_TYPES,
  catalogHref,
  type PublicIntervention,
} from '@/lib/interventions'

function closeModal(router: ReturnType<typeof useRouter>) {
  if (window.history.length > 1) router.back()
  else router.push(catalogHref())
}

export default function InterventionModal({ item }: { item: PublicIntervention }) {
  const router = useRouter()
  const isPublicSource = item.sourceKind === 'public'

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal(router)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [router])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-6 lg:p-10"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal(router)
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="intervention-modal-title"
        tabIndex={-1}
        className="relative my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl outline-none"
      >
        <button
          type="button"
          onClick={() => closeModal(router)}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <article className="p-6 sm:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 pr-10">
            <AreaIcon
              type={INTERVENTION_AREA_ICON[item.area] as AreaIconType}
              className="h-6 w-6 text-blue"
            />
            <p className="text-xs uppercase tracking-widest text-gray-400">
              {INTERVENTION_AREA_LABEL[item.area]}
            </p>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              <InterventionTypeIcon type={item.type} />
              {INTERVENTION_TYPES[item.type].title}
            </span>
            <InterventionStatusTag item={item} />
          </div>
          <h1
            id="intervention-modal-title"
            className="mb-4 text-2xl font-semibold leading-[1.15] tracking-tight lg:text-[36px]"
          >
            {item.title}
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-gray-600">{item.summary}</p>

          {item.resources && item.resources.length > 0 && (
            <section data-intervention-resources aria-labelledby="intervention-resources" className="mb-10 rounded-lg bg-gray-50 p-5">
              <h2 id="intervention-resources" className="mb-4 text-base font-semibold text-black">
                {item.resourceLabel || 'Resources'}
              </h2>
              <ul className="space-y-3">
                {item.resources.map((resource) => (
                  <li key={resource.href}>
                    <a href={resource.href} className="text-sm leading-relaxed text-blue underline decoration-blue/30 underline-offset-4 hover:decoration-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue">
                      {resource.title}
                    </a>
                    {resource.date && <time dateTime={resource.date} className="ml-2 text-xs text-gray-500">{resource.date}</time>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="space-y-8">
            <section>
              <h2 className="mb-2 text-lg font-semibold">The bottleneck</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.bottleneck}</p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-semibold">{isPublicSource ? 'The work' : 'The proposed work'}</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.work}</p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-semibold">{isPublicSource ? 'Delivery and contribution' : 'PL R&D’s proposed role'}</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.plRole}</p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-semibold">{isPublicSource ? 'Evidence and limits' : 'What we would examine'}</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.evidence}</p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link href={INTERVENTION_AREA_HREF[item.area]} className="text-blue hover:underline">
              {INTERVENTION_AREA_LABEL[item.area]} →
            </Link>
            <Link href={catalogHref()} className="text-blue hover:underline">
              Browse the catalog →
            </Link>
            <Link href={`${catalogHref()}methodology/`} className="text-blue hover:underline">
              Methodology →
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
