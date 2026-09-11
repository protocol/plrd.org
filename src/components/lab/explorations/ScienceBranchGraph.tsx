'use client'

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type KeyboardEvent } from 'react'
import { getScienceChildren, scienceGraphFrame, scienceHref, type ScienceNode } from '@/lib/lab-science-tree'
import tree from '@/components/lab/explorations/science-tree.module.css'

const MIN_ZOOM = .75
const MAX_ZOOM = 1.75

/** A bounded branch, not a 4,799-node force simulation. HTML anchors remain the navigation. */
export default function ScienceBranchGraph({ node, children, onSelect, overlayIds = [] }: {
  node: ScienceNode
  children: ScienceNode[]
  onSelect: (event: MouseEvent<HTMLAnchorElement>, id: string) => void
  overlayIds?: string[]
}) {
  const [zoom, setZoom] = useState(1)
  const viewport = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  const frame = scienceGraphFrame(children.length, viewportWidth)
  const { width: WIDTH, height: HEIGHT } = frame
  const scale = frame.fit * zoom
  const positions = children.map((child, index) => ({ child, ...frame.positions[index] }))
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const measure = () => { if (element.clientWidth > 0) setViewportWidth(element.clientWidth) }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  function pan(x: number, y: number) {
    if (!viewport.current) return
    viewport.current.scrollLeft += x
    viewport.current.scrollTop += y
  }
  function changeZoom(delta: number) { setZoom(value => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round((value + delta) * 100) / 100))) }
  function reset() {
    setZoom(1)
    if (viewport.current) { viewport.current.scrollLeft = 0; viewport.current.scrollTop = 0 }
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    const moves: Record<string, [number, number]> = { ArrowLeft: [-100, 0], ArrowRight: [100, 0], ArrowUp: [0, -100], ArrowDown: [0, 100] }
    if (moves[event.key]) { event.preventDefault(); pan(...moves[event.key]) }
    else if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); changeZoom(event.key === '-' ? -.25 : .25) }
    else if (event.key === 'Home' || event.key === '0') { event.preventDefault(); reset() }
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    // Touch uses the browser's native two-axis scrolling. Never swallow a link activation.
    if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as Element).closest('a, button')) return
    const el = event.currentTarget
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop }
    el.setPointerCapture?.(event.pointerId)
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || start.id !== event.pointerId) return
    event.currentTarget.scrollLeft = start.left + start.x - event.clientX
    event.currentTarget.scrollTop = start.top + start.y - event.clientY
  }
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return <div className={tree.graph}>
    <div className={tree.graphTools} role="group" aria-label="Map controls">
      <div><button type="button" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => changeZoom(-.25)}>−</button><output aria-label="Map zoom">{Math.round(zoom * 100)}%</output><button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => changeZoom(.25)}>+</button><button type="button" onClick={reset}>Reset view</button></div>
      <div><button type="button" aria-label="Pan left" onClick={() => pan(-160, 0)}>←</button><button type="button" aria-label="Pan up" onClick={() => pan(0, -120)}>↑</button><button type="button" aria-label="Pan down" onClick={() => pan(0, 120)}>↓</button><button type="button" aria-label="Pan right" onClick={() => pan(160, 0)}>→</button></div>
    </div>
    <div ref={viewport} className={tree.graphViewport} style={{ height: Math.min(460, HEIGHT * scale + 16) }} role="region" aria-label="Science branch map" aria-describedby="science-map-help" tabIndex={0} onKeyDown={onKeyDown} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null }}>
      <div className={tree.graphExtent} style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
        <div className={tree.graphScene} data-science-scene="" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}>
          <svg width={WIDTH} height={HEIGHT} aria-hidden="true" className={tree.graphEdges}>{positions.map(({ child, x, y }) => <path data-containment-edge="" key={child.id} d={`M${x < 300 ? 300 : 560} ${HEIGHT / 2} C${x < 300 ? 280 : 580} ${HEIGHT / 2} ${x < 300 ? 280 : 580} ${y + 64} ${x < 300 ? x + 250 : x} ${y + 64}`} fill="none" stroke="currentColor" strokeWidth="1.5" />)}</svg>
          <div className={tree.graphParent} style={{ left: 300, top: HEIGHT / 2 - 70 }}><span>{node.kind === 'root' ? 'RESEARCH UNIVERSE' : `CURRENT ${node.kind.toUpperCase()}`}</span><strong>{node.label}</strong><span>{getScienceChildren(node.id).length} direct branches</span></div>
          <ol aria-label="Science branches" className={tree.graphNodes}>{positions.map(({ child, x, y }) => <li key={child.id} style={{ left: x, top: y }}>
            <a data-science-node={child.id} data-pl-overlay={overlayIds.includes(child.id) ? '' : undefined} href={scienceHref(child.id)} onClick={event => onSelect(event, child.id)}>
              <span>{child.kind}{overlayIds.includes(child.id) ? ' · PL R&D context' : ''}</span><strong>{child.label}</strong><span>{child.kind === 'topic' ? 'Inspect topic' : `${getScienceChildren(child.id).length} branches`} <span aria-hidden="true">→</span></span>
            </a>
          </li>)}</ol>
        </div>
      </div>
    </div>
    <p id="science-map-help" className={tree.mapHelp}>Drag the background or scroll to pan. Keyboard: focus the map, use arrows to pan, + / − to zoom, Home to reset. Tab to a branch and Enter to explore. List offers the same branches without panning.</p>
  </div>
}
