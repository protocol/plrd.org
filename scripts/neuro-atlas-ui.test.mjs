import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const { default: AreaHeroActions } = source('components/AreaHeroActions.tsx')
const { default: AreaPage } = source('app/areas/[slug]/page.tsx')
const { areas } = source('lib/content.ts')

test('Neurotech Explore has one accessible static preview after strategy and before Insights', async () => {
  const tree = await AreaPage({ params: Promise.resolve({ slug: 'neurotech' }) })
  const all = nodes(tree)
  const section = all.find(node => node.type === 'section' && node.props['aria-labelledby'] === 'neuro-atlas-explore')
  assert.ok(section, 'Neurotech needs its contextual Explore preview')
  const links = nodes(section).filter(node => node.props.href === '/neuro-atlas/')
  assert.equal(links.length, 1)
  assert.equal(links[0].type, 'a', 'the entire visual card is a hard navigation across zones')
  const { document } = new JSDOM(renderToStaticMarkup(section)).window
  assert.equal(document.querySelector('h2').textContent, 'Explore')
  assert.equal(document.querySelector('h3').textContent, 'Neuro Atlas')
  const image = document.querySelector('img')
  assert.equal(image.getAttribute('src'), '/images/neuro-atlas-preview.png')
  assert.match(image.getAttribute('alt'), /Neuro Atlas/)
  assert.equal(image.getAttribute('loading'), 'lazy')
  assert.match(document.querySelector('figcaption').textContent, /Static interface preview/)
  assert.equal(document.querySelectorAll('iframe, canvas').length, 0)
  const html = document.querySelector('a')
  assert.match(html.className, /focus-visible:/)
  assert.ok(all.indexOf(section) > all.findIndex(node => node.props.id === 'opportunity-spaces'))
  assert.ok(all.indexOf(section) < all.findIndex(node => node.type === 'h2' && node.props.children === 'Insights'))
  const neuro = areas.find(area => area.slug === 'neurotech')
  assert.ok(all.some(node => node.props.dangerouslySetInnerHTML?.__html === neuro.html), 'existing page copy remains intact')
  for (const slug of ['ai-robotics', 'digital-human-rights']) {
    const other = await AreaPage({ params: Promise.resolve({ slug }) })
    assert.equal(nodes(other).filter(node => node.props.href === '/neuro-atlas/').length, 0)
  }
})

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes)
  if (!node || typeof node !== 'object') return []
  return [node, ...nodes(node.props?.children)]
}

test('Neurotech adds a normal Atlas anchor without replacing its Website or strategy links', () => {
  const props = { areaSlug: 'neurotech', showOpportunitySpaces: true, opportunityHref: '#opportunity-spaces' }
  const tree = AreaHeroActions(props)
  const anchor = nodes(tree).find(node => node.props.href === '/neuro-atlas/')
  assert.ok(anchor, 'distinct small Neuro Atlas link must exist')
  assert.equal(anchor.type, 'a', 'cross-zone navigation must not use Next Link')
  assert.equal(anchor.props.target, undefined)
  const { document } = new JSDOM(renderToStaticMarkup(tree)).window
  assert.equal(document.querySelector('a[href="/neuro-atlas/"]').textContent.trim(), 'Neuro Atlas →')
  assert.match(document.querySelector('a[href="https://www.plneuro.xyz/"]').textContent, /Website/)
  assert.ok(document.querySelector('a[href="#opportunity-spaces"]'))
  for (const areaSlug of ['ai-robotics', 'digital-human-rights', 'economies-governance']) {
    assert.equal(nodes(AreaHeroActions({ ...props, areaSlug })).filter(node => node.props.href === '/neuro-atlas/').length, 0)
  }
})
