import { test } from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { source } from './test-source-loader.mjs'

const dom = new JSDOM('<!doctype html><html><body><main id="app"></main></body></html>', { url: 'http://localhost/areas/?qa=1' })
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'KeyboardEvent', 'MouseEvent']) globalThis[key] = dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const Dashboard = source('components/ImpactDashboardV2.tsx').default
const historyTasks = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0)) }
const click = async node => { assert.ok(node, 'click target exists'); await act(async () => { node.click(); await historyTasks() }) }
const mount = async props => {
  const data = await source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
  const root = createRoot(document.getElementById('app'))
  await act(() => root.render(React.createElement(Dashboard, { ...data, initialArea: 'neurotech', ...props })))
  return async () => { await act(() => root.unmount()); window.history.replaceState(null, '', '/areas/?qa=1') }
}

test('focus-area tabs are horizontal above a normal-width overview', async () => {
  const unmount = await mount()
  try {
    const tabs = document.querySelector('[role="tablist"]')
    assert.equal(tabs.getAttribute('aria-orientation'), 'horizontal')
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/app/globals.css', 'utf8')
    assert.match(css, /\.field-velocity-overview\s*\{ max-width: 72rem; \}/)
    assert.ok(!css.includes('grid-template-columns: 13rem'), 'no reserved left sidebar')
  } finally { await unmount() }
})

test('single covers and two/three-view spreads share the same bounded horizontal card dimensions', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/app/globals.css', 'utf8')
    const rule = selector => css.slice(css.indexOf(`${selector} {`)).split('}')[0]
    assert.match(rule('.chart-deck'), /width: var\(--gallery-card-width\)/)
    assert.match(rule('.chart-fan-card'), /width: var\(--gallery-card-width\)/)
    assert.match(rule('.instrument-preview'), /height: 100%/)
    assert.match(rule('.chart-fan-card'), /height: 100%/)
    assert.match(rule('.chart-deck'), /height: var\(--gallery-card-height\)/)
    for (const [index, group] of ['latency_compression', 'revealed_commitments', 'performance_curves'].entries()) {
      const deck = document.querySelector(`[data-chart-deck="${group}"]`)
      const cover = deck.querySelector('[data-instrument]')
      assert.equal(Number(cover.dataset.viewCount), index + 1)
      await click(cover)
      if (index === 0) {
        assert.equal(deck.querySelector('[data-chart-fan]'), null, 'single views open directly')
        assert.ok(document.querySelector('[role="dialog"]'))
        await click(document.querySelector('[aria-label="Close gallery"]'))
      } else {
        assert.equal(deck.querySelector('[data-chart-fan]').style.getPropertyValue('--fan-count'), String(index + 1))
        assert.equal(deck.parentElement.style.getPropertyValue('--gallery-slots'), String(5 + index))
      }
    }
  } finally { await unmount() }
})

test('multi-view covers visibly retain layered backs at rest while single charts do not', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    for (const cover of document.querySelectorAll('[data-instrument]')) {
      const layers = cover.querySelectorAll('[data-stack-layer]')
      const views = Number(cover.dataset.viewCount)
      assert.equal(layers.length, Math.min(2, Math.max(0, views - 1)))
      for (const layer of layers) assert.equal(layer.getAttribute('aria-hidden'), 'true')
    }
  } finally { await unmount() }
})

test('latency animal-model qualifier appears only on the data face, not chart titles or previews', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    const cover = document.querySelector('[data-instrument="latency_compression"]')
    await click(cover)
    const target = cover.closest('[data-chart-deck]').querySelector('[data-chart-target]')
    assert.doesNotMatch(target.textContent, /Most entries are/)
    assert.ok(target === cover, 'single latency chart opens directly, without another preview')
    const dialog = document.querySelector('[role="dialog"]')
    assert.equal(dialog.querySelector('[data-gallery-item]').dataset.galleryItem, cover.dataset.chartTarget)
    assert.doesNotMatch(dialog.querySelector('h2').textContent, /Most entries are/)
    assert.doesNotMatch(dialog.querySelector('[data-face="chart"]').textContent, /Most entries are/)
    await click(dialog.querySelector('[data-flip-action]'))
    const data = dialog.querySelector('[data-face="data"]')
    assert.equal(data.getAttribute('aria-hidden'), 'false')
    assert.match(data.textContent, /Most entries are nonhuman-primate; the animal model is recorded per entry \(Synchron's pivotal preclinical work was in sheep\)\./)
  } finally { await unmount() }
})

test('opening another deck replaces a pinned or focused fan for every input mode', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  const pointer = async (target, type, relatedTarget = null) => {
    const event = new MouseEvent(type, { bubbles: true, relatedTarget })
    Object.defineProperty(event, 'pointerType', { value: 'mouse' })
    await act(() => target.dispatchEvent(event))
  }
  const openDecks = () => [...document.querySelectorAll('[data-chart-deck][data-expanded="true"]')].map(e => e.dataset.chartDeck)
  try {
    const a = document.querySelector('[data-instrument="performance_curves"]')
    const b = document.querySelector('[data-instrument="revealed_commitments"]')
    await click(a)
    const priorTarget = a.closest('[data-chart-deck]').querySelector('[data-chart-target]')
    await act(() => priorTarget.focus())
    await pointer(a, 'pointerout', document.body)
    await pointer(b, 'pointerover', document.body)
    assert.deepEqual(openDecks(), ['revealed_commitments'], 'hover replaces the previously clicked/pinned fan')
    assert.ok(document.activeElement === a, 'focus safely returns to the prior cover, not its now-inert preview')
    assert.ok(!document.activeElement.closest('[inert], [aria-hidden="true"]'))
    assert.equal(a.closest('[data-chart-deck]').querySelector('[data-chart-fan]').getAttribute('aria-hidden'), 'true')
    await pointer(a, 'pointerout', document.body)
    assert.deepEqual(openDecks(), ['revealed_commitments'], 'a late leave from the old deck cannot close the new deck')
    await act(() => { a.blur(); a.focus() })
    assert.deepEqual(openDecks(), ['performance_curves'], 'keyboard focus replaces the hovered fan')
    await click(b)
    assert.deepEqual(openDecks(), ['revealed_commitments'], 'touch/click replaces the other fan')
  } finally { await unmount() }
})

test('cover expands in place to individually titled real previews; each card opens only itself', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    const deck = document.querySelector('[data-chart-deck="performance_curves"]')
    assert.ok(deck, 'selectable chart deck exists')
    const cover = deck.querySelector('[data-instrument]')
    assert.equal(cover.getAttribute('aria-expanded'), 'false')
    await click(cover)
    assert.equal(document.querySelector('[role="dialog"]'), null, 'tap cover expands, never opens a group sheet')
    assert.equal(cover.getAttribute('aria-expanded'), 'true')
    const cards = [...deck.querySelectorAll('[data-chart-target]')]
    assert.equal(cards.length, 3)
    for (const card of cards) {
      assert.ok(card.querySelector('svg'), 'actual chart preview, not decorative back')
      assert.ok(card.querySelector('[data-preview-title]').textContent.trim())
      await click(card)
      const dialog = document.querySelector('[role="dialog"]')
      assert.equal(deck.dataset.expanded, 'true', 'the selected target remains visible for focus restoration')
      assert.equal(dialog.querySelectorAll('[data-gallery-item]').length, 1)
      assert.equal(dialog.querySelector('[data-gallery-item]').dataset.galleryItem, card.dataset.chartTarget)
      await act(() => dialog.querySelector('[aria-label="Close gallery"]').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
      assert.equal(deck.dataset.expanded, 'true', 'modal pointer interaction must not hide the return target')
      await click(dialog.querySelector('[aria-label="Close gallery"]'))
      assert.ok(document.activeElement === card, 'focus returns to card; got ' + document.activeElement.outerHTML.slice(0, 200))
    }
    assert.equal(document.querySelectorAll('button button, a a').length, 0)
  } finally { await unmount() }
})


test('chart URLs preserve query, open fresh, recover area tabs with Back/Forward and copy the exact link', async () => {
  const unmount = await mount()
  let href
  try {
    await click(document.querySelector('[data-instrument="performance_curves"]'))
    const card = document.querySelector('[data-chart-target="tissue-mapped"]')
    assert.ok(card.getAttribute('href'), 'each preview is a real direct link')
    await click(card)
    href = window.location.href
    assert.equal(window.location.hash, '#fv/neurotech/performance_curves/tissue-mapped')
    assert.equal(window.location.search, '?qa=1')
    const direct = document.querySelector('[data-chart-direct]')
    assert.equal(direct.href, href)
    let copied
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async text => { copied = text } } })
    await click(document.querySelector('[data-chart-copy]'))
    assert.equal(copied, href)
    await act(async () => { window.history.back(); await historyTasks() })
    assert.ok(!document.querySelector('[role="dialog"]'), 'dialog must be closed')
    await act(async () => { window.history.forward(); await historyTasks() })
    assert.equal(document.querySelector('[data-gallery-item]').dataset.galleryItem, 'tissue-mapped')
    await click(document.querySelector('[aria-label="Close gallery"]'))
    await click([...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.includes('AI & Robotics')))
    await act(async () => { window.history.back(); await historyTasks() })
    assert.match(document.querySelector('[role="tab"][aria-selected="true"]').textContent, /Neurotech/)
  } finally { await unmount() }
  window.history.replaceState(null, '', href)
  const unmountFresh = await mount({ initialArea: 'digital-human-rights' })
  try {
    assert.match(document.querySelector('[role="tab"][aria-selected="true"]').textContent, /Neurotech/)
    assert.equal(document.querySelector('[data-gallery-item]').dataset.galleryItem, 'tissue-mapped')
    await click(document.querySelector('[aria-label="Close gallery"]'))
    assert.ok(!document.querySelector('[role="dialog"]'), 'dialog must be closed')
    assert.equal(window.location.hash, '#fv/neurotech')
  } finally { await unmountFresh() }
})



test('pointer traverses the whole fan; focus and Escape work without shifting page layout', async () => {
  const { readFileSync } = await import('node:fs')
  const css = readFileSync('src/app/globals.css', 'utf8')
  assert.match(css, /\.chart-fan\s*\{[^}]*position: absolute/)
  assert.match(css, /\.chart-fan-cards\s*\{[^}]*gap:/, 'gaps belong to the same hover container')
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.chart-fan-card[^}]*transition: none/)
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    const deck = document.querySelector('[data-chart-deck="performance_curves"]')
    const cover = deck.querySelector('[data-instrument]')
    const pointer = async (target, type, relatedTarget = null) => {
      const event = new MouseEvent(type, { bubbles: true, relatedTarget })
      Object.defineProperty(event, 'pointerType', { value: 'mouse' })
      await act(() => target.dispatchEvent(event))
    }
    await pointer(cover, 'pointerover')
    assert.equal(deck.dataset.expanded, 'true', 'mouse-over alone opens the inline fan')
    const fan = deck.querySelector('[data-chart-fan]')
    await pointer(cover, 'pointerout', fan)
    await pointer(fan, 'pointerover', cover)
    assert.equal(deck.dataset.expanded, 'true', 'crossing fan padding/gaps does not collapse')
    const target = deck.querySelector('[data-chart-target]')
    await act(() => target.focus())
    await pointer(fan, 'pointerout', document.body)
    assert.equal(deck.dataset.expanded, 'true', 'keyboard focus retains the fan after pointer leaves')
    await act(() => target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
    assert.equal(deck.dataset.expanded, 'false')
    assert.ok(document.activeElement === cover, 'focus returns to cover; got ' + document.activeElement.outerHTML.slice(0, 200))
    assert.ok(fan.hasAttribute('inert'))
  } finally { await unmount() }
})



test('scrollbar compensation and exact body styles survive chart-to-chart hash replacement and close', async () => {
  document.body.style.overflow = 'auto'
  document.body.style.paddingRight = '7px'
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: window.innerWidth - 15 })
  window.history.replaceState(null, '', '#fv/neurotech/performance_curves/tissue-mapped')
  const unmount = await mount()
  try {
    assert.equal(document.body.style.paddingRight, '22px', 'preserve background width while scrollbar is hidden')
    assert.equal(document.body.style.overflow, 'hidden')
    await act(() => { window.history.replaceState(null, '', '#fv/neurotech/revealed_commitments/bci-implants'); window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')) })
    assert.equal(document.querySelector('[data-gallery-item]').dataset.galleryItem, 'bci-implants')
    assert.equal(document.body.style.paddingRight, '22px', 'do not double compensate when modal identity changes')
    assert.equal(document.body.style.overflow, 'hidden')
    await click(document.querySelector('[aria-label="Close gallery"]'))
    assert.equal(document.body.style.paddingRight, '7px')
    assert.equal(document.body.style.overflow, 'auto')
    assert.equal(document.activeElement.dataset.instrument, 'revealed_commitments', 'fresh URL close focuses the matching cover')
  } finally { await unmount(); delete document.documentElement.clientWidth; document.body.style.paddingRight = '' }
})


test('every available chart has a unique fresh URL; invalid, unavailable and cross-area detail links fail closed', async () => {
  const data = await source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
  const { instrumentGallery } = source('lib/instrument-gallery.ts')
  const { chartHash, parseChartHash } = source('lib/chart-selection.ts')
  const areas = source('lib/field-velocity.ts').FOCUS_AREAS
  const hashes = new Set()
  for (const area of areas) {
    for (const record of data.recordsByArea[area.key]) {
      const { items } = instrumentGallery(record, data.measurementSeriesByArea[area.key], [], data.ideaVintageExamples, area.label)
      for (const item of items.length ? items : [{ id: 'evidence' }]) {
        const hash = chartHash(area.key, record.instrument, item.id)
        assert.ok(!hashes.has(hash)); hashes.add(hash)
        window.history.replaceState(null, '', hash)
        const unmount = await mount()
        try {
          const dialog = document.querySelector('[role="dialog"]')
          assert.ok(dialog, hash)
          assert.equal(dialog.querySelector('[data-gallery-item]')?.dataset.galleryItem, item.id === 'evidence' ? undefined : item.id)
          assert.equal(document.querySelector('[data-chart-direct]').hash, hash)
          assert.ok(document.querySelector('[role="tab"][aria-selected="true"]').textContent.includes(area.label))
          assert.equal(document.getElementById(hash.slice(1)), null, 'no fragment-scroll target')
        } finally { await unmount() }
      }
    }
  }
  for (const hash of ['#fv/neurotech/performance_curves/missing', '#fv/neurotech/markets/primary', '#fv/neurotech/performance_curves/%E0%A4%A', '#fv/nope/performance_curves/primary', '#fv/neurotech/__proto__/primary']) {
    window.history.replaceState(null, '', hash)
    const unmount = await mount()
    try { assert.equal(document.querySelector('[role="dialog"]'), null, hash) } finally { await unmount() }
  }
  const marketId = 'market-https://example.org/forecast/?a=1&b=2#outcome'
  assert.equal(parseChartHash(chartHash('ai-robotics', 'markets', marketId)).itemId, marketId)
  window.history.replaceState(null, '', '#fv/ai-robotics/idea_vintage/primary')
  const unmount = await mount({ fixedArea: 'neurotech' })
  try { assert.ok(!document.querySelector('[role="dialog"]'), 'dialog must be closed') } finally { await unmount() }
})

test('edge spreads stay in the local horizontal viewport instead of positioning a vertical popover', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    const deck = document.querySelector('[data-chart-deck="performance_curves"]')
    const fan = deck.querySelector('[data-chart-fan]')
    const frame = deck.closest('[data-chart-viewport]')
    const before = { x: window.scrollX, y: window.scrollY, overflow: document.body.style.overflow }
    assert.ok(frame)
    deck.getBoundingClientRect = () => ({ left: 900, top: 700, width: 100, height: 304 })
    await click(deck.querySelector('[data-instrument]'))
    for (const property of ['--fan-top', '--fan-left', '--fan-width']) assert.equal(fan.style.getPropertyValue(property), '')
    assert.equal(fan.style.getPropertyValue('--fan-count'), '3')
    assert.deepEqual({ x: window.scrollX, y: window.scrollY, overflow: document.body.style.overflow }, before)
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/app/globals.css', 'utf8')
    assert.match(css, /\.instrument-preview-viewport\s*\{[^}]*overflow-x: auto;[^}]*overflow-y: hidden;/)
  } finally { await unmount() }
})

test('close keeps the modal input boundary until its pending history traversal finishes', async () => {
  const unmount = await mount({ fixedArea: 'neurotech' })
  const back = window.history.back.bind(window.history)
  let release
  try {
    await click(document.querySelector('[data-instrument="performance_curves"]'))
    await click(document.querySelector('[data-chart-target="primary"]'))
    window.history.back = () => { release = back }
    await click(document.querySelector('[aria-label="Close gallery"]'))
    assert.ok(document.querySelector('[role="dialog"]'), 'cannot select another background chart while Back is still pending')
    await act(async () => { release(); await new Promise(resolve => window.addEventListener('popstate', resolve, { once: true })) })
    assert.ok(!document.querySelector('[role="dialog"]'))
  } finally { window.history.back = back; await unmount() }
})

test('opening and closing preserve an existing fragment, Next history state, and scroll-restoration ownership', async () => {
  const state = { __NA: true, tree: ['existing-router-tree'], custom: 'keep-me' }
  window.history.replaceState(state, '', '/areas/?qa=1#existing-context')
  window.history.scrollRestoration = 'auto'
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    assert.equal(window.history.scrollRestoration, 'manual')
    await click(document.querySelector('[data-instrument="performance_curves"]'))
    await click(document.querySelector('[data-chart-target="tissue-mapped"]'))
    assert.deepEqual(window.history.state, state)
    await click(document.querySelector('[aria-label="Close gallery"]'))
    assert.equal(window.location.href, 'http://localhost/areas/?qa=1#existing-context')
    assert.deepEqual(window.history.state, state)
    assert.equal(window.history.scrollRestoration, 'manual')
  } finally { await unmount() }
  assert.equal(window.history.scrollRestoration, 'auto')
})

test('selected chart does not repeat general methodology below the popout', async () => {
  window.history.replaceState(null, '', '#fv/neurotech/idea_vintage/primary')
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    const chart = document.querySelector('[role="dialog"] [data-gallery-item]')
    assert.ok(chart)
    assert.ok(!document.querySelector('.gallery-methodology'), 'repeated methodology footer must be absent')
  } finally { await unmount() }
})

test('minimum-width mobile body does not receive a second scrollbar gutter', async () => {
  const inner = Object.getOwnPropertyDescriptor(window, 'innerWidth')
  const client = Object.getOwnPropertyDescriptor(document.documentElement, 'clientWidth')
  const minimum = document.body.style.minWidth
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 })
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 305 })
  document.body.style.minWidth = '320px'
  const unmount = await mount({ fixedArea: 'neurotech' })
  try {
    await click(document.querySelector('[data-instrument="performance_curves"]'))
    await click(document.querySelector('[data-chart-target="tissue-mapped"]'))
    assert.equal(document.body.style.paddingRight, '', 'body already spans the full viewport at its minimum width')
  } finally {
    await unmount(); document.body.style.minWidth = minimum
    Object.defineProperty(window, 'innerWidth', inner)
    if (client) Object.defineProperty(document.documentElement, 'clientWidth', client)
    else delete document.documentElement.clientWidth
  }
})
