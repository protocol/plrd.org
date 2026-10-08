import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

const catalog = source('lib/interventions.ts')
const base = catalog.INTERVENTIONS_BASE_PATH

test('methodology stays at the obscure preview prefix; the catalogue routes are gone', () => {
  assert.match(base || '', /^\/interventions-preview-[a-f0-9]{12}$/)
  assert.equal(catalog.methodologyHref(), base + '/methodology/')
  assert.ok(!existsSync(new URL('../src/app/interventions/page.tsx', import.meta.url)))
  assert.ok(!existsSync(new URL('../src/app/api/interventions/route.ts', import.meta.url)))
  assert.ok(!existsSync(new URL('../src/app' + base + '/page.tsx', import.meta.url)), 'catalogue index is removed')
  assert.ok(!existsSync(new URL('../src/app' + base + '/data/route.ts', import.meta.url)), 'catalogue JSON endpoint is removed')
  assert.ok(!existsSync(new URL('../src/app' + base + '/[slug]/page.tsx', import.meta.url)), 'program pages are removed')
  assert.ok(existsSync(new URL('../src/app' + base + '/methodology/page.tsx', import.meta.url)))
})

test('About us dropdown includes Methodology and nothing else promotes the catalogue', () => {
  const { mainNav, footerNav } = source('lib/site-config.ts')
  const about = mainNav.find(item => item.name === 'About us')
  assert.deepEqual(about.children.map(item => item.name), ['About us', 'Methodology', 'Protocol Labs'])
  assert.equal(about.children.find(item => item.name === 'Methodology').url, base + '/methodology/')
  assert.ok(![...mainNav, ...footerNav].some(item => /intervention/i.test(item.name)))
  assert.ok(!footerNav.some(item => item.url.includes('/interventions')))
  const footer = readFileSync(new URL('../src/components/SiteFooter.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(footer, /href="\/interventions\//)
  const sitemap = source('app/sitemap.ts').default()
  assert.ok(!sitemap.some(item => /\/interventions/.test(item.url)))
  const index = JSON.parse(readFileSync(new URL('../public/search-index.json', import.meta.url), 'utf8'))
  assert.ok(!index.some(item => /\/interventions/.test(item.relpermalink)))
  const Area = source('components/FocusAreaInterventions.tsx').default
  assert.equal(renderToStaticMarkup(React.createElement(Area, { area: 'neurotech' })), '')
  const Hero = source('components/AreaHeroActions.tsx').default
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Hero, { areaSlug: 'neurotech', showOpportunitySpaces: true, opportunityHref: '#opportunity-spaces' })), />Interventions</)
})

test('methodology inherits explicit noindex and retired catalogue URLs redirect to it', () => {
  const { metadata } = source('app' + base + '/layout.tsx')
  assert.deepEqual(metadata.robots, { index: false, follow: false, googleBot: { index: false, follow: false } })
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8')
  assert.match(config, /previewConfig\.basePath/)
  assert.match(config, /X-Robots-Tag/)
  assert.match(config, /The interventions catalogue is retired/)
  assert.match(config, /destination: methodology/)
  assert.match(config, /'neuroai-fellows'/)
  const catalogueBlock = config.slice(config.indexOf('The interventions catalogue is retired'), config.indexOf('Preserve shared preview links'))
  assert.doesNotMatch(catalogueBlock, /:slug/)
})
