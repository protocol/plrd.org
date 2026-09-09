import type { InstrumentRecord } from '@/lib/velocity-instruments'
import type { MeasurementSeries } from '@/lib/measurement-series'
import { isRenderableMarket, type MarketSignal } from '@/lib/market-signals'
import type { IdeaVintageExample } from '@/components/velocity-explainers'

export type GalleryItem =
  | { kind: 'primary' | 'secondary' | 'patent'; id: string }
  | { kind: 'market'; id: string; market: MarketSignal }
  | { kind: 'measurement'; id: string; measure: MeasurementSeries }
  | { kind: 'example'; id: string; example: IdeaVintageExample }

/** One inventory for both preview counts and the focused gallery. No values are
 * combined: measurement attribution and lenses stay exactly as supplied. */
export function instrumentGallery(
  record: InstrumentRecord,
  measurements: MeasurementSeries[] = [],
  markets: MarketSignal[] = [],
  examples: IdeaVintageExample[] = [],
  areaLabel?: string,
) {
  const items: GalleryItem[] = []
  if (record.state === 'reading') {
    if (record.series && record.series.length > 1) items.push({ kind: 'primary', id: 'primary' })
    if (record.series2 && record.series2.length > 1) items.push({ kind: 'secondary', id: 'secondary' })
    for (const measure of measurements.filter(s => s.instrument === record.instrument)) {
      if (measure.tracks.some(t => t.points.length)) items.push({ kind: 'measurement', id: measure.id, measure })
    }
    if (record.instrument === 'idea_vintage') {
      if (record.patentVintage?.state === 'reading' && (record.patentVintage.series?.length ?? 0) > 1) items.push({ kind: 'patent', id: 'patent' })
      for (const example of examples) {
        // The selected area's paper-vintage chart is already the primary chart.
        if (example.label === areaLabel && example.series.length > 1 && (record.series?.length ?? 0) < 2) {
          items.push({ kind: 'example', id: `example-${example.label}`, example })
        }
      }
    }
  }
  if (record.instrument === 'markets' && record.state === 'reading') {
    const seen = new Set<string>()
    for (const market of markets) {
      if (isRenderableMarket(market) && (market.prob != null || market.readout) && !seen.has(market.url!)) {
        seen.add(market.url!)
        items.push({ kind: 'market', id: `market-${market.url}`, market })
      }
    }
  }
  return { items, chartCount: items.filter(item => item.kind !== 'market' || item.market.prob != null).length }
}
