import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'
import 'next/dist/server/node-environment.js'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
const require = createRequire(import.meta.url)
const { createPatchedFetcher } = require('next/dist/server/lib/patch-fetch.js')
const { workAsyncStorage } = require('next/dist/server/app-render/work-async-storage.external.js')
const { workUnitAsyncStorage } = require('next/dist/server/app-render/work-unit-async-storage.external.js')
const { executeRevalidates } = require('next/dist/server/revalidation-utils.js')
const { AfterRunner } = require('next/dist/server/after/run-with-after.js')
const cacheReads = []
globalThis.__incrementalCache = {
  generateSimpleCacheKey: async (key) => key,
  get: async (_key, options) => { cacheReads.push(options); return null },
  set: async () => {},
}


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
    assert.ok(calls.every((o) => o.cache === 'no-store'))
    assert.ok(cacheReads.some((o) => o.revalidate > 0 && o.tags.includes(file)))
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



for (const [file, entry] of providers) {
for (const mode of ['miss', 'stale-foreground', 'stale-background']) {
  for (const phase of ['headers', 'body']) {
    test(`Next cache ${file}: ${mode} ${phase} stall cannot block export completion`, { timeout: 5000 }, async (t) => {
      const load = source(`lib/${file}.ts`)[entry]
      const nativeFetch = globalThis.fetch
      const nativeTimeout = AbortSignal.timeout.bind(AbortSignal)
      t.mock.method(console, 'warn', () => {})
      t.mock.method(console, 'error', () => {})
      let stall = false
      const server = createServer((request, response) => {
        let body = ''
        request.on('data', (chunk) => { body += chunk })
        request.on('end', () => {
          if (stall) {
            if (phase === 'body') { response.writeHead(200, { 'content-type': 'application/json' }); response.write('{') }
            return
          }
          let data
          if (file === 'glow') data = [{hexlifiedPublicKey:'fixture',powerOutput:12000,carbonCredit:1.5}]
          else if (file === 'gainforest') data = {data:{orgs:{totalCount:2},certs:{totalCount:3},occ:{totalCount:4}}}
          else if (file === 'maearth') data = {json: request.url.endsWith('getCurrent') ? {id:'fixture',name:'Fixture'} : request.url.endsWith('getMatchingEstimates') ? {projects:[{directDonations:12300,donorCount:5}]} : {amountCents:25000}}
          else if (file === 'simocracy') {
            const root = JSON.parse(body).query.match(/\{\s*(\w+)\(/)[1]
            const node = root === 'orgSimocracyHistory' ? {type:'chat',actorDid:'did:example:qa',simNames:['Fixture'],createdAt:'2026-01-01'} : {did:'did:example:qa',uri:'at://fixture',name:'Fixture',createdAt:'2026-01-01'}
            data = {data:{[root]:{edges:[{node}],pageInfo:{hasNextPage:false}}}}
          } else data = {data:{ioFundingthecommonsImpactMetricPoint:{edges:[{node:{metric:'total-pgf-distributed',value:42,date:'2026-01-01'}}],pageInfo:{hasNextPage:false}}}}
          response.end(JSON.stringify(data))
        })
      })
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
      const origin = `http://127.0.0.1:${server.address().port}`
      const entries = new Map()
      let stale = false
      const hash = async (...args) => createHash('sha256').update(JSON.stringify(args)).digest('hex')
      const cache = {
        generateCacheKey: hash, generateSimpleCacheKey: hash,
        get: async (key) => entries.has(key) ? { value: entries.get(key), isStale: stale } : null,
        set: async (key, value) => { entries.set(key, value) },
        lock: async () => () => {},
      }
      const signals = []
      const wrapped = createPatchedFetcher((url, init) => {
        signals.push(init.signal)
        return nativeFetch(origin + new URL(url).pathname, init)
      }, { workAsyncStorage, workUnitAsyncStorage })
      t.mock.method(globalThis, 'fetch', wrapped)
      async function render(isRevalidate = false) {
        const work = { route:'/budget-test', page:'/budget-test/page', isStaticGeneration:true, isRevalidate, incrementalCache:cache }
        const unit = { type:'prerender-legacy', phase:'render', revalidate:60, tags:[], implicitTags:{tags:[]} }
        return workAsyncStorage.run(work, () => workUnitAsyncStorage.run(unit, async () => {
          const stats = await load()
          const after = new AfterRunner()
          after.context.waitUntil(executeRevalidates(work))
          await after.executeAfter()
          return stats
        }))
      }
      let pending
      let observation
      let prime
      try {
        if (mode !== 'miss') {
          prime = await render()
          assert.equal(prime.degraded, false)
          assert.ok(entries.size)
          stale = true
        }
        const cacheBeforeFailure = JSON.stringify([...entries])
        stall = true
        signals.length = 0
        // Accelerate only the deliberate stall; healthy recovery keeps its real
        // budget even when the full suite and production build load the CPU.
        t.mock.method(AbortSignal, 'timeout', (ms) => nativeTimeout(ms === 20_000 && stall ? 40 : ms))
        pending = render(mode === 'stale-foreground')
        const sentinel = Symbol('export still pending')
        const stats = await Promise.race([pending, new Promise((resolve) => { observation = setTimeout(() => resolve(sentinel), 200) })])
        assert.notEqual(stats, sentinel, 'stale cache stripped origin cancellation and blocked export')
        assert.ok(signals.length > 0)
        assert.ok(signals.every((signal) => signal instanceof AbortSignal && signal.aborted))
        if (mode === 'miss') { assert.equal(stats.degraded, true); assert.equal(entries.size, 0) }
        else assert.deepEqual(stats, JSON.parse(JSON.stringify(prime)), 'failed refresh must retain original values AND original fetchedAt')
        assert.equal(JSON.stringify([...entries]), cacheBeforeFailure, 'failure must not overwrite the successful cache')
        stall = false
        const recovered = await render(true)
        assert.equal(recovered.degraded, false)
        assert.ok(entries.size)
        if (prime) assert.notEqual(recovered.fetchedAt, prime.fetchedAt)
        stale = false
        signals.length = 0
        assert.deepEqual(await render(), JSON.parse(JSON.stringify(recovered)))
        assert.equal(signals.length, 0, 'fresh cache must not refetch')
      } finally {
        clearTimeout(observation)
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
        if (pending) await pending.catch(() => {})
      }
    })
  }
}
}
