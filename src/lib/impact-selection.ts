import { INFLECTION_POINTS, type InflectionPoint } from '@/lib/field-velocity'
import { inflectionSlug } from '@/lib/inflection-points'

export function inflectionHash(point: InflectionPoint) {
  return `#inflection/${point.area}/${inflectionSlug(point)}`
}

/** Exact allowlist matching also rejects malformed escapes, suffixes and
 * prototype names without decoding untrusted fragment text. */
export function parseInflectionHash(hash: string) {
  return INFLECTION_POINTS.find(point => inflectionHash(point) === hash) ?? null
}
