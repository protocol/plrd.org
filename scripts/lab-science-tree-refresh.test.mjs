import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const snapshot = JSON.parse(readFileSync('src/data/lab-science-tree.json', 'utf8'))
const byId = new Map(snapshot.nodes.map(node => [node.id, node]))
const columns = ['topic_id', 'topic_name', 'subfield_id', 'subfield_name', 'field_id', 'field_name', 'domain_id', 'domain_name', 'keywords', 'summary', 'wikipedia_url']
// Reconstructed CSV is a deterministic local fixture, not a claimed source download.
const rows = snapshot.nodes.filter(node => node.kind === 'topic').map(topic => {
  const row = { keywords: topic.keywords, summary: topic.description, wikipedia_url: '' }
  for (let node = topic; node; node = byId.get(node.parent)) {
    row[`${node.kind}_id`] = node.sourceId
    row[`${node.kind}_name`] = node.label
  }
  return row
})
const csv = data => [columns.join(','), ...data.map(row => columns.map(key => `"${String(row[key]).replaceAll('"', '""')}"`).join(','))].join('\n') + '\n'
function run(t, data) {
  const dir = mkdtempSync(join(tmpdir(), 'lab-science-refresh-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const input = join(dir, 'input.csv'), output = join(dir, 'output.json')
  writeFileSync(input, data)
  writeFileSync(output, 'preserve previous snapshot')
  const result = spawnSync('python3', ['scripts/refresh-lab-science-tree.py', '--input', input, '--checked-on', '2026-09-11', '--output', output], { encoding: 'utf8', timeout: 15000 })
  assert.equal(result.error, undefined)
  return { result, output: readFileSync(output, 'utf8') }
}

test('offline refresh preserves all source nodes, descriptions and IDs and stamps the actual input hash', t => {
  const data = csv(rows)
  const { result, output } = run(t, data)
  assert.equal(result.status, 0, result.stderr)
  const refreshed = JSON.parse(output)
  assert.deepEqual(refreshed.nodes, snapshot.nodes)
  assert.deepEqual(refreshed.counts, snapshot.counts)
  assert.equal(refreshed.provenance.sourceSha256, createHash('sha256').update(data).digest('hex'))
})

for (const [name, mutate, message] of [
  ['malformed IDs without normalization', data => { data[0].topic_id = 'T10001' }, /Invalid source topic ID/],
  ['duplicate topics', data => { data.push(data[0]) }, /Duplicate topic/],
  ['conflicting ancestor labels', data => { data[1].domain_name = 'conflicting name' }, /Conflicting source hierarchy/],
  ['incomplete universes', data => { data.pop() }, /Source universe changed or is incomplete/],
  ['missing descriptions', data => { data[0].summary = '' }, /Missing description/],
]) test(`offline refresh rejects ${name} without replacing the previous file`, t => {
  const data = structuredClone(rows); mutate(data)
  const { result, output } = run(t, csv(data))
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, message)
  assert.equal(output, 'preserve previous snapshot')
})
