import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { source } from './test-source-loader.mjs'

function elements(node) {
  if (!React.isValidElement(node)) return []
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}

function text(node) {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(text).join('')
  if (!React.isValidElement(node)) return ''
  return text(node.props.children)
}

test('Impact headline matches the catalog’s 32px mobile and 44px desktop scale', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/impact-preview-eb61fba1b98e/page.tsx').default
  const tree = await Page({ searchParams: Promise.resolve({}) })
  const heading = elements(tree).find(node => node.type === 'h1')
  assert.equal(text(heading).trim(), 'How we build fields.')
  const sizeClasses = heading.props.className.split(/\s+/).filter(token => /^(?:(?:sm|md|lg|xl):)?text-\[\d+px\]$/.test(token))
  assert.deepEqual(sizeClasses, ['text-[32px]', 'md:text-[44px]'])
})

test('Methodology tabs share the page backdrop instead of painting separate full-width bands', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/impact-preview-eb61fba1b98e/page.tsx').default
  const nodes = elements(await Page({ searchParams: Promise.resolve({}) }))
  for (const id of ['diagnose', 'methodology', 'intervene', 'learn', 'field-velocity']) {
    const surface = nodes.find(node => node.props.id === id)
    assert.ok(surface, `missing ${id}`)
    assert.doesNotMatch(surface.props.className ?? '', /(?:^|\s)(?:[\w-]+:)*bg-/, `${id} must inherit the common page backdrop`)
    assert.equal(surface.props.style?.background, undefined)
    assert.equal(surface.props.style?.backgroundColor, undefined)
  }
})

test('Diagnose leads with bottlenecks; Learn keeps field velocity without the contribution showcase', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  t.mock.method(console, 'warn', () => {})
  const Page = source('app/impact-preview-eb61fba1b98e/page.tsx').default
  const Dashboard = source('components/ImpactDashboardV2.tsx').default
  const tree = await Page({ searchParams: Promise.resolve({}) })
  const nodes = elements(tree)
  const diagnose = nodes.find(node => node.props.id === 'diagnose')
  const intervene = nodes.find(node => node.props.id === 'intervene')
  const learn = nodes.find(node => node.props.id === 'learn')
  const diagnoseDashboards = elements(diagnose).filter(node => node.type === Dashboard)
  const learnDashboards = elements(learn).filter(node => node.type === Dashboard)
  const interveneDashboards = elements(intervene).filter(node => node.type === Dashboard)

  assert.equal(diagnoseDashboards.length, 0)
  assert.equal(interveneDashboards.length, 0)
  assert.equal(learnDashboards.length, 1)
  assert.equal(learnDashboards[0].props.mode, 'all')
  assert.equal(learnDashboards[0].props.orientation, 'horizontal')
  assert.equal(learnDashboards[0].props.signals, undefined)

  const diagnoseText = text(diagnose)
  const interveneText = text(intervene)
  const learnText = text(learn)
  assert.match(diagnoseText, /Identify the bottlenecks/)
  assert.doesNotMatch(diagnoseText, /Six ways to read field velocity/)
  assert.doesNotMatch(diagnoseText, /Field velocity/)
  assert.doesNotMatch(diagnoseText, /Name the thing that is stuck/)
  assert.doesNotMatch(diagnoseText, /Two fields we are already asking it of|Connectomics Benchmark \+ Prize Program|Sovereign AI acceleration program/)
  assert.match(diagnoseText, /which of these is preventing this field from moving faster now\?/)
  assert.equal(elements(diagnose).find(node => 'data-bottlenecks' in node.props).props.children.length, 10)
  assert.match(interveneText, /Culture/)
  assert.match(interveneText, /not a seventh/)
  assert.doesNotMatch(interveneText, /Documenting our hand/)
  assert.match(learnText, /Field velocity/)
  assert.doesNotMatch(learnText, /Documenting our hand|Verified Impact \+ Hypercerts|See all impact claims/)
  assert.doesNotMatch(learnText, /Every intervention is a hypothesis/)
  assert.doesNotMatch(learnText, /Six ways to read field velocity/)
  assert.ok(!elements(learn).some(node => node.props.id === 'verified-impact'))
  assert.ok(elements(learn).some(node => node.props.id === 'field-velocity'))
  assert.ok(elements(intervene).some(node => node.props.id === 'toolkit'))
  assert.ok(!elements(intervene).some(node => node.props.id === 'verified-impact'))
  assert.ok(elements(diagnose).some(node => node.props.id === 'methodology'))
  assert.doesNotMatch(text(tree), /Back to the methodology/)
})
