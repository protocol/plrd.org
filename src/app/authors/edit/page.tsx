'use client'

import Breadcrumb from '@/components/Breadcrumb'
import {
  useRequireAdmin,
  usePageEdit,
  EditableField,
  EditBar,
  EditBarSpacer,
} from '@/components/InlineEdit'

export default function AuthorsEditPage() {
  const { ready } = useRequireAdmin()
  const { get, set, isDirty, isLoading, isSaving, saveStatus, save, discard } =
    usePageEdit('authors')

  if (!ready || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-32 text-center text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Team', href: '/team/' },
          { label: 'Edit' },
        ]}
      />

      {/* Hero */}
      <div className="pt-8 pb-12 mb-12 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Page header</p>
        <EditableField
          value={get('hero', 'title')}
          onChange={(v) => set('hero', 'title', v)}
          placeholder="Our team"
          className="text-[36px] md:text-[52px] font-normal leading-[1.1] tracking-tight mb-4 max-w-2xl"
        />
        <EditableField
          value={get('hero', 'subtitle')}
          onChange={(v) => set('hero', 'subtitle', v)}
          multiline
          placeholder="We've come together from academia, startups, and the public sector, united by a belief that the hardest problems in computing and human flourishing deserve serious, long-horizon research."
          className="text-lg text-gray-600 leading-relaxed max-w-2xl"
        />
      </div>

      {/* Leadership blurb */}
      <div className="mb-12 pb-12 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-mono">
          leadership-blurb
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Shown above the leadership card grid.
        </p>
        <EditableField
          value={get('leadership-blurb', 'body')}
          onChange={(v) => set('leadership-blurb', 'body', v)}
          multiline
          placeholder="R&D Lead · Operations · Focus Area Leads"
          className="text-sm text-gray-700 leading-relaxed max-w-2xl"
        />
      </div>

      {/* Advisors blurb */}
      <div className="mb-12">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-mono">
          advisors-blurb
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Shown above the PL Neuro Science Advisory Board grid.
        </p>
        <EditableField
          value={get('advisors-blurb', 'body')}
          onChange={(v) => set('advisors-blurb', 'body', v)}
          multiline
          placeholder="Leading scientists, engineers, and entrepreneurs advising Protocol Labs on neurotechnology, NeuroAI, and brain-computer interfaces."
          className="text-sm text-gray-700 leading-relaxed max-w-2xl"
        />
      </div>

      <p className="text-sm text-gray-400 max-w-2xl">
        Author cards (leadership, advisors, alumni) are sourced from the author
        records under <code>content/authors/</code> and are not editable from
        this screen.
      </p>

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
