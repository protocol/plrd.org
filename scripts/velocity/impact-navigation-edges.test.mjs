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
const Dashboard = source('components/ImpactDashboardV2.tsx').default
const Measuring = source('components/MeasuringQuestionsV2.tsx').default
const tasks = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0)) }
const click = async node => { assert.ok(node); await act(async () => { node.click(); await tasks() }) }
const mount = async () => {
  const root = createRoot(document.getElementById('app'))
  await act(async () => root.render(React.createElement(React.Fragment, null, React.createElement(Dashboard), React.createElement(Measuring))))
  return async () => { await act(() => root.unmount()); window.history.replaceState(null, '', base) }
}

test('unknown and malformed fragments fail closed across every family and keep router state', async () => {
  const state = { __NA: true, tree: ['exact'], custom: 'keep' }
  const hashes = ['#intervention/missing', '#intervention/__proto__', '#intervention/culture/extra', '#intervention/%63ulture', '#definition/%E0%A4%A', '#definition/constructor', '#definition/performance_curves/', '#inflection/nope/ip-the-bci-app-store', '#inflection/neurotech/%E0%A4%A', '#inflection/neurotech/ip-the-bci-app-store/extra', '#inflection/digital-human-rights/ip-the-bci-app-store', '#fv/neurotech/unknown/nope']
  const unmount = await mount()
  try {
    for (const hash of hashes) {
      await act(() => { window.history.replaceState(state, '', `${base}${hash}`); window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')) })
      assert.ok(!document.querySelector('[role="dialog"]'), hash)
      assert.equal(window.location.hash, hash)
      assert.deepEqual(window.history.state, state)
    }
  } finally { await unmount() }
})

test('all methodology triggers push once, Direct link does not push, repeated close waits for one Back', async () => {
  const unmount = await mount()
  const back = window.history.back.bind(window.history)
  try {
    for (const trigger of document.querySelectorAll('[data-impact-trigger]')) {
      const length = window.history.length
      await click(trigger)
      assert.equal(window.location.hash, trigger.dataset.impactTrigger)
      // Forward history may be discarded, so compare the second click, not the
      // absolute length after creating an entry following a traversal.
      const opened = window.history.length
      assert.ok(opened <= length + 1)
      await click(trigger)
      await click(document.querySelector('[data-impact-direct]'))
      assert.equal(window.history.length, opened)
      let traversals = 0
      window.history.back = () => { traversals++ }
      await click(document.querySelector('[aria-label="Close"]'))
      await click(document.querySelector('[aria-label="Close"]'))
      assert.equal(traversals, 1)
      assert.ok(document.querySelector('[role="dialog"]'), 'input boundary retained while Back is pending')
      window.history.back = back
      await act(async () => { back(); await tasks() })
      assert.ok(!document.querySelector('[role="dialog"]'))
      assert.equal(window.location.href, base)
    }
  } finally { window.history.back = back; await unmount() }
})

test('section links deliberately scroll, persist focus area in copied hrefs, and restore it on history', async () => {
  window.history.replaceState({ __NA: true }, '', `${base}#fv/neurotech`)
  const unmount = await mount()
  try {
    const section = document.getElementById('observed-velocity')
    let scrolls = 0
    section.scrollIntoView = () => { scrolls++ }
    const anchor = section.querySelector('h3 a')
    assert.equal(new URL(anchor.href).searchParams.get('area'), 'neurotech')
    await click(anchor)
    assert.equal(scrolls, 1)
    assert.equal(window.location.hash, '#observed-velocity')
    const before = window.location.href
    assert.match(document.querySelector('[role="tab"][aria-selected="true"]').textContent, /Neurotech/)
    await click([...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.includes('AI & Robotics')))
    await act(async () => { window.history.back(); await tasks() })
    assert.equal(window.location.href, before)
    assert.match(document.querySelector('[role="tab"][aria-selected="true"]').textContent, /Neurotech/)
  } finally { await unmount() }
})
