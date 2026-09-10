import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './test-source-loader.mjs'

function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}

function backgroundClasses(node) {
  return (node.props.className ?? '').split(/\s+/).filter(name => name.startsWith('bg-'))
}

function offlineProviders(t) {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  // Exercise the real loaders with unavailable providers, without external requests.
  t.mock.method(console, 'warn', () => {})
}

test('Neurotech field velocity uses the same theme-aware gray surface as the cross-field overview', async (t) => {
  offlineProviders(t)
  const Overview = source('app/impact-preview-eb61fba1b98e/page.tsx').default
  const Panel = source('components/AreaFieldVelocity.tsx').default
  const overview = await Overview({ searchParams: Promise.resolve({ area: 'neurotech' }) })
  const overviewSection = elements(overview).find(node => node.props.id === 'field-velocity')
  assert.ok(overviewSection)
  assert.deepEqual(backgroundClasses(overviewSection), ['bg-gray-100'])

  const neuroSection = await Panel({ area: 'neurotech' })
  assert.deepEqual(backgroundClasses(neuroSection), backgroundClasses(overviewSection))
})

test('Neurotech opportunity grid finishes its odd desktop row with an empty white quadrant', async () => {
  const Page = source('app/areas/[slug]/page.tsx').default
  const page = await Page({ params: Promise.resolve({ slug: 'neurotech' }) })
  const section = elements(page).find(node => node.props.id === 'opportunity-spaces')
  const grid = elements(section).find(node => node.props.className?.includes('md:grid-cols-2'))
  assert.ok(grid)
  const cells = React.Children.toArray(grid.props.children)
  const cards = cells.filter(node => node.props.href)
  assert.equal(cards.length, 3, 'all three real opportunity links remain')
  assert.equal(cells.length, 4, 'the fourth quadrant must have its own surface')
  const emptyCell = cells.at(-1)
  assert.equal(emptyCell.type, 'div')
  assert.equal(emptyCell.props['aria-hidden'], true)
  assert.deepEqual(backgroundClasses(emptyCell), ['bg-white'])
  assert.equal(React.Children.count(emptyCell.props.children), 0)
  assert.match(emptyCell.props.className, /\bhidden\b/)
  assert.match(emptyCell.props.className, /\bmd:block\b/, 'no phantom stacked card on mobile')
})

test('cross-field methodology omits the full stocks-versus-velocity paragraph without removing the surrounding explanation', (t) => {
  const Methodology = source('components/MeasuringQuestionsV2.tsx').default
  const { FIELD_VELOCITY_METHODOLOGY } = source('lib/field-velocity.ts')
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(Methodology)))
  t.after(() => dom.window.close())
  const paragraphs = [...dom.window.document.querySelectorAll('p')].map(node => node.textContent.trim())
  assert.match(FIELD_VELOCITY_METHODOLOGY.stocksAndFlows, /^Stocks are not velocity\./, 'shared methodology must remain intact')
  assert.ok(paragraphs.includes(FIELD_VELOCITY_METHODOLOGY.observedVelocity))
  assert.ok(paragraphs.includes(FIELD_VELOCITY_METHODOLOGY.attribution))
  const heading = [...dom.window.document.querySelectorAll('h3')].find(node => node.textContent === 'Observed velocity')
  assert.ok(heading)
  assert.deepEqual(
    [...heading.parentElement.querySelectorAll('p')].map(node => node.textContent.trim()),
    [FIELD_VELOCITY_METHODOLOGY.observedVelocity],
    'remove the complete stocks paragraph and its wrapper, not just its opening sentence',
  )
  assert.doesNotMatch(dom.window.document.body.textContent, /Stocks are not velocity\./)
})

for (const area of ['digital-human-rights', 'economies-governance', 'ai-robotics']) {
  test(`${area} retains its existing blue-tinted field surface and opportunity grid`, async (t) => {
    offlineProviders(t)
    const Panel = source('components/AreaFieldVelocity.tsx').default
    assert.deepEqual(backgroundClasses(await Panel({ area })), ['bg-gray-200'])

    const Page = source(area === 'economies-governance' ? 'app/areas/economies-governance/page.tsx' : 'app/areas/[slug]/page.tsx').default
    const page = await Page({ params: Promise.resolve({ slug: area }) })
    const section = elements(page).find(node => node.props.id === 'opportunity-spaces')
    const grid = elements(section).find(node => node.props.className?.includes('md:grid-cols-2'))
    assert.ok(grid)
    assert.deepEqual(backgroundClasses(grid), ['bg-gray-200'])
    const cells = React.Children.toArray(grid.props.children)
    assert.ok(cells.length > 0)
    assert.ok(cells.every(node => typeof node.props.href === 'string'), 'do not add blank cells to other focus areas')
  })
}

test('the read-only field-velocity API still exports the full shared stocks-and-flows methodology', async (t) => {
  offlineProviders(t)
  const { GET } = source('app/api/field-velocity/[area]/route.ts')
  const { FIELD_VELOCITY_METHODOLOGY } = source('lib/field-velocity.ts')
  const response = await GET(new Request('https://www.plrd.org/api/field-velocity/neurotech/'), {
    params: Promise.resolve({ area: 'neurotech' }),
  })
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body.methodology, FIELD_VELOCITY_METHODOLOGY)
  assert.match(body.methodology.stocksAndFlows, /^Stocks are not velocity\./)
})
