'use client'

// Shared inline-SVG sparkline + ghost chart for the field-velocity instruments.
// Pure SVG (no deps). Supports a log axis, a confidence band, a dashed tail for
// unreliable points, an optional secondary normalizer line, an optional
// labelled vertical axis (min/max of the series, so the reader can see what the
// curve indexes to), and — when `interactive` — a hover crosshair with a tooltip
// that reads the value and x-axis position under the cursor. Click-hold-drag
// across the curve to measure the delta between two points (absolute + relative
// change).

import { useRef, useState } from 'react'

export type SeriesPoint = { x: number | string; y: number; lo?: number; hi?: number; reliable?: boolean }

function fmt(v: number, unit: string): string {
  const n = Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : Number.isInteger(v) ? `${v}` : v.toFixed(1)
  return unit ? `${n}${unit}` : n
}

// Signed absolute delta, e.g. "+1.2k" / "−3" / "±0".
function fmtDelta(v: number, unit: string): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '±'
  return `${sign}${fmt(Math.abs(v), unit)}`
}

export function Sparkline({
  series,
  series2,
  scale = 'linear',
  width = 116,
  height = 34,
  band = false,
  axis = false,
  unit = '',
  interactive = false,
}: {
  series: SeriesPoint[]
  series2?: { x: number | string; y: number }[]
  scale?: 'linear' | 'log'
  width?: number
  height?: number
  band?: boolean
  axis?: boolean
  unit?: string
  /** Enable a hover crosshair + value/x tooltip (used in the detail modal). */
  interactive?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  // Drag-to-measure: a two-point selection (indices into `series`). While the
  // pointer is down we grow it; on release it stays put so the reader can read
  // the delta. A plain click (no drag) clears it back to the hover crosshair.
  const [sel, setSel] = useState<{ a: number; b: number } | null>(null)
  const dragging = useRef(false)
  if (!series.length) return null
  const tf = (v: number) => (scale === 'log' ? Math.log10(Math.max(v, 1e-6)) : v)
  const xOf = (p: { x: number | string }, i: number) => (typeof p.x === 'number' ? p.x : i)

  const padL = axis ? 30 : 2
  const padR = 2

  const xsAll = [
    ...series.map((p, i) => xOf(p, i)),
    ...(series2 ? series2.map((p, i) => xOf(p, i)) : []),
  ]
  const minX = Math.min(...xsAll)
  const maxX = Math.max(...xsAll)
  const spanX = maxX - minX || 1

  const rawYs: number[] = []
  series.forEach((p) => {
    rawYs.push(p.y)
    if (band && p.lo != null) rawYs.push(p.lo)
    if (band && p.hi != null) rawYs.push(p.hi)
  })
  if (series2) series2.forEach((p) => rawYs.push(p.y))
  const minRaw = Math.min(...rawYs)
  const maxRaw = Math.max(...rawYs)
  const minY = tf(minRaw)
  const maxY = tf(maxRaw)
  const spanY = maxY - minY || 1

  const px = (x: number) => padL + ((x - minX) / spanX) * (width - padL - padR)
  const py = (v: number) => height - 3 - ((tf(v) - minY) / spanY) * (height - 6)
  const pt = (p: SeriesPoint, i: number) => `${px(xOf(p, i)).toFixed(1)},${py(p.y).toFixed(1)}`

  const hasReliableFlags = series.some((p) => p.reliable === false)
  const reliablePts = hasReliableFlags ? series.filter((p) => p.reliable !== false) : series
  const lastReliableIdx = hasReliableFlags
    ? series.reduce((acc, p, i) => (p.reliable !== false ? i : acc), 0)
    : series.length - 1
  const tailPts = hasReliableFlags ? series.slice(lastReliableIdx) : []

  let bandPath = ''
  if (band && series.every((p) => p.lo != null && p.hi != null)) {
    const top = series.map((p, i) => `${px(xOf(p, i)).toFixed(1)},${py(p.hi as number).toFixed(1)}`)
    const bot = [...series].reverse().map((p, i) => {
      const idx = series.length - 1 - i
      return `${px(xOf(p, idx)).toFixed(1)},${py(p.lo as number).toFixed(1)}`
    })
    bandPath = `${top.join(' ')} ${bot.join(' ')}`
  }

  const last = series[series.length - 1]

  // Map a client X coordinate to the nearest data-point index (by horizontal
  // distance).
  const nearestIndex = (clientX: number, rect: DOMRect) => {
    const svgX = ((clientX - rect.left) / rect.width) * width
    let best = 0
    let bestD = Infinity
    series.forEach((p, i) => {
      const d = Math.abs(px(xOf(p, i)) - svgX)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const i = nearestIndex(e.clientX, e.currentTarget.getBoundingClientRect())
    dragging.current = true
    setSel({ a: i, b: i })
    setHover(i)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const i = nearestIndex(e.clientX, e.currentTarget.getBoundingClientRect())
    setHover(i)
    if (dragging.current) setSel((s) => (s ? { a: s.a, b: i } : { a: i, b: i }))
  }

  const onPointerUp = () => {
    dragging.current = false
    // A click without a drag (both ends equal) collapses to the hover crosshair.
    setSel((s) => (s && s.a === s.b ? null : s))
  }

  const onPointerLeave = () => {
    if (!dragging.current) setHover(null)
  }

  const hp = hover != null ? series[hover] : null
  const hx = hp ? px(xOf(hp, hover as number)) : 0
  const hy = hp ? py(hp.y) : 0

  // Resolved selection (ordered left → right), with the change it measures.
  const selReady = sel && sel.a !== sel.b
  const lo = selReady ? Math.min(sel!.a, sel!.b) : 0
  const hi = selReady ? Math.max(sel!.a, sel!.b) : 0
  const yLo = selReady ? series[lo].y : 0
  const yHi = selReady ? series[hi].y : 0
  const dAbs = yHi - yLo
  const dRel = yLo !== 0 ? (dAbs / Math.abs(yLo)) * 100 : NaN
  const selX1 = selReady ? px(xOf(series[lo], lo)) : 0
  const selX2 = selReady ? px(xOf(series[hi], hi)) : 0
  const selMidX = (selX1 + selX2) / 2
  const selTopY = selReady ? Math.min(py(yLo), py(yHi)) : 0

  const svg = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden={!interactive}
      className={`overflow-visible${interactive ? ' cursor-crosshair touch-none select-none' : ''}`}
      {...(interactive
        ? {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave,
          }
        : {})}
    >
      {axis && (
        <g>
          <line x1={padL} y1={2} x2={padL} y2={height - 2} stroke="currentColor" className="text-gray-200" strokeWidth={1} />
          <text x={padL - 4} y={9} textAnchor="end" className="fill-gray-400" style={{ fontSize: 8 }}>{fmt(maxRaw, unit)}</text>
          <text x={padL - 4} y={height - 3} textAnchor="end" className="fill-gray-400" style={{ fontSize: 8 }}>{fmt(minRaw, unit)}</text>
        </g>
      )}
      {bandPath && <polygon points={bandPath} fill="var(--impact-field)" opacity={0.1} />}
      {series2 && (
        <polyline
          points={series2.map((p, i) => `${px(xOf(p, i)).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1.25}
          strokeDasharray="3 3"
        />
      )}
      <polyline
        points={reliablePts.map((p) => pt(p, series.indexOf(p))).join(' ')}
        fill="none"
        stroke="var(--impact-field)"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {tailPts.length > 1 && (
        <polyline
          points={tailPts.map((p) => pt(p, series.indexOf(p))).join(' ')}
          fill="none"
          stroke="var(--impact-field)"
          strokeWidth={1.75}
          strokeDasharray="2 2"
          opacity={0.45}
        />
      )}
      <circle cx={px(xOf(last, series.length - 1))} cy={py(last.y)} r={1.9} fill="var(--impact-field)" />
      {/* Drag selection: shaded span between the two chosen points */}
      {interactive && selReady && (
        <g>
          <rect x={selX1} y={2} width={Math.max(selX2 - selX1, 0)} height={height - 4} fill="var(--impact-field)" opacity={0.08} />
          <line x1={selX1} y1={2} x2={selX1} y2={height - 2} stroke="currentColor" className="text-gray-400" strokeWidth={1} strokeDasharray="2 2" />
          <line x1={selX2} y1={2} x2={selX2} y2={height - 2} stroke="currentColor" className="text-gray-400" strokeWidth={1} strokeDasharray="2 2" />
          <circle cx={selX1} cy={py(yLo)} r={2.8} fill="var(--impact-field)" stroke="#fff" strokeWidth={1.25} />
          <circle cx={selX2} cy={py(yHi)} r={2.8} fill="var(--impact-field)" stroke="#fff" strokeWidth={1.25} />
        </g>
      )}
      {/* Hover crosshair (only when not showing a selection) */}
      {interactive && !selReady && hp && (
        <g>
          <line x1={hx} y1={2} x2={hx} y2={height - 2} stroke="currentColor" className="text-gray-400" strokeWidth={1} strokeDasharray="2 2" />
          <circle cx={hx} cy={hy} r={2.8} fill="var(--impact-field)" stroke="#fff" strokeWidth={1.25} />
        </g>
      )}
    </svg>
  )

  if (!interactive) return svg

  const scaleX = (v: number) => `${(v / width) * 100}%`

  return (
    <span className="relative inline-block leading-none">
      {svg}
      {/* Delta readout for a drag selection (takes precedence over hover) */}
      {selReady ? (
        <span
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-center shadow-lg"
          style={{ left: scaleX(selMidX), top: `calc(${(selTopY / height) * 100}% - 6px)` }}
        >
          <span className="block text-[11px] font-semibold leading-tight tabular-nums text-white">
            {fmtDelta(dAbs, unit)}
          </span>
          <span className="block text-[10px] font-medium leading-tight tabular-nums text-gray-200">
            {Number.isFinite(dRel) ? `${dRel > 0 ? '+' : dRel < 0 ? '−' : '±'}${Math.abs(dRel).toFixed(0)}%` : '—'}
          </span>
          <span className="block text-[9px] leading-tight tabular-nums text-gray-400">
            {String(series[lo].x)} → {String(series[hi].x)}
          </span>
        </span>
      ) : (
        hp && (
          <span
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-center shadow-lg"
            style={{ left: scaleX(hx), top: `calc(${(hy / height) * 100}% - 6px)` }}
          >
            <span className="block text-[11px] font-semibold leading-tight tabular-nums text-white">
              {fmt(hp.y, unit)}
            </span>
            <span className="block text-[9px] leading-tight tabular-nums text-gray-300">{String(hp.x)}</span>
          </span>
        )
      )}
    </span>
  )
}

export function GhostChart({ width = 116, height = 34 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="text-gray-400"
      style={{ filter: 'blur(3.5px)', opacity: 0.28 }}
    >
      <ellipse cx={width * 0.42} cy={height * 0.55} rx={width * 0.34} ry={height * 0.26} fill="currentColor" />
      <ellipse cx={width * 0.66} cy={height * 0.42} rx={width * 0.22} ry={height * 0.2} fill="currentColor" />
    </svg>
  )
}
