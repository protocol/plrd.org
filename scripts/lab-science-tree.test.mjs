import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const model = () => {
  assert.ok(existsSync('src/lib/lab-science-tree.ts'), 'a broad sourced science model is missing')
  return source('lib/lab-science-tree.ts')
}

test('global search, source links, breadcrumbs and branch pagination cover the full universe', () => {
  const m = model()
  assert.equal(typeof m.searchScience, 'function', 'full-universe search is missing')
  assert.equal(m.getScienceChildren('science').length, 4)
  assert.deepEqual(m.getSciencePath('topic:T10001').map(n => n.id), ['science', 'domain:3', 'field:19', 'subfield:1908', 'topic:T10001'])
  assert.equal(m.searchScience('Geological and Geochemical Analysis')[0].id, 'topic:T10001')
  assert.ok(m.searchScience('zircon').some(n => n.id === 'topic:T10001'))
  assert.ok(m.searchScience('veterinary').length > 0)
  assert.deepEqual(m.searchScience('nonexistent-zzzzzz'), [])
  assert.deepEqual(m.searchScience('   '), [])
  const children = m.getScienceChildren('field:27')
  const first = m.pageScienceNodes(children, 0, 8)
  const second = m.pageScienceNodes(children, 1, 8)
  assert.equal(first.items.length, 8)
  assert.equal(first.total, children.length)
  assert.ok(second.items.every(n => !first.items.some(a => a.id === n.id)))
  assert.deepEqual(m.pageScienceNodes([], 999, 8), { items: [], page: 0, pages: 1, total: 0 })
  assert.equal(m.pageScienceNodes(children, -5, 8).page, 0)
  assert.equal(m.scienceHref('topic:T10001'), '/lab/explorations/observatory/?node=topic%3AT10001')
  assert.throws(() => m.scienceHref('__proto__'), /Unknown/)
  assert.equal(m.scienceSourceHref('topic:T10001'), 'https://openalex.org/T10001')
  assert.equal(m.scienceSourceHref('field:19'), 'https://api.openalex.org/fields/19')
  assert.equal(m.getScienceNode('__proto__'), undefined)
  assert.equal(m.getScienceChildren('topic:T10001').length, 0)
})

test('the pinned OpenAlex snapshot contains every sourced hierarchy node exactly once', () => {
  const { scienceNodes, scienceSnapshot, validateScienceSnapshot, getSciencePath } = model()
  assert.deepEqual(validateScienceSnapshot(scienceSnapshot), [])
  assert.deepEqual(scienceSnapshot.counts, { domain: 4, field: 26, subfield: 252, topic: 4516 })
  assert.equal(scienceNodes.length, 4799) // includes one explicitly editorial universe root
  assert.equal(new Set(scienceNodes.map(n => n.id)).size, scienceNodes.length)
  assert.match(scienceSnapshot.provenance.sourceSha256, /^[a-f0-9]{64}$/)
  assert.equal(scienceSnapshot.provenance.license, 'CC0')
  for (const node of scienceNodes.filter(n => n.kind === 'topic')) {
    const path = getSciencePath(node.id)
    assert.deepEqual(path.map(n => n.kind), ['root', 'domain', 'field', 'subfield', 'topic'])
    assert.equal(node.id, `topic:T${node.sourceId}`)
    assert.ok(node.description.length > 0)
  }
  const fields = scienceNodes.filter(n => n.kind === 'field').map(n => n.label)
  for (const label of ['Mathematics', 'Physics and Astronomy', 'Chemistry', 'Medicine', 'Arts and Humanities', 'Social Sciences', 'Agricultural and Biological Sciences']) assert.ok(fields.includes(label), label)
  const corrupt = structuredClone(scienceSnapshot)
  corrupt.nodes[4].parent = 'missing:parent'
  assert.ok(validateScienceSnapshot(corrupt).some(e => /parent/i.test(e)))
  const duplicate = structuredClone(scienceSnapshot)
  duplicate.nodes.push(duplicate.nodes[0])
  assert.ok(validateScienceSnapshot(duplicate).some(e => /duplicate/i.test(e)))
})
