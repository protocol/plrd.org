'use client'

import Link from 'next/link'
import AuthorCard from '@/components/AuthorCard'
import Breadcrumb from '@/components/Breadcrumb'
import FundingPipeline from '@/components/FundingPipeline'
import { AreaIcon } from '@/components/AreaIcons'
import opportunityData from '@/data/fa2/opportunityspaces.json'
import {
  useRequireAdmin,
  usePageEdit,
  EditableField,
  EditBar,
  EditBarSpacer,
} from '@/components/InlineEdit'

export default function EGEditPage() {
  const { ready } = useRequireAdmin()
  const { get, set, isDirty, isLoading, isSaving, saveStatus, save, discard } =
    usePageEdit('area-economies-governance')

  if (!ready || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-32 text-center text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Focus Areas', href: '/areas/' }, { label: 'Economies & Governance', href: '/areas/economies-governance/' }, { label: 'Edit' }]} />

      {/* Hero */}
      <div className="relative pt-8 pb-12 mb-12 overflow-hidden">
        <div className="flex items-center gap-4 sm:items-start sm:gap-5 mb-6">
          <AreaIcon type="hexagon" className="w-14 h-14 lg:w-16 lg:h-16 shrink-0 text-blue/70" />
          <div className="relative z-10 flex-1">
            <EditableField
              value={get('hero', 'title')}
              onChange={(v) => set('hero', 'title', v)}
              placeholder="Economies & Governance"
              className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight max-w-xl"
            />
          </div>
        </div>

        <div className="relative z-10 mb-8">
          <EditableField
            value={get('hero', 'subtitle')}
            onChange={(v) => set('hero', 'subtitle', v)}
            multiline
            placeholder="Summary description"
            className="text-lg text-gray-600 leading-relaxed max-w-2xl"
          />
        </div>

        <div className="relative z-10 flex flex-wrap gap-4 mb-10">
          <a href="#opportunity-spaces" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-medium">
            Opportunity Spaces
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-6-6m6 6l6-6" />
            </svg>
          </a>
          <a href="/areas/economies-governance/#interventions" className="inline-flex items-center gap-2 px-5 py-2.5 border border-blue text-blue rounded-full hover:bg-blue/5 transition-colors font-medium">
            Interventions
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-6-6m6 6l6-6" />
            </svg>
          </a>
          <a href="https://grants.plresearch.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 border border-blue/30 text-blue rounded-full hover:bg-blue/5 transition-colors font-medium">
            Apply for Grants
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </a>
        </div>

        <div className="relative z-10 flex flex-wrap gap-4">
          <AuthorCard slug="david-dao" variant="lead" />
          <AuthorCard slug="james-tunningley" variant="lead" />
        </div>
      </div>

      {/* Content body */}
      <div className="mb-12 pb-12 border-b border-gray-100">
        <EditableField
          value={get('body', 'body')}
          onChange={(v) => set('body', 'body', v)}
          multiline
          placeholder="Main description of this focus area"
          className="text-base text-gray-700 leading-relaxed max-w-3xl"
        />
        <p className="text-xs text-gray-400 mt-2">Paragraphs separated by blank lines</p>
      </div>

      {/* Opportunity Spaces section header (inlined on the live page) */}
      <section className="mb-12 pb-12 border-b border-gray-100">
        <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Strategy · inlined Opportunity Spaces section header</div>
        <ExploreCardEdit sectionId="explore-opportunities" label="Section heading + subtitle" get={get} set={set}
          href="/areas/economies-governance/#opportunity-spaces" />
        <p className="text-xs text-gray-400 mt-2">The opportunity space cards themselves are managed individually — edit each card on its own page.</p>
      </section>

      {/* Explore */}
      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Explore</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <ExploreCardEdit sectionId="explore-subareas" label="Domains" get={get} set={set}
          href="/areas/economies-governance/subareas/" />
        <ExploreCardEdit sectionId="explore-impact" label="Metrics" get={get} set={set}
          href="/areas/economies-governance/impact/" />
        <ExploreCardEdit sectionId="explore-projects" label="Ecosystem" get={get} set={set}
          href="/areas/economies-governance/projects/" />
        <ExploreCardEdit sectionId="explore-depgraph" label="Architecture" get={get} set={set}
          href="/areas/economies-governance/dependency-graph/" />
      </div>

      {/* Grants */}
      <div className="mt-16 mb-12 pb-12 border-b border-gray-100">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Grants</h2>
        <FundingPipeline />
        <a href="https://grants.plresearch.org" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-8 text-base text-blue hover:text-black border border-blue/30 hover:border-black/30 px-5 py-2.5 rounded-full transition-colors font-medium">
          Apply for Grants
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </a>
      </div>

      {/* How to Engage */}
      <div className="mt-16">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">How to Engage</h2>
        <p className="text-base text-gray-600 mb-6">We are actively seeking:</p>
        <div className="grid md:grid-cols-2 gap-6">
          <EngageItemEdit sectionId="engage-feedback" get={get} set={set} />
          <EngageItemEdit sectionId="engage-cases" get={get} set={set} />
          <EngageItemEdit sectionId="engage-partners" get={get} set={set} />
          <EngageItemEdit sectionId="engage-technical" get={get} set={set} />
          <EngageItemEdit sectionId="engage-strategic" get={get} set={set} />
        </div>
        <a href="https://forms.gle/xfuuf8U6UPX3obnh8" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-8 text-base text-blue hover:text-black border border-blue/30 hover:border-black/30 px-5 py-2.5 rounded-full transition-colors">
          Share feedback
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </a>
      </div>

      <EditBarSpacer />
      <EditBar isDirty={isDirty} isSaving={isSaving} saveStatus={saveStatus} onSave={save} onDiscard={discard} />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OpportunitySpacesPreview({ areaSlug }: { areaSlug: string }) {
  return (
    <section id="opportunity-spaces" className="mb-12 pb-12 border-b border-gray-100 scroll-mt-24">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest">Strategy · Opportunity Spaces (read-only preview)</h2>
        <span className="text-xs text-gray-400">Edit each card on its own page</span>
      </div>
      <h3 className="text-2xl lg:text-[32px] font-semibold mb-3">{opportunityData.meta.title}</h3>
      <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">{opportunityData.meta.subtitle}</p>
      <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
        {opportunityData.opportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-white p-8 relative overflow-hidden flex flex-col"
          >
            {opp.image && (
              <div className="h-28 mb-5 bg-gray-100 overflow-hidden rounded-sm">
                <img src={opp.image} alt={opp.title} className="w-full h-full object-cover opacity-80" />
              </div>
            )}
            <h4 className="text-lg font-medium text-black mb-1">{opp.title}</h4>
            {opp.tagline && <p className="text-sm text-gray-400 mb-3">{opp.tagline}</p>}
            <p className="text-base text-gray-600 leading-relaxed mb-4">{opp.description.slice(0, 140)}...</p>
            {opp.subfields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {opp.subfields.map((sf) => (
                  <span key={sf} className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-sm">
                    {sf}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-auto flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              <Link
                href={`/areas/${areaSlug}/${opp.id}/`}
                className="text-xs text-gray-500 hover:text-blue"
              >
                View →
              </Link>
              <Link
                href={`/areas/${areaSlug}/${opp.id}/edit`}
                className="text-xs text-blue hover:underline"
              >
                Edit this card →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ExploreCardEdit({
  sectionId, label, href, get, set,
}: {
  sectionId: string
  label: string
  href: string
  get: (s: string, f: 'title' | 'subtitle' | 'body' | 'label') => string
  set: (s: string, f: 'title' | 'subtitle' | 'body' | 'label', v: string) => void
}) {
  return (
    <div className="group flex flex-col p-5 bg-gray-50 border border-gray-100 rounded-xl">
      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <EditableField
        value={get(sectionId, 'title')}
        onChange={(v) => set(sectionId, 'title', v)}
        placeholder="Card title"
        className="text-base font-medium text-black mb-1"
      />
      <EditableField
        value={get(sectionId, 'subtitle')}
        onChange={(v) => set(sectionId, 'subtitle', v)}
        placeholder="Card description"
        className="text-sm text-gray-500 leading-relaxed"
      />
      <Link href={href} className="text-xs text-blue hover:underline mt-2">View →</Link>
    </div>
  )
}

function EngageItemEdit({
  sectionId, get, set,
}: {
  sectionId: string
  get: (s: string, f: 'title' | 'subtitle' | 'body' | 'label') => string
  set: (s: string, f: 'title' | 'subtitle' | 'body' | 'label', v: string) => void
}) {
  return (
    <div className="border-l-2 border-gray-100 pl-5">
      <EditableField
        value={get(sectionId, 'title')}
        onChange={(v) => set(sectionId, 'title', v)}
        placeholder="Engagement item title"
        className="text-base font-medium text-black mb-1"
      />
      <EditableField
        value={get(sectionId, 'body')}
        onChange={(v) => set(sectionId, 'body', v)}
        multiline
        placeholder="Description"
        className="text-sm text-gray-500 leading-relaxed"
      />
    </div>
  )
}
