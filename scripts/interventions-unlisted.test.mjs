import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

const catalog = source('lib/interventions.ts')

test('catalogue lives only at an obscure shareable preview prefix', () => {
  assert.match(catalog.INTERVENTIONS_BASE_PATH || '', /^\/interventions-preview-[a-f0-9]{12}$/)
  assert.equal(catalog.catalogHref(), catalog.INTERVENTIONS_BASE_PATH + '/')
  assert.equal(catalog.publicInterventionHref('bci-roadmap'), catalog.INTERVENTIONS_BASE_PATH + '/bci-roadmap/')
  assert.ok(!existsSync(new URL('../src/app/interventions/page.tsx', import.meta.url)))
  assert.ok(!existsSync(new URL('../src/app/api/interventions/route.ts', import.meta.url)))
  assert.ok(existsSync(new URL('../src/app'+catalog.INTERVENTIONS_BASE_PATH+'/data/route.ts', import.meta.url)))
})

test('preview is absent from navigation search sitemap and focus-area promotion', async () => {
  const { mainNav, footerNav } = source('lib/site-config.ts')
  assert.ok(![...mainNav,...footerNav].some(item => /intervention/i.test(item.name)))
  const footer = readFileSync(new URL('../src/components/SiteFooter.tsx', import.meta.url),'utf8')
  assert.doesNotMatch(footer, /href="\/interventions\//)
  const sitemap = source('app/sitemap.ts').default()
  assert.ok(!sitemap.some(item => /\/interventions/.test(item.url)))
  const index = JSON.parse(readFileSync(new URL('../public/search-index.json', import.meta.url),'utf8'))
  assert.ok(!index.some(item => /\/interventions/.test(item.relpermalink)))
  const Area = source('components/FocusAreaInterventions.tsx').default
  assert.equal(renderToStaticMarkup(React.createElement(Area, { area: 'neurotech' })), '')
  const Hero = source('components/AreaHeroActions.tsx').default
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Hero, {areaSlug:'neurotech',showOpportunitySpaces:true,opportunityHref:'#opportunity-spaces'})), />Interventions</)
})

test('all preview pages inherit explicit noindex and nofollow including Googlebot', () => {
  assert.ok(catalog.INTERVENTIONS_BASE_PATH, 'preview path absent')
  const { metadata } = source('app'+catalog.INTERVENTIONS_BASE_PATH+'/layout.tsx')
  assert.deepEqual(metadata.robots, {index:false,follow:false,googleBot:{index:false,follow:false}})
  const config = readFileSync(new URL('../next.config.ts', import.meta.url),'utf8')
  assert.match(config, /previewConfig.basePath/)
  assert.match(config, /X-Robots-Tag/)
  const api = source('app'+catalog.INTERVENTIONS_BASE_PATH+'/data/route.ts')
  assert.equal(typeof api.GET, 'function')
})
