import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

import { source } from './velocity/test-source-loader.mjs'

// The E&G Atlas trial is one unlisted page that invents nothing: every number
// on it is derived from data the site already publishes with a source. These
// checks hold it to that data and keep it out of the places a listed page is in.

const { atlasPath, facts, fieldSeries, landscape, notTrackedYet } = source('lib/eg-atlas.ts')
const ROUTE = atlasPath.replace(/\//g, '')

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

test('every figure comes from a Sovereign AI sheet, once each', () => {
  const inSheets = new Set()
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect)
    if (!node || typeof node !== 'object') return
    if (typeof node.figure === 'string' && typeof node.url === 'string') inSheets.add(`${node.url} ${node.figure}`)
    Object.values(node).forEach(collect)
  }
  for (const file of readdirSync('src/data/fa2/sovereign-ai')) collect(JSON.parse(readFileSync(`src/data/fa2/sovereign-ai/${file}`, 'utf8')))

  const shown = facts()
  assert.ok(shown.length > 0)
  assert.deepEqual(shown.map((fact) => `${fact.url} ${fact.figure}`).sort(), [...inSheets].sort())
  for (const fact of shown) {
    assert.match(fact.url, /^https?:\/\//)
    assert.ok(fact.source.trim(), `${fact.figure} names its source`)
    assert.doesNotMatch(fact.caption, /\]\(/, 'no raw link syntax')
    assert.ok(fact.sheets.length > 0)
    for (const sheet of fact.sheets) assert.match(sheet.href, /^\/areas\/economies-governance\/sovereign-ai\/[^/]+\/$/)
  }
})

test('the landscape counts the ecosystem directory by its own tags', () => {
  const { teams } = JSON.parse(readFileSync('src/data/fa2/projects.json', 'utf8'))
  const field = landscape()
  assert.equal(field.teams, teams.length)
  for (const { tag, teams: n } of field.tags) assert.equal(n, teams.filter((team) => (team.fa2_tags ?? []).includes(tag)).length, tag)
  assert.deepEqual(field.tags.map((t) => t.teams), field.tags.map((t) => t.teams).sort((a, b) => b - a), 'largest first')
})

test('the research series is the OpenAlex file, row for row', () => {
  const lines = readFileSync('src/data/velocity/economies-governance.csv', 'utf8').split(/\r?\n/).filter(Boolean)
  const rows = lines.filter((line) => /^\d{4},/.test(line)).map((line) => line.split(','))
  const series = fieldSeries()
  assert.equal(series.years.length, rows.length)
  rows.forEach((row, i) => {
    assert.equal(series.years[i].year, Number(row[0]))
    assert.equal(series.years[i].works, Number(row[1]))
    assert.equal(series.years[i].sharePer100k, Number(row[3]))
  })
  assert.ok(lines.includes(`# query: ${series.query}`))
  assert.equal(series.reliableUntil, Number(rows.filter((row) => row.at(-1) === '1').at(-1)[0]), 'the last year the file marks reliable')
  assert.match(series.source, /OpenAlex/)
})

test('what is not tracked yet carries no figures', () => {
  assert.equal(notTrackedYet.length, 3)
  for (const item of notTrackedYet) assert.doesNotMatch(`${item.title} ${item.text} ${item.needs}`, /\d|\$/)
})

test('the page shows its sections and stays unlisted', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const page = source(`app/${ROUTE}/page.tsx`)
  assert.deepEqual(page.metadata.robots, { index: false, follow: false })

  const nodes = elements(await page.default())
  assert.deepEqual(nodes.filter((node) => node.type === 'section').map((node) => node.props.id), ['evidence', 'field-velocity', 'landscape', 'live', 'next'])
  const evidence = nodes.find((node) => node.props?.id === 'evidence')
  const sources = elements(evidence).filter((node) => node.type === 'a' && node.props.target === '_blank').map((node) => node.props.href)
  for (const fact of facts()) assert.ok(sources.includes(fact.url), `links ${fact.source}`)
  assert.match(text(nodes[0]), /Trial v1\.0 · unlisted preview/)

  // Not in the sitemap, the search index or the navigation.
  const { default: sitemap } = source('app/sitemap.ts')
  assert.equal(sitemap().some((entry) => entry.url.includes(ROUTE)), false)
  assert.equal(readFileSync('public/search-index.json', 'utf8').includes(ROUTE), false)
  assert.equal(readFileSync('src/lib/site-config.ts', 'utf8').includes(ROUTE), false)
})
