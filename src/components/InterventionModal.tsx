'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import {
  INTERVENTION_AREA_HREF,
  INTERVENTION_AREA_ICON,
  INTERVENTION_AREA_LABEL,
  INTERVENTION_STAGE_LABEL,
  INTERVENTION_TYPES,
  catalogHref,
  type PublicIntervention,
} from '@/lib/interventions'

function closeModal(router: ReturnType<typeof useRouter>) {
  if (window.history.length > 1) router.back()
  else router.push('/interventions/')
}

export default function InterventionModal({ item }: { item: PublicIntervention }) {
  const router = useRouter()
  const support = item.support.map((id) => INTERVENTION_TYPES[id].title).join(' · ')

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
              {INTERVENTION_AREA_LABEL[item.area]} · Draft-source example
            </p>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              <InterventionTypeIcon type={item.type} />
              {INTERVENTION_TYPES[item.type].title}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {INTERVENTION_STAGE_LABEL[item.stage]}
            </span>
          </div>
          <h1
            id="intervention-modal-title"
            className="mb-4 text-2xl font-semibold leading-[1.15] tracking-tight lg:text-[36px]"
          >
            {item.title}
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-gray-600">{item.summary}</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-2 text-lg font-semibold">The bottleneck</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.bottleneck}</p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-semibold">The proposed work</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.work}</p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-semibold">PL R&amp;D&rsquo;s proposed role</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.plRole}</p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-semibold">What we would examine</h2>
              <p className="text-base leading-relaxed text-gray-600">{item.evidence}</p>
            </section>
          </div>

          <dl className="mt-10 space-y-2 border-t border-gray-100 pt-6 text-sm text-gray-500">
            <div>
              <dt className="inline text-gray-400">Supporting types: </dt>
              <dd className="inline">{support || 'None listed'}</dd>
            </div>
            <div>
              <dt className="inline text-gray-400">Public timing: </dt>
              <dd className="inline">{item.timing}</dd>
            </div>
            <div>
              <dt className="inline text-gray-400">Classification: </dt>
              <dd className="inline">{item.typeNote}</dd>
            </div>
          </dl>

          <p className="mt-6 text-xs leading-relaxed text-gray-400">
            This is a proposed public edition from internal planning drafts, not a verified active
            commitment. Funding figures and private source links are withheld until a designated publisher
            reviews them.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link href={INTERVENTION_AREA_HREF[item.area]} className="text-blue hover:underline">
              {INTERVENTION_AREA_LABEL[item.area]} →
            </Link>
            <Link href={catalogHref(item.area)} className="text-blue hover:underline">
              All {INTERVENTION_AREA_LABEL[item.area]} interventions →
            </Link>
            <Link href="/interventions/methodology/" className="text-blue hover:underline">
              Methodology →
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
