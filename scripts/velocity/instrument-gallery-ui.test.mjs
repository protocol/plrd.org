import { test } from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

const dom = new JSDOM('<!doctype html><html><body><main id="app"></main></body></html>', { url: 'http://localhost' })
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'KeyboardEvent', 'MouseEvent']) globalThis[key] = dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const Dashboard = source('components/ImpactDashboardV2.tsx').default
const load = () => source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
const click = async node => { assert.ok(node, 'click target exists'); await act(() => node.click()) }
const mount = async props => {
  const root = createRoot(document.getElementById('app'))
  await act(() => root.render(React.createElement(Dashboard, props)))
  return async () => act(() => root.unmount())
}

test('shared previews open only the selected instrument’s real charts, never inline detailed charts', async () => {
  const data = await load()
  for (const fixedArea of ['neurotech', 'ai-robotics', 'economies-governance', 'digital-human-rights', undefined]) {
    const unmount = await mount({ ...data, fixedArea, initialArea: 'neurotech' })
    try {
      const triggers = [...document.querySelectorAll('button[data-instrument]')]
      assert.equal(triggers.length, 5, 'each instrument has its own accessible trigger')
      assert.equal(document.querySelectorAll('[data-measurement]').length, 0, 'no extra inline measurements')
      assert.equal(document.querySelectorAll('button button').length, 0)
      for (const trigger of triggers) {
        assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog')
        const count = Number(trigger.dataset.chartCount)
        assert.equal(trigger.querySelectorAll('[data-stack-layer]').length, count > 1 ? Math.min(count - 1, 2) : 0)
        await click(trigger)
        const dialog = document.querySelector('[role="dialog"]')
        assert.ok(dialog, 'opens focused gallery')
        assert.ok(document.getElementById(dialog.getAttribute('aria-labelledby'))?.textContent)
        assert.equal(dialog.querySelectorAll('[data-gallery-item][data-is-chart="true"]').length, count)
        for (const node of dialog.querySelectorAll('[data-measurement]')) {
          const measure = data.measurementSeriesByArea[fixedArea ?? 'neurotech'].find(s => s.id === node.dataset.measurement)
          assert.equal(measure.instrument, trigger.dataset.instrument)
          assert.ok(node.textContent.includes(measure.coverage))
          assert.ok(node.textContent.includes(measure.caveat))
          for (const point of measure.tracks.flatMap(t => t.points)) assert.ok([...node.closest('[data-gallery-item]').querySelectorAll('a')].some(a => a.href === point.sourceUrl))
        }
        await click(dialog.querySelector('button[aria-label="Close gallery"]'))
        assert.equal(document.querySelector('[role="dialog"]'), null)
        assert.ok(document.activeElement === trigger, 'even browsers without pointer autofocus return to the clicked metric')
      }
    } finally { await unmount() }
  }
})


test('every gallery kind flips to locally contained data and back with only the active face exposed', async () => {
  const data = await load()
  const records = structuredClone(data.recordsByArea.neurotech)
  const line = [{ x: 2023, y: 1 }, { x: 2024, y: 2 }]
  records.find(r => r.instrument === 'idea_vintage').patentVintage = { state: 'reading', series: line, value: 'Test patent vintage', sources: [{ label: 'Test source', url: 'https://example.org/patents' }] }
  Object.assign(records.find(r => r.instrument === 'markets'), { state: 'reading', series: line, series2: line, series2Label: 'Secondary forecast', sources: [{ label: 'Test source', url: 'https://example.org/forecast' }] })
  const { INFLECTION_POINTS } = source('lib/field-velocity.ts')
  const point = INFLECTION_POINTS.find(p => p.area === 'neurotech')
  const marketSignals = { [point.title]: { prob: 0.4, platform: 'polymarket', question: 'Test question?', resolutionDate: '2027-01-01', url: 'https://polymarket.com/test' } }
  const unmount = await mount({ ...data, marketSignals, recordsByArea: { neurotech: records }, fixedArea: 'neurotech' })
  try {
    for (const trigger of document.querySelectorAll('button[data-instrument]')) {
      trigger.focus()
      await click(trigger)
      for (const card of document.querySelectorAll('[data-gallery-item]')) {
        const toggle = card.querySelector('button[data-flip-action]')
        assert.ok(toggle, `flip action missing on ${card.dataset.galleryItem}`)
        assert.equal(toggle.textContent, 'Data & sources')
        const front = card.querySelector('[data-face="chart"]')
        const back = card.querySelector('[data-face="data"]')
        assert.equal(back.hidden, true)
        assert.equal(back.getAttribute('aria-hidden'), 'true')
        assert.ok(back.hasAttribute('inert'))
        const isolate = front.querySelector('button[aria-label^="Isolate"]')
        if (isolate) { await click(isolate); assert.equal(isolate.getAttribute('aria-pressed'), 'true') }
        toggle.focus()
        await click(toggle)
        assert.equal(toggle.textContent, 'Back to chart')
        assert.ok(document.activeElement === toggle, 'stable flip control retains keyboard focus')
        assert.equal(front.hidden, true)
        assert.equal(front.getAttribute('aria-hidden'), 'true')
        assert.ok(front.hasAttribute('inert'))
        assert.equal(back.hidden, false)
        assert.equal(back.getAttribute('aria-hidden'), 'false')
        assert.ok(back.textContent.trim().length > 0)
        assert.ok(back.querySelector('a[href]'), 'every sourced chart kind exposes evidence links on its back')
        await act(() => toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })))
        assert.equal(document.activeElement.closest('[hidden]'), null, 'focus never enters inactive chart face')
        toggle.focus()
        await click(toggle)
        assert.equal(front.hidden, false)
        assert.equal(back.hidden, true)
        if (isolate) assert.equal(isolate.getAttribute('aria-pressed'), 'true', 'track selection survives flipping')
      }
      await click(document.querySelector('[aria-label="Close gallery"]'))
    }
  } finally { await unmount() }
})

test('adoption preview uses its real chart without dumping historical prose or a research-only caveat', async () => {
  const data = await load()
  const unmount = await mount({ ...data, fixedArea: 'neurotech' })
  try {
    const trigger = document.querySelector('[data-instrument="revealed_commitments"]')
    assert.ok(trigger.querySelector('[data-measurement-preview="bci-implants"]'), 'chart-backed reading previews an actual measurement when no record series exists')
    assert.ok(!trigger.textContent.includes('The review identified participants'), 'historical prose belongs on the data face/context, not preview')
    await click(trigger)
    const dialog = document.querySelector('[role="dialog"]')
    assert.ok(!dialog.textContent.includes('This reads the research side of the field.'), 'implant adoption is not a research-only signal')
    assert.equal(dialog.querySelectorAll('[data-measurement="bci-implants"]').length, 1)
    assert.equal(dialog.querySelectorAll('[data-measurement-details="bci-implants"]').length, 1)
    const front = dialog.querySelector('[data-face="chart"]')
    assert.equal(front.querySelectorAll('table, details').length, 0, 'chart front never exposes source disclosures')
  } finally { await unmount() }
})

test('gallery styling contains scroll, fans into readable columns, and disables motion when requested', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  assert.match(css, /\.instrument-gallery-grid\s*\{[^}]*grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 24rem\), 1fr\)\)/)
  assert.match(css, /\.gallery-card-faces\s*\{[^}]*height:/, 'flip does not resize the card')
  assert.match(css, /\.gallery-card-face\s*\{[^}]*overflow-y: auto/)
  assert.match(css, /@keyframes instrument-fan-open/)
  assert.match(css, /@keyframes gallery-card-turn/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.gallery-card-face[^}]*animation: none/)
})

test('gallery traps focus, excludes closed evidence, restores trigger and body styles on every close path', async () => {
  const data = await load()
  document.body.style.overflow = 'auto'
  const unmount = await mount({ ...data, fixedArea: 'neurotech' })
  try {
    for (const closeWith of ['Escape', 'backdrop', 'button']) {
      const trigger = document.querySelector('[data-instrument="performance_curves"]')
      trigger.focus()
      await click(trigger)
      const dialog = document.querySelector('[role="dialog"]')
      const close = dialog.querySelector('[aria-label="Close gallery"]')
      assert.ok(document.activeElement === close, 'initial focus moves into dialog')
      assert.equal(document.body.style.overflow, 'hidden')
      assert.ok(document.getElementById('app').hasAttribute('inert'), 'background cannot be reached')
      const key = async (key, shiftKey = false) => act(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })))
      await key('Tab', true)
      assert.ok(dialog.contains(document.activeElement), 'reverse Tab wraps inside')
      assert.notEqual(document.activeElement, close)
      assert.ok(document.activeElement.matches('[data-flip-action]'), 'inactive face source links excluded; last stop is the card flip action')
      await key('Tab')
      assert.ok(document.activeElement === close, 'forward Tab wraps to close')
      trigger.focus()
      assert.ok(dialog.contains(document.activeElement), 'programmatic outside focus is contained')
      const definition = [...dialog.querySelectorAll('summary')].find(s => s.textContent === 'Definition & methodology')
      await click(definition)
      assert.equal(definition.parentElement.open, true)
      assert.ok(dialog.textContent.includes(source('lib/velocity-instruments.ts').INSTRUMENT_BY_ID.performance_curves.description))
      if (closeWith === 'Escape') await key('Escape')
      if (closeWith === 'backdrop') await click(document.querySelector('.instrument-gallery-backdrop'))
      if (closeWith === 'button') await click(close)
      assert.equal(document.querySelector('[role="dialog"]'), null)
      assert.ok(document.activeElement === trigger, 'focus restores to original trigger')
      assert.equal(document.body.style.overflow, 'auto')
      assert.equal(document.getElementById('app').hasAttribute('inert'), false)
    }
  } finally { await unmount() }
})

