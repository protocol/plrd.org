import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

test('only Live status pills use a gentle green treatment', () => {
  const Tag = source('components/InterventionStatusTag.tsx').default
  const { publishedInterventions } = source('lib/interventions.ts')
  const item = publishedInterventions()[0]
  for (const stage of ['active', 'raising', 'proposed', 'completed', 'published']) {
    const doc = new JSDOM(renderToStaticMarkup(React.createElement(Tag, { item: { ...item, stage } }))).window.document
    const tag = doc.querySelector('[data-intervention-status]')
    const live = stage === 'active'
    assert.ok(tag.classList.contains(live ? 'bg-green-50' : 'bg-gray-100'), `${stage} background`)
    assert.ok(tag.classList.contains(live ? 'text-green-800' : 'text-gray-600'), `${stage} text`)
    assert.ok(!tag.classList.contains(live ? 'bg-gray-100' : 'bg-green-50'), `${stage} has no conflicting background`)
    assert.ok(!tag.classList.contains(live ? 'text-gray-600' : 'text-green-800'), `${stage} has no conflicting text colour`)
    assert.ok(tag.getAttribute('title'), 'status meaning remains available')
  }
})
