import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

const render = (Component, props = {}) => new JSDOM(renderToStaticMarkup(React.createElement(Component, props))).window.document
const { featuredInterventions, publishedInterventions } = source('lib/interventions.ts')

test('featured cards render the selected text-free covers above unchanged program titles and real status', () => {
  const doc = render(source('components/FeaturedInterventions.tsx').default)
  const cards = [...doc.querySelectorAll('a')]
  const items = featuredInterventions()
  assert.equal(cards.length, items.length)
  for (const [index, card] of cards.entries()) {
    const img = card.querySelector('img')
    assert.ok(img, `missing option C cover for ${items[index].slug}`)
    assert.equal(img.getAttribute('src'), `/images/interventions/${items[index].slug}.webp`)
    assert.equal(img.alt, '', 'illustrative art must not change the linked program accessible name')
    assert.equal(img.width / img.height, 16 / 9)
    assert.ok(card.querySelector('h3').textContent.includes(items[index].title))
    assert.ok(card.textContent.includes('Proposed'))
    assert.ok(img.compareDocumentPosition(card.querySelector('h3')) & 4, 'cover precedes title')
  }
  assert.equal(doc.querySelector('#featured-interventions').textContent.trim(), 'Featured interventions')
  assert.doesNotMatch(doc.body.textContent, /live programmatic/)
})

test('compact catalog treatment retains titles, stages, grouping and link targets', () => {
  const items = featuredInterventions()
  const doc = render(source('components/PortfolioMap.tsx').default, { items })
  for (const item of items) {
    const link = [...doc.querySelectorAll('a')].find((a) => a.getAttribute('href').replace(/\/$/, '') === `/interventions/${item.slug}`)
    assert.ok(link)
    const img = link.querySelector('img')
    assert.ok(img, `missing compact cover for ${item.slug}`)
    assert.equal(img.getAttribute('src'), `/images/interventions/${item.slug}-thumb.webp`)
    assert.equal(img.width, 320)
    assert.equal(img.height, 180)
    assert.equal(img.alt, '')
    assert.ok(link.textContent.includes(item.title))
    assert.ok(link.textContent.includes('Proposed'))
  }
  assert.equal(doc.querySelectorAll('button[aria-pressed]').length, 2)
})

test('program dialog shows the same cover while preserving close control and program details', () => {
  const Modal = source('components/InterventionModal.tsx').default
  const item = featuredInterventions()[0]
  const doc = render(() => React.createElement(AppRouterContext.Provider, { value: { back() {}, push() {} } }, React.createElement(Modal, { item })))
  const dialog = doc.querySelector('[role=dialog]')
  assert.equal(dialog.querySelector('img')?.getAttribute('src'), `/images/interventions/${item.slug}.webp`)
  assert.ok(dialog.querySelector('button[aria-label=Close]'))
  assert.ok(dialog.textContent.includes(item.bottleneck))
  assert.ok(dialog.textContent.includes(item.work))
})

test('every existing program has its own art; unknown or hostile slugs return no asset URL', () => {
  const { interventionArt } = source('lib/intervention-art.ts')
  const Cover = source('components/InterventionCover.tsx').default
  for (const item of publishedInterventions()) {
    const art = interventionArt(item.slug)
    assert.ok(art, `missing illustration mapping: ${item.slug}`)
    assert.equal(art.src, `/images/interventions/${item.slug}.webp`)
  }
  for (const slug of ['future-program', '../bad', 'https://example.com/a', '__proto__', 'constructor', '']) {
    assert.equal(interventionArt(slug), undefined)
    assert.equal(render(Cover, { slug }).querySelectorAll('img').length, 0)
  }
})

test('portfolio summary stays art-free and all cover images reserve size and defer loading', () => {
  const doc = render(source('components/PortfolioOverview.tsx').default, { items: publishedInterventions() })
  assert.equal(doc.querySelectorAll('img').length, 0)
  const Cover = source('components/InterventionCover.tsx').default
  for (const compact of [false, true]) {
    const img = render(Cover, { slug: 'sovereign-ai', compact }).querySelector('img')
    assert.equal(img.getAttribute('loading'), 'lazy')
    assert.equal(img.getAttribute('decoding'), 'async')
    assert.equal(img.width / img.height, 16 / 9)
    assert.equal(img.alt, '')
    if (!compact) assert.ok(img.srcset.includes('320w') && img.srcset.includes('960w'))
  }
})

test('each illustration and thumbnail is checked in, optimized WebP and unique per program', () => {
  const { interventionArt } = source('lib/intervention-art.ts')
  const hashes = new Set()
  for (const item of publishedInterventions()) {
    const art = interventionArt(item.slug)
    for (const [key, budget] of [['src', 120_000], ['thumbnail', 30_000]]) {
      const path = new URL(`../public${art[key]}`, import.meta.url)
      assert.ok(existsSync(path), `missing local asset: ${art[key]}`)
      const bytes = readFileSync(path)
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
      assert.ok(bytes.length < budget, `${art[key]} exceeds its byte budget`)
      const hash = createHash('sha256').update(bytes).digest('hex')
      assert.ok(!hashes.has(hash), `duplicate placeholder asset for ${item.slug}`)
      hashes.add(hash)
    }
  }
})




