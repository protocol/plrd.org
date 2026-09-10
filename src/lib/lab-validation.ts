import { Lexicons, type LexiconDoc } from '@atproto/lexicon'
import { LAB_COLLECTIONS, type LabKind } from '@/lib/lab-oauth-config'
import profile from '@/../public/lab/lexicons/org.plresearch.lab.profile.json'
import note from '@/../public/lab/lexicons/org.plresearch.lab.note.json'
import app from '@/../public/lab/lexicons/org.plresearch.lab.app.json'
import contribution from '@/../public/lab/lexicons/org.plresearch.lab.contribution.json'
import participation from '@/../public/lab/lexicons/org.plresearch.lab.participation.json'

export { LAB_COLLECTIONS, type LabKind }
export const LAB_COMMUNITY = 'https://www.plrd.org/lab/' as const
export const LAB_SCHEMAS = [profile, note, app, contribution, participation] as LexiconDoc[]
const lexicons = new Lexicons(LAB_SCHEMAS)
export type LabField = 'digital-human-rights' | 'economies-governance' | 'ai-robotics' | 'neurotech' | 'cross-field'
export type LabDataMap = {
  profile: { workingOn: string; interests: string[]; lookingFor: string; githubUrl?: string; scholarUrl?: string; linkedinUrl?: string };
  note: { text: string; postType: 'question' | 'finding' | 'tool' | 'help' | 'negative'; field: LabField; evidenceUrl?: string };
  app: { title: string; url: string; description: string; field: LabField; githubUrl?: string };
  contribution: { targetUrl: string; observation: string; evidenceUrl: string; field: LabField };
  participation: { campaignId: string; taskId: string; role: 'research' | 'reproduce' | 'review'; note: string; evidenceUrl?: string };
}
export type LabRecord<K extends LabKind = LabKind> = LabDataMap[K] & { $type: typeof LAB_COLLECTIONS[K]; community: typeof LAB_COMMUNITY; createdAt: string }

export const LAB_MAX_RECORD_BYTES = 16_384
const schemas = { profile, note, app, contribution, participation }

export function assertPlainObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('Expected a plain record object.')
  if (new TextEncoder().encode(JSON.stringify(value)).length > LAB_MAX_RECORD_BYTES) throw new Error('Record exceeds the 16 KiB application limit.')
}

export function safeLabHttpsUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) throw new Error('Use a public HTTPS URL.')
  let url: URL
  try { url = new URL(value) } catch { throw new Error('Use a public HTTPS URL.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(url.hostname) || /\.(?:local|localhost|internal|test)$/i.test(url.hostname)) throw new Error('Use a public HTTPS URL without credentials or a custom port.')
  if ([...url.searchParams.keys()].some(k => /^(?:access_token|refresh_token|token|key|api_key|secret|password|code|signature|x-amz-signature|x-goog-signature)$/i.test(k))) throw new Error('Do not publish credential-bearing URLs.')
  return value
}

function checkBusinessFields(kind: LabKind, data: Record<string, unknown>, record: boolean) {
  if (!Object.hasOwn(LAB_COLLECTIONS, kind)) throw new Error('Unknown Open Lab record kind.')
  const properties = schemas[kind].defs.main.record.properties
  const allowed = new Set(Object.keys(properties).filter(k => record || !['community', 'createdAt'].includes(k)))
  if (record) allowed.add('$type')
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key)) throw new Error('Unexpected record field.')
    for (const item of Array.isArray(value) ? value : [value]) {
      if (typeof item === 'string' && (!item.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(item))) throw new Error('Text must be nonempty and contain no unsafe control characters.')
    }
    if (/url$/i.test(key)) safeLabHttpsUrl(value)
  }
  if (typeof data.githubUrl === 'string') {
    const u = new URL(data.githubUrl)
    const shape = kind === 'profile' ? /^\/[a-zA-Z0-9-]{1,39}\/?$/ : /^\/[a-zA-Z0-9-]{1,39}\/[a-zA-Z0-9_.-]{1,100}\/?$/
    if (u.hostname !== 'github.com' || !shape.test(u.pathname) || u.search || u.hash) throw new Error('Use a GitHub profile or repository URL appropriate to this record.')
  }
  if (kind === 'profile' && typeof data.linkedinUrl === 'string') {
    const u = new URL(data.linkedinUrl)
    if (!['linkedin.com', 'www.linkedin.com'].includes(u.hostname) || !/^\/in\/[a-zA-Z0-9_%\-]{1,200}\/?$/.test(u.pathname) || u.search || u.hash) throw new Error('Use a LinkedIn /in/ profile URL without tracking parameters.')
  }
  if (typeof data.scholarUrl === 'string') {
    const u = new URL(data.scholarUrl)
    if (u.hostname !== 'scholar.google.com' || u.pathname !== '/citations' || !u.searchParams.get('user')) throw new Error('Use a Google Scholar citations profile URL.')
  }
  for (const key of ['campaignId', 'taskId']) if (key in data && (typeof data[key] !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(data[key] as string))) throw new Error('Invalid pilot task identifier.')
}

export function validateLabRecord<K extends LabKind>(kind: K, input: unknown): LabRecord<K> {
  assertPlainObject(input)
  checkBusinessFields(kind, input, true)
  if (input.$type !== LAB_COLLECTIONS[kind] || input.community !== LAB_COMMUNITY) throw new Error('Record type or community does not match.')
  lexicons.assertValidRecord(LAB_COLLECTIONS[kind], input)
  return structuredClone(input) as unknown as LabRecord<K>
}
export function validateLabData<K extends LabKind>(kind: K, input: unknown): LabDataMap[K] {
  assertPlainObject(input)
  checkBusinessFields(kind, input, false)
  const record = validateLabRecord(kind, { ...(input as object), $type: LAB_COLLECTIONS[kind], community: LAB_COMMUNITY, createdAt: '2026-01-01T00:00:00.000Z' })
  const { $type, community, createdAt, ...data } = record
  void $type; void community; void createdAt
  return data as unknown as LabDataMap[K]
}
