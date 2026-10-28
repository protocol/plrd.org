import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'

const providers = [
  ['glow', 'fetchGlowStats'],
  ['simocracy', 'fetchSimocracyStats'],
  ['gainforest', 'fetchGainforestStats'],
  ['maearth', 'fetchMaEarthStats'],
  ['ftc', 'fetchFtcStats'],
]
const realTimeout = AbortSignal.timeout.bind(AbortSignal)

// Exercise the real adapters; only upstream transport and elapsed time are
// synthetic. A hanging body after HTTP 200 reproduces the prerender failure.
for (const [file, entry] of providers) {
  for (const phase of ['headers', 'body']) {
    test(`${file}: stalled ${phase} is aborted within one 20-second provider budget`, async (t) => {
      const { [entry]: fetchStats } = source(`lib/${file}.ts`)
      const calls = [], cleanups = []
      t.mock.method(console, 'warn', () => {})
      t.mock.method(AbortSignal, 'timeout', (ms) => {
        assert.equal(ms, 20_000)
        return realTimeout(25)
      })
      t.mock.method(globalThis, 'fetch', async (_url, options = {}) => {
        calls.push(options)
        if (phase === 'headers') {
          return new Promise((_resolve, reject) => {
            const fail = () => reject(options.signal?.reason ?? new Error('fixture cleanup'))
            cleanups.push(fail)
            if (options.signal?.aborted) fail()
            else options.signal?.addEventListener('abort', fail, { once: true })
          })
        }
        return new Response(new ReadableStream({
          start(controller) {
            const fail = () => { try { controller.error(options.signal?.reason ?? new Error('fixture cleanup')) } catch {} }
            cleanups.push(fail)
            if (options.signal?.aborted) fail()
            else options.signal?.addEventListener('abort', fail, { once: true })
          },
        }), { status: 200 })
      })
      let timer
      const pending = fetchStats()
      try {
        const result = await Promise.race([
          pending,
          new Promise((resolve) => { timer = setTimeout(() => resolve('unbounded'), 200) }),
        ])
        assert.notEqual(result, 'unbounded', `${file} kept prerender waiting on ${phase}`)
        assert.equal(result.degraded, true)
        assert.ok(calls.length > 0)
        assert.ok(calls.every((call) => call.signal instanceof AbortSignal && call.signal.aborted))
        assert.equal(new Set(calls.map((call) => call.signal)).size, 1)
      } finally {
        clearTimeout(timer)
        for (const cleanup of cleanups) cleanup()
        await pending
      }
    })
  }
}

test('simocracy requests only aggregate metadata, never private chat bodies', async (t) => {
  const { fetchSimocracyStats } = source('lib/simocracy.ts')
  const queries = []
  t.mock.method(globalThis, 'fetch', async (_url, { body }) => {
    const query = JSON.parse(body).query
    queries.push(query)
    const root = query.match(/\{\s*(\w+)\(/)[1]
    return Response.json({ data: { [root]: { edges: [], pageInfo: { hasNextPage: false } } } })
  })
  await fetchSimocracyStats()
  assert.ok(queries.length > 0)
  assert.ok(queries.every((query) => !/\b(?:content|userMessage)\b/.test(query)), 'unused private chat fields inflate each history page')
})

const date = '2026-01-01T00:00:00Z'
for (const [file, entry] of providers) {
  test(`${file}: successful fixture data and existing cache settings are preserved`, async (t) => {
    const calls = []
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls.push(options)
      if (file === 'glow') return Response.json([
        { hexlifiedPublicKey: 'synthetic-a', powerOutput: 5, carbonCreditsProduced: 1 },
        { hexlifiedPublicKey: 'synthetic-b', powerOutput: 7, carbonCreditsProduced: 0.5 },
      ])
      if (file === 'maearth') {
        const data = url.endsWith('getCurrent') ? { id: 'fixture', name: 'Fixture round' }
          : url.endsWith('getMatchingEstimates') ? { projects: [{ directDonations: 12300, donorCount: 5 }] }
          : { algorithm_params: { matching_funds: 25000 } }
        return Response.json({ json: data })
      }
      if (file === 'gainforest') {
        const conn = (n) => ({ totalCount: n, edges: [{ node: { createdAt: date } }] })
        return Response.json({ data: { actorOrg: conn(2), act: conn(3), occ: conn(4) } })
      }
      const root = JSON.parse(options.body).query.match(/\{\s*(\w+)\(/)[1]
      const nodes = {
        orgSimocracyHistory: [{ type: 'chat', actorDid: 'did:example:a', simNames: ['Fixture'], createdAt: date }],
        orgSimocracySim: [{ did: 'did:example:a', name: 'Fixture', createdAt: date }],
        orgSimocracyGathering: [{ name: 'Fixture', treasuryUsd: 500, createdAt: date }],
        orgHypercertsClaimActivity: [{ createdAt: date }],
        orgImpactindexerReviewComment: [{ createdAt: date }],
        ioFundingthecommonsImpactMetricPoint: [{ metric: 'total-pgf-distributed', value: '42', date, type: 'actual' }],
      }[root]
      assert.ok(nodes, root)
      return Response.json({ data: { [root]: { edges: nodes.map((node) => ({ node })), pageInfo: { hasNextPage: false } } } })
    })
    const stats = await source(`lib/${file}.ts`)[entry]()
    assert.equal(stats.degraded, false)
    assert.ok(calls.every((o) => o.next.tags.includes(file) && o.next.revalidate > 0))
    assert.equal(new Set(calls.map((o) => o.signal)).size, 1)
    if (file === 'glow') {
      assert.equal(stats.powerOutput, 12); assert.equal(stats.carbon, 1.5); assert.equal(stats.activeFarms, 2)
      assert.equal(stats.trends.powerOutput.values.length, 8)
    } else if (file === 'simocracy') {
      assert.deepEqual(stats.totals, { treasuryUsd: 15500, uniqueHumans: 1, totalSims: 1, totalGatherings: 1, totalProposals: 1, totalComments: 1, totalSProcesses: 0, totalChats: 1 })
      assert.equal(stats.recentEvents.length, 1)
    } else if (file === 'gainforest') {
      assert.deepEqual([stats.certifiedOrgs, stats.bumicerts, stats.observations], [2, 3, 4])
      assert.equal(stats.trends.observations.values.at(-1), 4)
    } else if (file === 'maearth') {
      assert.deepEqual([stats.round, stats.donations, stats.donors, stats.projects, stats.matchingPool], ['Fixture round', 123, 5, 1, 250])
    } else {
      assert.equal(stats.totals.pgfDistributed, 42)
      assert.deepEqual(stats.trends.pgfDistributed.values, [42])
    }
  })
}

for (const file of ['simocracy', 'ftc', 'maearth', 'glow']) {
  test(`${file}: a late-page or partial-batch timeout is not a healthy truncated result`, async (t) => {
    const entry = providers.find(([name]) => name === file)[1]
    const calls = []
    t.mock.method(console, 'warn', () => {})
    t.mock.method(AbortSignal, 'timeout', () => realTimeout(25))
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls.push(options)
      const query = options.body && JSON.parse(options.body).query
      if (file === 'glow' && calls.length === 1) return Response.json([{ hexlifiedPublicKey: 'synthetic', powerOutput: 99 }])
      if (file === 'maearth' && url.endsWith('getCurrent')) return Response.json({ json: { id: 'fixture' } })
      if (file === 'maearth' && url.endsWith('getMatchingEstimates')) return Response.json({ json: { projects: [{ directDonations: 99 }] } })
      if (query && !query.includes('after:')) {
        const root = query.match(/\{\s*(\w+)\(/)[1]
        return Response.json({ data: { [root]: { edges: [{ node: { createdAt: date, metric: 'total-pgf-distributed', value: '99', date } }], pageInfo: { hasNextPage: true, endCursor: 'page-2' } } } })
      }
      return new Promise((_resolve, reject) => {
        if (options.signal.aborted) reject(options.signal.reason)
        else options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })
      })
    })
    // Keep the event loop alive for AbortSignal.timeout's unref'ed timer.
    const keepalive = setInterval(() => {}, 100)
    try {
      const result = await source(`lib/${file}.ts`)[entry]()
      assert.equal(result.degraded, true)
      assert.equal(new Set(calls.map((o) => o.signal)).size, 1)
      if (file === 'glow') assert.deepEqual(result.trends.powerOutput.values, [])
      if (file === 'ftc') assert.deepEqual(result.trends.pgfDistributed.values, [])
      if (file === 'simocracy') assert.deepEqual(result.recentEvents, [])
      if (file === 'maearth') assert.equal(result.round, 'Round 3')
    } finally { clearInterval(keepalive) }
  })
}

