import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('Arcade keeps its word boundary and shrinkable single-column layout on narrow screens', () => {
  // Reproduced in real Chrome at a 320px device viewport: the hidden last <br>
  // joined Unexpected + worlds and inflated the layout viewport to 350px.
  const css = readFileSync('src/components/lab/explorations/lab-explorations.module.css', 'utf8')
  assert.doesNotMatch(css, /\.cabinetIntro h1 br:last-child\s*\{\s*display:\s*none/)
  assert.match(css, /\.arcadeGrid\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);\s*padding-top:\s*32px/)
})
