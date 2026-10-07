import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import postcss from 'postcss'
import { JSDOM } from 'jsdom'
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8')
const article = JSON.parse(read('src/data/generated/blog.json')).find(post => post.title === 'Neurotech as a Frontier for Human Flourishing')
test('Neuro opportunity spaces render as bullets', () => {
  assert.ok(/<ul>\s*<li>Neural Augmentation \(Brain-Computer Interfaces\)<\/li>\s*<li>Biologically Inspired Intelligence \(NeuroAI\)<\/li>\s*<li>Whole Organism Emulation \(WOE\)<\/li>\s*<\/ul>/.test(article.html), 'Introductory opportunity spaces must be an unordered list')
})

test('Looking Ahead keeps its exact milestones in a visibly numbered prose list', () => {
  const { document } = new JSDOM(`<article class="page-content">${article.html}</article>`).window
  const heading = [...document.querySelectorAll('h2')].find(h => h.textContent === 'Looking Ahead')
  const list = heading.nextElementSibling.nextElementSibling
  assert.equal(list.tagName, 'OL')
  assert.deepEqual([...list.children].map(li => li.textContent), [
    '10,000 invasive high-bandwidth neural implants in humans',
    '100,000,000 hours of human neural data',
    'A whole brain mouse connectome completed',
  ])
  // Tailwind Preflight removes native markers; prose must explicitly restore them.
  const styles = {}
  postcss.parse(read('src/app/globals.css')).walkRules(rule => {
    if (rule.selector === '.page-content ol:not([class])') {
      rule.walkDecls(decl => { styles[decl.prop] = decl.value })
    }
  })
  assert.equal(styles['list-style-type'], 'decimal', 'Ordinary prose ordered lists need visible decimal markers')
  assert.ok(parseFloat(styles['padding-left']) > 0, 'Outside markers need an inset')
})

test('Each opportunity space introduces its inflection cards, with the definition only in the first', () => {
  const { document } = new JSDOM(article.html).window
  const intros = [...document.querySelectorAll('h3')].filter(h => h.textContent === 'Inflection Points')
  assert.equal(intros.length, 3, 'Each of the three opportunity spaces needs a section heading')
  const approvedIntros = [
    "Looking forward, clinical capabilities that create demand beyond medical use and an open BCI app ecosystem could greatly accelerate adoption.",
    "For NeuroAI, learning directly from neural data and achieving major energy savings through brain-inspired computing could mark the next inflection points.",
    "In whole organism emulation, demonstrating memory retrieval in simulation and completing a whole mouse-brain connectome could substantially accelerate progress."
  ]
  for (const [index, heading] of intros.entries()) {
    let intro = heading.nextElementSibling
    if (index === 0) {
      assert.equal(intro.textContent, 'An inflection point is a specific moment when field momentum can shift dramatically to accelerate progress.')
      intro = intro.nextElementSibling
    }
    assert.equal(intro.textContent, approvedIntros[index])
    assert.ok(intro.nextElementSibling.classList.contains('inflection'))
  }
  assert.equal((article.html.match(/An inflection point is/g) || []).length, 1)
  assert.equal(document.querySelectorAll('.inflection').length, 6)
})

test('PL Neuro in the mission paragraph links to its official site', () => {
  const { document } = new JSDOM(article.html).window
  const mission = [...document.querySelectorAll('p')].find(p => p.textContent.startsWith('PL Neuro exists to break bottlenecks:'))
  assert.equal(mission.querySelector('a')?.textContent, 'PL Neuro')
  assert.equal(mission.querySelector('a')?.getAttribute('href'), 'https://www.plneuro.xyz/')
})

test('Neuro interface wording uses directly', () => {
  assert.ok(article.html.includes('how directly they interact with neural tissue'))
  assert.ok(!article.html.includes('how invasively they interact'))
})
