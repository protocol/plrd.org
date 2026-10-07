import { test } from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { source } from './test-source-loader.mjs'

const dom = new JSDOM('<!doctype html><html><body style="padding-bottom:7px"><main id="app"></main></body></html>', { url: 'http://localhost/impact-preview-eb61fba1b98e/' })
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'KeyboardEvent']) globalThis[key] = dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const { createPortal } = await import('react-dom')
const { useGalleryDialog } = source('components/useGalleryDialog.ts')
Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })
Object.defineProperty(document.documentElement, 'clientWidth', { get: () => document.body.style.overflow === 'hidden' ? 1440 : 1425, configurable: true })
const layoutReads = []
Object.defineProperty(document.documentElement, 'clientHeight', { get: () => {
  layoutReads.push({ overflow: document.body.style.overflow, right: document.body.style.paddingRight, bottom: document.body.style.paddingBottom })
  return document.body.style.overflow === 'hidden' ? 1000 : 985
}, configurable: true })

function Dialog() {
  const ref = useGalleryDialog(() => {})
  return createPortal(React.createElement('div', null, React.createElement('section', { ref, role: 'dialog' }, React.createElement('button', null, 'Close'))), document.body)
}

test('modal lock reserves the disappearing horizontal scrollbar height to avoid bottom-scroll clamping', async () => {
  const root = createRoot(document.getElementById('app'))
  try {
    await act(() => root.render(React.createElement(Dialog)))
    assert.equal(document.body.style.paddingBottom, '22px', 'preserve existing padding plus the 15px gained viewport height')
    assert.equal(document.body.style.overflow, 'hidden')
    layoutReads.length = 0
  } finally { await act(() => root.unmount()) }
  assert.equal(document.body.style.paddingBottom, '7px', 'restore the exact original inline padding')
  assert.equal(document.body.style.overflow, '')
  assert.ok(layoutReads.some(read => read.overflow === '' && read.right === '' && read.bottom === '22px'), 'flush restored horizontal scrollbar after width compensation, before removing its height reservation')
})
