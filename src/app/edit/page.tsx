'use client'

import Link from 'next/link'
import { AreaIcon } from '@/components/AreaIcons'
import { FOCUS_AREA_DESCRIPTIONS } from '@/lib/focus-area-descriptions'
import {
  useRequireAdmin,
  usePageEdit,
  EditableField,
  EditBar,
  EditBarSpacer,
} from '@/components/InlineEdit'

export default function LandingEditPage() {
  const { ready } = useRequireAdmin()
  const { get, set, isDirty, isLoading, isSaving, saveStatus, save, discard } =
    usePageEdit('landing')

  if (!ready || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-32 text-center text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <div
        className="relative pt-20 pb-20 md:pt-32 md:pb-28 lg:pt-44 lg:pb-36"
        style={{ clipPath: 'inset(0 -100vw 0 0)' }}
      >
        {/* Hero banner image - extends to screen edge */}
        <div
          className="absolute top-1/2 -translate-y-[60%] h-[140%] pointer-events-none select-none"
          style={{
            right: 'calc(-50vw + 50%)',
            width: '70vw',
            backgroundImage: 'url(/images/hero.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            opacity: 0.35,
            maskImage: 'linear-gradient(to left, black 40%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 80%)',
          }}
          aria-hidden="true"
        />

        <h1 className="relative z-10 mb-8">
          <EditableField
            value={get('hero', 'title')}
            onChange={(v) => set('hero', 'title', v)}
            placeholder="Driving R&D breakthroughs to push humanity forward."
            className="font-serif text-[36px] md:text-[52px] lg:text-[64px] font-normal leading-[1.1] tracking-tight"
          />
        </h1>

        <div className="relative z-10 flex flex-wrap gap-4">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-medium"
          >
            About us
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/areas"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full hover:border-blue hover:text-blue transition-colors font-medium"
          >
            Focus areas
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="relative z-10 mt-16 lg:mt-24">
          <svg
            className="w-6 h-6 text-gray-400 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7" />
          </svg>
        </div>
      </div>

      {/* R&D approach section — mirrors the live homepage layout:
          two-column intro (title + body) above a 2x2 grid of large
          FocusAreaCards with hex-mosaic backdrops. */}
      <div className="pb-20 lg:pb-28 border-t border-gray-200 pt-16 lg:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-44 sm:mb-48 lg:mb-52">
          <h2>
            <EditableField
              value={get('approach', 'title')}
              onChange={(v) => set('approach', 'title', v)}
              placeholder="Use-inspired research across four frontiers"
              className="text-[28px] md:text-[36px] font-normal leading-tight tracking-tight"
            />
          </h2>
          <div className="lg:pt-3">
            <EditableField
              value={get('approach', 'body')}
              onChange={(v) => set('approach', 'body', v)}
              multiline
              placeholder="We work in Pasteur's Quadrant — pursuing fundamental understanding while staying anchored to real-world impact. Our four focus areas span the most consequential frontiers in computing, society, and human cognition."
              className="text-base text-gray-600 leading-relaxed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-44 md:gap-y-48 lg:gap-y-52">
          <FocusAreaCardEdit
            sectionId="approach-dhr"
            iconType="shield"
            mosaicSrc="/images/fa2/mosaics/digital-human-rights.svg"
            placeholderTitle="Digital Human Rights"
            placeholderBody={FOCUS_AREA_DESCRIPTIONS['digital-human-rights']}
            get={get}
            set={set}
          />
          <FocusAreaCardEdit
            sectionId="approach-eg"
            iconType="hexagon"
            mosaicSrc="/images/fa2/mosaics/economies-governance.svg"
            placeholderTitle="Economies & Governance"
            placeholderBody={FOCUS_AREA_DESCRIPTIONS['economies-governance']}
            get={get}
            set={set}
          />
          <FocusAreaCardEdit
            sectionId="approach-ai"
            iconType="neural"
            mosaicSrc="/images/fa2/mosaics/ai-robotics.svg"
            placeholderTitle="AI & Robotics"
            placeholderBody={FOCUS_AREA_DESCRIPTIONS['ai-robotics']}
            get={get}
            set={set}
          />
          <FocusAreaCardEdit
            sectionId="approach-neuro"
            iconType="brain"
            mosaicSrc="/images/fa2/mosaics/neurotech.svg"
            placeholderTitle="Neurotechnology"
            placeholderBody={FOCUS_AREA_DESCRIPTIONS.neurotech}
            get={get}
            set={set}
          />
        </div>
      </div>

      {/* Team */}
      <div className="pb-20 lg:pb-28">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Team</h2>
        <div className="mb-6">
          <EditableField
            value={get('team', 'body')}
            onChange={(v) => set('team', 'body', v)}
            multiline
            placeholder="A fully remote team distributed across the globe, working with talented and intellectually curious people who share a passion for improving technology for humanity."
            className="text-lg text-gray-700 leading-relaxed max-w-2xl"
          />
        </div>
        <Link
          href="/team/"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-blue/30 text-blue rounded-full hover:bg-blue hover:text-white hover:border-blue transition-all font-medium"
        >
          Meet the team
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      <EditBarSpacer />
      <EditBar
        isDirty={isDirty}
        isSaving={isSaving}
        saveStatus={saveStatus}
        onSave={save}
        onDiscard={discard}
      />
    </div>
  )
}

/**
 * Edit-mode mirror of the live <FocusAreaCard /> in src/app/page.tsx.
 * Same hex-mosaic backdrop, same 2-col card layout, but the title and
 * body are EditableField hooks bound to the page record's section.
 */
function FocusAreaCardEdit({
  sectionId,
  iconType,
  mosaicSrc,
  placeholderTitle,
  placeholderBody,
  get,
  set,
}: {
  sectionId: string
  iconType: 'shield' | 'hexagon' | 'neural' | 'brain'
  mosaicSrc: string
  placeholderTitle: string
  placeholderBody: string
  get: (s: string, f: 'title' | 'subtitle' | 'body' | 'label') => string
  set: (s: string, f: 'title' | 'subtitle' | 'body' | 'label', v: string) => void
}) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 -top-28 sm:-top-32 lg:-top-32 w-[65%] sm:w-[62%] lg:w-[60%] h-56 sm:h-64 lg:h-64 overflow-hidden select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mosaicSrc}
          alt=""
          className="absolute bottom-0 left-0 w-full h-auto opacity-60"
          style={{ filter: 'saturate(0.55)' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="relative z-10 flex items-start gap-5 p-6 lg:p-7 bg-white border border-gray-200 rounded-xl">
        <AreaIcon type={iconType} />
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <EditableField
              value={get(sectionId, 'title')}
              onChange={(v) => set(sectionId, 'title', v)}
              placeholder={placeholderTitle}
              className="text-lg lg:text-[22px] font-medium text-black leading-tight"
            />
          </div>
          <EditableField
            value={get(sectionId, 'subtitle')}
            onChange={(v) => set(sectionId, 'subtitle', v)}
            multiline
            placeholder={placeholderBody}
            className="text-sm lg:text-[15px] text-gray-500 leading-relaxed"
          />
        </div>
      </div>
    </div>
  )
}
