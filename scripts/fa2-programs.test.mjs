import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

// The FA2 programs: one JSON each, rendered as a web edition, printed as a
// PDF, and stood on the shelf of the FA2 page. These checks keep the four in
// step, and keep the old /briefs/ addresses landing on their programs.

const DATA = path.resolve('src/data/fa2/programs')
const { programs, programHref, programPdf, programCover } = source('lib/programs.ts')

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

const sourceUrls = (program) => [...JSON.stringify(program).matchAll(/"url":"(https?:[^"]+)"/g)].map((m) => m[1])

test('every program JSON is on the site, with its one-page A4 PDF, shelf plate and drawing', () => {
  const files = fs.readdirSync(DATA).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
  assert.deepEqual(programs.map((p) => p.slug).sort(), files.sort(), 'register each JSON in src/lib/programs.ts')
  for (const program of programs) {
    const json = JSON.parse(fs.readFileSync(path.join(DATA, `${program.slug}.json`), 'utf8'))
    assert.equal(json.slug, program.slug, 'the slug inside the JSON matches its file name')
    const pdf = fs.readFileSync(path.join('public', programPdf(program.slug))).toString('latin1')
    assert.equal(pdf.match(/\/Type\s*\/Page(?![s\w])/g)?.length, 1, `${program.slug}.pdf is one page (npm run build-programs)`)
    assert.match(pdf, /\/MediaBox \[0 0 594\.9\d* 841\.9\d*\]/, `${program.slug}.pdf is A4`)
    assert.ok(fs.existsSync(path.join('public', programCover(program.slug))), `${program.slug} has its shelf plate`)
    assert.ok(fs.existsSync(path.join('public', program.image)), `${program.slug} has its drawing`)
  }
})

test('the sheets say program, and nothing links to the old briefs addresses', () => {
  for (const program of programs) {
    const json = fs.readFileSync(path.join(DATA, `${program.slug}.json`), 'utf8')
    assert.doesNotMatch(json, /\bbriefs?\b/i, `${program.slug} still says brief`)
  }
})

test('a link from one program to another names a program that exists', () => {
  const routes = new Set(programs.map((p) => programHref(p.slug)))
  for (const program of programs) {
    const links = [...JSON.stringify(program).matchAll(/\]\((\/areas\/economies-governance\/programs\/[^)\s]*)\)/g)]
    for (const [, href] of links) assert.ok(routes.has(href), `${program.slug} links to ${href}`)
  }
})

test('each web edition links every source, the PDF and the other programs', async () => {
  const page = source('app/areas/economies-governance/programs/[slug]/page.tsx')
  assert.deepEqual(page.generateStaticParams().map((p) => p.slug), programs.map((p) => p.slug))
  for (const program of programs) {
    const params = Promise.resolve({ slug: program.slug })
    const html = renderToStaticMarkup(await page.default({ params }))
    assert.ok(sourceUrls(program).length > 0, `${program.slug} cites its sources`)
    for (const url of sourceUrls(program)) {
      assert.ok(html.includes(`href="${url.replace(/&/g, '&amp;')}"`), `${program.slug} links ${url}`)
    }
    assert.ok(html.includes(`href="${programPdf(program.slug)}"`), `${program.slug} offers its PDF`)
    assert.doesNotMatch(html, /\]\(/, `${program.slug} shows no raw link syntax`)
    const meta = await page.generateMetadata({ params })
    assert.equal(meta.alternates.canonical, programHref(program.slug))
    assert.doesNotMatch(meta.description, /\]\(/)
  }
})

test('the FA2 page stands every program on its shelf, above Opportunity Spaces', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/areas/economies-governance/page.tsx').default
  const ProgramShelf = source('components/programs/ProgramShelf.tsx').default
  const nodes = elements(await Page())
  const shelves = nodes.filter((node) => node.type === ProgramShelf)
  assert.equal(shelves.length, 1, 'one shelf')
  assert.deepEqual(
    shelves[0].props.programs.map((p) => [p.href, p.pdf, p.cover]),
    programs.map((p) => [programHref(p.slug), programPdf(p.slug), programCover(p.slug)]),
  )
  const ids = nodes.map((node) => node.props?.id).filter(Boolean)
  assert.ok(ids.includes('programs'), 'the section is anchored at #programs')
  assert.ok(ids.indexOf('programs') < ids.indexOf('opportunity-spaces'), 'programs come before Opportunity Spaces')
})

test('the old briefs addresses redirect to their programs', async () => {
  const { default: nextConfig } = source('../next.config.ts')
  const redirects = await nextConfig.redirects()
  const to = (from) => redirects.find((r) => r.source === from)?.destination
  assert.equal(to('/areas/economies-governance/briefs/:slug/'), '/areas/economies-governance/programs/:slug/')
  assert.equal(to('/areas/economies-governance/briefs/:slug'), '/areas/economies-governance/programs/:slug/')
  assert.equal(to('/areas/economies-governance/briefs/'), '/areas/economies-governance/#programs')
  assert.equal(to('/areas/economies-governance/programs/'), '/areas/economies-governance/#programs')
  assert.equal(to('/briefs/:file'), '/programs/:file')
  assert.equal(to('/images/fa2/briefs/:file'), '/images/fa2/programs/:file')
})
