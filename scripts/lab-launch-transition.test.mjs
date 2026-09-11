import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const require = createRequire(import.meta.url)
// Only CSS module naming is shimmed; TSX, React, events and DOM are real.
require.extensions['.css'] = module => { module.exports = { cover: 'launch-cover' } }
const componentPath = 'src/components/OpenLabLaunchLink.tsx'
const loadLink = () => {
  assert.ok(existsSync(componentPath), 'the progressively enhanced launch link must exist')
  return source('components/OpenLabLaunchLink.tsx').default
}

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
  url: 'https://plrd.org/',
})
for (const key of ['window', 'document', 'HTMLElement', 'MouseEvent', 'Event']) globalThis[key] = dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
// jsdom cannot load a new document. Spy ONLY at its final navigation boundary:
// the real Location.assign still parses and resolves the component's URL.
const { implForWrapper } = require('jsdom/lib/generated/idl/utils.js')
const { serializeURL } = createRequire(require.resolve('jsdom'))('whatwg-url')
let root, animations, navigations, reducedMotion, motionQuery
beforeEach(() => {
  animations = []
  navigations = []
  reducedMotion = false
  motionQuery = new window.EventTarget()
  Object.defineProperty(motionQuery, 'matches', { get: () => reducedMotion })
  window.matchMedia = () => motionQuery
  window.CSS = { supports: () => true }
  mock.method(implForWrapper(window.location), '_locationObjectNavigate', url => navigations.push(serializeURL(url)))
  // WAAPI/layout are browser-only. Keep the real component/DOM around these seams.
  window.HTMLElement.prototype.animate = function (frames, options) {
    let resolve, reject
    const finished = new Promise((yes, no) => { resolve = yes; reject = no })
    const animation = { element: this, frames, options, finished, resolve, reject, cancelled: 0,
      cancel() { this.cancelled++; reject(new Error('Animation cancelled')) },
    }
    animations.push(animation)
    return animation
  }
  mock.timers.enable({ apis: ['setTimeout'] })
  root = createRoot(document.getElementById('root'))
})
afterEach(async () => {
  await act(() => root.unmount())
  mock.restoreAll()
  mock.timers.reset()
  document.querySelectorAll('.launch-cover, base').forEach(node => node.remove())
})
const mount = async (props = {}) => {
  await act(() => root.render(React.createElement(loadLink(), { href: '/lab/', children: 'Explore the lab →', ...props })))
  const anchor = document.querySelector('#root a')
  anchor.getBoundingClientRect = () => ({ left: 100, top: 200, width: 400, height: 80 })
  return anchor
}
const activate = async (anchor, init = {}, type = 'click') => {
  let intercepted
  // Observe the real React handler, then stop jsdom's unimplemented native load.
  document.addEventListener(type, event => { intercepted = event.defaultPrevented; event.preventDefault() }, { once: true })
  const event = new window.MouseEvent(type, {
    bubbles: true, cancelable: true, button: 0, detail: 1, clientX: 150, clientY: 220, ...init,
  })
  await act(() => anchor.dispatchEvent(event))
  return intercepted
}

test('a primary click covers from its viewport point then navigates to the real href and removes the cover', async () => {
  const anchor = await mount()
  assert.equal(await activate(anchor), true, 'enhancement should own a plain click')
  assert.equal(animations.length, 1)
  const animation = animations[0]
  assert.equal(animation.element.parentElement, document.body)
  assert.equal(animation.element.getAttribute('aria-hidden'), 'true')
  assert.equal(animation.frames[0].clipPath, 'circle(0px at 150px 220px)')
  const radius = Math.ceil(Math.hypot(Math.max(150, window.innerWidth - 150), Math.max(220, window.innerHeight - 220)))
  assert.equal(animation.frames[1].clipPath, `circle(${radius}px at 150px 220px)`)
  assert.equal(animation.options.duration, 220)
  assert.deepEqual(navigations, [])
  await act(async () => animation.resolve())
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
  assert.equal(animation.element.isConnected, false)
  assert.equal(animation.cancelled, 1)
  const css = require('postcss').parse(readFileSync('src/components/OpenLabLaunchLink.module.css', 'utf8'))
  const rule = css.nodes.find(node => node.selector === '.cover')
  const declarations = Object.fromEntries(rule.nodes.map(node => [node.prop, node.value]))
  assert.equal(declarations.position, 'fixed')
  assert.equal(declarations.inset, '0')
  assert.equal(declarations['pointer-events'], 'none')
  assert.equal(declarations['clip-path'], 'circle(0px at 0 0)')
})

test('only ordinary current-tab document activation is enhanced', async () => {
  const cases = [
    [{}, { ctrlKey: true }], [{}, { metaKey: true }], [{}, { shiftKey: true }], [{}, { altKey: true }],
    [{}, { button: 1 }], [{}, { button: 1 }, 'auxclick'], [{}, { button: 2 }, 'auxclick'],
    [{ target: '_blank' }, {}], [{ target: 'workbench' }, {}], [{ target: '_parent' }, {}],
    [{ target: '_top' }, {}], [{ download: '' }, {}],
    [{ href: 'mailto:hello@example.org' }, {}], [{ href: '#focus-areas' }, {}],
    [{ onClick: event => event.preventDefault() }, {}, 'click', true],
  ]
  for (const [props, event, type = 'click', cancelled = false] of cases) {
    const anchor = await mount(props)
    assert.equal(await activate(anchor, event, type), cancelled, JSON.stringify({ props, event, type }))
    assert.equal(animations.length, 0)
    assert.equal(document.querySelector('.launch-cover'), null)
    assert.deepEqual(navigations, [])
  }
  const base = document.createElement('base')
  base.target = '_blank'
  document.head.appendChild(base)
  assert.equal(await activate(await mount()), false, 'honor the document base target too')
  assert.equal(animations.length, 0)
})

test('keyboard and assistive activation originates at the CTA center without stealing focus', async () => {
  const anchor = await mount({ target: '_SELF' })
  anchor.focus()
  assert.equal(await activate(anchor, { detail: 0, clientX: 0, clientY: 0 }), true)
  assert.equal(animations[0].frames[0].clipPath, 'circle(0px at 300px 240px)')
  assert.equal(document.activeElement, anchor)
  await act(async () => animations[0].resolve())
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
})

test('reduced motion leaves native navigation immediate and has a CSS safety net', async () => {
  reducedMotion = true
  assert.equal(await activate(await mount()), false)
  assert.equal(animations.length, 0)
  assert.equal(document.querySelector('.launch-cover'), null)
  assert.deepEqual(navigations, [])
  const css = require('postcss').parse(readFileSync('src/components/OpenLabLaunchLink.module.css', 'utf8'))
  const media = css.nodes.find(node => node.name === 'media' && node.params === '(prefers-reduced-motion: reduce)')
  assert.ok(media)
  assert.equal(media.nodes[0].selector, '.cover')
  assert.ok(media.nodes[0].nodes.some(node => node.prop === 'display' && node.value === 'none'))
})

test('unsupported motion or clip-path APIs never intercept native navigation', async () => {
  const supportedMedia = window.matchMedia
  const supportedCSS = window.CSS
  const supportedAnimate = window.HTMLElement.prototype.animate
  for (const unsupported of [
    () => { window.CSS = { supports: () => false } },
    () => { window.CSS = undefined },
    () => { window.CSS = {} },
    () => { window.CSS = { supports: () => { throw new Error('Unavailable API') } } },
    () => { window.matchMedia = undefined },
    () => { window.HTMLElement.prototype.animate = undefined },
  ]) {
    unsupported()
    assert.equal(await activate(await mount()), false)
    assert.equal(animations.length, 0)
    assert.equal(document.querySelector('.launch-cover'), null)
    assert.deepEqual(navigations, [])
    window.matchMedia = supportedMedia
    window.CSS = supportedCSS
    window.HTMLElement.prototype.animate = supportedAnimate
  }
})

test('a stalled animation is bounded by 320 ms and a late finish cannot navigate twice', async () => {
  await activate(await mount())
  await act(() => mock.timers.tick(319))
  assert.deepEqual(navigations, [])
  assert.ok(animations[0].element.isConnected)
  await act(() => mock.timers.tick(1))
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
  assert.equal(animations[0].element.isConnected, false)
  assert.equal(animations[0].cancelled, 1)
  await act(async () => { animations[0].resolve(); mock.timers.tick(1000) })
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
})

test('repeated plain clicks share one departure while modified clicks remain native', async () => {
  const anchor = await mount()
  await activate(anchor)
  assert.equal(await activate(anchor), true)
  assert.equal(await activate(anchor, { metaKey: true }), false)
  assert.equal(animations.length, 1)
  await act(async () => animations[0].resolve())
  assert.equal(await activate(anchor), true, 'do not issue a second load while the first document load is pending')
  await act(() => mock.timers.tick(1000))
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
  assert.equal(animations.length, 1)
})

test('unmount cancels the pending departure and cannot navigate later', async () => {
  await activate(await mount())
  await act(() => root.render(null))
  assert.equal(animations[0].element.isConnected, false)
  assert.equal(animations[0].cancelled, 1)
  await act(async () => { animations[0].resolve(); mock.timers.tick(1000) })
  assert.deepEqual(navigations, [])
})

test('page lifecycle and history exits cancel the cover and restored pages can launch again', async () => {
  const anchor = await mount()
  for (const type of ['pagehide', 'popstate', 'pageshow']) {
    await activate(anchor)
    const animation = animations.at(-1)
    await act(() => window.dispatchEvent(new window.Event(type)))
    assert.equal(animation.element.isConnected, false, type)
    await act(async () => { animation.resolve(); mock.timers.tick(1000) })
    assert.deepEqual(navigations, [])
  }
  assert.equal(animations.length, 3)
  await activate(anchor)
  await act(async () => animations.at(-1).resolve())
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
})

test('animation setup failure leaves the original click native with no stranded cover', async () => {
  const supportedAnimate = window.HTMLElement.prototype.animate
  const errors = []
  const onError = event => { errors.push(event.error); event.preventDefault() }
  window.addEventListener('error', onError)
  try {
    for (const fail of [
      () => { throw new Error('Fixture setup failure') },
      () => ({ cancel() {} }), // partial implementation without Animation.finished
    ]) {
      window.HTMLElement.prototype.animate = fail
      assert.equal(await activate(await mount()), false)
      assert.equal(document.querySelector('.launch-cover'), null)
      await act(() => mock.timers.tick(1000))
      assert.deepEqual(navigations, [])
    }
    assert.deepEqual(errors, [])
  } finally {
    window.HTMLElement.prototype.animate = supportedAnimate
    window.removeEventListener('error', onError)
  }
  await activate(await mount())
  await act(async () => animations[0].resolve())
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
})

test('a partially broken animation cancel API cannot strand navigation', async () => {
  await activate(await mount())
  animations[0].cancel = () => { throw new Error('Fixture cancellation failure') }
  await act(async () => animations[0].resolve())
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
  assert.equal(animations[0].element.isConnected, false)
  await act(() => mock.timers.tick(1000))
  assert.equal(navigations.length, 1)
})

test('enabling reduced motion during the cover immediately completes the departure', async () => {
  const removeListener = mock.method(motionQuery, 'removeEventListener')
  await activate(await mount())
  reducedMotion = true
  await act(() => motionQuery.dispatchEvent(new window.Event('change')))
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
  assert.equal(animations[0].element.isConnected, false)
  assert.ok(removeListener.mock.calls.some(call => call.arguments[0] === 'change'))
  await act(() => mock.timers.tick(1000))
  assert.equal(navigations.length, 1)
})

test('the exact cross-origin destination uses normal document navigation without View Transitions', async () => {
  assert.equal(document.startViewTransition, undefined)
  const href = 'https://open-lab.example/lab/?entry=public%2Fhome#workbench'
  const anchor = await mount({ href })
  assert.equal(anchor.getAttribute('href'), href)
  assert.equal(await activate(anchor), true)
  await act(async () => animations[0].resolve())
  assert.deepEqual(navigations, [href])
  await act(() => window.dispatchEvent(new window.Event('pageshow')))
  window.CSS.supports = () => false
  assert.equal(await activate(anchor), false, 'unsupported cross-origin case stays native too')
  assert.equal(animations.length, 1)
})

test('a rejected animation completes navigation once instead of leaving a cover', async () => {
  await activate(await mount())
  await act(async () => animations[0].reject(new Error('Fixture asynchronous animation failure')))
  assert.deepEqual(navigations, ['https://plrd.org/lab/'])
  assert.equal(animations[0].element.isConnected, false)
  await act(() => mock.timers.tick(1000))
  assert.equal(navigations.length, 1)
})

test('launching has no theme, storage, scroll-lock or automatic mount effects', async () => {
  const html = document.documentElement
  const previousClass = html.className
  const previousBodyStyle = document.body.getAttribute('style')
  html.classList.add('dark')
  document.body.style.paddingRight = '13px'
  window.localStorage.setItem('theme', 'dark')
  window.sessionStorage.setItem('fixture', 'unchanged')
  const htmlBefore = html.getAttribute('style')
  const bodyBefore = document.body.getAttribute('style')
  try {
    const anchor = await mount()
    await act(() => mock.timers.tick(1000))
    assert.equal(animations.length, 0)
    assert.deepEqual(navigations, [])
    await activate(anchor)
    assert.equal(html.getAttribute('style'), htmlBefore)
    assert.equal(document.body.getAttribute('style'), bodyBefore)
    await act(async () => animations[0].resolve())
    assert.ok(html.classList.contains('dark'))
    assert.equal(html.getAttribute('style'), htmlBefore)
    assert.equal(document.body.getAttribute('style'), bodyBefore)
    assert.equal(window.localStorage.getItem('theme'), 'dark')
    assert.equal(window.localStorage.length, 1)
    assert.equal(window.sessionStorage.getItem('fixture'), 'unchanged')
    assert.equal(window.sessionStorage.length, 1)
    const implementation = readFileSync(componentPath, 'utf8')
    assert.doesNotMatch(implementation, /next\/(?:navigation|link)|localStorage|sessionStorage|startViewTransition|lab-auth|lab-identity|scrollTo/)
    const css = require('postcss').parse(readFileSync('src/components/OpenLabLaunchLink.module.css', 'utf8'))
    css.walkRules(rule => assert.equal(rule.selector, '.cover', 'all style rules belong only to the transient cover'))
  } finally {
    html.className = previousClass
    if (previousBodyStyle === null) document.body.removeAttribute('style')
    else document.body.setAttribute('style', previousBodyStyle)
    window.localStorage.clear()
    window.sessionStorage.clear()
  }
})

test('a refused document load clears the cover and leaves the next attempt native', async () => {
  mock.method(implForWrapper(window.location), '_locationObjectNavigate', () => { throw new Error('Fixture refused navigation') })
  const anchor = await mount()
  await activate(anchor)
  await act(async () => animations[0].resolve())
  assert.equal(animations[0].element.isConnected, false)
  assert.equal(await activate(anchor), false, 'a failed load must not leave a permanently inert invitation')
  assert.equal(animations.length, 1)
})

test('server markup is a named native /lab/ anchor without JavaScript or an overlay', () => {
  const Link = loadLink()
  const markup = renderToStaticMarkup(React.createElement(Link, {
    href: '/lab/', className: 'invitation-styles',
    children: React.createElement('span', null, 'Made something that makes science easier?'),
  }))
  const doc = new JSDOM(markup).window.document
  assert.equal(doc.body.children.length, 1)
  const link = doc.querySelector('a')
  assert.ok(link)
  assert.equal(link.getAttribute('href'), '/lab/')
  assert.equal(link.textContent, 'Made something that makes science easier?')
  assert.equal(link.className, 'invitation-styles')
  assert.equal(link.getAttribute('role'), null)
  assert.equal(link.getAttribute('tabindex'), null)
  assert.equal(doc.querySelector('[aria-hidden]'), null)
  const home = readFileSync('src/app/page.tsx', 'utf8')
  assert.match(home, /<OpenLabLaunchLink href="\/lab\/"/)
})
