import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { source } from './test-source-loader.mjs'

const dom = new JSDOM('<!doctype html><html><body><main id="app"></main></body></html>', { url: 'http://localhost/impact-preview-eb61fba1b98e/?qa=sideways' })
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'KeyboardEvent', 'MouseEvent']) globalThis[key] = dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const Dashboard = source('components/ImpactDashboardV2.tsx').default
const areas = source('lib/field-velocity.ts').FOCUS_AREAS
const historyTasks = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0)) }
const click = async node => { assert.ok(node, 'click target exists'); await act(async () => { node.click(); await historyTasks() }) }
const pointer = async (target, type, relatedTarget = null, pointerType = 'mouse') => {
  const event = new MouseEvent(type, { bubbles: true, relatedTarget })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  await act(() => target.dispatchEvent(event))
}
const mount = async props => {
  const data = await source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
  const root = createRoot(document.getElementById('app'))
  await act(() => root.render(React.createElement(Dashboard, { ...data, initialArea: 'neurotech', ...props })))
  return async () => { await act(() => root.unmount()); window.history.replaceState(null, '', '/impact-preview-eb61fba1b98e/?qa=sideways') }
}
const css = readFileSync('src/app/globals.css', 'utf8')
const rule = selector => css.slice(css.indexOf(`${selector} {`)).split('}')[0]

test('single-view cards open their exact chart directly and evidence gaps never become dead covers', async () => {
  const unmount = await mount()
  try {
    for (const area of areas) {
      await click([...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.includes(area.label)))
      for (const cover of document.querySelectorAll('[data-instrument]')) {
        if (Number(cover.dataset.viewCount) > 1) continue
        const deck = cover.closest('[data-chart-deck]')
        await pointer(cover, 'pointerover')
        await act(() => cover.focus({ preventScroll: true }))
        assert.equal(deck.dataset.expanded, 'false', 'a single view needs no intermediate fan')
        assert.equal(cover.getAttribute('aria-expanded'), null)
        assert.equal(cover.getAttribute('aria-haspopup'), 'dialog')
        assert.equal(deck.querySelector('[data-chart-fan]'), null)
        const id = cover.dataset.chartTarget ?? 'evidence'
        if (Number(cover.dataset.viewCount) === 1) assert.ok(cover.dataset.chartTarget)
        await click(cover)
        const dialog = document.querySelector('[role="dialog"]')
        assert.ok(dialog, 'one activation opens the chart/status immediately')
        assert.equal(dialog.querySelector('[data-gallery-item]')?.dataset.galleryItem, id === 'evidence' ? undefined : id)
        const hash = `#fv/${area.key}/${cover.dataset.instrument}/${encodeURIComponent(id)}`
        assert.equal(window.location.hash, hash)
        assert.equal(document.querySelector('[data-chart-direct]').href, window.location.href)
        let copied
        Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async value => { copied = value } } })
        await click(document.querySelector('[data-chart-copy]'))
        assert.equal(copied, window.location.href)
        const flip = dialog.querySelector('[data-flip-action]')
        if (flip) {
          await click(flip)
          assert.equal(dialog.querySelector('[data-face="data"]').getAttribute('aria-hidden'), 'false')
          await click(flip)
          assert.equal(dialog.querySelector('[data-face="chart"]').getAttribute('aria-hidden'), 'false')
        }
        await click(dialog.querySelector('[aria-label="Close gallery"]'))
        assert.ok(document.activeElement === cover, 'focus is on the expected visible control')
        assert.equal(deck.dataset.expanded, 'false')
      }
    }
  } finally { await unmount() }
})

test('keyboard focus enters a visible preview, recovers on peer takeover, and returns safely from every modal', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    const a = document.querySelector('[data-chart-deck="performance_curves"]')
    const b = document.querySelector('[data-chart-deck="revealed_commitments"]')
    const aCover = a.querySelector('[data-instrument]')
    const bCover = b.querySelector('[data-instrument]')
    const aTarget = a.querySelector('[data-chart-target]')
    await act(() => aCover.focus())
    assert.ok(document.activeElement === aTarget, 'focus follows the fading cover onto its first real view')
    assert.equal(aCover.tabIndex, -1, 'the transparent cover cannot remain a keyboard stop')
    assert.equal(a.querySelector('[data-chart-fan]').hasAttribute('inert'), false)
    await click(aTarget)
    await click(document.querySelector('[aria-label="Close gallery"]'))
    assert.ok(document.activeElement === aTarget, 'focus is on the expected visible control')
    assert.equal(a.dataset.expanded, 'true')
    await pointer(bCover, 'pointerover', document.body)
    assert.equal(b.dataset.expanded, 'true')
    assert.equal(a.dataset.expanded, 'false')
    assert.ok(document.activeElement === aCover, 'peer takeover rescues focused previews before they become inert')
    assert.equal(aCover.tabIndex, 0)
    await pointer(aCover, 'pointerout', document.body)
    assert.equal(b.dataset.expanded, 'true', 'late events from the old owner do not close the new one')
    await act(() => { aCover.blur(); aCover.focus() })
    assert.ok(document.activeElement === aTarget, 'focus is on the expected visible control')
    assert.equal(b.dataset.expanded, 'false')
    await act(() => aTarget.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
    assert.ok(document.activeElement === aCover, 'Escape restores the visible cover')
    assert.equal(a.dataset.expanded, 'false', 'Escape cannot reopen the cover it focuses')
    await pointer(bCover, 'pointerover', document.body, 'touch')
    assert.equal(b.dataset.expanded, 'false', 'touch hover does not unexpectedly replace the set')
    await click(bCover)
    assert.equal(b.dataset.expanded, 'true', 'tap spreads')
    assert.ok(document.activeElement === b.querySelector('[data-chart-target]'), 'focus is on the expected visible control')
    await pointer(bCover, 'pointerout', document.body, 'touch')
    assert.equal(b.dataset.expanded, 'true', 'tap pins until selection/dismissal')
    await pointer(document.body, 'pointerdown', null, 'touch')
    assert.equal(b.dataset.expanded, 'false')
  } finally { await unmount() }

  window.history.replaceState(null, '', '#fv/neurotech/performance_curves/tissue-mapped')
  const unmountFresh = await mount()
  try {
    await click(document.querySelector('[aria-label="Close gallery"]'))
    const cover = document.querySelector('[data-instrument="performance_curves"]')
    assert.ok(document.activeElement === cover, 'fresh links return to a visible, closed cover')
    assert.equal(cover.closest('[data-chart-deck]').dataset.expanded, 'false')
    await act(() => { cover.blur(); cover.focus() })
    assert.equal(cover.closest('[data-chart-deck]').dataset.expanded, 'true', 'normal keyboard entry still works after fresh-link dismissal')
  } finally { await unmountFresh() }
})

test('right-edge touch spreads reveal only the local viewport on expansion and resize, not modal/history updates', async () => {
  const unmount = await mount({ fixedArea: 'ai-robotics' })
  try {
    const frame = document.querySelector('[data-chart-viewport]')
    assert.ok(frame, 'gallery owns a local horizontal scroll viewport')
    const row = frame.querySelector('.instrument-previews')
    const deck = frame.querySelector('[data-chart-deck="markets"]')
    const cover = deck.querySelector('[data-instrument]')
    assert.ok(Number(cover.dataset.viewCount) > 1)
    const calls = []
    frame.scrollTo = options => { calls.push(options); frame.scrollLeft = options.left }
    Object.defineProperty(frame, 'clientWidth', { configurable: true, value: 320 })
    Object.defineProperty(row, 'offsetLeft', { configurable: true, value: 12 })
    Object.defineProperty(deck, 'offsetLeft', { configurable: true, value: 1056 })
    Object.defineProperty(deck, 'offsetWidth', { configurable: true, value: 240 })
    row.style.columnGap = '24px'
    await pointer(cover, 'pointerover', document.body, 'touch')
    await click(cover)
    assert.deepEqual(calls.at(-1), { left: 1068, behavior: 'instant' }, 'reveal begins with the active card, leaving room to peek at its next sibling')
    assert.equal(frame.scrollLeft, 1068)
    frame.scrollLeft = 1160
    await click(deck.querySelector('[data-chart-target]'))
    await click(document.querySelector('[aria-label="Close gallery"]'))
    assert.equal(frame.scrollLeft, 1160, 'modal/history updates do not undo a user scroll inside the active set')
    Object.defineProperty(frame, 'clientWidth', { configurable: true, value: 800 })
    await act(() => window.dispatchEvent(new dom.window.Event('resize')))
    const count = Number(cover.dataset.viewCount)
    assert.deepEqual(calls.at(-1), { left: 1068, behavior: 'instant' })
    frame.scrollLeft = 0
    await act(() => window.dispatchEvent(new dom.window.Event('resize')))
    assert.equal(frame.scrollLeft, Math.max(0, 1068 + Math.min(count * 264 - 24, 800) - 800), 'desktop reveals the entire set when it fits')
    assert.match(rule('.instrument-preview-viewport'), /overflow-x: auto/)
    assert.match(rule('.instrument-preview-viewport'), /overflow-y: hidden/)
    assert.match(rule('.instrument-preview-viewport'), /max-width: 100%/)
    assert.match(rule('.instrument-previews'), /--gallery-card-width: min\(300px, 78cqw\)/, 'mobile reserves a visible next card instead of stacking')
    assert.match(rule('.chart-deck'), /width: var\(--gallery-card-width\)/)
    assert.match(rule('.chart-fan-card'), /width: var\(--gallery-card-width\)/)
    assert.match(rule('.chart-deck'), /height: var\(--gallery-card-height\)/)
    assert.match(rule('.chart-fan-card'), /height: 100%/)
    assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.chart-deck[^}]*\.chart-fan-card[^}]*transition: none/)
  } finally { await unmount() }
})

test('scrolled dismissal brings the restored cover back into the local viewport without scrolling the page', async () => {
 const unmount = await mount({ fixedArea: 'neurotech' })
 try {
  const frame = document.querySelector('[data-chart-viewport]')
  const deck = document.querySelector('[data-chart-deck="performance_curves"]')
  const cover = deck.querySelector('[data-instrument]')
  const last = deck.querySelector('[data-chart-target="neural-recording-hours"]')
  frame.getBoundingClientRect = () => ({ left: 16, right: 359 })
  cover.getBoundingClientRect = () => ({ left: 29 - frame.scrollLeft, right: 276 - frame.scrollLeft })
  frame.scrollTo = ({ left }) => { frame.scrollLeft = left }
  for (const method of ['Escape', 'close', 'outside']) {
   await act(() => { cover.blur(); cover.focus() })
   frame.scrollLeft = 548
   await act(() => last.focus({ preventScroll: true }))
   if (method === 'Escape') await act(() => last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
   else if (method === 'close') await click(deck.querySelector('[aria-label="Collapse Performance curves previews"]'))
   else await pointer(document.body, 'pointerdown')
   assert.equal(deck.dataset.expanded, 'false')
   assert.equal(document.activeElement, cover)
   assert.equal(frame.scrollLeft, 13, `${method} reveals the focused cover horizontally`)
   assert.equal(window.scrollY, 0, 'the document does not move')
  }
 } finally { await unmount() }
})

test('all four tabs spread real sibling slots horizontally and displace/dim only the neighboring decks', async () => {
  const unmount = await mount()
  try {
    for (const area of areas) {
      await click([...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.includes(area.label)))
      const row = document.querySelector('.instrument-previews')
      const decks = [...row.querySelectorAll('[data-chart-deck]')]
      assert.equal(decks.length, 5)
      for (const [index, deck] of decks.entries()) {
        const cover = deck.querySelector('[data-instrument]')
        const count = Number(cover.dataset.viewCount)
        if (count < 2) continue
        await pointer(cover, 'pointerover', document.body)
        assert.equal(row.dataset.activeGroup, cover.dataset.instrument, 'the shared row owns its active set')
        assert.equal(row.style.getPropertyValue('--gallery-slots'), String(decks.length + count - 1))
        for (const [peerIndex, peer] of decks.entries()) {
          assert.equal(peer.dataset.expanded, String(peer === deck))
          assert.equal(peer.dataset.subdued, String(peer !== deck))
          assert.equal(peer.style.getPropertyValue('--deck-shift'), String(peerIndex > index ? count - 1 : 0))
        }
        const fan = deck.querySelector('[data-chart-fan]')
        assert.equal(fan.style.getPropertyValue('--fan-count'), String(count))
        const targets = [...fan.querySelectorAll('[data-chart-target]')]
        assert.equal(targets.length, count)
        for (const [viewIndex, target] of targets.entries()) {
          assert.equal(target.hidden, false, 'every sibling stays in the horizontal scroll inventory')
          assert.equal(target.style.getPropertyValue('--fan-index'), String(viewIndex))
          assert.ok(target.querySelector('[data-preview-title]').textContent.trim())
          assert.ok(target.getAttribute('href').startsWith(`#fv/${area.key}/${cover.dataset.instrument}/`))
        }
        await pointer(cover, 'pointerout', fan)
        await pointer(fan, 'pointerover', cover)
        assert.equal(deck.dataset.expanded, 'true', 'the fan is one continuous hover region including card gaps')
        await pointer(fan, 'pointerout', document.body)
        assert.equal(row.dataset.activeGroup, undefined)
        assert.equal(row.style.getPropertyValue('--gallery-slots'), '5')
      }
    }
    // jsdom does not lay out CSS: these pin the actual reference motion/geometry
    // contract; browser QA must still measure intermediate positions and overflow.
    assert.match(rule('.chart-deck'), /transform: translateX\(calc\(var\(--deck-shift, 0\) \* var\(--gallery-step\)\)\)/)
    assert.match(rule('.chart-deck[data-expanded="true"] .chart-fan-card'), /transform: translateX\(calc\(var\(--fan-index\) \* var\(--gallery-step\)\)\)/)
    assert.doesNotMatch(rule('.chart-fan-card'), /rotate\(|translateY\(|scale\(/)
    assert.match(rule('.chart-deck[data-subdued="true"]::after'), /pointer-events: none/)
    assert.match(rule('.chart-deck[data-expanded="true"] .chart-fan::after'), /width: 1px/)
    assert.match(rule('.chart-deck[data-expanded="true"] > .instrument-preview'), /pointer-events: none/)
  } finally { await unmount() }
})
