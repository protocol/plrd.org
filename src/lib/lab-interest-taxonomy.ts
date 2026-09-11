import { DISCIPLINES } from '@/lib/lab-following'

/** Local profile choices only. Public field mapping and feed follows are separate decisions. */
export const LOCAL_INTERESTS = DISCIPLINES.map(({ id, label }) => ({ id, label }))
export const MAX_LOCAL_INTERESTS = 8

/** Saved custom/legacy values remain visible and editable, never filtered to the taxonomy. */
export function localInterestChoices(existing: string[]) {
  return [...LOCAL_INTERESTS, ...[...new Set(existing)].filter(id => !LOCAL_INTERESTS.some(i => i.id === id)).map(id => ({ id, label: id }))]
}

export function toggleLocalInterest(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter(value => value !== id)
  return current.length < MAX_LOCAL_INTERESTS ? [...current, id] : current
}

export function localInterestLimitMessage(count: number): string {
  return `${count} of ${MAX_LOCAL_INTERESTS} interests selected. ${count > MAX_LOCAL_INTERESTS ? `Saved interests are kept. Deselect to ${MAX_LOCAL_INTERESTS} or fewer before saving or adding another.` : count === MAX_LOCAL_INTERESTS ? 'Deselect an interest before adding another.' : `Choose up to ${MAX_LOCAL_INTERESTS}.`}`
}
