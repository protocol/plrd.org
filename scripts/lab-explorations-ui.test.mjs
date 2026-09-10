import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const require = createRequire(import.meta.url)
require.extensions['.css'] = module => {
  module.exports = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }
}
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/lab/explorations/arcade/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const React = await import('react')
const { createRoot } = await import('react-dom/client')
const { act } = React

async function mount(t, file, props = {}) {
  assert.ok(existsSync(`src/components/lab/explorations/${file}.tsx`), `${file} entrance is missing`)
  const Component = source(`components/lab/explorations/${file}.tsx`).default
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => root.render(React.createElement(Component, props)))
  t.after(async () => { await act(async () => root.unmount()); container.remove() })
  return container
}
const click = async element => { assert.ok(element, 'expected interactive control'); await act(async () => element.click()) }
const button = (view, text) => [...view.querySelectorAll('button')].find(el => el.textContent.includes(text))

test('Arcade changes its actual plot and downloads the current settings and result', async t => {
  const view = await mount(t, 'ScienceArcade')
  assert.match(view.textContent, /synthetic|educational/i)
  const originalPath = view.querySelector('[data-automaton-path]').getAttribute('d')
  await click(button(view, '30'))
  assert.notEqual(view.querySelector('[data-automaton-path]').getAttribute('d'), originalPath)
  const seed = view.querySelector('select[name="seed"]')
  await act(async () => { seed.value = 'pair'; seed.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  const boundary = view.querySelector('select[name="boundary"]')
  await act(async () => { boundary.value = 'wrap'; boundary.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  const files = []
  const blobs = []
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  const originalClick = dom.window.HTMLAnchorElement.prototype.click
  URL.createObjectURL = blob => { blobs.push(blob); return 'blob:lab-export' }
  URL.revokeObjectURL = () => {}
  dom.window.HTMLAnchorElement.prototype.click = function () { files.push(this.download) }
  t.after(() => { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; dom.window.HTMLAnchorElement.prototype.click = originalClick })
  await click(button(view, 'Download data'))
  const packet = JSON.parse(await blobs[0].text())
  assert.equal(packet.config.rule, 30)
  assert.equal(packet.config.seed, 'pair')
  assert.equal(packet.config.boundary, 'wrap')
  assert.match(files[0], /rule-30.*\.json$/)
  await click(button(view, 'Download print'))
  assert.ok((await blobs[1].text()).includes(view.querySelector('[data-automaton-path]').getAttribute('d')))
  assert.match(files[1], /\.svg$/)
  assert.equal(view.querySelectorAll('iframe').length, 0)
  assert.ok(view.querySelector('a[href="/lab/"]'))
})

test('Observatory selection updates a shareable route and supports history and list navigation', async t => {
  window.history.replaceState({}, '', '/lab/explorations/observatory/neural-measurements/')
  const view = await mount(t, 'Observatory', { initialQuestion: 'neural-measurements' })
  assert.match(view.querySelector('[data-question-brief]').textContent, /Which neural measurements/)
  assert.match(view.textContent, /not.*live|not.*relationships/i)
  const title = view.querySelector('#brief-title')
  const originalFocus = title.focus.bind(title)
  let focusOptions
  title.focus = options => { focusOptions = options; originalFocus(options) }
  await click(view.querySelector('a[data-question="portable-evaluations"]'))
  assert.ok(!focusOptions?.preventScroll, 'selection must bring an offscreen brief into view on mobile')
  assert.equal(window.location.pathname, '/lab/explorations/observatory/portable-evaluations/')
  assert.match(view.querySelector('[data-question-brief]').textContent, /What changes when a benchmark/)
  assert.equal(view.querySelector('a[data-question="portable-evaluations"]').getAttribute('aria-current'), 'true')
  assert.equal(document.activeElement, view.querySelector('#brief-title'))
  assert.equal(view.querySelector('input[aria-label="Direct link to this brief"]').value, window.location.href)
  await click(button(view, 'List'))
  assert.equal(button(view, 'List').getAttribute('aria-pressed'), 'true')
  assert.equal(view.querySelectorAll('a[data-question]').length, 4)
  await act(async () => {
    window.history.replaceState({}, '', '/lab/explorations/observatory/neural-measurements/')
    window.dispatchEvent(new dom.window.PopStateEvent('popstate'))
  })
  assert.match(view.querySelector('[data-question-brief]').textContent, /Which neural measurements/)
  const { frontierQuestions } = loadFrontier()
  for (const question of frontierQuestions) {
    await click(view.querySelector(`a[data-question="${question.id}"]`))
    assert.match(view.querySelector('[data-question-brief]').textContent, new RegExp(question.question.replace(/[?]/g, '\\?')))
  }
  assert.ok(view.querySelector('a[href="/lab/collaborate/"]'))
  assert.equal(view.querySelectorAll('iframe').length, 0)
})

function loadFrontier() { return source('components/lab/explorations/lab-explorations.ts') }

test('comparison connects each visitor intent to a distinct entrance and names its tradeoff', async t => {
  const view = await mount(t, 'ExplorationComparison')
  for (const href of ['/lab/', '/lab/explorations/arcade/', '/lab/explorations/observatory/']) {
    assert.ok(view.querySelector(`a[href="${href}"]`), `missing entrance: ${href}`)
  }
  assert.equal(view.querySelectorAll('[data-entrance]').length, 3)
  assert.match(view.textContent, /cold.start/i)
  assert.match(view.textContent, /maintenance|curation/i)
  await click(button(view, 'Make something'))
  assert.match(view.querySelector('[role="status"]').textContent, /Science Arcade/)
  await click(button(view, 'Find a useful question'))
  assert.match(view.querySelector('[role="status"]').textContent, /Observatory/)
  await click(button(view, 'Understand Open Lab'))
  assert.match(view.querySelector('[role="status"]').textContent, /foundation/i)
})

test('Arcade range and row controls update the exported matrix; failed downloads stay honest', async t => {
  const view = await mount(t, 'ScienceArcade')
  const range = view.querySelector('input[name="rule"]')
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(range, '204')
    range.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    range.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
  })
  assert.match(view.querySelector('svg title').textContent, /204/)
  const rows = view.querySelector('select[name="rows"]')
  await act(async () => { rows.value = '120'; rows.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  assert.equal(view.querySelector('svg[role="img"]').getAttribute('viewBox'), '0 0 121 120')
  const { makeAutomatonPrint } = loadFrontier()
  assert.equal(view.querySelector('[data-automaton-path]').getAttribute('d'), makeAutomatonPrint({ rule: 204, width: 121, rows: 120, seed: 'single', boundary: 'fixed' }).path)
  const originalCreate = URL.createObjectURL
  URL.createObjectURL = () => { throw new Error('test-only download failure') }
  t.after(() => { URL.createObjectURL = originalCreate })
  await click(button(view, 'Download print'))
  assert.match(view.querySelector('[role="status"]').textContent, /could not start/i)
  assert.doesNotMatch(view.querySelector('[role="status"]').textContent, /saved|published successfully/i)
})

test('all entrance routes render anonymously; every brief has static params and unknown IDs 404', async t => {
  const diagnostics = []
  const originalError = console.error
  console.error = (...args) => diagnostics.push(args.join(' '))
  t.after(() => { console.error = originalError })
  const { renderToStaticMarkup } = await import('react-dom/server')
  for (const path of ['page.tsx', 'arcade/page.tsx', 'observatory/page.tsx']) {
    const route = source(`app/lab/explorations/${path}`)
    assert.equal(route.metadata.robots.index, false)
    const html = renderToStaticMarkup(React.createElement(route.default))
    const doc = new JSDOM(html).window.document
    assert.equal(doc.querySelectorAll('h1').length, 1)
    assert.equal(doc.querySelectorAll('main').length, 0, 'parent owns the main landmark')
    for (const anchor of doc.querySelectorAll('a[href^="/"]')) {
      assert.ok(new URL(anchor.getAttribute('href'), 'https://example.org').pathname.endsWith('/'))
    }
  }
  const route = source('app/lab/explorations/observatory/[question]/page.tsx')
  assert.deepEqual(route.generateStaticParams(), loadFrontier().frontierQuestions.map(question => ({ question: question.id })))
  for (const question of loadFrontier().frontierQuestions) {
    const params = Promise.resolve({ question: question.id })
    const result = await route.default({ params })
    assert.equal(result.props.initialQuestion, question.id)
    assert.equal((await route.generateMetadata({ params })).description, question.question)
  }
  await assert.rejects(route.default({ params: Promise.resolve({ question: '__proto__' }) }), /NEXT_HTTP_ERROR_FALLBACK;404/)
  assert.deepEqual(diagnostics, [], 'server rendering must not emit React warnings')
})
