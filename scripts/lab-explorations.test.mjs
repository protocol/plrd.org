import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import postcss from 'postcss'
import { source } from './velocity/test-source-loader.mjs'

const helperPath = 'components/lab/explorations/lab-explorations.ts'
const load = () => {
  assert.ok(existsSync(`src/${helperPath}`), 'explorations instrument is not implemented')
  return source(helperPath)
}

test('rule 90 evolves a single seed into the exact fixed-boundary lattice', () => {
  const { evolveAutomaton } = load()
  const config = { rule: 90, width: 7, rows: 4, seed: 'single', boundary: 'fixed' }
  assert.deepEqual(evolveAutomaton(config).map(row => row.join('')), [
    '0001000', '0010100', '0100010', '1010101',
  ])
  assert.deepEqual(evolveAutomaton(config), evolveAutomaton(config))
})

test('instrument rejects invalid or unbounded configurations before allocation', () => {
  const { evolveAutomaton } = load()
  const config = { rule: 90, width: 7, rows: 4, seed: 'single', boundary: 'fixed' }
  for (const invalid of [
    { rule: -1 }, { rule: 256 }, { rule: NaN }, { rule: 1.5 },
    { width: 2 }, { width: 242 }, { width: Infinity }, { rows: 0 }, { rows: 161 },
    { seed: 'random' }, { boundary: 'unknown' },
  ]) assert.throws(() => evolveAutomaton({ ...config, ...invalid }), /invalid automaton/i)
})

test('download artifacts contain reproducible configuration and the exact visible lattice', () => {
  const { makeAutomatonPrint, evolveAutomaton } = load()
  assert.equal(typeof makeAutomatonPrint, 'function', 'print exporter is missing')
  const config = { rule: 90, width: 7, rows: 5, seed: 'pair', boundary: 'wrap' }
  const print = makeAutomatonPrint(config)
  const packet = JSON.parse(print.json)
  assert.deepEqual(packet.config, config)
  assert.deepEqual(packet.cells, evolveAutomaton(config))
  assert.equal(packet.schema, 'org.plrd.explorations.automaton.v1')
  assert.match(packet.limit, /educational/i)
  assert.match(print.svg, /<svg[^>]*viewBox="0 0 7 5"/)
  assert.ok(print.svg.includes(`d="${print.path}"`))
  assert.match(print.svg, /<metadata>/)
  assert.doesNotMatch(print.svg, /<script|foreignObject|https?:\/\/[^" ]+\.(js|png)/)
  const litCells = packet.cells.flat().filter(Boolean).length
  assert.equal((print.path.match(/M/g) ?? []).length, litCells)
  assert.equal(print.json, makeAutomatonPrint(config).json)
  assert.notEqual(print.path, makeAutomatonPrint({ ...config, boundary: 'fixed' }).path)
  assert.notEqual(print.path, makeAutomatonPrint({ ...config, rule: 30 }).path)
  assert.notEqual(print.path, makeAutomatonPrint({ ...config, seed: 'single' }).path)
})

test('frontier questions have stable allowlisted URLs and honest actionable source briefs', () => {
  const { frontierQuestions, findFrontierQuestion, frontierHref } = load()
  assert.ok(Array.isArray(frontierQuestions), 'editorial frontier brief collection is missing')
  assert.equal(frontierQuestions.length, 4)
  assert.equal(new Set(frontierQuestions.map(question => question.id)).size, 4)
  for (const question of frontierQuestions) {
    assert.equal(findFrontierQuestion(question.id), question)
    assert.equal(frontierHref(question.id), `/lab/explorations/observatory/${question.id}/`)
    assert.match(question.status, /editorial/i)
    assert.ok(question.opening && question.exists && question.contribution && question.limit)
    assert.ok(question.sources.every(source => source.url.startsWith('https://') || source.url.startsWith('/areas/')))
  }
  for (const invalid of ['__proto__', '../../admin', 'javascript:alert(1)', 'missing', '', null]) {
    assert.equal(findFrontierQuestion(invalid), undefined)
    assert.throws(() => frontierHref(invalid), /unknown frontier question/i)
  }
})

test('scoped stylesheet resolves component classes and keeps secondary controls at touch size', () => {
  const base = 'src/components/lab/explorations/'
  const css = readFileSync(`${base}lab-explorations.module.css`, 'utf8')
  const root = postcss.parse(css)
  const selectors = new Set()
  root.walkRules(rule => { for (const match of rule.selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) selectors.add(match[1]) })
  for (const file of ['ScienceArcade', 'Observatory', 'ExplorationComparison']) {
    for (const match of readFileSync(`${base}${file}.tsx`, 'utf8').matchAll(/styles\.([a-zA-Z][\w]*)/g)) {
      assert.ok(selectors.has(match[1]), `undefined scoped class ${match[1]}`)
    }
  }
  for (const className of ['previewA', 'previewB', 'previewC']) assert.ok(selectors.has(className))
  for (const selector of ['.method summary', '.viewSwitch button', '.sourceLinks a']) {
    let minHeight
    root.walkRules(selector, rule => rule.walkDecls('min-height', declaration => { minHeight = declaration.value }))
    assert.equal(minHeight, '44px', `${selector} needs an accessible touch target`)
  }
})
