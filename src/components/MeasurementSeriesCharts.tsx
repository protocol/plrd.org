'use client'

import { useState } from 'react'
import type { MeasurementPoint, MeasurementSeries } from '@/lib/measurement-series'
import { INSTRUMENT_BY_ID } from '@/lib/velocity-instruments'

const COLORS = ['var(--color-blue)', 'var(--color-pink)', 'var(--impact-field)', 'var(--color-teal)', 'var(--color-gray-500)', 'var(--color-blue-gray)', '#8b5cf6']
const valueLabel = (point: MeasurementPoint) => `${point.qualifier === 'approximate' ? '≈ ' : point.qualifier === 'at-least' ? '≥ ' : point.qualifier === 'greater-than' ? '> ' : ''}${point.value.toLocaleString('en-US', { maximumSignificantDigits: 15 })}`
const dateLabel = (point: MeasurementPoint) => point.datePrecision === 'year' ? point.date.slice(0, 4) :
  new Date(point.date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', ...(point.datePrecision === 'day' ? { day: 'numeric' as const } : {}) })
const axisValue = (value: number) => value > 0 && value < 0.01 ? value.toExponential(0) : value.toLocaleString('en-US', { notation: 'compact', maximumSignificantDigits: 3 })

/** Native, source-linked small multiples. Tracks remain distinct; no aggregate is computed. */
export default function MeasurementSeriesCharts({ series }: { series: MeasurementSeries[] }) {
  if (!series.length) return null
  return (
    <div className="measurement-series-grid mt-8" aria-label="Field-specific measurements">
      {series.map(measure => <MeasurementChart key={measure.id} measure={measure} />)}
    </div>
  )
}

/** Tick values are in source units; the renderer alone applies the log transform. */
export function measurementTicks(values: number[], scale: MeasurementSeries['scale']): number[] {
  const max = Math.max(...values)
  if (scale === 'log') {
    const low = Math.floor(Math.log10(Math.min(...values)))
    const high = Math.max(low + 1, Math.ceil(Math.log10(max)))
    return Array.from({ length: high - low + 1 }, (_, i) => Number(`1e${low + i}`))
  }
  const raw = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const fraction = raw / magnitude
  const step = Math.max(1, (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * magnitude)
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step)
}

export function visibleMeasurementTracks(measure: MeasurementSeries, selectedTrack: string | null) {
  return selectedTrack === null ? measure.tracks : measure.tracks.filter(track => track.id === selectedTrack)
}

function MeasurementChart({ measure }: { measure: MeasurementSeries }) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const points = measure.tracks.flatMap(track => track.points)
  const dates = points.map(point => Date.parse(point.date))
  const first = Math.min(...dates)
  const last = Math.max(...dates)
  const values = points.map(point => point.value)
  const transform = (value: number) => measure.scale === 'log' ? Math.log10(value) : value
  const ticks = measurementTicks(values, measure.scale)
  const low = transform(ticks[0])
  const high = transform(ticks[ticks.length - 1])
  const x = (date: string) => first === last ? 200 : 60 + (Date.parse(date) - first) / (last - first) * 284
  const y = (value: number) => 190 - (transform(value) - low) / (high - low) * 156
  const titleId = `measurement-${measure.id}`
  return (
    <article data-measurement={measure.id} className="min-w-0 border-t border-gray-300 pt-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {INSTRUMENT_BY_ID[measure.instrument].label} · {measure.lens.replace('-', ' ')}
      </p>
      <h3 id={titleId} className="text-xl font-semibold text-black mb-2">{measure.title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{measure.coverage}</p>
      <figure className="mt-4" aria-labelledby={titleId}>
        <p className="text-xs text-gray-500">{measure.unit} · {measure.scale === 'log' ? 'Log scale' : 'Linear scale'}</p>
        <svg viewBox="0 0 368 232" role="img" aria-labelledby={`${titleId}-chart`} data-scale={measure.scale} className="block w-full h-auto text-gray-500">
          <title id={`${titleId}-chart`}>{`${measure.title}: ${measure.unit} by date. ${measure.scale} scale. Separate evidence tracks; source data below.`}</title>
          {ticks.map(value => {
            const py = y(value)
            return <g key={value}>
              <line x1="60" x2="344" y1={py} y2={py} stroke="currentColor" opacity="0.18" />
              <text x="52" y={py + 4} textAnchor="end" fill="currentColor" fontSize="11">{axisValue(value)}</text>
            </g>
          })}
          <text x="60" y="216" fill="currentColor" fontSize="11">{new Date(first).getUTCFullYear()}</text>
          {first !== last && <text x="344" y="216" textAnchor="end" fill="currentColor" fontSize="11">{new Date(last).getUTCFullYear()}</text>}
          {visibleMeasurementTracks(measure, selectedTrack).map(track => <g key={track.id} data-track={track.id} style={{ color: COLORS[measure.tracks.indexOf(track) % COLORS.length] }}>
            {measure.chartKind === 'line' && track.points.length > 1 && <polyline data-line={track.id} points={track.points.map(point => `${x(point.date)},${y(point.value)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" />}
            {track.points.map(point => <a key={`${point.date}-${point.label}`} href={point.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${track.label}: ${valueLabel(point)} ${measure.unit}, ${dateLabel(point)}. ${point.sourceLabel}`}>
              <circle data-point={track.id} cx={x(point.date)} cy={y(point.value)} r="6" fill="currentColor" stroke="var(--color-white)" strokeWidth="1.5">
                <title>{`${track.label} · ${point.label}: ${valueLabel(point)} ${measure.unit} · ${dateLabel(point)} (${point.datePrecision} precision; ${point.dateBasis})`}</title>
              </circle>
            </a>)}
          </g>)}
        </svg>
        <figcaption className="space-y-1 text-xs leading-relaxed text-gray-600">
          <p className="mb-2">Some markers overlap. Select a track to isolate it; axes stay fixed.</p>
          <button type="button" aria-pressed={selectedTrack === null} onClick={() => setSelectedTrack(null)} className="text-blue underline py-1">Show all tracks</button>
          {measure.tracks.map((track, index) => <button key={track.id} type="button" aria-label={`Isolate ${track.label}`} aria-pressed={selectedTrack === track.id} onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)} className={`flex w-full items-start gap-2 py-1.5 text-left rounded-sm focus-visible:outline-2 focus-visible:outline-blue ${selectedTrack === track.id ? 'font-semibold text-black' : ''}`}>
            <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span>{track.label}</span>
          </button>)}
        </figcaption>
      </figure>
      <p className="mt-3 text-xs text-gray-500 leading-relaxed">{measure.caveat}</p>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-blue py-2 font-medium">Sources &amp; data · {points.length} observations</summary>
        <p className="my-3 text-gray-600 leading-relaxed">{measure.description}</p>
        <p className="text-xs text-gray-500 mb-4">Evidence checked {measure.checkedAt}. Dates retain the source’s precision; chart positions are not exact dates when only a month or year is known.</p>
        {measure.tracks.map(track => <div key={track.id} className="mt-5">
          <h4 className="font-semibold text-black">{track.label}</h4>
          <p className="mt-1 mb-3 text-xs text-gray-600 leading-relaxed">{track.definition}</p>
          <table className="measurement-data w-full table-fixed text-xs text-left">
            <caption className="sr-only">{track.label}: observations and sources</caption>
            <thead><tr><th scope="col">Date / value</th><th scope="col">Evidence</th></tr></thead>
            <tbody>{track.points.map(point => <tr key={`${point.date}-${point.label}`}>
              <td><span className="block font-medium">{valueLabel(point)} {measure.unit}</span>{dateLabel(point)} ({point.datePrecision} precision; {point.dateBasis})</td>
              <td><span className="block font-medium">{point.label}</span><p className="my-1">{point.note}</p><a href={point.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue underline underline-offset-2">{point.sourceLabel}</a></td>
            </tr>)}</tbody>
          </table>
        </div>)}
      </details>
    </article>
  )
}
