'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { localNextActions } from '@/lib/lab-social'
import { useLabSocial } from '@/components/lab/social/useLabSocial'
import '@/components/lab/social/social.css'

export type LabActionInboxProps = { ownerId?: string; onResumeDraft?: (slot: string) => void }
/** Insert inside LabShell's top-right .lab-header-actions. No remote notifications. */
export function LabActionInbox({ ownerId = 'guest', onResumeDraft }: LabActionInboxProps) {
  return <Inbox key={ownerId} ownerId={ownerId} onResumeDraft={onResumeDraft} />
}
function Inbox({ ownerId, onResumeDraft }: Required<Pick<LabActionInboxProps, 'ownerId'>> & Pick<LabActionInboxProps, 'onResumeDraft'>) {
  const local = useLabSocial(ownerId)
  const [open, setOpen] = useState(false)
  const bell = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const id = useId()
  const all = local.ready ? localNextActions({ ...local, error: local.readError }) : []
  const actions = all.filter(a => !local.meta.dismissed.includes(a.id))
  const unread = actions.filter(a => !local.meta.read.includes(a.id)).length
  const close = () => { setOpen(false); bell.current?.focus() }
  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLElement>('button, a')?.focus()
    function outside(e: PointerEvent) { if (!wrapper.current?.contains(e.target as Node)) { setOpen(false); bell.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  return <div className="lab-social lab-social-inbox" ref={wrapper}>
    <button ref={bell} type="button" className="lab-social-bell" aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-panel`} aria-label={local.readError ? 'Your next actions: count unavailable, storage needs attention' : local.ready ? `Your next actions: ${unread} unread, ${actions.length} actions${local.error ? ', storage needs attention' : ''}` : 'Your next actions: loading'} onClick={() => { local.refresh(); if (open) close(); else setOpen(true) }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {local.ready && unread > 0 && <span className="lab-social-badge" aria-hidden="true">{unread}</span>}
      {local.error && <span className="lab-social-warning" aria-hidden="true">!</span>}
    </button>
    {open && <div ref={panel} role="dialog" aria-label="Your next actions" id={`${id}-panel`} className="lab-social-inbox-panel" onKeyDown={e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
      if (e.key === 'Tab') {
        const nodes = [...(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') || [])]
        const first = nodes[0], last = nodes.at(-1)
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }}>
      <div className="lab-social-inbox-heading"><h2>Your next actions</h2><button type="button" onClick={close} aria-label="Close next actions">×</button></div>
      <p className="lab-social-muted">Self-prompts from this browser, not messages from other people. No push or email notifications are connected.</p>
      <p className="lab-social-kicker">{local.readError ? 'LOCAL ACTION COUNT UNAVAILABLE' : `${unread} UNREAD / ${actions.length} ACTIONS`}</p>
      {!local.ready ? <p role="status">Reading local drafts…</p> : local.readError ? <p>Local actions could not be checked. Your drafts have not been changed.</p> : !actions.length ? <p>No pending self-prompts. Keep exploring at your own pace.</p> : <ul className="lab-social-action-list">{actions.map(action => <li key={action.id}>
        <span className="lab-social-kicker">{local.meta.read.includes(action.id) ? 'READ' : 'UNREAD'} / LOCAL</span>
        {action.draftSlot && onResumeDraft ? <button className="lab-social-action-link" onClick={() => { close(); onResumeDraft(action.draftSlot!) }}>{action.title} →</button> : <a href={action.href} onClick={close}>{action.title} →</a>}
        <p className="lab-social-muted">{action.detail}</p>
        <div className="lab-social-controls">
          {!local.meta.read.includes(action.id) && <button type="button" aria-label={`Mark ${action.title} read`} onClick={() => { if (local.saveMeta({ read: [...new Set([...local.meta.read, action.id])] }).ok) panel.current?.querySelector<HTMLElement>('button')?.focus() }}>Mark read</button>}
          <button type="button" aria-label={`Dismiss ${action.title}`} onClick={() => { if (local.saveMeta({ dismissed: [...new Set([...local.meta.dismissed, action.id])] }).ok) panel.current?.querySelector<HTMLElement>('button')?.focus() }}>Dismiss</button>
        </div>
      </li>)}</ul>}
      {!!local.meta.dismissed.length && <button type="button" onClick={() => local.saveMeta({ dismissed: [] })}>Restore dismissed prompts</button>}
      {local.error && <p className="lab-social-error" role="alert">{local.error} Counts reflect readable local state only.</p>}
    </div>}
  </div>
}
