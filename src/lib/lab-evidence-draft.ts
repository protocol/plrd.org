/** Bounds follow the actual draft controls, not the stricter result-import schema. */
export const EVIDENCE_DRAFT_LIMITS = { researchText: 64_000, reviewText: 64_000, by: 80, note: 2000 } as const
export type EvidenceDraft = { version: 1; researchText: string; reviewText: string; by: string; note: string }
const empty: EvidenceDraft = { version: 1, researchText: '', reviewText: '', by: '', note: '' }
// JSON can escape one UTF-16 code unit into six ASCII characters (e.g. \u0000).
// Includes every field and the exact envelope overhead; the same bound gates reads/writes.
export const MAX_EVIDENCE_DRAFT_CHARS = JSON.stringify(empty).length + 6 * Object.values(EVIDENCE_DRAFT_LIMITS).reduce((sum, limit) => sum + limit, 0)

export function parseEvidenceDraft(raw: string): EvidenceDraft {
  if (raw.length > MAX_EVIDENCE_DRAFT_CHARS) throw new Error('Saved evidence exceeds the supported draft size.')
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new Error('Saved evidence contains malformed JSON.') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Saved evidence has an unsupported draft shape.')
  const draft = value as Record<string, unknown>
  if (draft.version !== 1) throw new Error('Saved evidence has an incompatible version; this workbench supports version 1 only.')
  if (Object.keys(draft).length !== Object.keys(empty).length || Object.keys(draft).some(key => !(key in empty))) throw new Error('Saved evidence has unsupported fields.')
  for (const [key, limit] of Object.entries(EVIDENCE_DRAFT_LIMITS)) {
    if (typeof draft[key] !== 'string' || draft[key].length > limit) throw new Error(`Saved evidence field ${key} is invalid or exceeds its control limit.`)
  }
  return draft as EvidenceDraft
}

export function serializeEvidenceDraft(draft: EvidenceDraft): string {
  const raw = JSON.stringify(draft)
  parseEvidenceDraft(raw)
  return raw
}

/** Bounded UTF-8 download only when encoding preserves the exact storage string. */
export function evidenceRecoveryRaw(raw: string): string | null {
  if (raw.length > MAX_EVIDENCE_DRAFT_CHARS) return null
  const bytes = new TextEncoder().encode(raw)
  return bytes.length <= MAX_EVIDENCE_DRAFT_CHARS && new TextDecoder().decode(bytes) === raw ? raw : null
}
