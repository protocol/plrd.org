'use client'
import { useEffect, useState } from 'react'
import { fields, fieldLabel, starterDisclosure } from '@/lib/lab-data'
import { APP_CATALOG, filterApps, type AppListing as Listing } from '@/lib/lab-app-catalog'
import AppListing, { useAppShelf } from '@/components/lab/AppListing'
import AppListingEditor from '@/components/lab/AppListingEditor'
import styles from '@/components/lab/AppListing.module.css'
export default function AppsWorkbench() {
  const shelf = useAppShelf()
  return <Catalog key={shelf.scope} shelf={shelf} />
}
function Catalog({ shelf }: { shelf: ReturnType<typeof useAppShelf> }) {
  const [selected, setSelected] = useState<string>(), [editing, setEditing] = useState<Listing | true>(), [query, setQuery] = useState(''), [field, setField] = useState('all'), [view, setView] = useState('all')
  useEffect(() => { const read = () => { const p = new URLSearchParams(window.location.search); setSelected(p.get('app') || undefined); setQuery(p.get('q') || '') }; read(); window.addEventListener('popstate',read); return () => window.removeEventListener('popstate',read) }, [])
  const all = [...APP_CATALOG, ...(shelf.state?.listings || [])]
  const apps = filterApps(all, { query, field }).filter(a => view === 'all' || (view === 'saved' ? shelf.state?.saved.includes(a.id) : a.origin === 'local'))
  const app = all.find(a => a.id === selected)
  function select(id?: string) { setSelected(id); const url = new URL(window.location.href); if (id) url.searchParams.set('app',id); else url.searchParams.delete('app'); window.history.replaceState(null,'',url) }
  return <div className={`lab-wrap ${styles.catalog}`}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>THE APP SHELF</p><h1>Find tools. Keep building.</h1><p>Preview the use case, inspect the source, then open the app on its own site.</p></div><button className={styles.primary} disabled={!shelf.ready} onClick={() => setEditing(true)}>Add your app</button></header>
    <div className={styles.context}><p>{starterDisclosure}</p><span>No embedded runtimes. No install flow.</span></div>
    <div className={styles.controls}>
      <label className={styles.search}>Search apps<input type="search" aria-label="Search science apps" placeholder="Notebooks, models, neural data…" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <label>Field<select aria-label="Filter apps by field" value={field} onChange={e => setField(e.target.value)}><option value="all">All fields</option>{fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
    </div>
    <div className={styles.tabs} aria-label="App collections">{[['all','All tools'],['saved','Saved apps'],['local','Your listings']].map(([id,label]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}<span aria-live="polite">{apps.length} {apps.length === 1 ? 'app' : 'apps'}</span></div>
    <div className={styles.grid}>{apps.map(a => <article key={a.id} className={styles.card} data-app-card>
      <div className={styles.cardTop}><span className={styles.icon} aria-hidden="true">{a.title.slice(0,2).toUpperCase()}</span><div><h2>{a.title}</h2><p className={styles.meta}>{fieldLabel(a.field)}</p></div></div>
      <p>{a.description}</p><div className={styles.cardFoot}><span className={styles.meta}>{a.origin === 'local' ? 'Unpublished · yours' : 'Editorial · source-linked'}</span><button aria-label={`View app: ${a.title}`} onClick={() => select(a.id)}>View app →</button></div>
    </article>)}</div>
    {!apps.length && <section className={styles.empty}><h2>{view === 'saved' ? 'Your shelf starts here.' : view === 'local' ? 'Give your tool a source-linked home.' : 'No apps match those filters.'}</h2><p>{view === 'saved' ? 'Open a listing and save tools you want to revisit.' : 'This is a small starter collection, not a complete science app index.'}</p><button onClick={() => { setQuery(''); setField('all'); setView('all') }}>Clear filters</button></section>}
    {shelf.error && <p role="alert">{shelf.error}</p>}
    {selected && !app && shelf.ready && <p role="alert">This app is not in the current identity’s shelf. No listing was created. <button onClick={() => select()}>Dismiss</button></p>}
    {app && !editing && <AppListing app={app} onClose={() => select()} onEdit={app.origin === 'local' ? () => setEditing(app) : undefined} />}
    {editing && <AppListingEditor app={editing === true ? undefined : editing} onClose={() => setEditing(undefined)} />}
  </div>
}
