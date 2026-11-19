import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'

import { source } from './velocity/test-source-loader.mjs'

// Economies & Governance presents Sovereign AI as its flagship program, in
// the place and shape the Digital Human Rights page gives its own
// (scripts/dhr-content.test.mjs). These checks hold the box, its wording and
// the order of the page around it.

const { flagshipCopy, sheets, sheetHref, sovAiArt, sovAiHref, programHref } = source('lib/sovereign-ai.ts')
// The same next/link the page is compiled against.
const Link = createRequire(import.meta.url)('next/link').default

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  return node && typeof node === 'object' ? text(node.props?.children) : ''
}

/** The page as the server builds it, with every live source unreachable. */
async function page(t) {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/areas/economies-governance/page.tsx').default
  return elements(await Page())
}

test('E&G presents Sovereign AI as its flagship after the introduction and before opportunity spaces', async (t) => {
  const nodes = await page(t)
  const section = nodes.find((node) => node.type === 'section' && node.props.id === 'flagship-program')
  assert.ok(section, 'E&G needs a visible, directly linkable flagship program section')
  assert.equal(section.props['aria-labelledby'], 'flagship-program-title')
  const contents = elements(section)
  const title = contents.find((node) => node.type === 'h2')
  assert.equal(title.props.id, 'flagship-program-title')
  assert.equal(text(title).trim(), 'Sovereign AI')
  assert.match(text(section), /Flagship program/)
  assert.match(text(section), /A PL R&D flagship program/)

  const external = contents.filter((node) => node.type === 'a')
  assert.equal(external.length, 1, 'one way out: the program site')
  assert.equal(external[0].props.href, sovAiHref)
  assert.equal(sovAiHref, '/sov-ai')
  assert.equal(text(external[0]), 'Explore Sovereign AI ↗')
  assert.equal(external[0].props.target, '_blank')
  assert.equal(external[0].props.rel, 'noopener noreferrer')

  const at = (found) => nodes.indexOf(found)
  const intro = nodes.find((node) => typeof node.props?.className === 'string' && node.props.className.includes('page-content'))
  const spaces = nodes.find((node) => node.props?.id === 'opportunity-spaces')
  assert.ok(intro && spaces)
  assert.ok(at(intro) < at(section), 'the introduction comes first')
  assert.ok(at(section) < at(spaces), 'the flagship comes before Opportunity Spaces')
})

test('the flagship box says what the program site says, word for word', async (t) => {
  const section = (await page(t)).find((node) => node.props?.id === 'flagship-program')
  const site = new JSDOM(readFileSync('public/sov-ai/index.html', 'utf8')).window.document
  const overview = [...site.querySelectorAll('.overview-copy p')].map((p) => p.textContent.replace(/\s+/g, ' ').trim())
  assert.equal(flagshipCopy.length, 2)
  for (const paragraph of flagshipCopy) {
    assert.ok(overview.includes(paragraph), `not on /sov-ai: ${paragraph.slice(0, 60)}…`)
    assert.ok(text(section).includes(paragraph), 'the box shows it')
  }
  // Nothing the program site does not claim: no figures or sums of money.
  assert.doesNotMatch(text(section), /\d{2,}|\$/)
})

test('the flagship box carries one picture', async (t) => {
  const section = (await page(t)).find((node) => node.props?.id === 'flagship-program')
  const contents = elements(section)
  const pictures = contents.filter((node) => node.type === 'img')
  assert.equal(pictures.length, 1)
  const [art] = pictures
  assert.equal(art.props.src, sovAiArt)
  assert.ok(readFileSync(`public${sovAiArt}`).length > 0, 'the picture is in the repository')
  assert.equal(art.props.alt, 'Paper-cut illustration: four people around a table with a computer, beside a civic building')
  // Above the title on a phone; beside it, out of the flow, from tablet width up.
  assert.ok(contents.indexOf(art) < contents.findIndex((node) => node.type === 'h2'), 'the picture comes before the title')
  assert.match(art.props.className, /(^| )md:absolute( |$)/)
  // The picture is drawn by an image model, and the record says so.
  assert.match(readFileSync('docs/fa2-flagship/verification.md', 'utf8'), /image model/)
})

test('the five one-pagers stand in the flagship box, each linked to its web edition', async (t) => {
  const section = (await page(t)).find((node) => node.props?.id === 'flagship-program')
  const links = elements(section).filter((node) => node.type === Link)
  assert.equal(sheets.length, 5)
  assert.deepEqual(links.map((link) => [link.props.href, text(link)]), sheets.map((sheet) => [sheetHref(sheet.slug), sheet.label]))
  for (const link of links) assert.match(link.props.href, /\/$/, 'internal links end in a slash')
})

test('the old #sovereign-ai address still lands on the program', async (t) => {
  const nodes = await page(t)
  const anchor = nodes.find((node) => node.props?.id === 'sovereign-ai')
  const section = nodes.find((node) => node.props?.id === 'flagship-program')
  assert.ok(anchor, 'sheets and redirects point at #sovereign-ai')
  assert.equal(programHref, '/areas/economies-governance/#sovereign-ai')
  // The anchor is the element just before the box, so the box is what the reader sees.
  assert.equal(nodes.indexOf(section) - nodes.indexOf(anchor), 1)
})

test('the page keeps everything it had, in the leaner order', async (t) => {
  const nodes = await page(t)
  const all = text(nodes[0])
  const order = ['Flagship program', 'Opportunity Spaces', 'Featured Work', 'Explore', 'How to Engage']
  const headings = nodes.filter((node) => /^(h2|h3|p)$/.test(node.type)).map((node) => text(node).trim())
  const positions = order.map((name) => headings.findIndex((heading) => heading === name || heading === name.toUpperCase()))
  assert.ok(positions.every((position) => position >= 0), `missing a section: ${JSON.stringify(positions)}`)
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'sections are out of order')
  // Moved, not removed.
  for (const kept of ['Broad Listening & Simocracy', 'AI for Public Goods (AI4PG)', 'Watch the documentary', 'Visit AI4PG', 'Share feedback']) {
    assert.ok(all.includes(kept), `lost: ${kept}`)
  }
  for (const href of ['subareas', 'impact', 'projects', 'dependency-graph']) {
    assert.ok(nodes.some((node) => node.props?.href === `/areas/economies-governance/${href}/`), `lost the ${href} card`)
  }
  const LiveBand = source('components/FA2LiveStatsBand.tsx').default
  assert.equal(nodes.filter((node) => node.type === LiveBand).length, 1, 'the live numbers are still on the page')
  const EngageHeading = nodes.findIndex((node) => text(node).trim() === 'How to Engage')
  assert.equal(nodes.slice(EngageHeading).filter((node) => node.props?.title && node.props?.description && !node.props?.href).length, 5, 'five ways to engage')
})

test('the four opportunity spaces are the cards they were', async (t) => {
  const nodes = await page(t)
  const data = { opportunities: JSON.parse(readFileSync('src/data/site-content/opportunities.json', 'utf8')).filter(o => o.areaSlug === 'economies-governance') }
  const section = nodes.find((node) => node.props?.id === 'opportunity-spaces')
  const cards = elements(section).filter((node) => node.type === Link)
  assert.equal(cards.length, 4)
  assert.deepEqual(cards.map((card) => card.props.href), data.opportunities.map((o) => `/areas/economies-governance/${o.id}/`))
  assert.deepEqual(elements(section).filter((node) => node.type === 'h4').map((node) => text(node).trim()), data.opportunities.map((o) => o.title))
})

test('the Sovereign AI flagship does not appear on other focus-area pages', async () => {
  const { default: AreaPage } = source('app/areas/[slug]/page.tsx')
  for (const slug of ['digital-human-rights', 'ai-robotics', 'neurotech']) {
    const nodes = elements(await AreaPage({ params: Promise.resolve({ slug }) }))
    assert.doesNotMatch(text(nodes[0]), /Explore Sovereign AI/)
    assert.equal(nodes.some((node) => node.props?.href === sovAiHref), false)
  }
})
