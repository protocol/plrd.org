import { AI_KINDS, AI_SCHEMA_VERSION, AI_SCOPE, AI_RIGHTS, aiRecords, aiUrl, isPublicAiRecord, markdownUrl, recordUrl, type AiRecord } from '@/lib/ai-content'

export const AI_LIMITS = { defaultLimit: 10, maxLimit: 50, maxOffset: 10000, maxQueryLength: 200 } as const
export const AI_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=300', 'Link': '<https://www.plrd.org/llms.txt>; rel="describedby"; type="text/plain"' }
export function aiResponse(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { ...AI_HEADERS, ...(status === 200 ? {} : { 'Cache-Control': 'no-store' }) } })
}
export function aiText(value: string, type = 'text/markdown; charset=utf-8', filename?: string): Response {
  return new Response(value, { headers: { ...AI_HEADERS, 'Content-Type': type, ...(filename ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}) } })
}

export function publicRecord(record: AiRecord) {
  // Explicit schema: never spill new/raw mapper fields into public responses.
  return {
    id: record.id, kind: record.kind, slug: record.slug, title: record.title,
    summary: record.summary, body: record.body, date: record.date, authors: record.authors, areas: record.areas,
    canonicalKind: record.canonicalKind, canonicalUrl: record.canonicalUrl, sourceUrl: record.sourceUrl,
    sources: record.sources, coverage: record.coverage, metadata: record.metadata,
    markdownUrl: markdownUrl(record), jsonUrl: recordUrl(record),
  }
}
export function recordSummary(record: AiRecord) {
  const { body: _body, ...data } = publicRecord(record)
  return data
}

export function coverage(records: AiRecord[]) {
  const dates = records.map(r => r.date).filter((d): d is string => d !== null).sort()
  return {
    scope: AI_SCOPE, rights: AI_RIGHTS, source: aiUrl('/'),
    total: records.length,
    counts: Object.fromEntries(AI_KINDS.map(kind => [kind, records.filter(r => r.kind === kind).length])),
    dates: { meaning: 'Source publication dates, not last-modified or export timestamps. Null means not provided or not applicable.', earliest: dates[0] || null, latest: dates.at(-1) || null },
  }
}

/** All paths (including known-ID detail) use the same fail-closed view. */
export function createAiAccess(input: AiRecord[] = aiRecords) {
  const visible = () => input.filter(r => isPublicAiRecord(r)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  const get = (kind: string, slug: string) => visible().find(r => r.kind === kind && r.slug === slug)
  return {
    records: visible,
    get,
    index() {
      const records = visible()
      return aiResponse({ schemaVersion: AI_SCHEMA_VERSION, coverage: coverage(records), search: { url: aiUrl('/api/ai/search/'), limits: AI_LIMITS, kinds: AI_KINDS, areas: records.filter(r => r.kind === 'area').map(r => r.slug) }, records: records.map(recordSummary) })
    },
    detail(kind: string, slug: string) {
      const record = get(kind, slug)
      return record ? aiResponse({ schemaVersion: AI_SCHEMA_VERSION, scope: AI_SCOPE, record: publicRecord(record) }) : aiResponse({ error: 'Not found' }, 404)
    },
    search(request: Request) {
      const params = new URL(request.url).searchParams
      const allowed = new Set(['q', 'kind', 'area', 'limit', 'offset'])
      const bad = (message: string) => aiResponse({ error: message }, 400)
      for (const key of params.keys()) if (!allowed.has(key) || params.getAll(key).length !== 1) return bad('Unknown or repeated query parameter')
      const q = params.get('q') || ''
      if (q.length > AI_LIMITS.maxQueryLength || /[\u0000-\u001f\u007f]/.test(q)) return bad('q must be at most 200 characters without control characters')
      const integer = (key: string, fallback: number, min: number, max: number) => {
        const value = params.get(key)
        if (value === null) return fallback
        if (!/^(0|[1-9]\d*)$/.test(value)) return null
        const n = Number(value)
        return Number.isSafeInteger(n) && n >= min && n <= max ? n : null
      }
      const limit = integer('limit', AI_LIMITS.defaultLimit, 1, AI_LIMITS.maxLimit)
      const offset = integer('offset', 0, 0, AI_LIMITS.maxOffset)
      if (limit === null || offset === null) return bad('Invalid limit (1–50) or offset (0–10000)')
      const records = visible()
      const kind = params.get('kind')
      const area = params.get('area')
      if (kind !== null && !AI_KINDS.some(k => k === kind)) return bad('Unknown kind')
      if (area !== null && !records.some(r => r.kind === 'area' && r.slug === area)) return bad('Unknown area')
      const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
      const matches = records.filter(r => {
        if (kind && r.kind !== kind || area && !r.areas.includes(area)) return false
        const text = [r.title, r.summary, r.body, ...r.authors.map(a => a.name)].join('\n').toLowerCase()
        return terms.every(term => text.includes(term))
      })
      const results = matches.slice(offset, offset + limit).map(recordSummary)
      return aiResponse({ schemaVersion: AI_SCHEMA_VERSION, coverage: coverage(records), query: { q, kind, area, limit, offset }, order: 'id ascending; case-insensitive AND substring matching, no relevance scoring', total: matches.length, nextOffset: offset + limit < matches.length ? offset + limit : null, results })
    },
  }
}
