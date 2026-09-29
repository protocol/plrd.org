import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const file = new URL('../src/data/interventions-active.json', import.meta.url)

test('approved active catalogue additions exist as a public-only source edition', () => {
  assert.ok(existsSync(file), 'the approved public additions have not been authored')
  const records = JSON.parse(readFileSync(file, 'utf8'))
  const required = ['juan-benet-neuropodcast', 'bci-roadmap', 'pl-neuro-salon', 'bci-founders-retreat', 'connectomics-workshop', 'ierr-2025', 'dacc-2025']
  assert.deepEqual(records.map(r => r.slug).sort(), required.sort())
  assert.equal(new Set(records.map(r => r.slug)).size, records.length)
  for (const item of records) {
    assert.equal(item.published, true)
    assert.equal(item.sourceKind, 'public')
    for (const key of ['title', 'summary', 'bottleneck', 'work', 'evidence', 'timing', 'plRole', 'sourceNote']) {
      assert.ok(item[key]?.trim(), `${item.slug} missing ${key}`)
    }
    assert.ok(item.resources.length > 0, `${item.slug} needs inspectable public evidence`)
    for (const link of item.resources) {
      assert.ok(link.title.trim())
      const url = new URL(link.href)
      assert.equal(url.protocol, 'https:')
      assert.ok(['www.plneuro.xyz', 'plneuro.xyz', 'www.plrd.org', 'www.researchretreat.org', 'researchretreat.org', 'lu.ma', 'luma.com'].includes(url.hostname), `unreviewed source host ${url.hostname}`)
      assert.ok(!url.search, 'no tracking or signed source queries')
    }
  }
  assert.equal(records.find(r => r.slug === 'ierr-2025').area, 'rnd-acceleration')
  for (const slug of ['pl-neuro-salon', 'bci-founders-retreat', 'connectomics-workshop', 'ierr-2025', 'dacc-2025']) {
    assert.equal(records.find(r => r.slug === slug).stage, 'completed', `${slug} must not be called Live`)
  }
  for (const slug of ['juan-benet-neuropodcast', 'bci-roadmap']) {
    assert.equal(records.find(r => r.slug === slug).stage, 'active')
  }
  const body = JSON.stringify(records)
  assert.doesNotMatch(body, /docs\.google|plrd-interventions|commsconsole|@protocol\.ai|\$[\d,]+|did:plc:|api[_-]?key|bearer/i)
})

test('podcast collection includes every known published Season 1 guest exactly once', () => {
  assert.ok(existsSync(file), 'approved podcast collection is absent')
  const podcast = JSON.parse(readFileSync(file, 'utf8')).find(r => r.slug === 'juan-benet-neuropodcast')
  for (const guest of ['Allison Duettmann', 'Konrad Kording', 'Tom Oxley', 'Ben Rapoport', 'Jacques Carolan', 'Max Hodak', 'Adam Marblestone']) {
    assert.equal(podcast.resources.filter(r => r.title.includes(guest)).length, 1, guest)
  }
  assert.equal(new Set(podcast.resources.map(r => r.href)).size, podcast.resources.length)
})

test('BCI Roadmap includes overview and editions 1–3 exactly once', () => {
  assert.ok(existsSync(file), 'approved roadmap collection is absent')
  const roadmap = JSON.parse(readFileSync(file, 'utf8')).find(r => r.slug === 'bci-roadmap')
  assert.equal(roadmap.resources.length, 4)
  for (const token of ['overview', 'roadmap-1-', 'roadmap-2-', 'roadmap-3-']) {
    assert.equal(roadmap.resources.filter(r => r.href.includes(token)).length, 1)
  }
})
