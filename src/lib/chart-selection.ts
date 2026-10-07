import { FOCUS_AREAS, type FocusAreaKey } from '@/lib/field-velocity'
import { INSTRUMENT_BY_ID, type InstrumentId } from '@/lib/velocity-instruments'

/** Stable source identities, never card indices. No matching element id means
 * fresh links cannot trigger native fragment scrolling. */
export function chartHash(area: FocusAreaKey, instrument?: InstrumentId, itemId?: string) {
  return `#fv/${area}${instrument && itemId ? `/${instrument}/${encodeURIComponent(itemId)}` : ''}`
}

export function parseChartHash(hash: string): { area: FocusAreaKey; instrument?: InstrumentId; itemId?: string } | null {
  const parts = hash.split('/')
  if (parts[0] !== '#fv' || ![2, 4].includes(parts.length) || !FOCUS_AREAS.some(area => area.key === parts[1])) return null
  const area = parts[1] as FocusAreaKey
  if (parts.length === 2) return { area }
  if (!Object.hasOwn(INSTRUMENT_BY_ID, parts[2])) return null
  try {
    const itemId = decodeURIComponent(parts[3])
    return itemId ? { area, instrument: parts[2] as InstrumentId, itemId } : null
  } catch { return null }
}
