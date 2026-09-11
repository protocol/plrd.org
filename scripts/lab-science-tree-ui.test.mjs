import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
require.extensions['.css'] = module => { module.exports = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) } }
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/lab/explorations/observatory/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
const React = await import('react')
const { createRoot } = await import('react-dom/client')
const { act } = React
async function mount(t, url = '/lab/explorations/observatory/', props = {}) {
  window.history.replaceState({}, '', url)
  const Component = source('components/lab/explorations/Observatory.tsx').default
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  await act(async () => root.render(React.createElement(Component, props)))
  t.after(async () => { await act(async () => root.unmount()); container.remove() })
  return container
}
const click = async el => { assert.ok(el, 'expected control'); await act(async () => el.click()) }
const button = (view, text) => [...view.querySelectorAll('button')].find(el => el.textContent === text || el.getAttribute('aria-label') === text)
const input = async (el, value) => { assert.ok(el); await act(async () => {
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(el, value)
  el.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
}) }

test('search and layout survive a shared URL and returning from a result; Escape clears without losing focus', async t => {
  const view = await mount(t, '/lab/explorations/observatory/?node=field%3A19&q=Veterinary&view=list&overlay=plrd')
  const search = view.querySelector('input[type="search"]')
  assert.equal(search.value, 'Veterinary', 'shared URL must restore whole-snapshot search')
  assert.equal(view.querySelector('input[type="checkbox"]').checked, true)
  assert.equal(button(view, 'List').getAttribute('aria-pressed'), 'true')
  const before = window.location.href
  await click(view.querySelector('[data-science-node="field:34"]'))
  assert.equal(search.value, '')
  assert.equal(new URLSearchParams(window.location.search).get('view'), 'list', 'branch navigation must retain layout in its URL')
  assert.equal(new URLSearchParams(window.location.search).get('overlay'), 'plrd')
  await act(async () => {
    window.history.replaceState({}, '', before)
    window.dispatchEvent(new dom.window.PopStateEvent('popstate'))
  })
  assert.equal(search.value, 'Veterinary')
  assert.ok(view.querySelector('[data-science-node="field:34"]'))
  await act(async () => {
    search.focus()
    search.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  assert.equal(search.value, '')
  assert.equal(document.activeElement.tagName, 'INPUT')
  assert.equal(new URLSearchParams(window.location.search).has('q'), false)
  await input(search, 'Oceanography')
  assert.equal(new URLSearchParams(window.location.search).get('q'), 'Oceanography')
})

test('a legacy deep link lands keyboard focus on its contextual brief rather than burying it below the atlas', async t => {
  const view = await mount(t, '/lab/explorations/observatory/neural-measurements/', { initialQuestion: 'neural-measurements' })
  assert.equal(document.activeElement.id, 'brief-title', 'legacy route must focus its contextual brief on arrival')
  assert.match(view.querySelector('#brief-title').textContent, /Which neural measurements/)
})

test('route metadata describes the broad atlas, and every scoped style resolves with readable surfaces', async () => {
  const route = source('app/lab/explorations/observatory/page.tsx')
  assert.match(route.metadata.description, /OpenAlex/, 'route metadata still advertises the narrow computing frontier')
  assert.equal(route.metadata.robots.index, false)
  const { readFileSync } = await import('node:fs')
  const postcss = (await import('postcss')).default
  const css = postcss.parse(readFileSync('src/components/lab/explorations/science-tree.module.css', 'utf8'))
  const selectors = new Set()
  css.walkRules(rule => { for (const match of rule.selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) selectors.add(match[1]) })
  for (const file of ['Observatory', 'ScienceBranchGraph']) for (const match of readFileSync(`src/components/lab/explorations/${file}.tsx`, 'utf8').matchAll(/(?<![-\w])tree\.([a-zA-Z][\w]*)/g)) assert.ok(selectors.has(match[1]), `undefined scoped class ${match[1]}`)
  const rules = selector => { const declarations = {}; css.walkRules(selector, rule => rule.walkDecls(d => { declarations[d.prop] = d.value })); return declarations }
  assert.equal(rules('.scienceTree')['color-scheme'], 'light')
  assert.equal(rules(':global(.dark) .scienceTree')['color-scheme'], 'dark')
  assert.equal(rules('.scienceTree h1')['font-size'], '22px')
  assert.equal(rules('.scienceTree h2')['font-size'], '17px')
  assert.equal(rules('.scienceTree button')['min-height'], '44px')
  assert.equal(rules('.graphViewport').overflow, 'auto')
  assert.ok(css.nodes.some(n => n.type === 'atrule' && n.params.includes('prefers-reduced-motion')))
})

test('a selected branch has an explicit Up control and search accurately announces its list layout', async t => {
  const view = await mount(t, '/lab/explorations/observatory/?node=field%3A19')
  const up = view.querySelector('a[aria-label="Up one level"]')
  assert.ok(up, 'explicit back-to-parent control is missing')
  await click(up)
  assert.equal(new URLSearchParams(window.location.search).get('node'), 'domain:3')
  await click(button(view, 'Map'))
  await input(view.querySelector('input[type="search"]'), 'Oceanography')
  assert.equal(button(view, 'List').getAttribute('aria-pressed'), 'true')
  assert.equal(button(view, 'Map').getAttribute('aria-pressed'), 'false')
  assert.equal(button(view, 'Map').disabled, true)
  await click(button(view, 'Clear search'))
  assert.equal(button(view, 'Map').disabled, false)
})

test('PL R&D highlights are an optional overlay; legacy briefs retain exact source-linked routes', async t => {
  const view = await mount(t)
  const ids = () => [...view.querySelectorAll('[data-science-node]')].map(n => n.dataset.scienceNode)
  const before = ids()
  assert.equal(view.querySelectorAll('[data-pl-overlay]').length, 0)
  await click(view.querySelector('input[type="checkbox"]'))
  assert.ok(view.querySelectorAll('[data-pl-overlay]').length > 0, 'overlay must highlight related branches, not only open a text disclaimer')
  assert.deepEqual(ids(), before, 'overlay never removes non-PL science')
  await click(view.querySelector('[data-question="neural-measurements"]'))
  assert.equal(window.location.pathname, '/lab/explorations/observatory/neural-measurements/')
  assert.equal(new URLSearchParams(window.location.search).has('node'), false)
  assert.equal(view.querySelector('#science-branch-title').textContent, 'Neuroscience')
  assert.match(view.querySelector('[data-question-brief]').textContent, /Which neural measurements are actually comparable/)
  assert.equal(document.activeElement.id, 'brief-title')
  assert.ok(view.querySelector('[data-question-brief] a[href="https://github.com/lksbrssr/neuro-atlas"]'))
  assert.equal(view.querySelector('input[aria-label="Direct link to this brief"]').value, window.location.href)
})

test('invalid deep links fail visibly without rewriting any storage; modifier links stay native', async t => {
  window.localStorage.setItem('openlab.synthetic.unrelated', '{corrupt')
  const before = [...Array(window.localStorage.length)].map((_, i) => [window.localStorage.key(i), window.localStorage.getItem(window.localStorage.key(i))])
  const view = await mount(t, '/lab/explorations/observatory/?node=__proto__')
  assert.match(view.textContent, /This branch is not in this snapshot/)
  assert.equal(view.querySelector('#science-branch-title').textContent, 'All sciences')
  const anchor = view.querySelector('[data-science-node="domain:3"]')
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })
  await act(async () => anchor.dispatchEvent(event))
  assert.equal(event.defaultPrevented, false)
  assert.equal(window.location.search, '?node=__proto__')
  await click(anchor)
  assert.doesNotMatch(view.textContent, /This branch is not in this snapshot/)
  const after = [...Array(window.localStorage.length)].map((_, i) => [window.localStorage.key(i), window.localStorage.getItem(window.localStorage.key(i))])
  assert.deepEqual(after, before)
})

test('map navigation has real bounded zoom, pan, reset, keyboard controls and a mobile list alternative', async t => {
  const view = await mount(t)
  await click(button(view, 'Map'))
  const viewport = view.querySelector('[aria-label="Science branch map"]')
  assert.ok(viewport, 'an interactive branch map is missing')
  assert.equal(viewport.getAttribute('tabindex'), '0')
  assert.equal(view.querySelectorAll('[data-containment-edge]').length, 4)
  assert.ok(view.querySelectorAll('[data-science-node]').length <= 8)
  const scene = view.querySelector('[data-science-scene]')
  const original = scene.style.transform
  await click(button(view, 'Zoom in'))
  assert.notEqual(scene.style.transform, original)
  await click(button(view, 'Pan right'))
  assert.ok(viewport.scrollLeft > 0)
  await act(async () => viewport.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
  assert.ok(viewport.scrollTop > 0)
  await click(button(view, 'Reset view'))
  assert.equal(scene.style.transform, original)
  assert.equal(viewport.scrollLeft, 0)
  assert.equal(viewport.scrollTop, 0)
  for (let i = 0; i < 20; i++) await click(button(view, 'Zoom in'))
  assert.equal(button(view, 'Zoom in').disabled, true)
  await click(button(view, 'List'))
  assert.equal(view.querySelector('[data-science-scene]'), null)
  assert.equal(view.querySelectorAll('[data-science-node]').length, 4)
})

test('a researcher drills the complete hierarchy and returns through breadcrumbs and browser history', async t => {
  const view = await mount(t)
  assert.ok(view.querySelector('[data-science-node="domain:3"]'), 'broad science branches are missing')
  for (const id of ['domain:3', 'field:19', 'subfield:1908']) {
    await click(view.querySelector(`[data-science-node="${id}"]`))
    assert.equal(new URLSearchParams(window.location.search).get('node'), id)
    assert.equal(view.querySelector('#science-branch-title').textContent, source('lib/lab-science-tree.ts').getScienceNode(id).label)
    assert.equal(document.activeElement, view.querySelector('#science-branch-title'))
  }
  await click(button(view, 'List'))
  // Global search crosses the current branch; exact names rank first.
  await input(view.querySelector('input[type="search"]'), 'Geological and Geochemical Analysis')
  await click(view.querySelector('[data-science-node="topic:T10001"]'))
  assert.match(view.querySelector('[data-science-detail]').textContent, /tectonic evolution/i)
  assert.ok(view.querySelector('a[href="https://openalex.org/T10001"]'))
  assert.equal(view.querySelector('[aria-label="Science breadcrumb"]').querySelectorAll('a').length, 4)
  assert.equal(view.querySelector('input[aria-label="Direct link to this branch"]').value, 'https://example.org/lab/explorations/observatory/?node=topic%3AT10001')
  assert.equal(view.querySelector('input[aria-label="Link to this view"]').value, window.location.href)
  await click(view.querySelector('[aria-label="Science breadcrumb"] a'))
  assert.equal(view.querySelector('#science-branch-title').textContent, 'All sciences')
  await act(async () => {
    window.history.replaceState({}, '', '/lab/explorations/observatory/?node=topic%3AT10001')
    window.dispatchEvent(new dom.window.PopStateEvent('popstate'))
  })
  assert.match(view.querySelector('[data-science-detail]').textContent, /Geological and Geochemical Analysis/)
  assert.equal(view.querySelectorAll('iframe, canvas').length, 0)
})

test('search spans non-PL fields, gives an honest empty state, and leaves source attribution inspectable', async t => {
  const view = await mount(t)
  await input(view.querySelector('input[type="search"]'), 'Veterinary')
  assert.ok(view.querySelector('[data-science-node="field:34"]'))
  assert.match(view.textContent, /whole snapshot/i)
  await input(view.querySelector('input[type="search"]'), 'no-such-field-zzzz')
  assert.match(view.textContent, /No matches/)
  await click(button(view, 'Clear search'))
  assert.ok(view.querySelector('[data-science-node="domain:1"]'))
  assert.match(view.textContent, /4,516 topics/)
  assert.match(view.textContent, /not an exhaustive ontology/i)
  assert.match(view.textContent, /machine.generated/i)
  assert.ok(view.querySelector('a[href="https://help.openalex.org/data/topics/"]'))
  assert.match(view.textContent, /CC0/)
})
