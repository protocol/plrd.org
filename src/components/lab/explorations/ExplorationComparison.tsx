'use client'

import { useState } from 'react'
import { makeAutomatonPrint } from '@/components/lab/explorations/lab-explorations'
import styles from '@/components/lab/explorations/lab-explorations.module.css'

const miniature = makeAutomatonPrint({ rule: 90, width: 61, rows: 40, seed: 'single', boundary: 'fixed' })
const entrances = [
  { id: 'A', title: 'Open Lab', kind: 'The foundation', href: '/lab/', intent: 'Understand Open Lab',
    suggestion: 'Start with the Open Lab foundation: understand the invitation, then explore or contribute. It is the strongest home for the whole product.',
    promise: 'A place for science before it’s finished.',
    payoff: 'Understand what belongs here and move into the workbench, tools, or contribution flow.',
    tradeoff: 'The most complete mental model, but also the hardest cold-start problem: the invitation needs useful work behind it, not an empty social feed.',
    test: 'Can a new visitor explain what they could contribute—and find a real next step?' },
  { id: 'B', title: 'Science Arcade', kind: 'The science-tools entrance', href: '/lab/explorations/arcade/', intent: 'Make something',
    suggestion: 'Start with Science Arcade: make and export a deterministic print before deciding whether to join. Best first-use payoff; a tool is not yet a community.',
    promise: 'Make first. Understand by doing.',
    payoff: 'Change a rule, inspect its pattern, and download the SVG plus the configuration and cell matrix.',
    tradeoff: 'Useful even with no community activity. But a delightful toy can become a cul-de-sac unless the artifact leads into a scientific question.',
    test: 'Does someone export a result, change one variable, and return with an observation?' },
  { id: 'C', title: 'Observatory', kind: 'The work-map entrance', href: '/lab/explorations/observatory/', intent: 'Find a useful question',
    suggestion: 'Start with Observatory: inspect a question and its sources, then identify a bounded contribution. Best orientation for an already-motivated researcher.',
    promise: 'Locate the opening. Bring better evidence.',
    payoff: 'Inspect an editorial question, trace its sources, and share a direct link to a concrete contribution brief.',
    tradeoff: 'Makes the research agenda legible, but curation is ongoing work. A map can imply more authority and connection than the evidence warrants.',
    test: 'Can a visitor identify a useful contribution without mistaking the map for a live team network?' },
] as const

export default function ExplorationComparison() {
  const [selected, setSelected] = useState('B')
  const recommendation = entrances.find(entrance => entrance.id === selected)!
  return (
    <div className={`${styles.exploration} ${styles.comparison}`}>
      <nav className={styles.routeBar} aria-label="Exploration navigation"><a href="/lab/" className={styles.wordmark}><img src="/images/pl_logo_mark.svg" alt="" width="22" height="26" /> Open Lab <span>/</span></a><span>Entrance studies</span></nav>
      <header className={styles.comparisonHeader}><p className={styles.eyebrow}>One product / Three ways in</p><h1>What should happen<br /><em>in the first minute?</em></h1><p>Not three skins for the same page. Three different starting objects: an invitation, an instrument, and a question.</p></header>
      <section className={styles.intentPicker} aria-labelledby="intent-title"><h2 id="intent-title">Start with what you came to do.</h2><div>{entrances.map(entrance => <button type="button" key={entrance.id} aria-pressed={selected === entrance.id} onClick={() => setSelected(entrance.id)}>{entrance.intent} <span aria-hidden="true">↗</span></button>)}</div><p role="status">{recommendation.suggestion}</p></section>
      <div className={styles.entranceGallery}>{entrances.map(entrance => <article key={entrance.id} data-entrance={entrance.id} data-selected={selected === entrance.id} className={styles.entranceOption}>
        <div className={styles.optionHeading}><span>{entrance.id}</span><p>{entrance.kind}</p></div>
        <a href={entrance.href} className={`${styles.entrancePreview} ${styles[`preview${entrance.id}`]}`} aria-label={`Open ${entrance.title}`}>
          {entrance.id === 'A' && <div className={styles.foundationPreview}><small>Open Lab / PL R&D</small><strong>A place for science<br /><em>before it’s finished.</em></strong><span className={styles.sketchAction}>Explore the lab ↗</span><div><span>Question</span><span>Evidence</span><span>Contribution</span></div><small>Composition sketch · not a live feed</small></div>}
          {entrance.id === 'B' && <div className={styles.arcadePreview}><small>Rule / Print <span>R090</span></small><svg viewBox="0 0 61 40" aria-hidden="true" shapeRendering="crispEdges"><path d={miniature.path} fill="#1982F4" /></svg><span>One rule. A world of patterns.</span><small>Generated automaton · try the instrument ↗</small></div>}
          {entrance.id === 'C' && <div className={styles.observatoryPreview}><small>Observatory / Editorial field notes</small><svg viewBox="0 0 320 180" aria-hidden="true"><ellipse cx="160" cy="90" rx="105" ry="64" fill="none" stroke="#526176" strokeDasharray="2 5" /><path d="M65 50L160 90L245 43M78 142L160 90L247 133" stroke="#1982F4" fill="none" />{[[65, 50], [245, 43], [78, 142], [247, 133]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="7" fill="#1982F4" />)}<text x="160" y="83" textAnchor="middle" fill="#e4ecf6" fontSize="17">Evidence</text><text x="160" y="104" textAnchor="middle" fill="#e4ecf6" fontSize="17">that travels</text></svg><strong>What is worth<br />getting closer to?</strong><small>Editorial map · inspect a question ↗</small></div>}
        </a>
        <div className={styles.optionCopy}><h2><a href={entrance.href}>{entrance.title} ↗</a></h2><p className={styles.optionPromise}>{entrance.promise}</p><h3>First-use payoff</h3><p>{entrance.payoff}</p><h3>The tradeoff</h3><p>{entrance.tradeoff}</p><details><summary>What would tell us this works?</summary><p>{entrance.test}</p></details></div>
      </article>)}</div>
      <section className={styles.comparisonVerdict} aria-labelledby="verdict-title"><p className={styles.eyebrow}>The product call</p><h2 id="verdict-title">Keep A as the foundation.<br /><em>Let B earn the first visit.<br />Let C give it direction.</em></h2><div><p>Open Lab needs a durable home for identity, work, and contributions. It does not need every visitor to start with the whole system.</p><p>Science Arcade can earn attention with an actual artifact. Observatory can turn that curiosity into a bounded research question. Keep them as purposeful entrances into the same lab—not separate communities to populate.</p><a className={styles.textLink} href="/lab/">Return to the Open Lab foundation ↗</a></div></section>
      <p className={styles.comparisonNote}>These are prototype entrance studies. Questions and tool links are editorial starters, not joined projects or active campaigns. No sign-in, publication, or external execution happens in these alternatives.</p>
    </div>
  )
}
