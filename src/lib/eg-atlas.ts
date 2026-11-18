import fs from 'node:fs'
import path from 'node:path'

import projects from '@/data/fa2/projects.json'
import { plain, sheetHref, sheets } from '@/lib/sovereign-ai'

/**
 * The E&G Atlas trial: one unlisted page that maps the Economies & Governance
 * field, starting with Sovereign AI. Version 1.0 adds no data of its own.
 * Every number comes from something this repository already publishes with
 * its source: the Sovereign AI sheets, the OpenAlex field series, and the
 * ecosystem directory. What the field would need next (a funding index, a
 * dated timeline, a who-does-what directory) is listed on the page as not
 * tracked yet, never filled with placeholders.
 */

/** Unlisted: not in the navigation, the sitemap or the search index. */
export const atlasPath = '/eg-atlas-preview-7c41e9a2/'

export type AtlasFact = {
  figure: string
  caption: string
  source: string
  url: string
  /** The sheets that cite it. */
  sheets: { label: string; href: string }[]
}

function isEvidence(node: Record<string, unknown>): node is { figure: string; caption: string; source: string; url: string } {
  return ['figure', 'caption', 'source', 'url'].every((key) => typeof node[key] === 'string')
}

/**
 * Every sourced figure in the Sovereign AI sheets, once each, in the order the
 * sheets give them. Two sheets citing the same figure from the same source
 * make one entry; two figures from one source stay two.
 */
export function facts(): AtlasFact[] {
  const byUrl = new Map<string, AtlasFact>()
  for (const sheet of sheets) {
    const cited = { label: sheet.label, href: sheetHref(sheet.slug) }
    const visit = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(visit)
      if (!node || typeof node !== 'object') return
      const record = node as Record<string, unknown>
      if (isEvidence(record)) {
        const key = `${record.url} ${record.figure}`
        const known = byUrl.get(key)
        if (!known) {
          byUrl.set(key, { figure: record.figure, caption: plain(record.caption), source: record.source, url: record.url, sheets: [cited] })
        } else if (!known.sheets.some((s) => s.href === cited.href)) {
          known.sheets.push(cited)
        }
      }
      Object.values(record).forEach(visit)
    }
    visit(sheet)
  }
  return [...byUrl.values()]
}

export type Landscape = { teams: number; tags: { tag: string; teams: number }[] }

/** The ecosystem directory by its own tags. A team can carry several, so the tags add up to more than the teams. */
export function landscape(): Landscape {
  const counts = new Map<string, number>()
  for (const team of projects.teams) {
    for (const tag of team.fa2_tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  const tags = [...counts].map(([tag, teams]) => ({ tag, teams })).sort((a, b) => b.teams - a.teams || a.tag.localeCompare(b.tag))
  return { teams: projects.teams.length, tags }
}

export type FieldYear = { year: number; works: number; sharePer100k: number; reliable: boolean }
export type FieldSeries = {
  /** The frozen OpenAlex query the series counts. */
  query: string
  generated: string
  source: string
  /** The last year the file marks as reliable: later years are still filling in at OpenAlex. */
  reliableUntil: number
  years: FieldYear[]
}

/**
 * Papers per year in the field, from the same OpenAlex file the field-velocity
 * instruments read (src/data/velocity/economies-governance.csv). Null when the
 * file is absent: the page then says so instead of drawing anything.
 */
export function fieldSeries(): FieldSeries | null {
  let text: string
  try {
    text = fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'velocity', 'economies-governance.csv'), 'utf8')
  } catch {
    return null
  }
  const provenance: Record<string, string> = {}
  const rows: string[][] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    if (line.startsWith('#')) {
      const [key, ...rest] = line.replace(/^#\s*/, '').split(':')
      provenance[key.trim()] = rest.join(':').trim()
    } else {
      rows.push(line.split(','))
    }
  }
  const [header, ...body] = rows
  if (!header) return null
  const at = (name: string) => header.indexOf(name)
  const years = body
    .map((row) => ({
      year: Number(row[at('year')]),
      works: Number(row[at('field_works')]),
      sharePer100k: Number(row[at('corpus_share_per_100k')]),
      reliable: row[at('reliable')] === '1',
    }))
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.works) && Number.isFinite(row.sharePer100k))
  if (years.length < 2) return null
  return {
    query: provenance.query ?? '',
    generated: provenance.generated ?? '',
    source: provenance.source ?? '',
    reliableUntil: Math.max(...years.filter((y) => y.reliable).map((y) => y.year)),
    years,
  }
}

/** What an atlas of this field would track next. Nothing here has data yet, and the page says so. */
export const notTrackedYet = [
  {
    title: 'Funding index',
    text: 'Public money committed to sovereign AI and to public-goods funding: who committed it, when, how much, and the announcement that says so. One row per commitment, never an estimate.',
    needs: 'A sourced list of commitments, and a rule for what counts.',
  },
  {
    title: 'Milestones',
    text: 'A dated timeline of the field: national AI strategies, public compute coming online, citizen assemblies run with AI, court and parliament decisions. The sourced figures above are the first entries, still without a date field.',
    needs: 'A date and a category on each entry.',
  },
  {
    title: 'Who does what',
    text: 'Governments, labs, funders and researchers working on sovereign AI, each with what they have actually shipped and a link to it. Sovereign AI first, then the other opportunity spaces.',
    needs: 'A reviewed list of organisations and people, with consent where a person is named.',
  },
] as const
