import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'
import { source } from './velocity/test-source-loader.mjs'
// Node does not load stylesheets; layout/contrast are separately checked in Chrome.
createRequire(import.meta.url).extensions['.css'] = module => { module.exports = {} }
process.env.__NEXT_TRAILING_SLASH = 'true'

test('the main invitation starts at a bottleneck while retaining the experiment entrance', () => {
  const html = renderToStaticMarkup(React.createElement(source('components/lab/Landing.tsx').default))
  const doc = new JSDOM(html).window.document
  assert.equal(doc.querySelector('.lab-hero-actions a')?.getAttribute('href'), '/lab/bottlenecks/')
  assert.match(doc.querySelector('h1').textContent, /bottleneck/i)
  assert.ok(doc.querySelector('.lab-hero-copy a[href="/lab/apps/#signal-sandbox"]'))
})

test('LinkedIn survives profile defaults and public draft preparation with format validation', () => {
  const entry = source('lib/lab-entry.ts')
  const values = {...entry.entryDefaults('profile'), workingOn:'Reproducibility tools', interests:'ai-robotics', lookingFor:'A reviewer', linkedinUrl:'https://www.linkedin.com/in/demo-person/'}
  assert.equal(entry.entryDefaults('profile').linkedinUrl, '')
  assert.equal(entry.entryPayload('profile', values).linkedinUrl, values.linkedinUrl)
  assert.equal(entry.validateEntry('profile', values).linkedinUrl, undefined)
  assert.ok(entry.validateEntry('profile', {...values, linkedinUrl:'https://example.org/not-linkedin'}).linkedinUrl)
})

test('the collaboration route contains the actual researcher and reviewer return workbench', () => {
  const Page = source('app/lab/collaborate/page.tsx').default
  const doc = new JSDOM(renderToStaticMarkup(React.createElement(Page))).window.document
  assert.ok(doc.querySelector('textarea[aria-label="Research return JSON"]'))
  assert.ok(doc.querySelector('textarea[aria-label="Review return JSON"]'))
  assert.ok(doc.querySelector('#evidence-pilot'))
})
