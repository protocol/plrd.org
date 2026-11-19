import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const historicalFiles = [
  'src/data/site-content/provenance/2026-11-19/public-records.json',
  'src/data/site-content/provenance/2026-11-19/manifest.json',
  'src/data/site-content/migration-receipt.json',
]
const hashes = () => historicalFiles.map(file => createHash('sha256').update(readFileSync(file)).digest('hex'))
const run = mode => spawnSync(process.execPath, ['scripts/fixtures/site-content-control.mjs', mode], {
  encoding: 'utf8', timeout: 30_000, env: { ...process.env, NODE_TEST_CONTEXT: '' },
})

test('ongoing contracts accept current copy and ordinary editorial changes without rewriting history', async t => {
  const before = hashes()
  for (const mode of ['unchanged', 'page', 'opportunity', 'blog', 'blog-metadata', 'unlisted']) {
    await t.test(mode, () => {
      const result = run(mode)
      assert.equal(result.error, undefined)
      assert.equal(result.status, 0, `${mode} editorial contract failed:\n${result.stdout}\n${result.stderr}`)
    })
  }
  assert.deepEqual(hashes(), before, 'editorial controls must not change archive, manifest, or initial receipt')
})

test('ongoing contracts reject malformed/duplicate current data, remote fallback, and visibility leakage', async t => {
  const before = hashes()
  const controls = [
    ['bad-section', /section.*subtitle.*string/i],
    ['bad-timestamp', /updatedAt.*timestamp/i],
    ['duplicate-section', /duplicate section/i],
    ['duplicate-page', /duplicate page/i],
    ['bad-uri', /opportunity.*uri/i],
    ['bad-signals', /fieldSignals.*kpi.*string/i],
    ['duplicate-opportunity', /duplicate opportunity/i],
    ['duplicate-card', /duplicate blog listing card/i],
    ['duplicate-blog', /duplicate blog slug/i],
    ['bad-visibility', /unlisted must be a boolean/i],
    ['remote-fallback', /CMS network is forbidden/],
    ['unlisted-leak', /unlisted article leaked/i],
  ]
  for (const [mode, diagnostic] of controls) {
    await t.test(mode, () => {
      const result = run(mode)
      assert.equal(result.error, undefined)
      assert.notEqual(result.status, 0, `${mode} negative control unexpectedly passed`)
      assert.match(`${result.stdout}\n${result.stderr}`, diagnostic, `${mode} must fail for its intended contract`)
    })
  }
  assert.deepEqual(hashes(), before)
})
