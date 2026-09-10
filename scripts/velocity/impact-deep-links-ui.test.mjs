import { test } from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { source } from './test-source-loader.mjs'

const base = 'http://localhost/impact-preview-eb61fba1b98e/?qa=1'
const dom = new JSDOM('<!doctype html><html><body><main id="app"></main></body></html>', { url: base })
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'KeyboardEvent', 'MouseEvent']) globalThis[key] = dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const Measuring = source('components/MeasuringQuestionsV2.tsx').default
const Dashboard = source('components/ImpactDashboardV2.tsx').default
const { INFLECTION_POINTS, FOCUS_AREAS } = source('lib/field-velocity.ts')
const { inflectionSlug } = source('lib/inflection-points.ts')
const tasks = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0)) }
const click = async node => { assert.ok(node, 'click target exists'); await act(async () => { node.click(); await tasks() }) }
const go = async direction => act(async () => { window.history[direction](); await tasks() })
const dialog = () => document.querySelector('[role="dialog"]')
const mount = async (dashboard = false, certs = false) => {
  const root = createRoot(document.getElementById('app'))
  const data = dashboard ? await source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({})) : {}
  await act(async () => root.render(React.createElement(React.Fragment, null,
    dashboard && React.createElement(Dashboard, { ...data, ...(typeof dashboard === 'object' ? dashboard : {}) }),
    React.createElement(Measuring),
    certs && React.createElement(source('components/hypercerts/HypercertsShowcase.tsx').HypercertsShowcase, { certs: source('data/hypercerts.ts').HYPERCERTS }),
  )))
  return async () => { await act(() => root.unmount()); window.history.replaceState(null, '', base) }
}

test('Culture opens a stable URL, preserving page/query/router state and the prior nonmodal URL', async () => {
  const state = { __NA: true, tree: ['keep'], custom: 'unchanged' }
  window.history.replaceState(state, '', `${base}#toolkit`)
  const unmount = await mount()
  try {
    const culture = [...document.querySelectorAll('button')].find(button => button.textContent.startsWith('Culture'))
    const before = { x: window.scrollX, y: window.scrollY }
    await click(culture)
    assert.equal(window.location.href, `${base}#intervention/culture`)
    assert.deepEqual(window.history.state, state)
    assert.equal(dialog().getAttribute('aria-label'), 'Culture')
    assert.equal(document.getElementById('intervention/culture'), null)
    assert.deepEqual({ x: window.scrollX, y: window.scrollY }, before)
    await go('back')
    assert.equal(dialog(), null)
    assert.equal(window.location.href, `${base}#toolkit`)
    await go('forward')
    assert.equal(dialog().getAttribute('aria-label'), 'Culture')
    await click(dialog().querySelector('[aria-label="Close"]'))
    assert.equal(dialog(), null)
    assert.equal(window.location.href, `${base}#toolkit`)
    assert.deepEqual(window.history.state, state)
  } finally { await unmount() }
})

test('every methodology link opens fresh in a portal focus boundary and closes safely at its parent', async () => {
  const { TOOLKIT_V2 } = source('lib/field-velocity.ts')
  const { VELOCITY_INSTRUMENTS, INFLECTION_EXPLAINER } = source('lib/velocity-instruments.ts')
  const entries = [
    ...TOOLKIT_V2.map(entry => ({ hash: `#intervention/${entry.id}`, title: entry.title, parent: '#toolkit' })),
    ...[...VELOCITY_INSTRUMENTS, INFLECTION_EXPLAINER].map(entry => ({ hash: `#definition/${entry.id}`, title: entry.label, parent: '#observed-velocity' })),
  ]
  for (const [index, entry] of entries.entries()) {
    window.history.replaceState({ __NA: true }, '', `${base}&area=neurotech${entry.hash}`)
    const length = window.history.length
    const unmount = await mount()
    try {
      assert.equal(dialog()?.getAttribute('aria-label'), entry.title, entry.hash)
      assert.ok(document.getElementById('app').hasAttribute('inert'), 'background is inert')
      assert.ok(dialog().contains(document.activeElement), 'focus moves inside without scrolling')
      const direct = dialog().querySelector('[data-impact-direct]')
      assert.equal(direct.href, window.location.href)
      const modifiedClick = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })
      // Probe native new-tab semantics without asking jsdom to navigate.
      direct.addEventListener('click', event => { assert.equal(event.defaultPrevented, false); event.preventDefault() }, { once: true })
      await act(() => direct.dispatchEvent(modifiedClick))
      if (index % 3 === 0) await click(dialog().querySelector('[aria-label="Close"]'))
      else if (index % 3 === 1) await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tasks() })
      else await click(dialog().parentElement)
      assert.equal(dialog(), null)
      assert.equal(window.location.href, `${base}&area=neurotech${entry.parent}`)
      assert.equal(window.history.length, length, 'fresh close replaces; never Back out of the page')
      assert.ok(!document.getElementById('app').hasAttribute('inert'))
      assert.equal(document.body.style.overflow, '')
      assert.notEqual(document.activeElement, document.body, 'fresh close returns focus to its trigger')
    } finally { await unmount() }
  }
})

test('Copy link reports both clipboard success and failure truthfully', async () => {
  window.history.replaceState(null, '', `${base}#intervention/culture`)
  const unmount = await mount()
  try {
    let copied
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async text => { copied = text } } })
    await click(dialog().querySelector('[data-impact-copy]'))
    assert.equal(copied, window.location.href)
    assert.equal(dialog().querySelector('[role="status"]').textContent, 'Copied')
    for (const value of [undefined, { writeText: async () => { throw new Error('denied') } }]) {
      Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value })
      await click(dialog().querySelector('[data-impact-copy]'))
      assert.match(dialog().querySelector('[role="status"]').textContent, /Copy failed/)
      assert.equal(dialog().querySelector('[data-impact-direct]').href, window.location.href)
    }
  } finally { await unmount() }
})

test('every inflection opens its area from a fresh namespaced URL with safe close and share controls', async () => {
  const hashes = new Set()
  for (const point of INFLECTION_POINTS) {
    const hash = `#inflection/${point.area}/${inflectionSlug(point)}`
    assert.ok(!hashes.has(hash)); hashes.add(hash)
    window.history.replaceState({ __NA: true }, '', `${base}${hash}`)
    const unmount = await mount(true)
    try {
      assert.equal(dialog()?.getAttribute('aria-label'), point.title, hash)
      const area = FOCUS_AREAS.find(area => area.key === point.area)
      assert.match(document.querySelector('[role="tab"][aria-selected="true"]').textContent, new RegExp(area.label.replaceAll('&', '&')))
      assert.equal(dialog().querySelector('[data-impact-direct]').hash, hash)
      assert.ok(dialog().querySelector('[data-impact-copy]'))
      assert.equal(document.getElementById(hash.slice(1)), null, 'modal hashes never scroll the background')
      assert.ok(dialog().contains(document.activeElement))
      await click(dialog().querySelector('[aria-label="Close"]'))
      assert.equal(dialog(), null)
      assert.equal(window.location.hash, '#inflection-points')
      assert.equal(new URL(window.location.href).searchParams.get('area'), point.area)
      assert.equal(document.activeElement.id, inflectionSlug(point))
    } finally { await unmount() }
  }
})

test('inflection click and history interoperate with definition and chart families without two dialogs', async () => {
  const point = INFLECTION_POINTS.find(point => point.area === 'neurotech')
  window.history.replaceState({ __NA: true }, '', `${base}#fv/neurotech`)
  const unmount = await mount(true)
  const navigate = async hash => act(() => {
    window.history.pushState(window.history.state, '', hash)
    window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'))
  })
  try {
    await click(document.getElementById(inflectionSlug(point)))
    assert.equal(window.location.hash, `#inflection/neurotech/${inflectionSlug(point)}`)
    await go('back')
    assert.equal(dialog(), null)
    await go('forward')
    assert.equal(dialog().getAttribute('aria-label'), point.title)
    for (const hash of ['#definition/performance_curves', '#fv/neurotech/performance_curves/tissue-mapped', '#intervention/culture', `#inflection/neurotech/${inflectionSlug(point)}`, '#toolkit']) {
      await navigate(hash)
      assert.equal(document.querySelectorAll('[role="dialog"]').length, hash === '#toolkit' ? 0 : 1, hash)
      if (dialog()) assert.equal(dialog().querySelector('[data-impact-direct], [data-chart-direct]').hash, hash)
    }
    await go('back')
    assert.equal(dialog().getAttribute('aria-label'), point.title)
    await go('back')
    assert.equal(document.querySelectorAll('[role="dialog"]').length, 1)
    assert.equal(dialog().getAttribute('aria-label'), 'Culture')
    await go('forward')
    assert.equal(document.querySelectorAll('[role="dialog"]').length, 1)
    assert.equal(dialog().getAttribute('aria-label'), point.title)
  } finally { await unmount() }
  assert.equal(document.body.style.overflow, '')
  assert.ok(!document.getElementById('app').hasAttribute('inert'))
})

test('methodology keeps Neuro selected on open, Back/Forward and a fresh shared URL', async () => {
  const unmount = await mount(true)
  let shared
  const selected = () => document.querySelector('[role="tab"][aria-selected="true"]').textContent
  try {
    await click([...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.includes('Neurotech')))
    const prior = window.location.href
    await click(document.querySelector('[data-impact-trigger="#definition/performance_curves"]'))
    shared = window.location.href
    assert.equal(new URL(shared).searchParams.get('area'), 'neurotech')
    assert.match(selected(), /Neurotech/)
    await go('back')
    assert.equal(window.location.href, prior)
    assert.match(selected(), /Neurotech/)
    await go('forward')
    assert.match(selected(), /Neurotech/)
    await click(dialog().querySelector('[aria-label="Close"]'))
    assert.equal(window.location.href, prior)
  } finally { await unmount() }
  window.history.replaceState(null, '', shared)
  const fresh = await mount(true)
  try {
    assert.match(selected(), /Neurotech/)
    await click(dialog().querySelector('[aria-label="Close"]'))
    assert.match(selected(), /Neurotech/)
    assert.equal(window.location.hash, '#observed-velocity')
  } finally { await fresh() }
})

test('main section headings expose real named anchors, with unique scroll targets', async () => {
  const { readFileSync } = await import('node:fs')
  const page = readFileSync('src/app/impact-preview-eb61fba1b98e/page.tsx', 'utf8')
  for (const section of ['field-velocity', 'methodology', 'verified-impact']) {
    assert.ok(page.includes(`id="${section}"`), section)
    assert.ok(page.includes(`<ImpactSectionLink fragment="#${section}">`), `clickable ${section} heading`)
  }
  const unmount = await mount(true)
  try {
    for (const section of ['toolkit', 'observed-velocity', 'inflection-points']) {
      assert.equal(document.querySelectorAll(`[id="${section}"]`).length, 1, section)
      assert.ok(document.querySelector(`a[href$="#${section}"]`), `clickable ${section} heading`)
    }
  } finally { await unmount() }
})

test('existing cert links yield to other fragment families without a lingering overlay or scroll lock', async () => {
  const { mock } = await import('node:test')
  globalThis.ResizeObserver = class { observe() {} disconnect() {} }
  const auth = mock.method(source('lib/atproto.tsx'), 'useAuth', () => ({ session: null }))
  const network = mock.method(source('lib/hypercerts-live.ts'), 'fetchLiveActivity', async () => ({ evidence: [], comments: [] }))
  const cert = source('data/hypercerts.ts').HYPERCERTS[0]
  window.history.replaceState({ __NA: true }, '', `${base}#${cert.rkey}`)
  document.body.style.overflow = 'auto'
  document.body.style.paddingRight = '7px'
  const unmount = await mount(true, true)
  const certOverlay = () => document.querySelector('.fixed .hypercert-on-photo')?.closest('.fixed') ?? null
  const change = async hash => act(() => { window.history.pushState(window.history.state, '', hash); window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')) })
  try {
    assert.ok(certOverlay(), 'existing cert URL still opens')
    assert.equal(document.body.style.overflow, 'hidden')
    await change('#intervention/culture')
    assert.ok(!certOverlay(), 'no fading cert overlay retained above the new dialog')
    assert.equal(dialog().getAttribute('aria-label'), 'Culture')
    assert.equal(document.body.style.overflow, 'hidden')
    await go('back')
    assert.ok(certOverlay())
    assert.equal(dialog(), null)
    assert.equal(document.body.style.overflow, 'hidden')
    await go('forward')
    assert.equal(certOverlay(), null)
    assert.equal(dialog().getAttribute('aria-label'), 'Culture')
    assert.equal(document.body.style.overflow, 'hidden')
    await change('#toolkit')
    assert.equal(dialog(), null)
    assert.equal(certOverlay(), null)
    assert.equal(document.body.style.overflow, 'auto')
    assert.equal(document.body.style.paddingRight, '7px')
    await click(document.querySelector(`[aria-label="Open impact claim: ${cert.title}"]`))
    assert.ok(certOverlay(), 'cert opens by ordinary click from a named section')
    await change('#intervention/culture')
    assert.ok(!certOverlay(), 'clicked cert yields immediately even after a foreign section fragment')
    assert.equal(document.body.style.overflow, 'hidden')
    await change('#toolkit')
    assert.equal(document.body.style.overflow, 'auto')
    assert.equal(document.body.style.paddingRight, '7px')
  } finally {
    await unmount(); network.mock.restore(); auth.mock.restore()
    document.body.style.overflow = ''; document.body.style.paddingRight = ''
  }
})



