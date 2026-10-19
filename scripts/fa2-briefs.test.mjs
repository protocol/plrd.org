import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { source } from './velocity/test-source-loader.mjs'

// The FA2 briefs: one JSON each, rendered as a web edition, printed as a PDF,
// and stood on the shelf of the FA2 page. These checks keep the four in step.

const DATA = path.resolve('src/data/fa2/briefs')
const { briefs, briefHref, briefPdf, briefCover } = source('lib/briefs.ts')

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

const sourceUrls = (brief) => [...JSON.stringify(brief).matchAll(/"url":"(https?:[^"]+)"/g)].map((m) => m[1])

test('every brief JSON is on the site, with its one-page A4 PDF, shelf plate and drawing', () => {
  const files = fs.readdirSync(DATA).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
  assert.deepEqual(briefs.map((b) => b.slug).sort(), files.sort(), 'register each JSON in src/lib/briefs.ts')
  for (const brief of briefs) {
    const json = JSON.parse(fs.readFileSync(path.join(DATA, `${brief.slug}.json`), 'utf8'))
    assert.equal(json.slug, brief.slug, 'the slug inside the JSON matches its file name')
    const pdf = fs.readFileSync(path.join('public', briefPdf(brief.slug))).toString('latin1')
    assert.equal(pdf.match(/\/Type\s*\/Page(?![s\w])/g)?.length, 1, `${brief.slug}.pdf is one page (npm run build-briefs)`)
    assert.match(pdf, /\/MediaBox \[0 0 594\.9\d* 841\.9\d*\]/, `${brief.slug}.pdf is A4`)
    assert.ok(fs.existsSync(path.join('public', briefCover(brief.slug))), `${brief.slug} has its shelf plate`)
    assert.ok(fs.existsSync(path.join('public', brief.image)), `${brief.slug} has its drawing`)
  }
})

test('a link from one brief to another names a brief that exists', () => {
  const routes = new Set(briefs.map((b) => briefHref(b.slug)))
  for (const brief of briefs) {
    const links = [...JSON.stringify(brief).matchAll(/\]\((\/areas\/economies-governance\/briefs\/[^)\s]*)\)/g)]
    for (const [, href] of links) assert.ok(routes.has(href), `${brief.slug} links to ${href}`)
  }
})

test('each web edition links every source, the PDF and the other briefs', async () => {
  const page = source('app/areas/economies-governance/briefs/[slug]/page.tsx')
  assert.deepEqual(page.generateStaticParams().map((p) => p.slug), briefs.map((b) => b.slug))
  for (const brief of briefs) {
    const params = Promise.resolve({ slug: brief.slug })
    const html = renderToStaticMarkup(await page.default({ params }))
    assert.ok(sourceUrls(brief).length > 0, `${brief.slug} cites its sources`)
    for (const url of sourceUrls(brief)) {
      assert.ok(html.includes(`href="${url.replace(/&/g, '&amp;')}"`), `${brief.slug} links ${url}`)
    }
    assert.ok(html.includes(`href="${briefPdf(brief.slug)}"`), `${brief.slug} offers its PDF`)
    assert.doesNotMatch(html, /\]\(/, `${brief.slug} shows no raw link syntax`)
    const meta = await page.generateMetadata({ params })
    assert.equal(meta.alternates.canonical, briefHref(brief.slug))
    assert.doesNotMatch(meta.description, /\]\(/)
  }
})

test('the FA2 page stands every brief on its shelf, above Opportunity Spaces', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/areas/economies-governance/page.tsx').default
  const BriefShelf = source('components/briefs/BriefShelf.tsx').default
  const nodes = elements(await Page())
  const shelves = nodes.filter((node) => node.type === BriefShelf)
  assert.equal(shelves.length, 1, 'one shelf')
  assert.deepEqual(
    shelves[0].props.briefs.map((b) => [b.href, b.pdf, b.cover]),
    briefs.map((b) => [briefHref(b.slug), briefPdf(b.slug), briefCover(b.slug)]),
  )
  const ids = nodes.map((node) => node.props?.id).filter(Boolean)
  assert.ok(ids.includes('briefs'), 'the section is anchored at #briefs')
  assert.ok(ids.indexOf('briefs') < ids.indexOf('opportunity-spaces'), 'briefs come before Opportunity Spaces')
})
