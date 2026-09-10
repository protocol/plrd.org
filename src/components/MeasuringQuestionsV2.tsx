'use client'

// Methodology section: our toolkit and observed field velocity are separate axes,
// not a causal attribution claim. Both tools and velocity instruments open modals.

import { useEffect, useState, type ReactNode } from 'react'
import { HAND_COLOR, FIELD_COLOR, TOOLKIT_V2, FIELD_VELOCITY_METHODOLOGY, type ToolkitEntry } from '@/lib/field-velocity'
import { VELOCITY_INSTRUMENTS, INFLECTION_EXPLAINER } from '@/lib/velocity-instruments'
import { IdeaVintageExamples, InflectionQuadrant, type IdeaVintageExample } from '@/components/velocity-explainers'
import InterventionExampleCards from '@/components/InterventionExampleCards'

type DefEntry = { id: string; label: string; subtitle: string; description: string }
export type { IdeaVintageExample }
type Modal =
  | { kind: 'tool'; entry: ToolkitEntry }
  | { kind: 'measure'; entry: DefEntry }

export default function MeasuringQuestionsV2({
  ideaVintageExamples = [],
  interlude,
}: {
  ideaVintageExamples?: IdeaVintageExample[]
  /** Optional block rendered between the interventions and observed-velocity
      sections (e.g. the Verified Impact hypercerts, which mirror the
      interventions above). */
  interlude?: ReactNode
}) {
  const [modal, setModal] = useState<Modal | null>(null)

  return (
    <div>
      {/* Block 1 — the interventions (our toolkit) */}
      <section id="toolkit" className="scroll-mt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: HAND_COLOR }}>
              Our hand
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-black">PL R&amp;D interventions</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              A fixed toolkit we bring to every field. Pick the ones a field is missing, then push.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              {FIELD_VELOCITY_METHODOLOGY.attribution}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOOLKIT_V2.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setModal({ kind: 'tool', entry: t })}
                aria-haspopup="dialog"
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-black">{t.title}</span>
                  <span className="text-xs text-gray-400">· {t.subtitle}</span>
                  {t.proposed && (
                    <span className="ml-auto rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                      Proposed
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-gray-600">{t.oneLiner}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 transition-colors group-hover:text-black">
                  Learn more
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {interlude}

      {/* Divider between our documented work and the field we observe. */}
      <div className="relative my-12" aria-hidden>
        <div className="border-t border-gray-200" />
        <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Block 2 — observed field velocity, the result we watch */}
      <section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: FIELD_COLOR }}>
              The field
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-black">Observed velocity</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {FIELD_VELOCITY_METHODOLOGY.observedVelocity}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              {FIELD_VELOCITY_METHODOLOGY.stocksAndFlows}
            </p>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VELOCITY_INSTRUMENTS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModal({ kind: 'measure', entry: m })}
                  aria-haspopup="dialog"
                  className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                >
                  <span className="mb-1 text-sm font-semibold text-black">{m.label}</span>
                  <p className="text-xs leading-relaxed text-gray-600">{m.subtitle}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 transition-colors group-hover:text-black">
                    Learn more
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              ))}
              {/* Inflection points share the grid but are markers, not instruments
                  (they never enter a reading record), so they carry a "Marker" tag. */}
              <button
                type="button"
                onClick={() => setModal({ kind: 'measure', entry: INFLECTION_EXPLAINER })}
                aria-haspopup="dialog"
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-black">{INFLECTION_EXPLAINER.label}</span>
                  <span className="ml-auto rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                    Marker
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-600">{INFLECTION_EXPLAINER.subtitle}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 transition-colors group-hover:text-black">
                  Learn more
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-gray-400">
              These instruments read the research and capital sides of a field. They do not observe
              invention directly: prototypes, designs, datasets, and negative results largely lack
              identifiers to count. Closing that gap is itself part of the work.
            </p>
          </div>
        </div>
      </section>

      {modal && (
        <InfoModal modal={modal} ideaVintageExamples={ideaVintageExamples} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

function InfoModal({
  modal,
  ideaVintageExamples,
  onClose,
}: {
  modal: Modal
  ideaVintageExamples: IdeaVintageExample[]
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const isTool = modal.kind === 'tool'
  const eyebrow = isTool ? 'Intervention' : 'Field velocity'
  const eyebrowColor = isTool ? HAND_COLOR : FIELD_COLOR
  const title = isTool ? modal.entry.title : modal.entry.label
  const subtitle = modal.entry.subtitle
  const proposed = isTool ? modal.entry.proposed : false
  const description = modal.entry.description
  const researchSide =
    modal.kind === 'measure' &&
    (modal.entry.id === 'idea_vintage' || modal.entry.id === 'revealed_commitments')
  const isIdeaVintage = modal.kind === 'measure' && modal.entry.id === 'idea_vintage'
  const isInflection = modal.kind === 'measure' && modal.entry.id === 'inflection_points'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6 lg:p-10"
      onClick={onClose}
    >
      <div className="relative my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: eyebrowColor }}>
              {eyebrow}
            </span>
            {proposed && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                Proposed: our wildcard
              </span>
            )}
          </div>
          <h2 className="mb-1 text-2xl font-semibold leading-tight tracking-tight text-black">{title}</h2>
          {subtitle && <div className="mb-5 text-sm text-gray-500">{subtitle}</div>}
          {isTool && (
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Description</div>
          )}
          <p className={`${subtitle || isTool ? '' : 'mt-4 '}text-sm leading-relaxed text-gray-700`}>{description}</p>
          {isTool && <InterventionExampleCards tool={modal.entry} />}
          {researchSide && (
            <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm italic leading-relaxed text-gray-500">
              This reads the research side of the field. It does not observe invention directly, and the
              two can decouple.
            </p>
          )}
          {isIdeaVintage && <IdeaVintageExamples examples={ideaVintageExamples} />}
          {isInflection && <InflectionQuadrant />}
        </div>
      </div>
    </div>
  )
}
