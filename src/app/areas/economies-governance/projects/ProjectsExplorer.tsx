'use client'

import { useState, useMemo } from 'react'
import Breadcrumb from '@/components/Breadcrumb'

type Team = {
  uid: string
  name: string
  logo: { url: string } | null
  website: string | null
  twitterHandler: string | null
  linkedinHandler: string | null
  shortDescription: string | null
  longDescription: string | null
  fa2_tags?: string[]
  createdAt: string
  updatedAt: string
}

type ProjectsData = {
  count: number
  teams: Team[]
}

export default function ProjectsExplorer({ projects }: { projects: ProjectsData }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    projects.teams.forEach((t) => t.fa2_tags?.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [projects.teams])

  const filtered = useMemo(() => {
    let result = projects.teams.filter((team) => {
      const matchesSearch =
        search === '' ||
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        (team.shortDescription || '').toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        category === 'all' ||
        (team.fa2_tags || []).some((t) => t.toLowerCase() === category.toLowerCase())

      return matchesSearch && matchesCategory
    })

    result.sort((a, b) => {
      switch (sortBy) {
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [projects.teams, search, category, sortBy])

  function downloadCSV() {
    const headers = ['Name', 'Short Description', 'Website', 'Twitter', 'LinkedIn', 'Tags', 'Created At', 'Updated At']
    const rows = projects.teams.map((team) => [
      `"${(team.name || '').replace(/"/g, '""')}"`,
      `"${(team.shortDescription || '').replace(/"/g, '""')}"`,
      team.website || '',
      team.twitterHandler || '',
      team.linkedinHandler || '',
      `"${(team.fa2_tags || []).join(', ')}"`,
      team.createdAt || '',
      team.updatedAt || '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fa2_ecosystem_projects.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Areas', href: '/areas' },
          { label: 'Economies & Governance', href: '/areas/economies-governance' },
          { label: 'Projects' },
        ]}
      />

      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-[36px] font-semibold mb-2">Project Explorer</h1>
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-black">{filtered.length}</span> teams building decentralized coordination.
          </p>
        </div>
        <button
          onClick={downloadCSV}
          className="text-sm text-gray-400 hover:text-black transition-colors hidden md:block"
        >
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-10 pb-10 border-b border-gray-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 px-4 py-2.5 border-b border-gray-200 text-base focus:outline-none focus:border-black transition-colors bg-transparent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 border-b border-gray-200 text-base focus:outline-none focus:border-black transition-colors bg-transparent cursor-pointer text-gray-700"
        >
          <option value="all">All categories</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 border-b border-gray-200 text-base focus:outline-none focus:border-black transition-colors bg-transparent cursor-pointer text-gray-700"
        >
          <option value="name">Name</option>
          <option value="created-desc">Newest</option>
          <option value="updated-desc">Updated</option>
        </select>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {filtered.map((team) => (
            <div key={team.uid} className="py-5 flex items-start gap-4">
              {team.logo ? (
                <img src={team.logo.url} alt={team.name} className="w-10 h-10 object-contain shrink-0 rounded" loading="lazy" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-sm text-gray-500">{team.name[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-base font-medium text-black truncate">{team.name}</span>
                  {team.fa2_tags && team.fa2_tags.length > 0 && (
                    <span className="text-sm text-gray-400 shrink-0">{team.fa2_tags[0]}</span>
                  )}
                </div>
                {team.shortDescription && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{team.shortDescription}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`https://os.pl.xyz/teams/${team.uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-blue transition-colors"
                >
                  Profile
                </a>
                {team.website && (
                  <a
                    href={team.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-blue transition-colors"
                  >
                    Site
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-base text-gray-400 py-16 text-center">No results found.</p>
      )}

    </div>
  )
}
