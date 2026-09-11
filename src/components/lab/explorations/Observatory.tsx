'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { findFrontierQuestion, frontierHref, frontierQuestions } from '@/components/lab/explorations/lab-explorations'
import styles from '@/components/lab/explorations/lab-explorations.module.css'

export default function Observatory({ initialQuestion = 'neural-measurements' }: { initialQuestion?: string }) {
  const [selected, setSelected] = useState(initialQuestion)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [origin, setOrigin] = useState('')
  const briefTitle = useRef<HTMLHeadingElement>(null)
  const question = findFrontierQuestion(selected) ?? frontierQuestions[2]
  useEffect(() => {
    setOrigin(window.location.origin)
    function restoreFromLocation() {
      const match = window.location.pathname.match(/^\/lab\/explorations\/observatory\/([^/]+)\/$/)
      const restored = match && findFrontierQuestion(match[1])
      setSelected(restored ? restored.id : initialQuestion)
    }
    restoreFromLocation()
    window.addEventListener('popstate', restoreFromLocation)
    return () => window.removeEventListener('popstate', restoreFromLocation)
  }, [initialQuestion])
  function selectQuestion(event: MouseEvent<HTMLAnchorElement>, id: string) {
    // Keep native new-tab / modifier-click behavior and an ordinary href fallback.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (selected !== id) window.history.pushState(null, '', frontierHref(id))
    setSelected(id)
    briefTitle.current?.focus()
  }
  return (
    <div className={`${styles.exploration} ${styles.observatory}`}>
      <header className={styles.observatoryHeader}><div><p className={styles.eyebrow}>TECH TREE</p><h1>Explore the tech tree</h1></div><p>Choose a branch. See the source, the opening, and what useful evidence could look like.</p></header>
      <div className={styles.observatoryConsole}>
        <section className={styles.frontier} aria-labelledby="frontier-title">
          <div className={styles.mapToolbar}><h2 id="frontier-title">Frontier / Computing & human capability</h2><div className={styles.viewSwitch} aria-label="Question layout"><button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>Map</button><button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button></div></div>
          <figure className={view === 'map' ? styles.frontierMap : styles.frontierList}>
            {view === 'map' && <><svg className={styles.mapGeometry} viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="frontier-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth=".5" /></pattern></defs><rect width="800" height="600" fill="url(#frontier-grid)" /><ellipse cx="400" cy="300" rx="262" ry="203" fill="none" stroke="currentColor" strokeDasharray="2 6" /><ellipse cx="400" cy="300" rx="130" ry="99" fill="none" stroke="currentColor" /><path d="M0 300H800M400 0V600" stroke="currentColor" strokeDasharray="3 7" />{frontierQuestions.map(item => <path key={item.id} d={`M400 300 Q${item.x * 8} 300 ${item.x * 8} ${item.y * 6}`} fill="none" stroke="currentColor" data-selected={item.id === question.id || undefined} strokeWidth={item.id === question.id ? '2' : '1'} />)}</svg><div className={styles.mapCenter} aria-hidden="true"><span>Humanity’s tech tree</span><strong>Choose a<br />branch</strong><small>Different fields.<br />Related methods.</small></div></>}
            <ol className={styles.questionNodes} aria-label="Editorial example questions">{frontierQuestions.map(item => <li key={item.id} style={view === 'map' ? { left: `${item.x}%`, top: `${item.y}%` } : undefined}><a data-question={item.id} href={frontierHref(item.id)} onClick={event => selectQuestion(event, item.id)} aria-current={question.id === item.id ? 'true' : undefined} aria-label={`${item.field}: ${item.question}`}><span className={styles.nodeIndex}>{item.number}<i aria-hidden="true" /></span><span className={styles.nodeField}>{item.field}</span><strong>{item.shortTitle}</strong><span className={styles.nodeMethod}>{item.method} <span aria-hidden="true">↗</span></span></a></li>)}</ol>
            <figcaption className={styles.mapLegend}><span><i aria-hidden="true" /> Selected question</span><span>Lines connect questions to a shared editorial lens—not live relationships.</span></figcaption>
          </figure>
          <p className={styles.mapFootnote}>Positions are editorial, not measures of progress or similarity. Every question is also available in List view and by keyboard.</p>
        </section>
        <aside className={styles.questionBrief} data-question-brief="" aria-labelledby="brief-title">
          <div className={styles.briefIndex}><span>Brief / {question.number}</span><span>{question.status}</span></div>
          <p className={styles.briefField}>{question.field}</p><h2 id="brief-title" ref={briefTitle} tabIndex={-1}>{question.question}</h2>
          <div className={styles.briefSection}><h3>What exists</h3><p>{question.exists}</p><div className={styles.sourceLinks}>{question.sources.map(source => <a key={source.url} href={source.url} {...(source.url.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{source.label} ↗</a>)}</div></div>
          <div className={styles.briefSection}><h3>The opening</h3><p>{question.opening}</p></div>
          <div className={`${styles.briefSection} ${styles.contributionCallout}`}><h3>A useful contribution contains</h3><p>{question.contribution}</p></div>
          <p className={styles.briefLimit}>{question.limit}</p>
          <label className={styles.shareField}>A direct link to this question<input aria-label="Direct link to this brief" readOnly value={`${origin}${frontierHref(question.id)}`} onFocus={event => event.target.select()} /></label>
          <a className={styles.briefAction} href="/lab/collaborate/">Prepare a contribution in Open Lab <span aria-hidden="true">↗</span></a>
          <p className={styles.smallNote}>Bring the question and its source links. This page does not create a task, contact a team, or submit evidence.</p>
        </aside>
      </div>
    </div>
  )
}
