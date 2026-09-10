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
const historyTasks = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0)) }

test('commitments keeps two selectable views, but only the cohort view is a chart', async () => {
  const data = await load()
  const unmount = await mount({ ...data, fixedArea: 'neurotech' })
  try {
    const cover = document.querySelector('[data-instrument="revealed_commitments"]')
    assert.equal(cover.dataset.viewCount, '2')
    assert.equal(cover.dataset.chartCount, '1')
    const target = await open(cover)
    const dialog = document.querySelector('[role="dialog"]')
    assert.equal(dialog.querySelectorAll('[data-gallery-item]').length, 1)
    const reading = dialog.querySelector('[data-gallery-item="reading"]')
    assert.equal(reading.dataset.isChart, 'false')
    assert.ok(reading.textContent.includes('67 participants'))
    const sourceNote = data.recordsByArea.neurotech.find(r => r.instrument === 'revealed_commitments').trend
    assert.ok(!reading.querySelector('[data-face="chart"]').textContent.includes(sourceNote))
    assert.ok(reading.querySelector('[data-face="data"]').textContent.includes(sourceNote))
    await click(dialog.querySelector('[aria-label="Close gallery"]'))
    assert.ok(document.activeElement === target, 'focus returns to selected target')
    await click(cover.closest('[data-chart-deck]').querySelector('[data-chart-target="bci-implants"]'))
    assert.equal(document.querySelector('[data-gallery-item]').dataset.isChart, 'true')
  } finally { await unmount() }
})

test('wide gallery plots fill the card and position hover details in scaled coordinates', async () => {
  const css = readFileSync(new URL('../../src/app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.gallery-plot > span\s*\{[^}]*width:\s*100%/)
  const data = await load()
  const unmount = await mount({ ...data, fixedArea: 'ai-robotics' })
  try {
    await open(document.querySelector('[data-instrument="markets"]'))
    const svg = document.querySelector('.gallery-plot svg')
    assert.ok(svg.closest('.gallery-plot').nextElementSibling.classList.contains('gallery-plot-axis'), 'endpoint labels share the plot’s bounded frame')
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 720, height: 320 })
    await act(() => svg.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 300 })))
    const tooltip = svg.parentElement.querySelector('span[style]')
    assert.ok(tooltip, 'hover details are present')
    assert.match(tooltip.style.top, /^calc\([^)]*%/, 'vertical position scales with the rendered SVG instead of staying in source pixels')
  } finally { await unmount() }
})
const load = () => source('lib/field-velocity-data.ts').loadFieldVelocity(async () => ({}))
const click = async node => { assert.ok(node, 'click target exists'); await act(async () => { node.click(); await historyTasks() }) }
const open = async cover => {
  await click(cover)
  const target = cover.closest('[data-chart-deck]').querySelector('[data-chart-target]:not([hidden])')
  if (target) await click(target)
  return target ?? cover
}
const mount = async props => {
  const root = createRoot(document.getElementById('app'))
  await act(() => root.render(React.createElement(Dashboard, props)))
  return async () => { await act(() => root.unmount()); window.history.replaceState(null, '', '/') }
}

test('all four overview tabs and Neuro detail select every real view once with exact measurement attribution', async () => {
  const data = await load()
  for (const fixedArea of ['neurotech', undefined]) {
    const unmount = await mount({ ...data, fixedArea, initialArea: 'neurotech' })
    try {
      for (const area of fixedArea ? ['neurotech'] : ['neurotech', 'ai-robotics', 'economies-governance', 'digital-human-rights']) {
        if (!fixedArea) {
          const label = source('lib/field-velocity.ts').FOCUS_AREAS.find(a => a.key === area).label
          await click([...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.includes(label)))
        }
        assert.equal(document.querySelectorAll('[data-measurement]').length, 0)
        const covers = [...document.querySelectorAll('button[data-instrument]')]
        assert.equal(covers.length, 5)
        for (const cover of covers) {
          const deck = cover.closest('[data-chart-deck]')
          const targets = [...deck.querySelectorAll('[data-chart-target]')]
          assert.equal(targets.length, Number(cover.dataset.viewCount))
          let chartCount = 0
          const seen = new Set()
          if (targets.length) await click(cover)
          for (const target of targets.length ? targets : [cover]) {
            await click(target)
            const dialog = document.querySelector('[role="dialog"]')
            assert.ok(dialog)
            assert.equal(dialog.querySelectorAll('[data-gallery-item]').length, targets.length ? 1 : 0)
            const item = dialog.querySelector('[data-gallery-item]')
            if (item) { assert.equal(item.dataset.galleryItem, target.dataset.chartTarget); seen.add(item.dataset.galleryItem); chartCount += Number(item.dataset.isChart === 'true') }
            for (const node of dialog.querySelectorAll('[data-measurement]')) {
              const measure = data.measurementSeriesByArea[area].find(s => s.id === node.dataset.measurement)
              assert.equal(measure.instrument, cover.dataset.instrument)
              assert.ok(node.textContent.includes(measure.coverage))
              assert.ok(node.textContent.includes(measure.caveat))
              for (const point of measure.tracks.flatMap(t => t.points)) assert.ok([...node.closest('[data-gallery-item]').querySelectorAll('a')].some(a => a.href === point.sourceUrl))
            }
            await click(dialog.querySelector('[aria-label="Close gallery"]'))
            assert.ok(document.activeElement === target, 'focus returns to selected target')
            assert.ok(!document.querySelector('[role="dialog"]'), 'dialog must be closed')
          }
          assert.equal(seen.size, targets.length)
          assert.equal(chartCount, Number(cover.dataset.chartCount))
        }
      }
    } finally { await unmount() }
  }
})

test('every instrument popout omits the repeated general Definition & methodology footer', async () => {
  const data = await load()
  for (const fixedArea of ['neurotech', 'ai-robotics', 'economies-governance', 'digital-human-rights', undefined]) {
    const unmount = await mount({ ...data, fixedArea, initialArea: 'neurotech' })
    try {
      for (const trigger of document.querySelectorAll('button[data-instrument]')) {
        await open(trigger)
        const methodology = document.querySelector('[role="dialog"] .gallery-methodology')
        assert.ok(!methodology, 'no duplicated general methodology after the chart')
        await click(document.querySelector('[aria-label="Close gallery"]'))
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
      await click(trigger)
      for (const target of trigger.closest('[data-chart-deck]').querySelectorAll('[data-chart-target]')) {
      await click(target)
      for (const card of document.querySelectorAll('[data-gallery-item]')) {
        const toggle = card.querySelector('button[data-flip-action]')
        assert.ok(toggle, `flip action missing on ${card.dataset.galleryItem}`)
        assert.equal(toggle.textContent, 'Data & sources')
        const front = card.querySelector('[data-face="chart"]')
        const back = card.querySelector('[data-face="data"]')
        assert.equal(back.hidden, false, 'both physical faces stay rendered during rotation')
        assert.equal(back.getAttribute('aria-hidden'), 'true')
        assert.ok(back.hasAttribute('inert'))
        toggle.focus()
        await click(toggle)
        assert.equal(toggle.textContent, card.dataset.galleryItem === 'reading' ? 'Back to reading' : 'Back to chart')
        assert.ok(document.activeElement === toggle, 'stable flip control retains keyboard focus')
        assert.equal(front.hidden, false, 'front remains mounted at the back of the rotating card')
        assert.equal(card.querySelector('.gallery-card-rotator').dataset.flipped, 'true')
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
        assert.equal(back.hidden, false, 'both physical faces stay rendered during rotation')
        assert.equal(card.querySelector('.gallery-card-rotator').dataset.flipped, 'false')
      }
      await click(document.querySelector('[aria-label="Close gallery"]'))
      }
    }
  } finally { await unmount() }
})


test('performance measurement dots reveal project, value, date and context on hover and keyboard focus', async () => {
  const data = await load()
  const unmount = await mount({ ...data, fixedArea: 'neurotech' })
  try {
    await click(document.querySelector('[data-instrument="performance_curves"]'))
    for (const measure of data.measurementSeriesByArea.neurotech.filter(m => m.instrument === 'performance_curves')) {
      await click(document.querySelector(`[data-chart-target="${measure.id}"]`))
      const article = document.querySelector(`[data-measurement="${measure.id}"]`)
      assert.equal(article.querySelectorAll('figcaption button').length, 0, 'legend cannot hide evidence')
      const links = [...article.querySelectorAll('svg a')]
      const entries = measure.tracks.flatMap(track => track.points.map(point => ({ track, point })))
      assert.equal(links.length, entries.length)
      // A stationary pointer must not steal details from keyboard navigation.
      await act(() => links[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true })))
      await act(() => links[1].focus())
      let activeTip = article.querySelector('[role="tooltip"]')
      assert.equal(links[1].getAttribute('aria-describedby'), activeTip.id, 'focused point owns the tooltip despite another hovered point')
      assert.equal(links[0].getAttribute('aria-describedby'), null)
      assert.ok(activeTip.textContent.includes(entries[1].point.label))
      await act(() => links[1].blur())
      activeTip = article.querySelector('[role="tooltip"]')
      assert.equal(links[0].getAttribute('aria-describedby'), activeTip.id, 'blur restores the stationary hover')
      await act(() => links[0].dispatchEvent(new MouseEvent('mouseout', { bubbles: true })))
      for (const [index, link] of links.entries()) {
        const { track, point } = entries[index]
        await act(() => link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })))
        let tip = article.querySelector('[role="tooltip"]')
        assert.ok(tip, 'immediate HTML tooltip, not only native SVG title')
        for (const value of [point.label, track.label, track.definition, measure.unit, point.date.slice(0, 4), point.dateBasis]) assert.ok(tip.textContent.includes(value), value)
        assert.ok(!tip.textContent.includes(measure.coverage), 'coverage is already visible above the chart; do not repeat it in the tooltip')
        assert.ok(article.textContent.includes(measure.coverage), 'coverage stays on the chart face')
        assert.ok(tip.textContent.includes(point.value.toLocaleString('en-US', { maximumSignificantDigits: 15 })))
        await act(() => link.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })))
        assert.equal(article.querySelector('[role="tooltip"]'), null)
        await act(() => link.focus())
        tip = article.querySelector('[role="tooltip"]')
        assert.ok(tip, 'keyboard focus shows the same details')
        assert.equal(link.getAttribute('aria-describedby'), tip.id)
        assert.equal(link.getAttribute('href'), point.sourceUrl)
        await act(() => link.blur())
        assert.equal(article.querySelector('[role="tooltip"]'), null)
      }
      await click(document.querySelector('[aria-label="Close gallery"]'))
    }
  } finally { await unmount() }
})

test('idea vintage is scoped to the current detail area or selected overview tab', async () => {
  const data = await load()
  const { FOCUS_AREAS } = source('lib/field-velocity.ts')
  for (const fixedArea of ['neurotech', undefined]) {
    const unmount = await mount({ ...data, fixedArea, initialArea: 'neurotech' })
    try {
      for (const area of fixedArea ? FOCUS_AREAS.filter(a => a.key === fixedArea) : FOCUS_AREAS) {
        if (!fixedArea) await click([...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.includes(area.label)))
        const trigger = document.querySelector('[data-instrument="idea_vintage"]')
        assert.equal(trigger.dataset.chartCount, '1')
        await open(trigger)
        const dialog = document.querySelector('[role="dialog"]')
        assert.equal(dialog.querySelectorAll('[data-gallery-item]').length, 1)
        assert.ok(dialog.querySelector('[data-face="chart"] h3').textContent.includes(area.label))
        assert.equal(dialog.querySelectorAll('[data-gallery-item^="example-"]').length, 0)
        await click(dialog.querySelector('[aria-label="Close gallery"]'))
      }
    } finally { await unmount() }
  }
})

test('adoption preview uses its real chart without dumping historical prose or a research-only caveat', async () => {
  const data = await load()
  const unmount = await mount({ ...data, fixedArea: 'neurotech' })
  try {
    const trigger = document.querySelector('[data-instrument="revealed_commitments"]')
    assert.ok(trigger.querySelector('[data-measurement-preview="bci-implants"]'), 'chart-backed reading previews an actual measurement when no record series exists')
    assert.ok(!trigger.textContent.includes('The review identified participants'), 'historical prose belongs on the data face/context, not preview')
    await click(trigger)
    await click(trigger.closest('[data-chart-deck]').querySelector('[data-chart-target="bci-implants"]'))
    const dialog = document.querySelector('[role="dialog"]')
    assert.ok(!dialog.textContent.includes('This reads the research side of the field.'), 'implant adoption is not a research-only signal')
    assert.equal(dialog.querySelectorAll('[data-measurement="bci-implants"]').length, 1)
    assert.equal(dialog.querySelectorAll('[data-measurement-details="bci-implants"]').length, 1)
    const front = dialog.querySelector('[data-face="chart"]')
    assert.equal(front.querySelectorAll('table, details').length, 0, 'chart front never exposes source disclosures')
  } finally { await unmount() }
})

test('the thin gallery frame belongs to both rotating faces, not the stationary shell', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  const rule = selector => css.slice(css.indexOf(`${selector} {`)).split('}')[0]
  const shell = rule('.instrument-gallery-item')
  assert.match(shell, /border: 1px solid transparent/, 'retain the existing layout inset without painting a stationary frame')
  assert.doesNotMatch(shell, /background:|overflow: hidden|box-shadow:|outline:/, 'the shell must neither paint a card nor clip its rotating corners')
  const face = rule('.gallery-card-face')
  assert.match(face, /outline: 1px solid color-mix\(in srgb, var\(--color-gray-500\) 24%, transparent\)/, 'each physical face paints the original thin frame without changing its size')
  assert.match(face, /border-radius: \.875rem/)
  assert.match(face, /backface-visibility: hidden/)
  assert.match(rule('.gallery-card-toolbar'), /border-top: 1px solid transparent/, 'the stationary toolbar retains its size but does not leave a frame edge behind')
})

test('gallery styling uses a physical two-faced 3D rotation with reduced-motion support', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  assert.match(css, /\.instrument-gallery-grid\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(css, /\.gallery-card-face\[data-face="chart"\]\s*\{[^}]*position: relative/, 'chart content sizes the card; back stays contained')
  assert.doesNotMatch(css, /height: clamp\(28rem, 62dvh, 38rem\)/)
  assert.match(css, /\.gallery-card-face\s*\{[^}]*overflow-y: auto/)
  assert.doesNotMatch(css, /@keyframes instrument-fan-open/, 'measured spring motion replaces the tiny CSS fade')
  assert.match(css, /\.gallery-card-rotator\s*\{[^}]*transform-style: preserve-3d/)
  assert.match(css, /\.gallery-card-rotator\[data-flipped="true"\]\s*\{[^}]*transform: rotateY\(180deg\)/)
  assert.match(css, /\.gallery-card-face\[data-face="data"\]\s*\{[^}]*transform: rotateY\(180deg\)/)
  assert.match(css, /backface-visibility: hidden/)
  assert.doesNotMatch(css, /@keyframes gallery-card-turn/)
  assert.doesNotMatch(css, /\.gallery-plot svg\s*\{[^}]*max-height:/, 'sparkline pointer geometry must not be letterboxed by a height cap')
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.gallery-card-face[^}]*animation: none/)
})

test('large inventories page at most three titled previews, while every modal stays single-chart', async () => {
  const data = await load()
  const areaPoints = source('lib/field-velocity.ts').INFLECTION_POINTS.filter(p => p.area === 'ai-robotics')
  const marketSignals = Object.fromEntries(areaPoints.slice(0, 2).map((p, i) => [p.title, { prob: 0.4, platform: 'polymarket', question: `Question ${i}?`, resolutionDate: '2027-01-01', url: `https://polymarket.com/${i}` }]))
  const unmount = await mount({ ...data, marketSignals, initialArea: 'ai-robotics' })
  try {
    const deck = document.querySelector('[data-chart-deck="markets"]')
    await click(deck.querySelector('[data-instrument]'))
    assert.equal(deck.querySelectorAll('[data-chart-target]:not([hidden])').length, 3)
    await click([...deck.querySelectorAll('button')].find(button => button.textContent === 'More previews'))
    assert.equal(deck.querySelectorAll('[data-chart-target]:not([hidden])').length, 1)
    const target = deck.querySelector('[data-chart-target]:not([hidden])')
    await click(target)
    assert.equal(document.querySelectorAll('[data-gallery-item]').length, 1)
    assert.equal(document.querySelector('.instrument-gallery-grid').dataset.columns, '1')
    assert.equal(document.querySelector('[data-gallery-item]').dataset.galleryItem, target.dataset.chartTarget)
  } finally { await unmount() }
})

test('gallery traps focus, excludes closed evidence, restores trigger and body styles on every close path', async () => {
  const data = await load()
  document.body.style.overflow = 'auto'
  const unmount = await mount({ ...data, fixedArea: 'neurotech' })
  try {
    for (const closeWith of ['Escape', 'backdrop', 'button']) {
      const trigger = document.querySelector('[data-instrument="performance_curves"]')
      const target = await open(trigger)
      const dialog = document.querySelector('[role="dialog"]')
      const close = dialog.querySelector('[aria-label="Close gallery"]')
      assert.ok(document.activeElement === close, 'initial focus moves into dialog')
      assert.equal(document.body.style.overflow, 'hidden')
      assert.ok(document.getElementById('app').hasAttribute('inert'), 'background cannot be reached')
      const key = async (key, shiftKey = false) => act(async () => { document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })); await historyTasks() })
      await key('Tab', true)
      assert.ok(dialog.contains(document.activeElement), 'reverse Tab wraps inside')
      assert.notEqual(document.activeElement, close)
      assert.ok(document.activeElement.matches('[data-flip-action]'), 'inactive face source links excluded; last stop is the card flip action')
      await key('Tab')
      assert.ok(document.activeElement === close, 'forward Tab wraps to close')
      await act(() => target.focus())
      assert.ok(dialog.contains(document.activeElement), 'programmatic outside focus is contained')
      assert.ok(!dialog.querySelector('.gallery-methodology'), 'no repeated methodology footer')
      if (closeWith === 'Escape') await key('Escape')
      if (closeWith === 'backdrop') await click(document.querySelector('.instrument-gallery-backdrop'))
      if (closeWith === 'button') await click(close)
      assert.ok(!document.querySelector('[role="dialog"]'), 'dialog must be closed')
      assert.ok(document.activeElement === target, 'focus restores to selected chart')
      assert.equal(document.body.style.overflow, 'auto')
      assert.equal(document.getElementById('app').hasAttribute('inert'), false)
    }
  } finally { await unmount() }

})
