import { AI_SCHEMA_VERSION, AI_SCOPE, AI_RIGHTS, aiUrl, markdownUrl, recordUrl, type AiRecord } from '@/lib/ai-content'
import { createAiAccess, coverage } from '@/lib/ai-access'

// Escape text labels, not article Markdown. Canonical URLs remain explicit.
const label = (text: string) => text.replace(/[\[\]\\]/g, '\\$&').replace(/\s+/g, ' ')
export function recordMarkdown(r: AiRecord): string {
  return [
    `# ${r.title}`, `Canonical (${r.canonicalKind}): ${r.canonicalUrl}`,
    `PL R&D source: ${r.sourceUrl}`, `Source date: ${r.date || 'Not provided / not applicable'}`,
    r.authors.length ? `Authors: ${r.authors.map(a => a.url ? `[${label(a.name)}](${a.url})` : a.name).join('; ')}` : '',
    `Coverage: ${r.coverage}`,
    ...Object.entries(r.metadata).filter(([, value]) => value.length).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join('; ') : value}`),
    r.summary, r.body,
    '## Sources', ...r.sources.map(s => `- [${label(s.label)}](${s.url})`),
    `\nJSON: ${recordUrl(r)}`,
  ].filter(Boolean).join('\n\n') + '\n'
}

export function llmsIndex(): string {
  const records = createAiAccess().records()
  const info = coverage(records)
  return [
    '# PL R&D', '> Public research context for readers and AI assistants.',
    AI_SCOPE, AI_RIGHTS,
    `Schema: ${AI_SCHEMA_VERSION}. Records: ${records.length}. Source date range: ${info.dates.earliest || 'unknown'} to ${info.dates.latest || 'unknown'}. Dates describe source publication, not export freshness.`,
    '## Start here',
    `- [Human guide](${aiUrl('/ai/')}): starter prompt, coverage and query examples.`,
    `- [JSON index](${aiUrl('/ai/index.json')}): all record metadata, counts, canonical URLs and per-record Markdown links.`,
    `- [Search](${aiUrl('/api/ai/search/?q=connectome&limit=5')}): GET; q (max 200 characters), kind, area, limit (1–50), offset (0–10000). Case-insensitive AND substrings, stable ID order. Invalid inputs return 400; unknown resources return 404.`,
    `- [Complete covered context](${aiUrl('/llms-full.txt')}): downloadable text, not a full-site or live-CMS dump.`,
    '## Focused resources',
    ...records.filter(r => r.kind === 'area').map(r => `- [${label(r.title)}](${aiUrl(`/ai/topics/${r.slug}/`)}): shared descriptor and links to covered records; current page: ${r.canonicalUrl}`),
    '## Current overview pages',
    `- [PL R&D](${aiUrl('/')}): current landing page.`,
    `- [About](${aiUrl('/about/')}): current mission and operating model; not copied into this snapshot.`,
  ].join('\n\n') + '\n'
}

export function fullMarkdown(): string {
  const records = createAiAccess().records()
  return [llmsIndex(), '# Covered records', ...records.map(recordMarkdown)].join('\n\n---\n\n')
}

export function topicMarkdown(slug: string): string | null {
  const records = createAiAccess().records()
  const area = records.find(r => r.kind === 'area' && r.slug === slug)
  if (!area) return null
  const matches = records.filter(r => r.kind !== 'area' && r.areas.includes(slug))
  return [recordMarkdown(area), AI_SCOPE, `## Covered resources (${matches.length})`,
    ...matches.map(r => `- [${label(r.title)}](${markdownUrl(r)}) — ${r.kind}; ${r.date || 'undated'}; canonical (${r.canonicalKind}): ${r.canonicalUrl}`),
    'An empty or short list means limited source tagging, not an absence of research. Authors and tutorials may not have area tags. Use the JSON index or search for wider coverage.',
  ].join('\n\n') + '\n'
}
