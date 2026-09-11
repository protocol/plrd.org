import { isValidAtUri, isValidDid, isValidRecordKey } from '@atproto/syntax'

export type PublicLabDocument = {
  uri: string; cid: string; did: string;
  kind: 'profile' | 'note' | 'app' | 'contribution' | 'participation';
  data: Record<string, unknown>; createdAt?: string;
}
const kinds = ['profile', 'note', 'app', 'contribution', 'participation'] as const
export function checkedRecordUri(uri: string): string {
  if (typeof uri !== 'string' || uri.length > 2048 || !isValidAtUri(uri) || /[?#\s]/.test(uri)) throw new Error('Use an exact Open Lab AT Protocol record URI, not a profile or website URL.')
  const parts = uri.slice(5).split('/')
  if (parts.length !== 3 || !isValidDid(parts[0]) || !['did:plc:', 'did:web:'].some(p => parts[0].startsWith(p)) || !kinds.some(k => parts[1] === `org.plresearch.lab.${k}`) || !isValidRecordKey(parts[2])) throw new Error('This viewer accepts DID-qualified Open Lab records only.')
  return uri
}
export function presentPdsRecord(input: {
  uri: string; cid: string; authorDid: string; kind: string; data: object;
}): PublicLabDocument {
  const uri = checkedRecordUri(input.uri)
  if (uri.split('/')[2] !== input.authorDid) throw new Error('Record author does not match its location.')
  if (!kinds.some(kind => kind === input.kind)) throw new Error('Unsupported public record kind.')
  return { uri, cid: input.cid, did: input.authorDid, kind: input.kind as PublicLabDocument['kind'], data: input.data as Record<string,unknown> }
}

export function recordPermalink(origin: string, uri: string, response?: string | null): string {
  const base = new URL(origin)
  if (base.origin !== origin || base.username || base.password || !['https:', 'http:'].includes(base.protocol)) throw new Error('Use the exact app origin.')
  if (base.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw new Error('Public links must use HTTPS.')
  const url = new URL('/lab/record/', base)
  url.searchParams.set('uri', checkedRecordUri(uri))
  if (response) url.searchParams.set('response', checkedRecordUri(response))
  return url.href
}
export function readRecordLocation(search: string) {
  const params = new URLSearchParams(search)
  if (params.getAll('uri').length > 1 || params.getAll('response').length > 1) throw new Error('Provide one main record and at most one comparison record.')
  const uri = params.get('uri')
  const response = params.get('response')
  return { uri: uri ? checkedRecordUri(uri) : null, response: response ? checkedRecordUri(response) : null }
}
const fields: Record<PublicLabDocument['kind'], [string, string][]> = {
  profile: [['workingOn', 'Working on'], ['interests', 'Interests'], ['lookingFor', 'Looking for'], ['githubUrl', 'GitHub link'], ['scholarUrl', 'Google Scholar link']],
  note: [['text', 'The work'], ['field', 'Field'], ['evidenceUrl', 'Evidence']],
  app: [['description', 'What it makes possible'], ['url', 'Open app'], ['githubUrl', 'Source code'], ['field', 'Field']],
  contribution: [['targetUrl', 'Contribution target'], ['observation', 'Observation'], ['evidenceUrl', 'Evidence'], ['field', 'Field']],
  participation: [['campaignId', 'Pilot'], ['taskId', 'Task'], ['role', 'Role'], ['note', 'Return or intent'], ['evidenceUrl', 'Evidence']],
}
const labels: Record<string, string> = { question: 'Open question', finding: 'Finding', tool: 'Tool', help: 'Needs a hand', negative: 'Negative result' }
function safeDisplayLink(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !/[\u0000-\u0020\\]/.test(value) ? value : null } catch { return null }
}
export function displayRecord(record: PublicLabDocument) {
  if (!Object.hasOwn(fields, record.kind)) throw new Error('Unsupported record kind.')
  const data = record.data
  const title = record.kind === 'note' ? labels[String(data.postType)] || 'Research note' : record.kind === 'app' ? String(data.title || 'Science app').slice(0, 160) : record.kind === 'profile' ? 'Research profile' : record.kind === 'contribution' ? 'Evidence proposal' : 'Agent work contribution'
  const rows = fields[record.kind].flatMap(([key, label]) => {
    const raw = data[key]
    const value = Array.isArray(raw) ? raw.filter(x => typeof x === 'string').slice(0, 8).join(', ') : typeof raw === 'string' ? raw : ''
    if (!value) return []
    const link = /url$/i.test(key) || key === 'url'
    if (link && !safeDisplayLink(value)) return []
    return [{ label, value: value.slice(0, 5000), link }]
  })
  return { title, rows }
}
