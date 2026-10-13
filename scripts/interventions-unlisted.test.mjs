import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

const catalog = source('lib/interventions.ts')
const base = catalog.INTERVENTIONS_BASE_PATH
const methodology = catalog.METHODOLOGY_PATH

test('methodology stays public; the interventions overview is the unlisted catalogue page', () => {
  assert.equal(methodology, '/methodology/')
  assert.equal(catalog.methodologyHref(), '/methodology/')
  assert.equal(catalog.catalogHref(), `${base}/`)
  assert.match(base || '', /^\/interventions-preview-[a-f0-9]{12}$/)
  assert.ok(!existsSync(new URL('../src/app/interventions/page.tsx', import.meta.url)))
  assert.ok(!existsSync(new URL('../src/app/api/interventions/route.ts', import.meta.url)))
  assert.ok(existsSync(new URL(`../src/app${base}/page.tsx`, import.meta.url)), 'unlisted overview page exists')
  assert.ok(existsSync(new URL('../src/app/methodology/page.tsx', import.meta.url)))
  const overview = readFileSync(new URL(`../src/app${base}/page.tsx`, import.meta.url), 'utf8')
  assert.match(overview, /index: false/)
  const index = renderToStaticMarkup(React.createElement(source('components/InterventionsIndex.tsx').default))
  assert.match(index, /Turning bottlenecks into breakthroughs/)
  assert.match(index, /href="\/methodology\/"/)
  assert.doesNotMatch(index, new RegExp(`href="${base}/methodology/`))
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

test('the public methodology page is indexable and only the nested methodology URL redirects to it', () => {
  const { metadata } = source('app/impact-preview-eb61fba1b98e/page.tsx')
  assert.equal(metadata.robots, undefined, 'the shared page is now public; the old preview route redirects')
  assert.equal(metadata.alternates.canonical, '/methodology/')
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8')
  assert.match(config, /const methodology = '\/methodology\/'/)
  assert.match(config, /X-Robots-Tag/)
  assert.match(config, /destination: methodology/)
  const catalogueBlock = config.slice(config.indexOf('The methodology page is public'), config.indexOf('Preserve shared preview links'))
  assert.match(catalogueBlock, /basePath}\/methodology/)
  assert.doesNotMatch(catalogueBlock, /destination: methodology,\s*\n\s*permanent: false/)
  assert.doesNotMatch(catalogueBlock, /'neuroai-fellows'/)
})

test('the homepage teases the methodology page under the four focus areas', () => {
  const home = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8')
  const focus = home.indexOf('id="focus-areas"')
  const band = home.slice(focus)
  const tease = band.indexOf('How we build fields')
  const steps = band.indexOf('FIELD_LOOP_STEPS')
  const cta = band.indexOf('Learn about our methodology')
  const news = band.indexOf('Latest from PL R&amp;D')
  assert.ok(focus >= 0 && tease > 0 && steps > tease && cta > steps && news > cta, 'one label, then the steps, then the link, under the four focus areas and above the news')
  assert.doesNotMatch(home.slice(0, focus), /How we build fields/)
  assert.doesNotMatch(band, /Explore how we build fields/)
  assert.doesNotMatch(band, />\s*Methodology\s*</)
  assert.doesNotMatch(home, /Read the methodology/)
})
