import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'
import { source } from './velocity/test-source-loader.mjs'
createRequire(import.meta.url).extensions['.css'] = module => { module.exports = {} }

test('returning-reader instructions are available on demand, not an extra paragraph before every update', () => {
 const Daily = source('components/lab/feed/DailyCatchup.tsx').default
 const daily = { state: {}, ready: true, isReviewed: () => false, notice: '', error: '' }
 const html = renderToStaticMarkup(React.createElement(Daily, { daily, rows: [], view: 'unread', setView: () => {}, hasFollows: true, isDemo: true, status: 'ready', followedCount: 0, onFollowing: () => {} }))
 const doc = new JSDOM(html).window.document
 assert.match(doc.querySelector('details').textContent, /Unread means not yet acknowledged here/)
 assert.ok([...doc.querySelectorAll('section > p')].every(p => !p.textContent.includes('Unread means')))
})
const shell=()=>postcss.parse(readFileSync('src/components/lab/lab-app-shell.css','utf8'))
const feed=()=>postcss.parse(readFileSync('src/components/lab/feed/feed.module.css','utf8'))
const declarations=(root,selector)=>{const out={};root.walkRules(selector,r=>r.walkDecls(d=>out[d.prop]=d.value));return out}
test('daily surface uses the available width and separates white stream from tinted context',()=>{
 assert.equal(declarations(shell(),'.open-lab.lab-app-shell')['--lab-content-width'],'1600px','Wide working canvas missing')
 assert.equal(declarations(feed(),'.root')['max-width'],'var(--lab-content-width, 1600px)')
 assert.equal(declarations(feed(),'.stream').background,'var(--lab-card)')
 assert.equal(declarations(feed(),'.context').background,'var(--lab-context-bg)')
 assert.match(declarations(feed(),'.layout')['grid-template-columns'],/minmax\(0,\s*1fr\)/)
 assert.match(declarations(feed(),'.row')['border-top'],/var\(--lab-line\)/)
 const css=readFileSync('src/components/lab/feed/feed.module.css','utf8')
 assert.match(css,/\.dailyActions/);assert.match(css,/\.reviewLine/)
 assert.match(css,/@media\s*\(max-width:\s*600px\)/)
})

test('activity context is available on demand rather than repeated above every row action',()=>{
 const code=readFileSync('src/components/lab/feed/MixedScienceFeed.tsx','utf8')
 assert.match(code,/<details className=\{styles.rowContext\}>/,'Row provenance and tags need progressive disclosure')
 assert.match(code,/Demo scenario/,'Illustrative rows retain visible provenance even when context is closed')
 assert.match(code,/Explore the tech tree/)
})
