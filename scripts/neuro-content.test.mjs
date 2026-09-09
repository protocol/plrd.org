import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8')
const article = JSON.parse(read('src/data/generated/blog.json')).find(post => post.title === 'Neurotech as a Frontier for Human Flourishing')
test('Neuro opportunity spaces render as bullets', () => {
  assert.ok(/<ul>\s*<li>Neural Augmentation \(Brain-Computer Interfaces\)<\/li>\s*<li>Biologically Inspired Intelligence \(NeuroAI\)<\/li>\s*<li>Whole Organism Emulation \(WOE\)<\/li>\s*<\/ul>/.test(article.html), 'Introductory opportunity spaces must be an unordered list')
})

test('Neuro interface wording uses directly', () => {
  assert.ok(article.html.includes('how directly they interact with neural tissue'))
  assert.ok(!article.html.includes('how invasively they interact'))
})
