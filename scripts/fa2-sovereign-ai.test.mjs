import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

// The Sovereign AI program's sheets: one JSON each, rendered as a web
// edition, printed as a PDF, and stood on the program's shelf on the FA2
// page. These checks keep the four in step, and keep the old /briefs/ and
// /programs/ addresses landing on their sheets.

const DATA = path.resolve('src/data/fa2/sovereign-ai')
const { sheets, programHref, sheetHref, sheetPdf, sheetCover } = source('lib/sovereign-ai.ts')

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

const sourceUrls = (sheet) => [...JSON.stringify(sheet).matchAll(/"url":"(https?:[^"]+)"/g)].map((m) => m[1])

test('every sheet JSON is on the site, with its one-page A4 PDF, shelf plate and drawing', () => {
  const files = fs.readdirSync(DATA).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
  assert.deepEqual(sheets.map((s) => s.slug).sort(), files.sort(), 'register each JSON in src/lib/sovereign-ai.ts')
  for (const sheet of sheets) {
    const json = JSON.parse(fs.readFileSync(path.join(DATA, `${sheet.slug}.json`), 'utf8'))
    assert.equal(json.slug, sheet.slug, 'the slug inside the JSON matches its file name')
    const pdf = fs.readFileSync(path.join('public', sheetPdf(sheet.slug))).toString('latin1')
    assert.equal(pdf.match(/\/Type\s*\/Page(?![s\w])/g)?.length, 1, `${sheet.slug}.pdf is one page (npm run build-sheets)`)
    assert.match(pdf, /\/MediaBox \[0 0 594\.9\d* 841\.9\d*\]/, `${sheet.slug}.pdf is A4`)
    assert.ok(fs.existsSync(path.join('public', sheetCover(sheet.slug))), `${sheet.slug} has its shelf plate`)
    assert.ok(fs.existsSync(path.join('public', sheet.image)), `${sheet.slug} has its drawing`)
  }
})

test('every sheet is printed as part of the Sovereign AI program, and none links to an old address', () => {
  for (const sheet of sheets) {
    assert.equal(sheet.kicker, 'Economies & Governance · Sovereign AI program', `${sheet.slug} names its program`)
    const json = fs.readFileSync(path.join(DATA, `${sheet.slug}.json`), 'utf8')
    assert.doesNotMatch(json, /\bbriefs?\b|\/programs\//i, `${sheet.slug} still says brief or links /programs/`)
  }
})

test('a link from one sheet to another names a sheet that exists', () => {
  const routes = new Set(sheets.map((s) => sheetHref(s.slug)))
  for (const sheet of sheets) {
    const links = [...JSON.stringify(sheet).matchAll(/\]\((\/areas\/economies-governance\/sovereign-ai\/[^)\s]*)\)/g)]
    for (const [, href] of links) assert.ok(routes.has(href), `${sheet.slug} links to ${href}`)
  }
})

test('each web edition links every source, the PDF, the program and the other sheets', async () => {
  const page = source('app/areas/economies-governance/sovereign-ai/[slug]/page.tsx')
  assert.deepEqual(page.generateStaticParams().map((p) => p.slug), sheets.map((s) => s.slug))
  for (const sheet of sheets) {
    const params = Promise.resolve({ slug: sheet.slug })
    const html = renderToStaticMarkup(await page.default({ params }))
    assert.ok(sourceUrls(sheet).length > 0, `${sheet.slug} cites its sources`)
    for (const url of sourceUrls(sheet)) {
      assert.ok(html.includes(`href="${url.replace(/&/g, '&amp;')}"`), `${sheet.slug} links ${url}`)
    }
    assert.ok(html.includes(`href="${sheetPdf(sheet.slug)}"`), `${sheet.slug} offers its PDF`)
    // next/link drops the trailing slash outside a Next build, so match the anchor.
    assert.match(html, /href="\/areas\/economies-governance\/?#sovereign-ai"/, `${sheet.slug} links back to the program in its breadcrumb`)
    assert.doesNotMatch(html, /\]\(/, `${sheet.slug} shows no raw link syntax`)
    const meta = await page.generateMetadata({ params })
    assert.equal(meta.alternates.canonical, sheetHref(sheet.slug))
    assert.doesNotMatch(meta.description, /\]\(/)
  }
})

test('the FA2 page stands every sheet on the program shelf, above Opportunity Spaces', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/areas/economies-governance/page.tsx').default
  const SheetShelf = source('components/sovereign-ai/SheetShelf.tsx').default
  const nodes = elements(await Page())
  const shelves = nodes.filter((node) => node.type === SheetShelf)
  assert.equal(shelves.length, 1, 'one shelf')
  assert.deepEqual(
    shelves[0].props.sheets.map((s) => [s.href, s.pdf, s.cover]),
    sheets.map((s) => [sheetHref(s.slug), sheetPdf(s.slug), sheetCover(s.slug)]),
  )
  const ids = nodes.map((node) => node.props?.id).filter(Boolean)
  assert.ok(ids.includes('sovereign-ai'), 'the section is anchored at #sovereign-ai')
  assert.ok(ids.indexOf('sovereign-ai') < ids.indexOf('opportunity-spaces'), 'the program comes before Opportunity Spaces')
  assert.equal(programHref, '/areas/economies-governance/#sovereign-ai')
})

test('the old briefs and programs addresses redirect to their sheets', async () => {
  const { default: nextConfig } = source('../next.config.ts')
  const redirects = await nextConfig.redirects()
  const to = (from) => redirects.find((r) => r.source === from)?.destination
  for (const dir of ['briefs', 'programs']) {
    assert.equal(to(`/areas/economies-governance/${dir}/:slug/`), '/areas/economies-governance/sovereign-ai/:slug/')
    assert.equal(to(`/areas/economies-governance/${dir}/:slug`), '/areas/economies-governance/sovereign-ai/:slug/')
    assert.equal(to(`/areas/economies-governance/${dir}/`), programHref)
    assert.equal(to(`/${dir}/:file`), '/sovereign-ai/:file')
    assert.equal(to(`/images/fa2/${dir}/:file`), '/images/fa2/sovereign-ai/:file')
  }
  assert.equal(to('/areas/economies-governance/sovereign-ai/'), programHref)
  assert.equal(to('/sovereign-ai/'), programHref)
})
