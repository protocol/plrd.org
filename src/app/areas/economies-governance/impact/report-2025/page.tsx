import Link from 'next/link'
import type { Metadata } from 'next'
import impactData from '@/data/fa2/impact.json'
import projectsData from '@/data/fa2/projects.json'
import Breadcrumb from '@/components/Breadcrumb'

export const metadata: Metadata = {
  title: 'Impact Report 2025',
  description: 'Explore the impact of Protocol Labs ecosystem initiatives in 2025.',
}

type Cofunder = {
  id: string
  name: string
  type: string
  status: string
  website: string
  description: string
  focus: string[]
  arms: { name: string; size: string; focus: string }[]
}

export default function ImpactReport2025Page() {
  // Typed because the JSON array may be empty (TS would otherwise infer never[]).
  const cofunders = impactData.cofunders as Cofunder[]
  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[
        { label: 'Focus Areas', href: '/areas/' },
        { label: 'Economies & Governance', href: '/areas/economies-governance/' },
        { label: 'Impact', href: '/areas/economies-governance/impact/' },
        { label: 'Report 2025' }
      ]} />

      {/* Header */}
      <h1 className="text-2xl lg:text-[36px] font-semibold mb-3">{impactData.meta.title}</h1>
      <p className="text-lg text-gray-600 mb-12 max-w-2xl">{impactData.meta.subtitle}</p>

      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14 pb-14 border-b border-gray-100">
        {impactData.highlights.map((h) => (
          <div key={h.label}>
            <div className="text-2xl lg:text-3xl font-semibold text-black mb-2">{h.value}</div>
            <div className="text-sm text-gray-500">{h.label}</div>
            {h.source && <div className="text-xs text-gray-400 mt-1">{h.source}</div>}
          </div>
        ))}
      </div>

      {/* Initiatives */}
      <div className="mb-14 pb-14 border-b border-gray-100">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-8">Key Initiatives</h2>
        <div className="divide-y divide-gray-100">
          {impactData.initiatives.map((init) => (
            <div key={init.id} className="py-8 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4 mb-4">
                {init.logo && (
                  <img src={init.logo} alt={init.name} className="w-10 h-10 object-contain shrink-0 rounded" />
                )}
                <div>
                  <a
                    href={init.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium text-black hover:text-blue transition-colors"
                  >
                    {init.name}
                  </a>
                  <span className="text-sm text-gray-400 ml-3">{init.category}</span>
                </div>
              </div>
              <p className="text-base text-gray-600 leading-relaxed mb-4 max-w-3xl">{init.description}</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {init.metrics.map((m) => (
                  <div key={m.label} className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-black">{m.value}</span>
                    <span className="text-sm text-gray-400">{m.label}</span>
                  </div>
                ))}
              </div>
              {init.events && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {init.events.map((e) => (
                    <span key={e.title} className="text-sm text-gray-500">{e.title}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Co-Funders */}
      {cofunders.length > 0 && (
        <div className="mb-14 pb-14 border-b border-gray-100">
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-8">Co-Funders</h2>
          <div className="divide-y divide-gray-100">
            {cofunders.map((cf) => (
              <div key={cf.id} className="py-8 first:pt-0 last:pb-0">
                <div className="flex items-start gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <a href={cf.website} target="_blank" rel="noopener noreferrer"
                        className="text-lg font-medium text-black hover:text-blue transition-colors">
                        {cf.name}
                      </a>
                      <span className="text-sm text-gray-400">{cf.type}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                        {cf.status}
                      </span>
                    </div>
                    <p className="text-base text-gray-600 leading-relaxed max-w-3xl">{cf.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
                  {cf.arms.map((arm) => (
                    <div key={arm.name}>
                      <span className="text-lg font-semibold text-black">{arm.size}</span>
                      <span className="text-sm text-gray-400 ml-2">{arm.name} — {arm.focus}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cf.focus.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ecosystem */}
      <div className="mb-12">
        <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-5">Ecosystem Overview</h2>
        <p className="text-base text-gray-700 mb-8">
          <span className="font-semibold text-black">{projectsData.count}</span> global teams building the future of decentralized coordination.
        </p>
        <div className="flex flex-wrap gap-3 mb-8">
          {projectsData.teams.map((team) => (
            <a
              key={team.uid}
              href={`https://os.pl.xyz/teams/${team.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 opacity-50 hover:opacity-100 transition-opacity"
              title={team.name}
            >
              {team.logo ? (
                <img src={team.logo.url} alt={team.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-[10px] text-gray-500">{team.name[0]}</span>
                </div>
              )}
            </a>
          ))}
        </div>
        <Link href="/areas/economies-governance/projects/" className="text-base text-blue hover:underline">
          Explore all projects →
        </Link>
      </div>

    </div>
  )
}
