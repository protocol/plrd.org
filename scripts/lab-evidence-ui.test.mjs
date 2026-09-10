import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
require.extensions['.css'] = () => {}
const makeResult = (role, assessment) => ({ schemaVersion: 1, taskId: 'flywire-source-audit-v1', sourceUrl: 'https://www.nih.gov/news-events/nih-research-matters/complete-wiring-map-adult-fruit-fly-brain', role, contributor: `Test ${role}`, runner: 'human', quote: 'Synthetic test excerpt, not evidence.', location: 'Test-only location', assessment, limitation: 'This is a synthetic UI fixture.' })

test('visitor imports research and review, sees dissent, and explicitly exports a local review with no network publish', async () => {
  assert.ok(existsSync('src/components/lab/LabEvidenceWorkbench.tsx'), 'missing evidence workbench')
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/lab/collaborate/' })
  const saved = {}
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'localStorage']) {
    saved[key] = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('root'))
  let exported = null
  const Component = source('components/lab/LabEvidenceWorkbench.tsx').default
  try {
    await React.act(() => root.render(React.createElement(Component, { onExport: bundle => { exported = bundle } })))
    const fill = async (label, value) => {
      const el = document.querySelector(`[aria-label="${label}"]`)
      assert.ok(el, label)
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      await React.act(() => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) })
    }
    const click = async text => { const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text); assert.ok(el, text); await React.act(() => el.click()) }
    await fill('Research return JSON', JSON.stringify(makeResult('research', 'supports')))
    await click('Import research')
    await fill('Review return JSON', JSON.stringify(makeResult('review', 'contradicts')))
    await click('Import review')
    assert.match(document.body.textContent, /Different judgments/)
    assert.equal(exported, null)
    await fill('Local reviewer name', 'Test local editor')
    await fill('Resolution note', 'The conflicting judgments need further source inspection.')
    await React.act(() => document.querySelector('[aria-label="I inspected the source evidence"]').click())
    await click('Export review bundle')
    assert.equal(exported.status, 'local-review-not-atlas-acceptance')
    assert.equal(exported.comparison.status, 'disagreement')
    assert.equal(exported.results.length, 2)
    assert.ok(localStorage.getItem('plrd-open-lab:evidence-pilot:v1'))
    assert.match(document.body.textContent, /not published/i)
  } finally {
    await React.act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of Object.entries(saved)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
