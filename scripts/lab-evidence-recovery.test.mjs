import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
require.extensions['.css'] = () => {}
const key = 'plrd-open-lab:evidence-pilot:v1'
const empty = { version: 1, researchText: '', reviewText: '', by: '', note: '' }
const { evidenceTask, parseEvidenceResult } = source('lib/lab-evidence-ledger.ts')
const result = (role) => JSON.stringify({ schemaVersion: 1, taskId: evidenceTask.id, sourceUrl: evidenceTask.sourceUrl, role, contributor: `Synthetic ${role}`, runner: 'human', quote: 'Synthetic test excerpt, not evidence.', location: 'Synthetic location', assessment: role === 'research' ? 'supports' : 'contradicts', limitation: 'Synthetic UI fixture only.' })

async function mounted(raw, run, { unavailable = false } = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/lab/collaborate/' })
  const saved = {}
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'localStorage', 'fetch', 'IS_REACT_ACT_ENVIRONMENT']) {
    saved[name] = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { value: name === 'fetch' ? () => { throw Error('Unexpected network') } : name === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[name], configurable: true, writable: true })
  }
  const store = dom.window.localStorage
  if (raw !== null) store.setItem(key, raw)
  store.setItem('unrelated-draft', 'must survive')
  let writes = 0
  const originalSet = dom.window.Storage.prototype.setItem
  dom.window.Storage.prototype.setItem = function (...args) { writes++; return originalSet.apply(this, args) }
  const originalGet = dom.window.Storage.prototype.getItem
  if (unavailable) dom.window.Storage.prototype.getItem = function () { throw Error('read blocked') }
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const Component = source('components/lab/LabEvidenceWorkbench.tsx').default
  let root = createRoot(document.getElementById('root'))
  const render = () => React.act(() => root.render(React.createElement(React.StrictMode, null, React.createElement(Component))))
  const read = () => originalGet.call(store, key)
  const fill = async (label, value) => {
    const el = document.querySelector(`[aria-label="${label}"]`)
    assert.ok(el, label)
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    await React.act(() => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) })
  }
  const click = async text => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text)
    assert.ok(el, text)
    await React.act(() => el.click())
  }
  try {
    await render()
    await run({ read, fill, click, React, dom, writes: () => writes, remount: async () => { await React.act(() => root.unmount()); root = createRoot(document.getElementById('root')); await render() } })
    assert.equal(originalGet.call(store, 'unrelated-draft'), 'must survive')
  } finally {
    await React.act(() => root.unmount())
    dom.window.close()
    for (const [name, descriptor] of Object.entries(saved)) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name] }
  }
}

for (const [name, raw] of [
  ['empty saved string', ''],
  ['malformed JSON', '{broken original\r\n'],
  ['unknown version 2', JSON.stringify({ ...empty, version: 2, researchText: 'future recoverable work' })],
  ['oversized raw', 'x'.repeat(900_000)],
  ['invalid field', JSON.stringify({ ...empty, note: { recoverable: 'do not erase' } })],
]) test(`F1 preserves ${name} on mount, edits, failed export, and remount`, async () => {
  await mounted(raw, async ({ read, fill, click, React, remount, writes }) => {
    assert.ok(read() === raw, 'original must survive mount byte-for-byte')
    assert.equal(writes(), 0, 'failed restore must inhibit autosave')
    assert.match(document.querySelector('[role="alert"]')?.textContent ?? '', /original.*(preserv|not overwritten)|preserv.*original/i)
    assert.doesNotMatch(document.querySelector('[role="alert"]').textContent, /storage is unavailable/i)
    await fill('Research return JSON', 'edited scratch text')
    await React.act(() => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    assert.ok(read() === raw, 'edits and failed review export cannot release recovery hold')
    assert.equal(writes(), 0)
    await remount()
    assert.ok(read() === raw)
  })
})

test('F1 two valid 40000-newline-prefixed returns survive save and remount', async () => {
  await mounted(null, async ({ read, fill, click, remount }) => {
    const inputs = {}
    for (const role of ['research', 'review']) {
      const label = `${role === 'research' ? 'Research' : 'Review'} return JSON`
      inputs[role] = '\n'.repeat(40000) + result(role)
      assert.ok(inputs[role].length < document.querySelector(`[aria-label="${label}"]`).maxLength)
      assert.ok(new TextEncoder().encode(inputs[role]).length < 64000)
      assert.equal(parseEvidenceResult(inputs[role], role).role, role)
      await fill(label, inputs[role]); await click(`Import ${role}`)
    }
    assert.match(document.body.textContent, /Different judgments/)
    const raw = read()
    assert.ok(raw.length > 150000 && raw.length > 128000)
    await remount()
    assert.ok(read() === raw, 'successful save must remain restorable, not become empty')
    for (const role of ['research', 'review']) assert.equal(document.querySelector(`[aria-label="${role === 'research' ? 'Research' : 'Review'} return JSON"]`).value, inputs[role])
  })
})

test('F1 unavailable restore never writes even if storage writes work', async () => {
  const raw = JSON.stringify({ ...empty, note: 'unreadable but recoverable' })
  await mounted(raw, async ({ read, fill, writes }) => {
    assert.ok(read() === raw)
    await fill('Resolution note', 'scratch edit')
    assert.equal(writes(), 0)
    assert.ok(read() === raw)
    assert.match(document.querySelector('[role="alert"]')?.textContent ?? '', /storage is unavailable/i)
  }, { unavailable: true })
})

test('F1 exact raw download and failed download never authorize replacement', async () => {
  const raw = ' \r\n{broken "😀"\r\n'
  await mounted(raw, async ({ read, click, dom }) => {
    const create = URL.createObjectURL, revoke = URL.revokeObjectURL
    const anchorClick = dom.window.HTMLAnchorElement.prototype.click
    let blob
    try {
      URL.createObjectURL = () => { throw Error('download blocked') }
      await click('Download saved original')
      assert.ok(read() === raw)
      assert.match(document.body.textContent, /Could not.*download/i)
      URL.createObjectURL = value => { blob = value; return 'blob:fixture' }
      URL.revokeObjectURL = () => {}
      dom.window.HTMLAnchorElement.prototype.click = () => {}
      await click('Download saved original')
      assert.equal(await blob.text(), raw)
      assert.ok(read() === raw)
    } finally { URL.createObjectURL = create; URL.revokeObjectURL = revoke; dom.window.HTMLAnchorElement.prototype.click = anchorClick }
  })
})

test('F1 explicit confirmed replacement only replaces the evidence key', async () => {
  await mounted('{bad', async ({ read, fill, click, React, remount }) => {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent === 'Replace saved evidence with current draft')
    assert.ok(button, 'explicit replacement control')
    assert.equal(button.disabled, true)
    await fill('Resolution note', 'manually reconciled copy')
    await React.act(() => document.querySelector('[aria-label="Confirm replacement of saved evidence"]').click())
    await click('Replace saved evidence with current draft')
    assert.equal(JSON.parse(read()).note, 'manually reconciled copy')
    await remount()
    assert.equal(document.querySelector('[aria-label="Resolution note"]').value, 'manually reconciled copy')
  })
})

test('F1 replacement failure preserves the original and input edits require fresh confirmation', async () => {
  await mounted('{bad', async ({ read, fill, click, React, dom, writes }) => {
    const confirm = () => document.querySelector('[aria-label="Confirm replacement of saved evidence"]')
    await React.act(() => confirm().click())
    await fill('Resolution note', 'changed after confirmation')
    assert.equal(confirm().checked, false)
    await click('Replace saved evidence with current draft')
    assert.equal(read(), '{bad')
    const set = dom.window.Storage.prototype.setItem
    try {
      dom.window.Storage.prototype.setItem = () => { throw Error('quota exceeded') }
      await React.act(() => confirm().click())
      await click('Replace saved evidence with current draft')
      assert.equal(read(), '{bad')
      assert.match(document.body.textContent, /Could not replace.*autosave remains paused/)
    } finally { dom.window.Storage.prototype.setItem = set }
    await fill('Resolution note', 'another unsaved edit')
    assert.equal(read(), '{bad')
    assert.equal(writes(), 0)
  })
})

for (const raw of ['x'.repeat(900_000), '{broken\ud800']) test(`F1 unsafe recovery export is withheld (${raw.length} code units)`, async () => {
  await mounted(raw, async ({ read }) => {
    assert.ok(read() === raw)
    assert.equal([...document.querySelectorAll('button')].some(b => b.textContent === 'Download saved original'), false)
    assert.match(document.body.textContent, /Exact-raw download is unavailable.*browser developer tools/)
  })
})

test('F1 an out-of-control-limit edit cannot replace a restorable saved draft', async () => {
  const raw = JSON.stringify({ ...empty, note: 'saved work' })
  await mounted(raw, async ({ read, fill, writes, remount }) => {
    assert.equal(writes(), 0, 'opening even a valid draft need not rewrite it')
    await fill('Research return JSON', 'x'.repeat(64001))
    assert.ok(read() === raw)
    assert.match(document.body.textContent, /Could not save locally/)
    await remount()
    assert.equal(document.querySelector('[aria-label="Resolution note"]').value, 'saved work')
  })
})

test('F1 worst-case JSON escaping at every permitted control limit is restorable', async () => {
  await mounted(null, async ({ fill, read, remount }) => {
    for (const label of ['Research return JSON', 'Review return JSON', 'Local reviewer name', 'Resolution note']) {
      const el = document.querySelector(`[aria-label="${label}"]`)
      await fill(label, '\u0000'.repeat(el.maxLength))
    }
    const raw = read()
    assert.equal(JSON.parse(raw).researchText.length, 64000)
    await remount()
    assert.ok(read() === raw)
    assert.equal(document.querySelector('[aria-label="Resolution note"]').value.length, 2000)
  })
})
