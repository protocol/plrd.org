import neuroMeasurements from '@/data/velocity/neuro-measurement-series.json'

/** Sourced field-specific measures, nested within the five-instrument framework. */
export type MeasurementPoint = {
  date: string
  datePrecision: 'day' | 'month' | 'year'
  dateBasis: 'release' | 'publication' | 'observation' | 'disclosure'
  value: number
  label: string
  sourceUrl: string
  sourceLabel: string
  note: string
  qualifier?: 'approximate' | 'at-least' | 'greater-than'
}
export type MeasurementTrack = {
  id: string
  label: string
  definition: string
  points: MeasurementPoint[]
}
export type MeasurementSeries = {
  id: 'tissue-mapped' | 'bci-implants' | 'neural-recording-hours'
  title: string
  instrument: 'performance_curves' | 'revealed_commitments'
  lens: 'capability' | 'adoption' | 'data-supply'
  unit: 'mm³' | 'participants' | 'hours'
  description: string
  coverage: string
  caveat: string
  checkedAt: string
  chartKind: 'scatter' | 'line'
  scale: 'linear' | 'log'
  tracks: MeasurementTrack[]
}

const MEASURE_DEFINITIONS = {
  'tissue-mapped': ['performance_curves', 'capability', 'mm³', 'scatter', 'log'],
  'bci-implants': ['revealed_commitments', 'adoption', 'participants', 'line', 'linear'],
  'neural-recording-hours': ['performance_curves', 'data-supply', 'hours', 'scatter', 'linear'],
} as const

/** Validate the committed research JSON before it can become a public feed. */
export function parseMeasurementSeries(input: unknown): MeasurementSeries[] {
  const fail = (): never => { throw new Error('Invalid measurement series') }
  const object = (value: unknown): Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : fail()
  const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
  const date = (value: unknown): value is string => text(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  const url = (value: unknown) => {
    if (!text(value) || value.trim() !== value) return false
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'https:' && !!parsed.hostname && !parsed.username && !parsed.password
    } catch { return false }
  }
  if (!Array.isArray(input)) return fail()
  const ids = new Set<string>()
  for (const item of input) {
    const series = object(item)
    if (!text(series.id) || !Object.hasOwn(MEASURE_DEFINITIONS, series.id) || ids.has(series.id)) return fail()
    ids.add(series.id)
    const definition = MEASURE_DEFINITIONS[series.id as keyof typeof MEASURE_DEFINITIONS]
    if (['instrument', 'lens', 'unit', 'chartKind', 'scale'].some((key, i) => series[key] !== definition[i])) return fail()
    if (['title', 'description', 'coverage', 'caveat'].some(key => !text(series[key])) || !date(series.checkedAt)) return fail()
    if (!Array.isArray(series.tracks) || !series.tracks.length) return fail()
    const trackIds = new Set<string>()
    for (const entry of series.tracks) {
      const track = object(entry)
      if (!text(track.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(track.id) || trackIds.has(track.id)) return fail()
      trackIds.add(track.id)
      if (!text(track.label) || !text(track.definition) || !Array.isArray(track.points) || !track.points.length) return fail()
      const pointIds = new Set<string>()
      let lastDate = ''
      for (const entry of track.points) {
        const point = object(entry)
        if (!date(point.date) || point.date < lastDate) return fail()
        lastDate = point.date
        if (!['day', 'month', 'year'].includes(String(point.datePrecision)) ||
            !['release', 'publication', 'observation', 'disclosure'].includes(String(point.dateBasis))) return fail()
        if (typeof point.value !== 'number' || !Number.isFinite(point.value) || point.value <= 0) return fail()
        if (!url(point.sourceUrl) || ['label', 'sourceLabel', 'note'].some(key => !text(point[key]))) return fail()
        if (point.qualifier !== undefined && !['approximate', 'at-least', 'greater-than'].includes(String(point.qualifier))) return fail()
        const identity = JSON.stringify([point.date, point.label, point.sourceUrl])
        if (pointIds.has(identity)) return fail()
        pointIds.add(identity)
      }
    }
  }
  return input as MeasurementSeries[]
}

// Validate the canonical research source, shared unchanged by API and native UI.
export const NEURO_MEASUREMENT_SERIES: MeasurementSeries[] = parseMeasurementSeries(neuroMeasurements)
