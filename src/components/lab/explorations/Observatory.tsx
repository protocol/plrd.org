'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { findFrontierQuestion, frontierHref, frontierQuestions } from '@/components/lab/explorations/lab-explorations'
import { getScienceChildren, getScienceNode, getSciencePath, pageScienceNodes, scienceHref, scienceRoot, scienceSnapshot, scienceSourceHref, searchScience } from '@/lib/lab-science-tree'
import ScienceBranchGraph from '@/components/lab/explorations/ScienceBranchGraph'
import tree from '@/components/lab/explorations/science-tree.module.css'

// Editorial entry points, not OpenAlex classification claims or scientific dependencies.
const questionBranches: Record<string, string> = {
  'verifiable-artifacts': 'field:17', 'portable-evaluations': 'field:17',
  'neural-measurements': 'field:28', 'robust-coordination': 'field:20',
}
const overlayBranches = new Set(Object.values(questionBranches).flatMap(id => getSciencePath(id).map(part => part.id)))
const nativeClick = (event: MouseEvent<HTMLAnchorElement>) => event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

export default function Observatory({ initialQuestion }: { initialQuestion?: string }) {
  const initial = findFrontierQuestion(initialQuestion)
  const [selected, setSelected] = useState(initial ? questionBranches[initial.id] : 'science')
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(initial?.id ?? null)
  const [view, setView] = useState<'map' | 'list'>('list')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [origin, setOrigin] = useState('')
  const [currentHref, setCurrentHref] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const [invalidLink, setInvalidLink] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const branchTitle = useRef<HTMLHeadingElement>(null)
  const briefTitle = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef<'branch' | 'brief' | null>(initial ? 'brief' : null)
  const node = getScienceNode(selected) ?? scienceRoot
  const question = findFrontierQuestion(selectedQuestion)
  const path = getSciencePath(node.id)
  const children = getScienceChildren(node.id)
  const searching = query.trim().length > 0
  const results = useMemo(() => searchScience(query), [query])
  const visible = pageScienceNodes(searching ? results : children, page, searching || view === 'list' ? 24 : 8)
  const provenance = scienceSnapshot.provenance

  useEffect(() => {
    setOrigin(window.location.origin)
    const defaultView = window.matchMedia?.('(max-width: 720px)').matches ? 'list' : 'map'
    function restoreFromLocation() {
      const match = window.location.pathname.match(/^\/lab\/explorations\/observatory\/([^/]+)\/$/)
      const restoredQuestion = match && findFrontierQuestion(match[1])
      const params = new URLSearchParams(window.location.search)
      const requested = params.get('node')
      const restoredNode = requested && getScienceNode(requested)
      setSelected(restoredQuestion ? questionBranches[restoredQuestion.id] : restoredNode ? restoredNode.id : 'science')
      setSelectedQuestion(restoredQuestion ? restoredQuestion.id : null)
      setInvalidLink(Boolean(requested && !restoredNode))
      setQuery((params.get('q') ?? '').slice(0, 200))
      const requestedPage = Number(params.get('page'))
      setPage(Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 0)
      const restoredView = params.get('view')
      setView(restoredView === 'list' || restoredView === 'map' ? restoredView : defaultView)
      setShowOverlay(params.get('overlay') === 'plrd')
      setCurrentHref(window.location.pathname + window.location.search)
    }
    restoreFromLocation()
    window.addEventListener('popstate', restoreFromLocation)
    return () => window.removeEventListener('popstate', restoreFromLocation)
  }, [])
  useEffect(() => {
    if (pendingFocus.current === 'branch') branchTitle.current?.focus()
    if (pendingFocus.current === 'brief') briefTitle.current?.focus()
    pendingFocus.current = null
  }, [selected, selectedQuestion, query, page])

  function writeLocation(href: string, push = false) {
    if (window.location.pathname + window.location.search !== href) {
      if (push) window.history.pushState(null, '', href)
      else window.history.replaceState(window.history.state, '', href)
    }
    setCurrentHref(href)
  }
  function changeControls(next: { query?: string; page?: number; view?: 'list' | 'map'; overlay?: boolean }) {
    const nextQuery = next.query ?? query
    const nextPage = next.page ?? visible.page
    const nextView = next.view ?? view
    const nextOverlay = next.overlay ?? showOverlay
    const params = new URLSearchParams(window.location.search)
    if (nextQuery) params.set('q', nextQuery); else params.delete('q')
    if (nextPage) params.set('page', String(nextPage)); else params.delete('page')
    params.set('view', nextView)
    if (nextOverlay) params.set('overlay', 'plrd'); else params.delete('overlay')
    writeLocation(`${window.location.pathname}?${params}`)
    setQuery(nextQuery); setPage(nextPage); setView(nextView); setShowOverlay(nextOverlay)
  }
  function clearSearch() { changeControls({ query: '', page: 0 }); searchInput.current?.focus() }
  function selectNode(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (nativeClick(event)) return
    event.preventDefault()
    const params = new URLSearchParams(scienceHref(id).split('?')[1])
    params.set('view', view)
    if (showOverlay) params.set('overlay', 'plrd')
    writeLocation(`/lab/explorations/observatory/?${params}`, true)
    pendingFocus.current = 'branch'
    setSelected(id); setSelectedQuestion(null); setQuery(''); setPage(0); setInvalidLink(false)
    if (id === selected && !selectedQuestion && !query && page === 0) branchTitle.current?.focus()
  }
  function selectQuestion(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (nativeClick(event)) return
    event.preventDefault()
    writeLocation(frontierHref(id), true)
    setShowOverlay(false)
    setView(window.matchMedia?.('(max-width: 720px)').matches ? 'list' : 'map')
    pendingFocus.current = 'brief'
    setSelected(questionBranches[id]); setSelectedQuestion(id); setQuery(''); setPage(0); setInvalidLink(false)
    if (id === selectedQuestion) briefTitle.current?.focus()
  }
  function turnPage(next: number) { pendingFocus.current = 'branch'; changeControls({ page: next }) }

  return <div className={tree.scienceTree}>
    <header className={tree.header}>
      <div><p className={tree.eyebrow}>TECH TREE / SCIENCE ATLAS</p><h1>Explore the tech tree</h1><p>Choose a branch. Follow the research from broad fields to specific topics.</p></div>
      <p className={tree.snapshotLabel}>OpenAlex snapshot <span>4 domains · 26 fields · 252 subfields · 4,516 topics</span></p>
    </header>
    <div className={tree.workspace}>
      <section className={tree.explorer} aria-labelledby="science-branch-title">
        <div className={tree.searchBar}>
          <label className={tree.searchLabel}><span>Search all sciences</span><input ref={searchInput} type="search" maxLength={200} value={query} placeholder="Try oceanography, algebra, or public health…" onChange={event => changeControls({ query: event.target.value, page: 0 })} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); clearSearch() } }} /></label>
          {query && <button type="button" onClick={clearSearch}>Clear search</button>}
        </div>
        <nav className={tree.breadcrumb} aria-label="Science breadcrumb"><ol>{path.map((part, i) => <li key={part.id}>{i === path.length - 1 ? <span aria-current="page">{part.label}</span> : <a href={scienceHref(part.id)} onClick={event => selectNode(event, part.id)}>{part.label}</a>}</li>)}</ol></nav>
        {invalidLink && <p role="status" className={tree.notice}>This branch is not in this snapshot. Showing All sciences; no saved data was changed.</p>}
        <div className={tree.branchHeader}>
          <div><p className={tree.eyebrow}>{searching ? 'WHOLE SNAPSHOT' : node.kind === 'root' ? 'START EXPLORING' : `OPENALEX ${node.kind.toUpperCase()}`}</p><h2 ref={branchTitle} id="science-branch-title" tabIndex={-1}>{searching ? 'Search results' : node.label}</h2></div>
          <div className={tree.viewSwitch} aria-label="Branch layout">{node.parent && <a className={tree.upLink} aria-label="Up one level" href={scienceHref(node.parent)} onClick={event => selectNode(event, node.parent!)}>↑ Up</a>}<button type="button" disabled={searching} aria-pressed={!searching && view === 'map'} onClick={() => changeControls({ view: 'map', page: 0 })}>Map</button><button type="button" aria-pressed={searching || view === 'list'} onClick={() => changeControls({ view: 'list', page: 0 })}>List</button></div>
        </div>
        <p className={tree.resultCount} role="status">{searching ? `${visible.total.toLocaleString('en-US')} matches across the whole snapshot` : `${children.length} ${node.kind === 'topic' ? 'narrower branches in this snapshot' : 'branches to explore'}`}{visible.total > 0 && ` · ${visible.page * (searching || view === 'list' ? 24 : 8) + 1}–${Math.min(visible.total, (visible.page + 1) * (searching || view === 'list' ? 24 : 8))} shown`}</p>
        {view === 'map' && !searching && visible.total > 0 ? <ScienceBranchGraph key={`${node.id}:${visible.page}`} node={node} children={visible.items} onSelect={selectNode} overlayIds={showOverlay ? [...overlayBranches] : []} /> : <ol className={tree.branchList} aria-label={searching ? 'Science search results' : 'Science branches'}>{visible.items.map(item => <li key={item.id}>
          <a data-science-node={item.id} data-pl-overlay={showOverlay && overlayBranches.has(item.id) ? '' : undefined} href={scienceHref(item.id)} onClick={event => selectNode(event, item.id)}>
            <span className={tree.branchKind}>{item.kind}</span><span className={tree.branchText}><strong>{item.label}</strong>{showOverlay && overlayBranches.has(item.id) && <span className={tree.overlayBadge}>PL R&D editorial entry point</span>}{searching ? <span>{getSciencePath(item.id).slice(1, -1).map(part => part.label).join(' / ')}</span> : <span>{item.kind === 'topic' ? 'Read the topic description and source' : `${getScienceChildren(item.id).length} ${item.kind === 'domain' ? 'fields' : item.kind === 'field' ? 'subfields' : 'topics'}`}</span>}</span><span aria-hidden="true">→</span>
          </a>
        </li>)}</ol>}
        {visible.total === 0 && <div className={tree.empty}>{searching ? <><h3>No matches</h3><p>Try a broader term or a synonym. This finite literature classification does not name every area of science.</p></> : <><h3>You’re at a research topic</h3><p>This is the most detailed level in this snapshot. Inspect the source and its machine-generated description, or explore neighboring topics.</p>{node.parent && <a href={scienceHref(node.parent)} onClick={event => selectNode(event, node.parent!)}>Explore sibling topics →</a>}</>}</div>}
        {visible.pages > 1 && <nav className={tree.pagination} aria-label="Branch pages"><button type="button" disabled={visible.page === 0} onClick={() => turnPage(visible.page - 1)}>Previous page</button><span>Page {visible.page + 1} of {visible.pages}</span><button type="button" disabled={visible.page + 1 === visible.pages} onClick={() => turnPage(visible.page + 1)}>Next page</button></nav>}
        <div className={tree.legend}><svg width="28" height="12" aria-hidden="true"><path d="M0 6H28" stroke="currentColor" /></svg><span>Hierarchy lines mean containment—not measured similarity or prerequisite relationships.</span></div>
      </section>
      <aside className={tree.context} aria-label="Branch details and sources">
        <section data-science-detail="" className={tree.detail}>
          <p className={tree.eyebrow}>{node.kind === 'root' ? 'ABOUT THIS ATLAS' : 'SELECTED BRANCH'}</p><h2>{node.label}</h2>
          <p>{node.description ?? (node.kind === 'root' ? 'A broad map of research literature, including natural sciences, engineering, medicine, social sciences, and humanities. OpenAlex’s hierarchy is a way in—not an exhaustive ontology of all science.' : `An OpenAlex ${node.kind} containing ${children.length} ${node.kind === 'domain' ? 'fields' : node.kind === 'field' ? 'subfields' : 'topics'}. Placement follows the source hierarchy, not a claim about what must be learned first.`)}</p>
          {node.description && <p className={tree.smallNote}>Source description: machine-generated by OpenAlex from a citation cluster; not independently reviewed here.</p>}
          {node.keywords && <div className={tree.keywords} aria-label="Source keywords">{node.keywords.split(';').map(k => k.trim()).filter(Boolean).slice(0, 8).map(k => <span key={k}>{k}</span>)}</div>}
          <a className={tree.sourceLink} href={scienceSourceHref(node.id)} target="_blank" rel="noopener noreferrer">{node.kind === 'root' ? 'OpenAlex classification guide' : `Inspect OpenAlex ${node.kind} source`} ↗</a>
          <details className={tree.shareLinks}><summary>Branch and view links</summary>
          {currentHref && <label className={tree.shareField}>Link to this view<input aria-label="Link to this view" readOnly value={`${origin}${currentHref}`} onFocus={event => event.target.select()} /></label>}
          <label className={tree.shareField}>Direct link to this branch<input aria-label="Direct link to this branch" readOnly value={`${origin}${scienceHref(node.id)}`} onFocus={event => event.target.select()} /></label></details>
        </section>
        <details className={tree.provenance}><summary>Source, scope & limitations</summary><p>OpenAlex / OurResearch · CC0 metadata. Snapshot checked {provenance.checkedOn}; not a live feed.</p><p>Topic names and descriptions are machine-generated from citation clusters. Each topic has one containment parent. No measured similarity, prerequisites, progress, peer review, or community activity is inferred.</p><p>Coverage reflects indexed research literature, its language and publication biases, and a finite classification. PL R&D is only an editorial overlay.</p><div className={tree.sourceLinks}><a href={provenance.documentationUrl} target="_blank" rel="noopener noreferrer">Classification method ↗</a><a href={provenance.sourceUrl} target="_blank" rel="noopener noreferrer">Exact source table ↗</a><a href={provenance.repositoryUrl} target="_blank" rel="noopener noreferrer">Source repository ↗</a><a href={provenance.licenseUrl} target="_blank" rel="noopener noreferrer">Data access & license ↗</a></div></details>
        <section className={tree.plContext}>
          <label className={tree.overlayToggle}><input type="checkbox" checked={showOverlay} onChange={event => changeControls({ overlay: event.target.checked })} />Show PL R&D overlay</label>
          <p className={tree.smallNote}>Editorial starting questions, not a filter on all science or an endorsement of an entire field.</p>
          <details open={Boolean(question) || showOverlay}><summary>PL R&D contextual briefs</summary><ul className={tree.questionList}>{frontierQuestions.map(item => <li key={item.id}><a data-question={item.id} href={frontierHref(item.id)} onClick={event => selectQuestion(event, item.id)} aria-current={question?.id === item.id ? 'true' : undefined}><span>{item.field}</span><strong>{item.shortTitle}</strong></a></li>)}</ul></details>
        </section>
        {question && <section className={tree.questionBrief} data-question-brief="" aria-labelledby="brief-title">
          <p className={tree.eyebrow}>CONTEXTUAL BRIEF / {question.number} · {question.status}</p><h2 id="brief-title" ref={briefTitle} tabIndex={-1}>{question.question}</h2>
          <h3>What exists</h3><p>{question.exists}</p><div className={tree.sourceLinks}>{question.sources.map(source => <a key={source.url} href={source.url} {...(source.url.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{source.label} ↗</a>)}</div>
          <h3>The opening</h3><p>{question.opening}</p><h3>A useful contribution contains</h3><p>{question.contribution}</p><p className={tree.smallNote}>{question.limit}</p>
          <label className={tree.shareField}>A direct link to this question<input aria-label="Direct link to this brief" readOnly value={`${origin}${frontierHref(question.id)}`} onFocus={event => event.target.select()} /></label>
          <a className={tree.sourceLink} href="/lab/collaborate/">Prepare a contribution in Open Lab ↗</a><p className={tree.smallNote}>Bring the question and its source links. This page does not create a task, contact a team, or submit evidence.</p>
        </section>}
      </aside>
    </div>
  </div>
}
