'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import AreaHeroActions from '@/components/AreaHeroActions'
import AuthorCard from '@/components/AuthorCard'
import Breadcrumb from '@/components/Breadcrumb'
import aiOpportunityData from '@/data/fa2/ai-opportunityspaces.json'
import dhrOpportunityData from '@/data/fa2/dhr-opportunityspaces.json'
import neuroOpportunityData from '@/data/fa2/neuro-opportunityspaces.json'
import {
  useRequireAdmin,
  usePageEdit,
  EditableField,
  EditBar,
  EditBarSpacer,
} from '@/components/InlineEdit'

type OpportunityDataset = {
  meta: { title: string; subtitle: string }
  opportunities: Array<{
    id: string
    title: string
    tagline?: string
    image?: string
    description: string
    subfields: string[]
  }>
}

const SLUG_TO_OPPORTUNITY_DATA: Record<string, OpportunityDataset> = {
  'ai-robotics': aiOpportunityData as OpportunityDataset,
  'digital-human-rights': dhrOpportunityData as OpportunityDataset,
  'neurotech': neuroOpportunityData as OpportunityDataset,
}

const SLUG_TO_ICON: Record<string, AreaIconType> = {
  'ai-robotics': 'neural',
  'digital-human-rights': 'shield',
  'neurotech': 'brain',
}

const SLUG_TO_TITLE: Record<string, string> = {
  'ai-robotics': 'AI & Robotics',
  'digital-human-rights': 'Digital Human Rights',
  'neurotech': 'Neurotechnology',
}

export default function AreaEditPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : String(params.slug ?? '')

  const { ready } = useRequireAdmin()
  const { get, set, isDirty, isLoading, isSaving, saveStatus, save, discard } =
    usePageEdit(`area-${slug}`)

  if (!ready || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-32 text-center text-gray-400">
        Loading…
      </div>
    )
  }

  const iconType: AreaIconType = SLUG_TO_ICON[slug] ?? 'hexagon'
  const fallbackTitle = SLUG_TO_TITLE[slug] ?? slug

  // Read leads/advisors from the page record
  // usePageEdit exposes the full record indirectly through get()
  // but leads/advisors are top-level fields, not sections.
  // For now we show static leads from the known data.
  const KNOWN_LEADS: Record<string, string[]> = {
    'ai-robotics': ['molly-mackinlay'],
    'digital-human-rights': ['will-scott'],
    'neurotech': ['sean-escola'],
  }
  const KNOWN_ADVISORS: Record<string, string[]> = {
    'neurotech': ['adam-marblestone', 'david-markowitz', 'doris-tsao', 'edward-chang', 'greg-wayne', 'ilan-gur', 'matthew-botvinick', 'max-hodak'],
  }

  const leads = KNOWN_LEADS[slug] || []
  const advisors = KNOWN_ADVISORS[slug] || []

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Focus Areas', href: '/areas/' }, { label: fallbackTitle }, { label: 'Edit' }]} />

      {/* Hero */}
      <div className="relative pt-8 pb-12 mb-12 overflow-hidden">
        <div className="flex items-center gap-4 sm:items-start sm:gap-5 mb-6">
          <AreaIcon type={iconType} className="w-14 h-14 lg:w-16 lg:h-16 shrink-0 text-blue/70" />
          <div className="relative z-10 flex-1">
            <EditableField
              value={get('hero', 'title') || fallbackTitle}
              onChange={(v) => set('hero', 'title', v)}
              placeholder="Focus area title"
              className="text-2xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight max-w-xl"
            />
          </div>
        </div>

        <div className="relative z-10 mb-8">
          <EditableField
            value={get('hero', 'subtitle')}
            onChange={(v) => set('hero', 'subtitle', v)}
            multiline
            placeholder="Short summary of this focus area"
            className="text-lg text-gray-600 leading-relaxed max-w-2xl"
          />
        </div>

        <AreaHeroActions
          areaSlug={slug}
          showOpportunitySpaces={Boolean(SLUG_TO_OPPORTUNITY_DATA[slug])}
          opportunityHref={`/areas/${slug}/#opportunity-spaces`}
          interventionsHref={`/areas/${slug}/#interventions`}
        />

        {/* Leads */}
        {leads.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-4">
            {leads.map((authorSlug) => (
              <AuthorCard key={authorSlug} slug={authorSlug} variant="lead" />
            ))}
          </div>
        )}
      </div>

      {/* Content body */}
      <div className="mb-12 pb-12 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Body content</p>
        <EditableField
          value={get('hero', 'body')}
          onChange={(v) => set('hero', 'body', v)}
          multiline
          placeholder="Main description of this focus area. Paragraphs separated by blank lines."
          className="text-base text-gray-700 leading-relaxed max-w-3xl"
        />
        <p className="text-xs text-gray-400 mt-2">Paragraphs separated by blank lines</p>
      </div>

      {/* Advisors */}
      {advisors.length > 0 && (
        <div className="mb-12 pb-12 border-b border-gray-100 max-w-3xl">
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-4">
            {slug === 'neurotech' ? 'Science Advisory Board' : 'Advisors'}
          </h2>
          <div className="flex flex-wrap gap-3">
            {advisors.map((authorSlug) => (
              <AuthorCard key={authorSlug} slug={authorSlug} variant="advisor" />
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Spaces preview (read-only — each card has its own edit page) */}
      <OpportunitySpacesPreview areaSlug={slug} />

      {/* Publications (static, non-editable) */}
      <div className="mb-12 pb-12 border-b border-gray-100">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Publications</h2>
        <p className="text-sm text-gray-400">Publications are loaded from markdown files and cannot be edited here.</p>
        <Link href="/publications" className="text-sm text-blue hover:underline mt-4 inline-block">
          View all publications →
        </Link>
      </div>

      {/* Talks (static, non-editable) */}
      <div className="mb-10">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Talks</h2>
        <p className="text-sm text-gray-400">Talks are loaded from markdown files and cannot be edited here.</p>
        <Link href="/talks" className="text-sm text-blue hover:underline mt-4 inline-block">
          View all talks →
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

function OpportunitySpacesPreview({ areaSlug }: { areaSlug: string }) {
  const dataset = SLUG_TO_OPPORTUNITY_DATA[areaSlug]
  if (!dataset) return null
  return (
    <section id="opportunity-spaces" className="mb-12 pb-12 border-b border-gray-100 scroll-mt-24">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest">Strategy · Opportunity Spaces (read-only preview)</h2>
        <span className="text-xs text-gray-400">Edit each card on its own page</span>
      </div>
      <h3 className="text-2xl lg:text-[32px] font-semibold mb-3">{dataset.meta.title}</h3>
      <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">{dataset.meta.subtitle}</p>
      <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
        {dataset.opportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-white p-8 relative overflow-hidden flex flex-col"
          >
            {opp.image && (
              <div className="h-28 mb-5 bg-gray-100 overflow-hidden rounded-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
