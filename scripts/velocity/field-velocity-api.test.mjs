import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './test-source-loader.mjs'

test('GET returns the versioned public contract for each area with only that field’s records and forecasts', async (t) => {
  assert.ok(existsSync('src/app/api/field-velocity/[area]/route.ts'), 'missing read-only field-velocity endpoint')
  // Deterministic provider outage: exercises real resolver fallbacks, not invented readings.
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  const route = source('app/api/field-velocity/[area]/route.ts')
  const { FOCUS_AREAS, INFLECTION_POINTS, TOOLKIT_V2, FIELD_VELOCITY_METHODOLOGY } = source('lib/field-velocity.ts')
  const { VELOCITY_INSTRUMENTS } = source('lib/velocity-instruments.ts')
  const { loadFieldVelocity } = source('lib/field-velocity-data.ts')
  const data = await loadFieldVelocity()
  for (const { key, label } of FOCUS_AREAS) {
    const response = await route.GET(new Request(`https://www.plrd.org/api/field-velocity/${key}/`), { params: Promise.resolve({ area: key }) })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('access-control-allow-origin'), '*')
    assert.equal(response.headers.get('access-control-allow-credentials'), null)
    assert.match(response.headers.get('cache-control'), /s-maxage=/)
    const body = await response.json()
    assert.deepEqual(Object.keys(body).sort(), ['schemaVersion', 'generatedAt', 'area', 'source', 'instruments', 'records', 'inflectionPoints', 'marketSignals', 'toolkit', 'methodology', 'measurementSeries'].sort())
    assert.ok(Array.isArray(body.measurementSeries))
    assert.deepEqual(body.measurementSeries, data.measurementSeriesByArea[key])
    if (key !== 'neurotech') assert.deepEqual(body.measurementSeries, [])
    assert.equal(body.schemaVersion, 1)
    assert.ok(Number.isFinite(Date.parse(body.generatedAt)))
    assert.deepEqual(body.area, { key, label })
    assert.deepEqual(body.source, {
      url: `https://www.plrd.org/impact-preview-eb61fba1b98e/?area=${key}#field-velocity`,
      repository: 'https://github.com/protocol/plrd.org',
      methodologyUrl: 'https://www.plrd.org/impact-preview-eb61fba1b98e/#methodology',
    })
    assert.deepEqual(body.records, JSON.parse(JSON.stringify(data.recordsByArea[key])))
    assert.deepEqual(body.instruments, VELOCITY_INSTRUMENTS)
    assert.deepEqual(body.inflectionPoints, INFLECTION_POINTS.filter(p => p.area === key))
    const titles = new Set(body.inflectionPoints.map(p => p.title))
    assert.deepEqual(body.marketSignals, Object.fromEntries(Object.entries(data.marketSignals).filter(([title]) => titles.has(title))))
    assert.deepEqual(body.toolkit, TOOLKIT_V2)
    assert.deepEqual(body.methodology, FIELD_VELOCITY_METHODOLOGY)
  }
  assert.equal(route.POST, undefined)
  assert.equal(route.PUT, undefined)
})

test('unknown or malformed area fails closed before loading or fetching', async (t) => {
  assert.ok(existsSync('src/app/api/field-velocity/[area]/route.ts'), 'missing read-only field-velocity endpoint')
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('invalid area must not fetch') })
  const { GET } = source('app/api/field-velocity/[area]/route.ts')
  for (const area of ['unknown', 'Neurotech', 'neurotech/', '', '__proto__', '../neurotech']) {
    const response = await GET(new Request('https://www.plrd.org/api/field-velocity/unknown/'), { params: Promise.resolve({ area }) })
    assert.equal(response.status, 404, area)
    assert.equal(response.headers.get('access-control-allow-origin'), '*')
    assert.deepEqual(await response.json(), { error: 'Unknown focus area' })
  }
  assert.equal(fetchMock.mock.callCount(), 0)
})
