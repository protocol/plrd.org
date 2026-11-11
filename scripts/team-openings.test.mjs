import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const { default: nextConfig } = source('../next.config.ts')

test('legacy Team index spellings permanently redirect to /team/ without redirecting profiles', async () => {
  const redirects = await nextConfig.redirects()
  for (const path of ['/authors', '/authors/']) {
    const rule = redirects.find(rule => rule.source === path)
    assert.ok(rule, `${path} must retain the old Team index's link equity`)
    assert.equal(rule.destination, '/team/')
    assert.equal(rule.permanent, true)
  }
  assert.ok(!redirects.some(rule => ['/team', '/team/'].includes(rule.source)), 'the real page must not redirect back')
  assert.ok(!redirects.some(rule => rule.source.startsWith('/authors/:')), 'individual profile URLs must remain unchanged')
})

const { default: AuthorsPage, metadata: teamMetadata } = source('app/team/page.tsx')

test('the real Team page declares /team/ as its canonical URL', () => {
  assert.equal(teamMetadata.alternates?.canonical, '/team/')
  assert.equal(teamMetadata.openGraph?.url, '/team/')
})

test('navigation, sitemap, search and Team backlinks all use the new canonical index', () => {
  const { mainNav, footerNav, siteConfig } = source('lib/site-config.ts')
  for (const nav of [mainNav, footerNav]) assert.equal(nav.find(item => item.name === 'Team').url, '/team/')
  const { default: sitemap } = source('app/sitemap.ts')
  const urls = sitemap().map(entry => entry.url)
  assert.ok(urls.includes(`${siteConfig.baseUrl}/team/`))
  assert.ok(!urls.includes(`${siteConfig.baseUrl}/authors/`))
  const { authors } = source('lib/content.ts')
  for (const author of authors) assert.ok(urls.includes(`${siteConfig.baseUrl}/authors/${author.slug}/`))
  const search = JSON.parse(readFileSync('public/search-index.json', 'utf8'))
  assert.equal(search.find(item => item.type === 'page' && item.title === 'Team').relpermalink, '/team/')
  for (const file of ['src/app/page.tsx', 'src/app/edit/page.tsx', 'src/app/about/page.tsx', 'src/components/SiteFooter.tsx', 'src/app/authors/[slug]/page.tsx', 'src/app/authors/edit/page.tsx']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /(?:href=|href:\s*)["']\/authors\/?["']/, `${file} must link straight to /team/`)
  }
})
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

test('team page offers one generic job-board link after the profiles, outside the selected tab', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ data: { orgPlresearchPage: { edges: [] } } }))
  const nodes = elements(await AuthorsPage())
  const profiles = nodes.findIndex(node => node.type?.name === 'AuthorsTabs')
  const openings = nodes.findIndex(node => node.type?.name === 'TeamOpenings')
  assert.ok(openings > profiles && profiles >= 0, 'openings must be a sibling after the team profiles')
  const element = nodes[openings]
  const doc = new JSDOM(renderToStaticMarkup(element)).window.document
  const section = doc.querySelector('section')
  assert.equal(doc.getElementById(section.getAttribute('aria-labelledby')).textContent, 'Join our team')
  assert.equal(section.querySelectorAll('article').length, 0)
  const links = [...section.querySelectorAll('a')]
  assert.equal(links.length, 1)
  assert.equal(links[0].href, 'https://os.pl.xyz/jobs')
  assert.equal(links[0].textContent.trim(), 'See open roles →')
  assert.match(section.querySelector('p').textContent, /Protocol Labs/)
  assert.doesNotMatch(section.textContent, /Philanthropic Fundraising Lead|Program Manager|funding and programs/)
  assert.equal(links[0].querySelector('span').getAttribute('aria-hidden'), 'true')
})
