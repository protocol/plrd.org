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

test('the home uses a single compact workshop invitation above the actual feed', () => {
  const Provider=source('lib/lab-auth.tsx').LabAuthProvider
  const html = renderToStaticMarkup(React.createElement(Provider,null,React.createElement(source('components/lab/Landing.tsx').default)))
  const doc = new JSDOM(html).window.document
  const invitation=doc.querySelector('[aria-label="Workshop invitation"]')
  assert.ok(invitation.querySelector('button[aria-label="What are you making? Show a build →"]'))
  assert.match(invitation.textContent, /Catch up.*Find what changed/)
  assert.equal(doc.querySelector('.lab-welcome'),null)
  assert.ok(doc.querySelector('[aria-label="Mixed science feed"]'));assert.equal(doc.querySelector('.lab-hero'),null)
})

test('login preserves only known demo discussion contexts without normalizing the original', () => {
 const {safeLabReturnTo}=source('lib/lab-oauth-config.ts');
 for(const id of ['split-boundary','duration-denominator','receipt-permission']){
  const path=`/lab/demo/?discussion=${id}#demo-discussion-${id}`;
  assert.equal(safeLabReturnTo(path),path);
 }
 for(const path of ['/lab/demo/?discussion=unknown','/lab/feed/?discussion=split-boundary','/lab/demo/?discussion=split-boundary&redirect=evil','/lab/demo/?discussion=split-boundary&discussion=split-boundary','/lab/demo/?discussion=split-boundary#demo-discussion-duration-denominator','/lab/%64emo/?discussion=split-boundary','/lab/demo/?discussion=split%252dboundary'])assert.equal(safeLabReturnTo(path),'/lab/',path);
});

test('composition responsive overrides outrank base styles regardless of CSS import order', async () => {
 const {readFileSync}=await import('node:fs');
 const css=readFileSync('src/components/lab/lab-app-shell.css','utf8');
 const shell=readFileSync('src/components/lab/LabShell.tsx','utf8');
 assert.match(shell,/className="open-lab lab-composed lab-app-shell"/);
 assert.match(css,/\.open-lab\.lab-app-shell/);
 assert.match(css,/min-height: 44px/);assert.match(css,/@media/);
});

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
