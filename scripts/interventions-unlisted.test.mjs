import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

const catalog = source('lib/interventions.ts')
const base = catalog.INTERVENTIONS_BASE_PATH
const methodology = catalog.METHODOLOGY_PATH

test('methodology is a public page; the catalogue routes and cryptic prefix are gone', () => {
  assert.equal(methodology, '/methodology/')
  assert.equal(catalog.methodologyHref(), '/methodology/')
  assert.match(base || '', /^\/interventions-preview-[a-f0-9]{12}$/)
  assert.ok(!existsSync(new URL('../src/app/interventions/page.tsx', import.meta.url)))
  assert.ok(!existsSync(new URL('../src/app/api/interventions/route.ts', import.meta.url)))
  assert.ok(!existsSync(new URL('../src/app' + base, import.meta.url)), 'cryptic preview prefix is removed')
  assert.ok(existsSync(new URL('../src/app/methodology/page.tsx', import.meta.url)))
})

test('About us dropdown includes Methodology and nothing else promotes the catalogue', () => {
  const { mainNav, footerNav } = source('lib/site-config.ts')
  const about = mainNav.find(item => item.name === 'About us')
  assert.deepEqual(about.children.map(item => item.name), ['About us', 'Methodology', 'Protocol Labs'])
  assert.equal(about.children.find(item => item.name === 'Methodology').url, '/methodology/')
  assert.ok(![...mainNav, ...footerNav].some(item => /intervention/i.test(item.name)))
  assert.ok(!footerNav.some(item => item.url.includes('/interventions')))
  const footer = readFileSync(new URL('../src/components/SiteFooter.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(footer, /href="\/interventions\//)
  const sitemap = source('app/sitemap.ts').default()
  assert.ok(sitemap.some(item => item.url.endsWith('/methodology/')))
  assert.ok(!sitemap.some(item => /interventions-preview/.test(item.url)))
  const builder = readFileSync(new URL('../scripts/build-content.mjs', import.meta.url), 'utf8')
  assert.match(builder, /relpermalink: '\/methodology\/'/)
  assert.doesNotMatch(builder, /interventions-preview/)
  const Area = source('components/FocusAreaInterventions.tsx').default
  assert.equal(renderToStaticMarkup(React.createElement(Area, { area: 'neurotech' })), '')
  const Hero = source('components/AreaHeroActions.tsx').default
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Hero, { areaSlug: 'neurotech', showOpportunitySpaces: true, opportunityHref: '#opportunity-spaces' })), />Interventions</)
})

test('the public methodology page is indexable and retired catalogue URLs redirect to it', () => {
  const { metadata } = source('app/impact-preview-eb61fba1b98e/page.tsx')
  assert.equal(metadata.robots, undefined, 'the shared page is now public; the old preview route redirects')
  assert.equal(metadata.alternates.canonical, '/methodology/')
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8')
  assert.match(config, /const methodology = '\/methodology\/'/)
  assert.match(config, /X-Robots-Tag/)
  assert.match(config, /destination: methodology/)
  assert.match(config, /'neuroai-fellows'/)
  const catalogueBlock = config.slice(config.indexOf('The methodology page is public'), config.indexOf('Preserve shared preview links'))
  assert.doesNotMatch(catalogueBlock, /:slug/)
  assert.match(catalogueBlock, /basePath}\/methodology/)
})

test('the homepage teases the methodology page above the four focus areas', () => {
  const home = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8')
  const focus = home.indexOf('id="focus-areas"')
  const band = home.slice(0, focus)
  const tease = band.lastIndexOf('How we build fields')
  const steps = band.lastIndexOf('FIELD_LOOP_STEPS')
  const cta = band.lastIndexOf('Learn about our methodology')
  const news = home.indexOf('Latest from PL R&amp;D')
  assert.ok(tease >= 0 && steps > tease && cta > steps && focus > cta && news > focus, 'one label, then the steps, then the link, above the four focus areas')
  assert.equal(band.slice(0, tease).includes('id="focus-areas"'), false)
  assert.doesNotMatch(band, /Explore how we build fields/)
  assert.doesNotMatch(band, />\s*Methodology\s*</)
  assert.doesNotMatch(home, /Read the methodology/)
})
