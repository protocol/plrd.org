import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

const file = new URL('../src/data/interventions-active.json', import.meta.url)

test('mixed catalogue describes public sources separately from draft proposals', () => {
  const { publishedInterventions } = source('lib/interventions.ts')
  const items = publishedInterventions()
  const published = items.filter((item) => item.sourceKind === 'public').length
  const draft = items.length - published
  const Overview = source('components/PortfolioOverview.tsx').default
  const Map = source('components/PortfolioMap.tsx').default
  const overview = new JSDOM(renderToStaticMarkup(React.createElement(Overview, { items }))).window.document
  assert.match(overview.querySelector('#portfolio-source-note').textContent, new RegExp(`${published} published-source records and ${draft} draft-source examples`))
  const map = new JSDOM(renderToStaticMarkup(React.createElement(Map, { items }))).window.document
  assert.match(map.body.textContent, /Published records and draft-source examples/)
  assert.match(map.body.textContent, /Draft proposals are not approved commitments/)
})

test('read-only API exposes the same public status and collection as the UI records', async () => {
  const { GET } = source('app/interventions-preview-872d1767c376/data/route.ts')
  const payload = await (await GET()).json()
  const data = JSON.parse(readFileSync(file, 'utf8'))
  assert.equal(payload.count, payload.items.length)
  for (const item of data) {
    const row = payload.items.find(r => r.slug === item.slug)
    assert.deepEqual(row.resources, item.resources, `${item.slug} API resources`)
    assert.equal(row.sourceKind, 'public')
    assert.equal(row.statusLabel, item.stage === 'completed' ? 'Completed' : item.stage === 'published' ? 'Published' : 'Live')
    assert.equal(row.sourceNote, item.sourceNote)
  }
  for (const row of payload.items.filter(r => r.stage === 'proposed')) assert.equal(row.statusLabel, 'Developing')
})

test('source collections and provenance render on both modal and direct detail routes', async () => {
  const Modal = source('components/InterventionModal.tsx').default
  const Details = source('app/interventions-preview-872d1767c376/[slug]/page.tsx').default
  const data = JSON.parse(readFileSync(file, 'utf8'))
  for (const item of data) {
    for (const node of [React.createElement(Modal, { item }), await Details({ params: Promise.resolve({ slug: item.slug }) })]) {
      const doc = new JSDOM(renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: {} }, node))).window.document
      const dialog = doc.querySelector('[role="dialog"]')
      const links = [...dialog.querySelectorAll('[data-intervention-resources] a')]
      assert.deepEqual(links.map(a => a.href), item.resources.map(r => r.href), item.slug)
      assert.deepEqual(links.map(a => a.textContent.trim()), item.resources.map(r => r.title), item.slug)
      assert.match(dialog.textContent, /Published source record/)
      assert.doesNotMatch(dialog.textContent, /Draft-source example|The proposed work|proposed public edition|proposed role/)
      assert.ok(dialog.textContent.includes(item.sourceNote))
    }
  }
})

test('FA0 public records have a complete cross-field area mapping', () => {
  const catalog = source('lib/interventions.ts')
  const area = 'rnd-acceleration'
  assert.ok(catalog.INTERVENTION_AREA_ORDER.includes(area), 'FA0 is not a catalogue area')
  assert.equal(catalog.INTERVENTION_AREA_LABEL[area], 'R&D Acceleration (FA0)')
  assert.ok(catalog.INTERVENTION_AREA_ICON[area])
  assert.ok(catalog.INTERVENTION_AREA_ACCENT[area])
  assert.equal(catalog.INTERVENTION_AREA_HREF[area], '/interventions-preview-872d1767c376/#explore-all-interventions')
})

test('public additions enter the same catalogue selectors that serve UI and API', () => {
  const { publishedInterventions, interventionBySlug } = source('lib/interventions.ts')
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const all = publishedInterventions()
  for (const item of data) {
    assert.deepEqual(interventionBySlug(item.slug), item, `${item.slug} is not in the canonical catalogue`)
    assert.equal(all.filter(r => r.slug === item.slug).length, 1)
  }
})

test('approved active catalogue additions exist as a public-only source edition', () => {
  assert.ok(existsSync(file), 'the approved public additions have not been authored')
  const records = JSON.parse(readFileSync(file, 'utf8'))
  const required = ['juan-benet-neuropodcast', 'bci-roadmap', 'pl-neuro-salon', 'bci-founders-retreat', 'connectomics-workshop', 'ierr-2025', 'dacc-2025']
  assert.deepEqual(records.map(r => r.slug).sort(), required.sort())
  assert.equal(new Set(records.map(r => r.slug)).size, records.length)
  for (const item of records) {
    assert.equal(item.published, true)
    assert.equal(item.sourceKind, 'public')
    for (const key of ['title', 'summary', 'bottleneck', 'work', 'evidence', 'timing', 'plRole', 'sourceNote']) {
      assert.ok(item[key]?.trim(), `${item.slug} missing ${key}`)
    }
    assert.ok(item.resources.length > 0, `${item.slug} needs inspectable public evidence`)
    for (const link of item.resources) {
      assert.ok(link.title.trim())
      const url = new URL(link.href)
      assert.equal(url.protocol, 'https:')
      assert.ok(['www.plneuro.xyz', 'plneuro.xyz', 'www.plrd.org', 'www.researchretreat.org', 'researchretreat.org', 'lu.ma', 'luma.com'].includes(url.hostname), `unreviewed source host ${url.hostname}`)
      assert.ok(!url.search, 'no tracking or signed source queries')
    }
  }
  assert.equal(records.find(r => r.slug === 'ierr-2025').area, 'rnd-acceleration')
  for (const slug of ['pl-neuro-salon', 'bci-founders-retreat', 'connectomics-workshop', 'ierr-2025', 'dacc-2025']) {
    assert.equal(records.find(r => r.slug === slug).stage, 'completed', `${slug} must not be called Live`)
  }
  assert.equal(records.find(r => r.slug === 'bci-roadmap').stage, 'active')
  const podcast = records.find(r => r.slug === 'juan-benet-neuropodcast')
  assert.equal(podcast.stage, 'published', 'published episodes alone do not establish ongoing production')
  assert.equal(podcast.timing, 'Published collection')
  assert.match(records.find(r => r.slug === 'dacc-2025').work, /was designed for residents to prototype/)
  assert.match(records.find(r => r.slug === 'ierr-2025').work, /retreat focused on/)
  const body = JSON.stringify(records)
  assert.doesNotMatch(body, /docs\.google|plrd-interventions|commsconsole|@protocol\.ai|\$[\d,]+|did:plc:|api[_-]?key|bearer/i)
})

test('podcast collection includes every known published guest exactly once', () => {
  assert.ok(existsSync(file), 'approved podcast collection is absent')
  const podcast = JSON.parse(readFileSync(file, 'utf8')).find(r => r.slug === 'juan-benet-neuropodcast')
  for (const guest of ['Allison Duettmann', 'Konrad Kording', 'Tom Oxley', 'Ben Rapoport', 'Jacques Carolan', 'Max Hodak', 'Adam Marblestone']) {
    assert.equal(podcast.resources.filter(r => r.title.includes(guest)).length, 1, guest)
  }
  assert.equal(new Set(podcast.resources.map(r => r.href)).size, podcast.resources.length)
})

test('BCI Roadmap includes overview and editions 1–3 exactly once', () => {
  assert.ok(existsSync(file), 'approved roadmap collection is absent')
  const roadmap = JSON.parse(readFileSync(file, 'utf8')).find(r => r.slug === 'bci-roadmap')
  assert.equal(roadmap.resources.length, 4)
  for (const token of ['overview', 'roadmap-1-', 'roadmap-2-', 'roadmap-3-']) {
    assert.equal(roadmap.resources.filter(r => r.href.includes(token)).length, 1)
  }
})
