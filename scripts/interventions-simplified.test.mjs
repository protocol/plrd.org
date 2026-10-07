import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

// Match next.config.ts when rendering Next Link outside the Next compiler.
process.env.__NEXT_TRAILING_SLASH = 'true'
const Index = source('components/InterventionsIndex.tsx').default
const render = () => new JSDOM(renderToStaticMarkup(React.createElement(Index))).window.document

test('compact serif hero includes the measurement loop and its only methodology CTA', () => {
  const doc = render()
  const hero = doc.querySelector('header')
  const headline = hero.querySelector('h1')
  assert.ok(headline.classList.contains('font-serif'))
  assert.ok(headline.classList.contains('text-[32px]'), 'mobile headline is 32px')
  assert.ok(headline.classList.contains('md:text-[44px]'), 'desktop headline is 44px')
  assert.doesNotMatch(headline.className, /(?:lg:)?text-\[(?:68|76)px\]/)
  assert.ok(hero.classList.contains('pt-8'), 'hero starts closer to the breadcrumb')
  assert.doesNotMatch(hero.className, /pt-14|pt-20|pb-24/)
  const subheading = headline.nextElementSibling
  assert.equal(subheading.textContent.replace(/\s+/g, ' ').trim(), 'Observe. Diagnose. Intervene. Repeat. We observe each field’s velocity, diagnose its bottlenecks, deploy interventions, and measure whether they worked—then repeat.')
  assert.doesNotMatch(subheading.className, /(?:^|\s)(?:md:)?text-(?:lg|xl)(?:\s|$)/, 'custom oversized type tokens do not suit a subheading')
  const links = doc.querySelectorAll('a[href="/interventions-preview-872d1767c376/methodology/"]')
  assert.equal(links.length, 1)
  const arrow = links[0].querySelector('[aria-hidden="true"]')
  assert.equal(arrow?.textContent, '→', 'CTA has the reference right arrow, hidden from screen readers')
  const accessibleLabel = links[0].cloneNode(true)
  accessibleLabel.querySelector('[aria-hidden="true"]').remove()
  assert.equal(accessibleLabel.textContent.trim(), 'Explore how we accelerate fields')
  for (const token of ['bg-blue', 'text-white', 'gap-2', 'hover:bg-blue/90', 'focus-visible:outline-blue']) {
    assert.ok(links[0].classList.contains(token), `CTA keeps ${token}`)
  }
  assert.ok(!links[0].classList.contains('bg-black'))
  assert.ok(hero.contains(links[0]), 'CTA is inside the hero')
  assert.ok(subheading.compareDocumentPosition(links[0]) & 4, 'CTA follows the subheading')
  assert.ok(links[0].classList.contains('rounded-full'))
  assert.equal(doc.querySelector('#intervention-method, #portfolio-map, #intervention-evidence'), null, 'no separate methodology band or removed sections')
})

test('only Live status pills use a gentle green treatment', () => {
  const Tag = source('components/InterventionStatusTag.tsx').default
  const { publishedInterventions } = source('lib/interventions.ts')
  const item = publishedInterventions()[0]
  for (const stage of ['active', 'raising', 'proposed', 'completed', 'published']) {
    const doc = new JSDOM(renderToStaticMarkup(React.createElement(Tag, { item: { ...item, stage } }))).window.document
    const tag = doc.querySelector('[data-intervention-status]')
    const live = stage === 'active'
    assert.ok(tag.classList.contains(live ? 'bg-green-50' : 'bg-gray-100'), `${stage} background`)
    assert.ok(tag.classList.contains(live ? 'text-green-800' : 'text-gray-600'), `${stage} text`)
    assert.ok(!tag.classList.contains(live ? 'bg-gray-100' : 'bg-green-50'), `${stage} has no conflicting background`)
    assert.ok(!tag.classList.contains(live ? 'text-gray-600' : 'text-green-800'), `${stage} has no conflicting text colour`)
    assert.ok(tag.getAttribute('title'), 'status meaning remains available')
  }
})

test('Featured interventions uses the homepage full-width background and contained content', () => {
  const doc = render()
  const featured = doc.querySelector('section[aria-labelledby="featured-interventions"]')
  assert.equal(featured.querySelector('h2').textContent.trim(), 'Featured interventions')
  assert.ok(featured.classList.contains('bg-gray-100'))
  const inner = featured.firstElementChild
  for (const token of ['max-w-6xl', 'mx-auto', 'px-6']) assert.ok(inner.classList.contains(token), token)
  for (let ancestor = featured; ancestor; ancestor = ancestor.parentElement) {
    assert.doesNotMatch(ancestor.className, /max-w-|(?:^|\s)px-|100vw|w-screen|overflow-(?:x-)?hidden/, 'section must reach the viewport without width/overflow tricks')
  }
  const hero = doc.querySelector('header')
  const library = doc.querySelector('section[aria-labelledby="explore-all-interventions"]')
  for (const node of [hero, library]) {
    assert.ok(node.closest('.max-w-6xl.px-6'), 'other page content stays aligned')
  }
})

test('index server render includes all 22 grouped cards and no expansion control', () => {
  const doc = render()
  assert.equal(doc.querySelector('h1').textContent.trim(), 'Turning bottlenecks into breakthroughs')
  const library = doc.querySelector('#explore-all-interventions').closest('section')
  const groups = library.querySelectorAll('[data-catalogue-group]')
  assert.ok(groups.length > 1)
  assert.equal(library.querySelectorAll('[data-intervention-slug]').length, 22)
  for (const tile of library.querySelectorAll('li, [data-intervention-slug]')) {
    assert.ok(tile.classList.contains('min-w-0'), 'cards shrink below min-content width at 320px')
  }
  assert.doesNotMatch(library.textContent, /See more|Show fewer|first look/)
  const controls = [...library.querySelectorAll('[role="group"] button')]
  assert.deepEqual(controls.map(button => button.textContent.trim()), ['Intervention type', 'Focus area', 'Status'])
  assert.equal(controls[0].getAttribute('aria-pressed'), 'true')
})
