// Server-side data assembly shared by the impact overview, area panels and API.
// Keep observation dates from the source loaders; generatedAt only dates this envelope.
import { FOCUS_AREAS, type FocusAreaKey } from '@/lib/inflection-points'
import { instrumentsForArea, withOpenAlex, withPatentVintage, type InstrumentRecord } from '@/lib/velocity-instruments'
import { loadAllOpenAlex } from '@/lib/velocity-openalex'
import { loadAllLatency, withLatency } from '@/lib/velocity-latency'
import { loadMarketCurve, withMarketCurve } from '@/lib/velocity-market-curve'
import { resolveAllSignals, type MarketSignal } from '@/lib/market-signals'
import { INFLECTION_POINTS, TOOLKIT_V2, FIELD_VELOCITY_METHODOLOGY, FIELD_VELOCITY_OVERVIEW, FIELD_VELOCITY_ORIGIN } from '@/lib/field-velocity'
import { VELOCITY_INSTRUMENTS } from '@/lib/velocity-instruments'
import { NEURO_MEASUREMENT_SERIES, type MeasurementSeries } from '@/lib/measurement-series'

export function isFocusAreaKey(area: string): area is FocusAreaKey {
  return FOCUS_AREAS.some(({ key }) => key === area)
}

/** Explicit public projection: never spread server-only outputs or hypercert inputs. */
export function fieldVelocityForArea(data: Awaited<ReturnType<typeof loadFieldVelocity>>, area: FocusAreaKey) {
  const { key, label } = FOCUS_AREAS.find(fa => fa.key === area)!
  const inflectionPoints = INFLECTION_POINTS.filter(point => point.area === area)
  const marketSignals: Record<string, MarketSignal> = Object.fromEntries(
    inflectionPoints.flatMap(point => data.marketSignals[point.title] ? [[point.title, data.marketSignals[point.title]]] : []),
  )
  return {
    schemaVersion: 1 as const,
    generatedAt: data.generatedAt,
    area: { key, label },
    source: {
      url: `${FIELD_VELOCITY_ORIGIN}${FIELD_VELOCITY_OVERVIEW}?area=${area}#field-velocity`,
      repository: 'https://github.com/protocol/plrd.org',
      methodologyUrl: `${FIELD_VELOCITY_ORIGIN}${FIELD_VELOCITY_OVERVIEW}#methodology`,
    },
    instruments: VELOCITY_INSTRUMENTS,
    records: data.recordsByArea[area],
    measurementSeries: data.measurementSeriesByArea[area],
    inflectionPoints,
    marketSignals,
    toolkit: TOOLKIT_V2,
    methodology: FIELD_VELOCITY_METHODOLOGY,
  }
}

export type AreaFieldVelocity = ReturnType<typeof fieldVelocityForArea>

export async function loadFieldVelocity(resolveSignals = resolveAllSignals) {
  const openAlex = loadAllOpenAlex()
  const latency = loadAllLatency()
  const marketCurve = loadMarketCurve()
  const recordsByArea = Object.fromEntries(FOCUS_AREAS.map(({ key }) => [
    key,
    withMarketCurve(
      withLatency(withOpenAlex(withPatentVintage(instrumentsForArea(key), key), openAlex[key]), latency[key]),
      marketCurve[key],
    ),
  ])) as Record<FocusAreaKey, InstrumentRecord[]>
  const ideaVintageExamples = FOCUS_AREAS.flatMap(({ key, label }) => {
    const record = recordsByArea[key].find(r => r.instrument === 'idea_vintage' && r.state === 'reading' && r.series && r.series.length > 1)
    return record ? [{ label, series: record.series!, scale: record.seriesScale ?? 'linear' as const }] : []
  })
  const marketSignals = await resolveSignals()
  const measurementSeriesByArea = Object.fromEntries(FOCUS_AREAS.map(({ key }) => [
    key, key === 'neurotech' ? NEURO_MEASUREMENT_SERIES : [],
  ])) as Record<FocusAreaKey, MeasurementSeries[]>
  return { generatedAt: new Date().toISOString(), recordsByArea, measurementSeriesByArea, ideaVintageExamples, marketSignals }
}
