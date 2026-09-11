import snapshot from '@/data/lab-science-tree.json'

export type ScienceKind = 'root' | 'domain' | 'field' | 'subfield' | 'topic'
export type ScienceNode = {
  id: string
  sourceId: string
  label: string
  kind: ScienceKind
  parent: string | null
  description?: string
  keywords?: string
}
export type ScienceSnapshot = {
  schema: string
  provenance: { publisher: string; sourceUrl: string; documentationUrl: string; repositoryUrl: string; license: string; licenseUrl: string; checkedOn: string; sourceSha256: string; classification: string }
  counts: Record<Exclude<ScienceKind, 'root'>, number>
  nodes: ScienceNode[]
}
export const scienceSnapshot = snapshot as ScienceSnapshot
export const scienceRoot: ScienceNode = { id: 'science', sourceId: '', label: 'All sciences', kind: 'root', parent: null }
export const scienceNodes: ScienceNode[] = [scienceRoot, ...scienceSnapshot.nodes]
const byId = new Map(scienceNodes.map(node => [node.id, node]))
export const getScienceNode = (id: unknown) => typeof id === 'string' ? byId.get(id) : undefined

export function getSciencePath(id: string): ScienceNode[] {
  const path: ScienceNode[] = []
  const seen = new Set<string>()
  let node = getScienceNode(id)
  while (node && !seen.has(node.id)) {
    path.unshift(node)
    seen.add(node.id)
    node = node.parent ? getScienceNode(node.parent) : undefined
  }
  return path
}

const childrenById = new Map<string, ScienceNode[]>()
for (const node of scienceNodes) {
  if (node.parent) childrenById.set(node.parent, [...(childrenById.get(node.parent) ?? []), node])
}
for (const children of childrenById.values()) children.sort((a, b) => a.label.localeCompare(b.label, 'en'))
export const getScienceChildren = (id: string): ScienceNode[] => childrenById.get(id) ?? []

/** Fit readable desktop branches and size the canvas to the actual bounded row count. */
export function scienceGraphFrame(count: number, viewportWidth: number) {
  const length = Number.isFinite(count) ? Math.max(0, Math.min(8, Math.floor(count))) : 0
  const width = 860
  const height = Math.max(164, Math.ceil(length / 2) * 140 + 24)
  const fit = Number.isFinite(viewportWidth) && viewportWidth >= 620 ? Math.min(1, (viewportWidth - 16) / width) : 1
  const positions = Array.from({ length }, (_, index) => ({ x: index % 2 === 0 ? 16 : 594, y: 12 + Math.floor(index / 2) * 140 }))
  return { width, height, fit, positions }
}

const searchIndex = scienceNodes.filter(node => node.kind !== 'root').map(node => ({
  node,
  label: node.label.toLocaleLowerCase('en'),
  text: `${node.label} ${node.keywords ?? ''} ${node.description ?? ''} ${getSciencePath(node.id).map(n => n.label).join(' ')}`.toLocaleLowerCase('en'),
}))

/** Searches the entire snapshot, never only the visible branch/page/PL overlay. */
export function searchScience(query: string): ScienceNode[] {
  const normalized = query.trim().toLocaleLowerCase('en').slice(0, 200)
  if (!normalized) return []
  const words = normalized.split(/\s+/)
  return searchIndex.filter(item => words.every(word => item.text.includes(word)))
    .sort((a, b) => Number(b.label === normalized) - Number(a.label === normalized)
      || Number(b.label.startsWith(normalized)) - Number(a.label.startsWith(normalized))
      || a.label.localeCompare(b.label, 'en'))
    .map(item => item.node)
}

export function pageScienceNodes(nodes: ScienceNode[], requestedPage: number, size = 8) {
  const pageSize = Number.isFinite(size) ? Math.max(1, Math.min(40, Math.floor(size))) : 8
  const pages = Math.max(1, Math.ceil(nodes.length / pageSize))
  const page = Number.isFinite(requestedPage) ? Math.max(0, Math.min(pages - 1, Math.floor(requestedPage))) : 0
  return { items: nodes.slice(page * pageSize, (page + 1) * pageSize), page, pages, total: nodes.length }
}

export function scienceHref(id: string): string {
  if (!getScienceNode(id)) throw new RangeError('Unknown science node')
  return `/lab/explorations/observatory/${id === 'science' ? '' : `?node=${encodeURIComponent(id)}`}`
}

export function scienceSourceHref(id: string): string {
  const node = getScienceNode(id)
  if (!node) throw new RangeError('Unknown science node')
  if (node.kind === 'root') return scienceSnapshot.provenance.documentationUrl
  return node.kind === 'topic' ? `https://openalex.org/T${node.sourceId}` : `https://api.openalex.org/${node.kind}s/${node.sourceId}`
}

/** Build-time/test gate. Every rendered line has exactly one sourced containment meaning. */
export function validateScienceSnapshot(data: ScienceSnapshot): string[] {
  const errors: string[] = []
  const ids = new Map<string, ScienceNode>()
  const levels: ScienceKind[] = ['root', 'domain', 'field', 'subfield', 'topic']
  for (const node of data.nodes) {
    if (ids.has(node.id)) errors.push(`Duplicate ID: ${node.id}`)
    ids.set(node.id, node)
    if (!node.label || !/^\d+$/.test(node.sourceId) || node.id !== `${node.kind}:${node.kind === 'topic' ? 'T' : ''}${node.sourceId}`) errors.push(`Invalid node: ${node.id}`)
  }
  for (const node of data.nodes) {
    const parent = node.parent === 'science' ? scienceRoot : ids.get(node.parent ?? '')
    if (!parent || levels.indexOf(parent.kind) !== levels.indexOf(node.kind) - 1) errors.push(`Invalid parent for ${node.id}`)
  }
  for (const kind of levels.slice(1) as (Exclude<ScienceKind, 'root'>)[]) {
    if (data.nodes.filter(node => node.kind === kind).length !== data.counts[kind]) errors.push(`Count mismatch: ${kind}`)
  }
  return errors
}
