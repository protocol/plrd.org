export type AutomatonConfig = {
  rule: number
  width: number
  rows: number
  seed: 'single' | 'pair'
  boundary: 'fixed' | 'wrap'
}

/** Wolfram numbering: neighborhood 111 is bit 7; 000 is bit 0. */
export function evolveAutomaton(config: AutomatonConfig): number[][] {
  const { rule, width, rows, seed, boundary } = config
  if (!Number.isInteger(rule) || rule < 0 || rule > 255 ||
      !Number.isInteger(width) || width < 3 || width > 241 ||
      !Number.isInteger(rows) || rows < 1 || rows > 160 ||
      !['single', 'pair'].includes(seed) || !['fixed', 'wrap'].includes(boundary)) {
    throw new RangeError('Invalid automaton configuration')
  }
  const first = Array<number>(width).fill(0)
  first[Math.floor(width / 2)] = 1
  if (seed === 'pair') first[Math.floor(width / 2) + 1] = 1
  const result = [first]
  for (let y = 1; y < rows; y++) {
    const previous = result[y - 1]
    const at = (x: number) => boundary === 'wrap'
      ? previous[(x + width) % width]
      : (previous[x] ?? 0)
    result.push(Array.from({ length: width }, (_, x) =>
      (rule >> ((at(x - 1) << 2) | (at(x) << 1) | at(x + 1))) & 1))
  }
  return result
}

export function makeAutomatonPrint(config: AutomatonConfig) {
  const cells = evolveAutomaton(config)
  const path = cells.flatMap((row, y) => row.flatMap((cell, x) =>
    cell ? [`M${x} ${y}h1v1h-1z`] : [])).join('')
  const packet = {
    schema: 'org.plrd.explorations.automaton.v1',
    config: { rule: config.rule, width: config.width, rows: config.rows, seed: config.seed, boundary: config.boundary },
    convention: 'Row 0 is the seed. Columns run left to right. Neighborhood 111 is bit 7; 000 is bit 0. Fixed edges are zero; wrap edges join.',
    limit: 'Synthetic educational model, not a simulation of biological cells or evidence of a scientific discovery.',
    cells,
  }
  const json = JSON.stringify(packet, null, 2)
  // Configuration is validated and narrowed above. Escape XML even for static metadata.
  const metadata = JSON.stringify({ ...packet, cells: undefined })
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${config.width} ${config.rows}" width="${config.width * 8}" height="${config.rows * 8}" shape-rendering="crispEdges"><title>Open Lab — Rule ${config.rule}</title><metadata>${metadata}</metadata><rect width="100%" height="100%" fill="#F8F7F3"/><path d="${path}" fill="#1982F4"/></svg>`
  return { cells, path, json, svg }
}

export type FrontierQuestion = {
  id: string
  number: string
  field: string
  shortTitle: string
  question: string
  method: string
  x: number
  y: number
  status: string
  exists: string
  opening: string
  contribution: string
  limit: string
  sources: { label: string; url: string }[]
}

// An editorial arrangement, not a quantitative embedding or a social graph.
export const frontierQuestions: FrontierQuestion[] = [
  {
    id: 'verifiable-artifacts', number: '01', field: 'Digital human rights',
    shortTitle: 'Trust the artifact?', question: 'Can someone verify a result without trusting its author?',
    method: 'Provenance', x: 22, y: 26, status: 'Editorial starter',
    exists: 'IPFS content addressing identifies data by its content and encoding, rather than by the server that hosts it.',
    opening: 'What should travel with a research result so that another person can identify the exact inputs, code, and output?',
    contribution: 'A small reproducibility manifest for a public result: input identifiers, code revision, environment, output identifiers, and a clear statement of what was actually checked.',
    limit: 'Matching bytes do not prove a claim is true. Content addressing does not guarantee availability, authorship, or scientific validity.',
    sources: [{ label: 'IPFS · Content Identifiers', url: 'https://docs.ipfs.tech/concepts/content-addressing/' }],
  },
  {
    id: 'portable-evaluations', number: '02', field: 'AI & robotics',
    shortTitle: 'Does the score travel?', question: 'What changes when a benchmark leaves the lab?',
    method: 'Reproduction', x: 73, y: 23, status: 'Editorial starter',
    exists: 'EleutherAI’s Language Model Evaluation Harness provides reusable tasks and model evaluation tooling.',
    opening: 'Can you explain a score difference without changing the model? Start with one public task definition and its prompting and scoring choices.',
    contribution: 'A pinned task revision, model revision, prompt, decoding settings, scoring method, and a side-by-side account of one controlled change. Label any run you have not performed.',
    limit: 'This is a proposed investigation, not a reproduced benchmark or an invitation from the maintainers. Running models may cost money; nothing runs here.',
    sources: [{ label: 'EleutherAI · Evaluation Harness', url: 'https://github.com/EleutherAI/lm-evaluation-harness' }],
  },
  {
    id: 'neural-measurements', number: '03', field: 'Neurotech',
    shortTitle: 'Comparable to what?', question: 'Which neural measurements are actually comparable?',
    method: 'Measurement', x: 71, y: 73, status: 'Editorial starter',
    exists: 'The public Neuro Atlas repository organizes field evidence with provenance. PL Neuro’s published field overview describes the broader opportunity spaces.',
    opening: 'When two sources report recording scale, are they counting the same thing? Identify a specific pair before drawing a trend.',
    contribution: 'Two public source links, exact quoted measurements, units, recording duration, modality, organism, and a reason the observations should—or should not—be compared.',
    limit: 'A source audit is not peer review. This page does not modify the Atlas; its hosted app may require access. The public repository is the source here.',
    sources: [{ label: 'Neuro Atlas · Public repository', url: 'https://github.com/lksbrssr/neuro-atlas' }, { label: 'PL Neuro · Published field overview', url: 'https://www.plneuro.xyz/insights/neurotech-frontier-human-flourishing/' }],
  },
  {
    id: 'robust-coordination', number: '04', field: 'Economies & governance',
    shortTitle: 'Who can change the outcome?', question: 'Can a coordination mechanism survive strategic behavior?',
    method: 'Counterexample', x: 22, y: 75, status: 'Editorial starter',
    exists: 'PL R&D’s Economies & Governance focus area explores mechanism design, coordination, and capital allocation.',
    opening: 'Choose one explicitly defined allocation rule. Where does its desirable outcome depend on participants reporting their preferences honestly?',
    contribution: 'A minimal worked example with the rule, participant assumptions, a truthful outcome, one strategic deviation, and who gains or loses. Separate model results from real-world predictions.',
    limit: 'This is an editorial question, not an active funded campaign. A toy counterexample does not establish how a real institution behaves.',
    sources: [{ label: 'PL R&D · Economies & Governance', url: '/areas/economies-governance/' }],
  },
]

export function findFrontierQuestion(id: unknown) {
  return frontierQuestions.find(question => question.id === id)
}

export function frontierHref(id: string) {
  if (!findFrontierQuestion(id)) throw new RangeError('Unknown frontier question')
  return `/lab/explorations/observatory/${id}/`
}
