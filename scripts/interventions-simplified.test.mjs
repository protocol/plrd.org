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

test('index offers one compact methodology band instead of the detailed preview and extra sections', () => {
  const doc = render()
  const band = doc.querySelector('#intervention-method')?.closest('section')
  assert.ok(band, 'methodology band remains accessible by its heading')
  assert.ok(band.classList.contains('bg-gray-100'), 'methodology band has a light-grey background')
  assert.ok(band.classList.contains('py-8'), 'methodology band uses compact vertical spacing')
  assert.equal(band.querySelector('h2').textContent.trim(), 'Observe. Diagnose. Intervene. Repeat.')
  assert.equal(band.querySelectorAll('ol, .method-cycle, .method-cycle-levers').length, 0)
  const links = doc.querySelectorAll('a[href="/interventions-preview-872d1767c376/methodology/"]')
  assert.equal(links.length, 1, 'only one methodology CTA on the index')
  assert.equal(links[0].textContent.trim(), 'Explore how we accelerate fields')
  assert.ok(band.contains(links[0]))
  assert.ok(links[0].classList.contains('rounded-full'), 'CTA is a pill')
  assert.equal(doc.querySelector('#portfolio-map, #intervention-evidence'), null)
  assert.doesNotMatch(doc.body.textContent, /Running a program is only the beginning|Public types here follow the FA2 draft vocabulary|Read the field|Find the constraint|Pull the right lever/)
  assert.equal(doc.querySelector('header a[href="/interventions-preview-872d1767c376/methodology/"]'), null)
})

test('simplified index retains hero, featured content, five-card library, and grouping controls', () => {
  const doc = render()
  assert.equal(doc.querySelector('h1').textContent.trim(), 'Turning bottlenecks into breakthroughs')
  assert.match(doc.body.textContent, /Spotlight/)
  const library = doc.querySelector('#explore-all-interventions').closest('section')
  const grid = library.querySelector('[data-testid="catalogue-grid"]')
  assert.equal(grid.querySelectorAll('[data-intervention-slug]').length, 5)
  assert.equal(grid.children.length, 6)
  for (const tile of grid.children) assert.ok(tile.classList.contains('min-w-0'), 'grid items must shrink below min-content width at 320px')
  for (const tile of grid.querySelectorAll('[data-intervention-slug]')) assert.ok(tile.classList.contains('min-w-0'), 'card links must shrink with grid items')
  const more = grid.querySelector('button')
  assert.equal(more.textContent.trim(), 'See more')
  assert.equal(more.getAttribute('aria-expanded'), 'false')
  assert.equal(more.getAttribute('aria-controls'), 'intervention-library')
  assert.deepEqual([...library.querySelectorAll('[role="group"] button')].map(button => button.textContent.trim()), ['Intervention type', 'Focus area', 'Status'])
  assert.match(library.textContent, /Draft proposals are not approved commitments/)
})
