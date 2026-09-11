'use client'

import { useMemo, useState } from 'react'
import { makeAutomatonPrint, type AutomatonConfig } from '@/components/lab/explorations/lab-explorations'
import styles from '@/components/lab/explorations/lab-explorations.module.css'

const initial: AutomatonConfig = { rule: 90, width: 121, rows: 80, seed: 'single', boundary: 'fixed' }
const presets = [{ rule: 90, name: 'Triangles' }, { rule: 30, name: 'Asymmetry' }, { rule: 110, name: 'Structures' }, { rule: 184, name: 'Traffic' }]

export default function ScienceArcade() {
  const [config, setConfig] = useState(initial)
  const [notice, setNotice] = useState('')
  const print = useMemo(() => makeAutomatonPrint(config), [config])
  function update(patch: Partial<AutomatonConfig>) {
    setConfig(current => ({ ...current, ...patch }))
    setNotice('')
  }
  function download(format: 'svg' | 'json') {
    let url: string | undefined
    const anchor = document.createElement('a')
    try {
      url = URL.createObjectURL(new Blob([print[format]], { type: format === 'svg' ? 'image/svg+xml' : 'application/json' }))
      anchor.href = url
      anchor.download = `open-lab-rule-${config.rule}-${config.seed}-${config.boundary}.${format}`
      document.body.append(anchor)
      anchor.click()
      setNotice(`${format === 'svg' ? 'SVG print' : 'JSON data'} download requested. Nothing was published.`)
    } catch {
      setNotice('Download could not start. Try again in a browser that supports file downloads.')
    } finally {
      anchor.remove()
      if (url) { const objectUrl = url; setTimeout(() => URL.revokeObjectURL(objectUrl), 1000) }
    }
  }
  return (
    <div className={`${styles.exploration} ${styles.arcade}`}>
      <nav className={styles.routeBar} aria-label="Exploration navigation">
        <a href="/lab/" className={styles.wordmark}><img src="/images/pl_logo_mark.svg" alt="" width="22" height="26" /> Open Lab <span>/</span></a>
        <span>Science Arcade</span>
        <a className={styles.compareLink} href="/lab/explorations/">Compare entrances ↗</a>
      </nav>
      <div className={styles.arcadeGrid}>
        <section className={styles.cabinetIntro} aria-labelledby="arcade-title">
          <p className={styles.eyebrow}>B / The tools entrance</p>
          <h1 id="arcade-title">Small rules.<br /><em>Unexpected</em><br />worlds.</h1>
          <p className={styles.intro}>Science starts with something you can try. Turn a rule into a pattern. Take the result apart. Leave with something you made.</p>
          <a className={styles.textLink} href="#print-instrument">Try the print instrument <span aria-hidden="true">↓</span></a>
          <div className={styles.cabinetLabel}><span>On the bench</span><span>01</span></div>
          <div className={styles.benchObject}>
            <span className={styles.instrumentGlyph} aria-hidden="true">▦</span>
            <div><strong>Rule / Print</strong><p>Elementary cellular automaton<br />Runs here. No sign-in.</p></div>
          </div>
          <p className={styles.smallNote}>An educational instrument, not a biological model. No external app runs when you open this page.</p>
        </section>
        <section id="print-instrument" className={styles.instrument} aria-labelledby="instrument-title">
          <div className={styles.instrumentBar}><h2 id="instrument-title">Rule / Print</h2><span className={styles.localBadge}>Computed in your browser</span></div>
          <figure className={styles.printSheet}>
            <div className={styles.printCaption}><span>PL R&D / Synthetic studies</span><span>R{String(config.rule).padStart(3, '0')}</span></div>
            <svg className={styles.automaton} role="img" aria-labelledby="automaton-title automaton-description" viewBox={`0 0 ${config.width} ${config.rows}`} shapeRendering="crispEdges">
              <title id="automaton-title">{`Rule ${config.rule} cellular automaton`}</title>
              <desc id="automaton-description">{config.width} cells across, {config.rows} rows including the seed, {config.seed === 'single' ? 'one central cell' : 'two adjacent central cells'}, {config.boundary === 'fixed' ? 'zero outside the edges' : 'wrapping edges'}. Time moves downward. Download JSON for every cell.</desc>
              <path data-automaton-path="" d={print.path} fill="#1982F4" />
            </svg>
            <figcaption><span>Initial condition → repeated local rule → pattern</span><span>{config.width} × {config.rows}</span></figcaption>
          </figure>
          <div className={styles.controls}>
            <div className={styles.ruleHeader}><label htmlFor="arcade-rule">Rule number</label><output htmlFor="arcade-rule">{config.rule.toString().padStart(3, '0')}</output></div>
            <input id="arcade-rule" name="rule" type="range" min="0" max="255" step="1" value={config.rule} onChange={event => update({ rule: Number(event.target.value) })} aria-describedby="rule-help" />
            <div className={styles.presets} aria-label="Rule presets">{presets.map(preset => <button key={preset.rule} type="button" aria-pressed={config.rule === preset.rule} onClick={() => update({ rule: preset.rule })}><span>{preset.rule}</span> {preset.name}</button>)}</div>
            <div className={styles.settingGrid}>
              <label>Starting cells<select name="seed" value={config.seed} onChange={event => update({ seed: event.target.value as AutomatonConfig['seed'] })}><option value="single">One in the center</option><option value="pair">Two side by side</option></select></label>
              <label>At the edges<select name="boundary" value={config.boundary} onChange={event => update({ boundary: event.target.value as AutomatonConfig['boundary'] })}><option value="fixed">Fixed zero</option><option value="wrap">Wrap around</option></select></label>
              <label>Rows, including seed<select name="rows" value={config.rows} onChange={event => update({ rows: Number(event.target.value) })}><option value="40">40 rows</option><option value="80">80 rows</option><option value="120">120 rows</option></select></label>
            </div>
            <div className={styles.downloads}><button type="button" className={styles.primaryButton} onClick={() => download('svg')}>Download print <span aria-hidden="true">↙</span></button><button type="button" className={styles.secondaryButton} onClick={() => download('json')}>Download data .json</button></div>
            <p className={styles.downloadStatus} role="status">{notice || 'SVG artwork + JSON configuration and cell matrix. Yours to reproduce.'}</p>
          </div>
          <details className={styles.method}><summary>Eight tiny decisions. How does this work?</summary><p id="rule-help">Each cell looks at itself and its two neighbors in the previous row. The rule number encodes which of the eight possible neighborhoods becomes a filled cell. Nothing is random. The same settings produce the same result.</p><div className={styles.ruleTable}>{Array.from({ length: 8 }, (_, i) => 7 - i).map(neighborhood => <div key={neighborhood}><code>{neighborhood.toString(2).padStart(3, '0')}</code><span aria-hidden="true">↓</span><strong>{(config.rule >> neighborhood) & 1}</strong></div>)}</div><p>Time runs down the print; row zero is the seed. “Wrap around” connects the left and right edges. A visual pattern is an observation, not proof of universality or scientific significance.</p></details>
        </section>
      </div>
      <section className={styles.nextExperiment} aria-labelledby="next-experiment-title"><p className={styles.eyebrow}>A useful next experiment</p><h2 id="next-experiment-title">Change one thing.<br /><em>Keep the evidence.</em></h2><div><p>Keep rule 90 and switch from one starting cell to two. Export both results. What changes, and what would you need to show that your observation holds beyond these settings?</p><a className={styles.textLink} href="/lab/feed/">Bring an observation to the lab ↗</a><span className={styles.smallNote}>The download does not publish a post.</span></div></section>
      <section className={styles.toolShelf} aria-labelledby="cabinet-title"><div><p className={styles.eyebrow}>Elsewhere in the cabinet</p><h2 id="cabinet-title">Take it further.</h2><p className={styles.smallNote}>Editorial links to independent tools, not Open Lab members. Each opens only when you choose it.</p></div><a href="https://jupyterlite.readthedocs.io/en/stable/" target="_blank" rel="noopener noreferrer"><span>02 / Notebook</span><h3>JupyterLite ↗</h3><p>Take the JSON into a browser notebook to inspect rows and compare results.</p><small>Read the project docs · external</small></a><a href="https://observablehq.com/plot/" target="_blank" rel="noopener noreferrer"><span>03 / Visualization</span><h3>Observable Plot ↗</h3><p>Turn a measurement from the cell matrix into a chart you can explain.</p><small>Read the project docs · external</small></a></section>
    </div>
  )
}
