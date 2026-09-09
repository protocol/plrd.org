'use client'

import { useId, useState } from 'react'
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

export function MeasurementChart({ measure, face = 'complete' }: { measure: MeasurementSeries; face?: 'complete' | 'chart' | 'data' | 'preview' }) {
  const [hovered, setHovered] = useState<MeasurementPoint | null>(null)
  const [focused, setFocused] = useState<MeasurementPoint | null>(null)
  const activePoint = hovered ?? focused
  const activeTrack = activePoint ? measure.tracks.find(track => track.points.includes(activePoint)) : undefined
  const tooltipId = useId()
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
  if (face === 'preview') return <svg data-measurement-preview={measure.id} aria-hidden="true" viewBox="54 28 296 170" className="block w-full h-11">
    {measure.tracks.map((track, index) => <g key={track.id} style={{ color: COLORS[index % COLORS.length] }}>
      {measure.chartKind === 'line' && track.points.length > 1 && <polyline points={track.points.map(p => `${x(p.date)},${y(p.value)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="3" />}
      {track.points.map((p, i) => <circle key={i} cx={x(p.date)} cy={y(p.value)} r="5" fill="currentColor" />)}
    </g>)}
  </svg>
  const titleId = `measurement-${measure.id}${face === 'data' ? '-data' : ''}`
  return (
    <article data-measurement={face === 'data' ? undefined : measure.id} data-measurement-details={face === 'data' ? measure.id : undefined} className="min-w-0 border-t border-gray-300 pt-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {INSTRUMENT_BY_ID[measure.instrument].label} · {measure.lens.replace('-', ' ')}
      </p>
      <h3 id={titleId} className="text-xl font-semibold text-black mb-2">{measure.title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{measure.coverage}</p>
      {face !== 'data' && <figure className="measurement-figure mt-3" aria-labelledby={titleId}>
        <p className="text-xs text-gray-500">{measure.unit} · {measure.scale === 'log' ? 'Log scale' : 'Linear scale'}</p>
        <svg viewBox="0 0 368 232" role="group" aria-labelledby={`${titleId}-chart`} data-scale={measure.scale} className="block w-full h-auto text-gray-500">
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
          {measure.tracks.map(track => <g key={track.id} data-track={track.id} style={{ color: COLORS[measure.tracks.indexOf(track) % COLORS.length] }}>
            {measure.chartKind === 'line' && track.points.length > 1 && <polyline data-line={track.id} points={track.points.map(point => `${x(point.date)},${y(point.value)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" />}
            {track.points.map(point => <a key={`${point.date}-${point.label}`} href={point.sourceUrl} target="_blank" rel="noopener noreferrer" tabIndex={0}
              aria-label={`${point.label} · ${track.label}: ${valueLabel(point)} ${measure.unit}, ${dateLabel(point)}. ${point.sourceLabel}`}
              aria-describedby={activePoint === point ? tooltipId : undefined}
              onMouseEnter={() => setHovered(point)} onMouseLeave={() => setHovered(null)}
              onFocus={() => setFocused(point)} onBlur={() => setFocused(null)}>
              <circle data-point={track.id} cx={x(point.date)} cy={y(point.value)} r="6" fill="currentColor" stroke="var(--color-white)" strokeWidth="1.5">
                <title>{`${track.label} · ${point.label}: ${valueLabel(point)} ${measure.unit} · ${dateLabel(point)} (${point.datePrecision} precision; ${point.dateBasis})`}</title>
              </circle>
            </a>)}
          </g>)}
        </svg>
        {activePoint && activeTrack && <div id={tooltipId} role="tooltip" className="measurement-tooltip">
          <p className="font-semibold text-black">{activePoint.label}</p>
          <p className="font-medium text-black">{valueLabel(activePoint)} {measure.unit} · {dateLabel(activePoint)}</p>
          <p>{activeTrack.label} · {activeTrack.definition}</p>
          <p className="text-gray-500">{activePoint.datePrecision} precision · {activePoint.dateBasis} · {activePoint.sourceLabel}</p>
        </div>}
        <figcaption className="text-xs leading-relaxed text-gray-600">
          <ul className="measurement-legend" aria-label="Evidence tracks">
            {measure.tracks.map((track, index) => <li key={track.id}>
              <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span>{track.label}</span>
            </li>)}
          </ul>
          <p className="mt-2 text-[11px] text-gray-500">Hover or focus a dot for details; follow it to the source. Some markers overlap; Tab visits every observation.</p>
        </figcaption>
      </figure>}
      <p className="mt-3 text-xs text-gray-500 leading-relaxed">{measure.caveat}</p>
      {face !== 'chart' && <details open={face === 'data' ? true : undefined} className="mt-4 text-sm">
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
      </details>}
    </article>
  )
}
