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

test('Diagnose leads with nested field-velocity charts, then bottlenecks; Intervene holds the hand and culture layer; Learn holds inflections', async (t) => {
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

  assert.equal(diagnoseDashboards.length, 1)
  assert.equal(diagnoseDashboards[0].props.mode, 'charts')
  assert.equal(diagnoseDashboards[0].props.orientation, 'vertical')
  assert.equal(diagnoseDashboards[0].props.signals.length, 6)
  assert.equal(interveneDashboards.length, 0)
  assert.equal(learnDashboards.length, 1)
  assert.equal(learnDashboards[0].props.mode, 'inflections')

  const diagnoseText = text(diagnose)
  const interveneText = text(intervene)
  const learnText = text(learn)
  assert.match(diagnoseText, /Six ways to read field velocity/)
  assert.match(diagnoseText, /Identify the bottlenecks/)
  assert.doesNotMatch(diagnoseText, /Name the thing that is stuck/)
  assert.ok(diagnoseText.indexOf('Six ways to read field velocity') < diagnoseText.indexOf('Identify the bottlenecks'))
  assert.match(interveneText, /Documenting our hand/)
  assert.match(interveneText, /Culture/)
  assert.match(interveneText, /not a seventh/)
  assert.doesNotMatch(learnText, /Documenting our hand/)
  assert.match(learnText, /What would convince us the field has changed/)
  assert.ok(elements(intervene).some(node => node.props.id === 'verified-impact'))
  assert.ok(elements(intervene).some(node => node.props.id === 'toolkit'))
  assert.ok(elements(diagnose).some(node => node.props.id === 'field-velocity'))
  assert.ok(elements(diagnose).some(node => node.props.id === 'methodology'))
})
