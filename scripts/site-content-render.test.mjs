import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const snapshot = JSON.parse(readFileSync('src/data/site-content/provenance/2026-11-19/public-records.json', 'utf8'))
const adapter = source('lib/indexer.ts')
const withRkey = record => record ? { ...structuredClone(record), rkey: record.uri.split('/').at(-1) } : null
const pages = snapshot.indexer.orgPlresearchPage.nodes
const opportunities = snapshot.indexer.orgPlresearchOpportunitySpace.nodes

// Compare actual server-renderer trees/props before child components execute.
// This includes MarkdownContent bodies, links, headings, cards, and metadata.
function renderValue(value) {
  if (value === undefined) return null
  if (typeof value === 'function') return `[function:${value.name}]`
  if (typeof value === 'symbol') return value.toString()
  if (Array.isArray(value)) return value.map(renderValue)
  if (value && typeof value === 'object') {
    if (value.$$typeof) return { type: renderValue(value.type), key: value.key, props: renderValue(value.props) }
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, renderValue(child)]))
  }
  return value
}

const routes = [
  ['', {}], ['areas/', {}], ['insights/', { searchParams: Promise.resolve({}) }],
  ['team/', {}], ['blog/', {}], ['publications/', {}], ['talks/', {}], ['tutorials/', {}],
  ['outreach/collaboration/', {}], ['areas/economies-governance/', {}],
  ['areas/economies-governance/subareas/', {}], ['areas/economies-governance/impact/', {}],
  ...opportunities.filter(o => o.areaSlug === 'economies-governance').map(o => ['areas/economies-governance/[slug]/', { params: Promise.resolve({ slug: o.id }) }]),
]

test('all 16 active CMS-content routes retain their exact renderer output with the archived indexer baseline', async t => {
  // Synthetic metric fixtures only: the public read-only provider implementations are not changed.
  const series = { days: [], values: [] }
  t.mock.method(source('lib/simocracy.ts'), 'fetchSimocracyStats', async () => ({ totals: { totalSims: 0, totalGatherings: 0 }, trends: { totalSims: series, totalGatherings: series } }))
  t.mock.method(source('lib/gainforest.ts'), 'fetchGainforestStats', async () => ({ observations: 0, bumicerts: 0, certifiedOrgs: 0, trends: { observations: series, bumicerts: series, certifiedOrgs: series } }))
  t.mock.method(source('lib/glow.ts'), 'fetchGlowStats', async () => ({ powerOutput: 0, activeFarms: 0, trends: { powerOutput: series, activeFarms: series } }))
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Render parity test must be offline') })
  assert.equal(routes.length, 16)
  for (const [path, props] of routes) {
    await t.test(`/${path}${props.params ? (await props.params).slug : ''}`, async () => {
      const module = source(`app/${path}page.tsx`)
      const current = renderValue(await module.default(props))
      const currentMetadata = module.generateMetadata ? renderValue(await module.generateMetadata(props)) : null
      const mocks = [
        t.mock.method(adapter, 'fetchPage', async rkey => withRkey(pages.find(page => page.pageId === rkey))),
        t.mock.method(adapter, 'fetchOpportunitySpaces', async area => opportunities.filter(o => o.areaSlug === area).map(withRkey)),
        t.mock.method(adapter, 'fetchOpportunitySpace', async rkey => withRkey(opportunities.find(o => o.uri.endsWith(`/${rkey}`)))),
        t.mock.method(adapter, 'fetchAtproPosts', async () => []), // The captured old records query fails; repo posts are already rendered.
      ]
      try {
        const original = renderValue(await module.default(props))
        assert.deepEqual(current, original, `Rendered content/URLs changed: /${path}`)
        if (module.generateMetadata) assert.deepEqual(currentMetadata, renderValue(await module.generateMetadata(props)))
      } finally { mocks.forEach(mock => mock.mock.restore()) }
    })
  }
  assert.equal(network.mock.callCount(), 0)
})
