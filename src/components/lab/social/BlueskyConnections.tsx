'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLabIdentity, type LabIdentity } from '@/lib/lab-identity'
import { createLabProfileReader, labSessionRequestSignal, type LabSession } from '@/lib/lab-auth'
import { assertLabDid } from '@/lib/lab-protocol'
import { safeLabReturnTo, type LabConnectionAction } from '@/lib/lab-oauth-config'
import { createLabConnectionClient, LabConnectionPermissionError, LabConnectionUnknownError, type LabConnectionReceipt } from '@/lib/lab-connections'

const draftKey = (did: string) => `open-lab:connection-draft:v1:${did}`
const returnHere = () => safeLabReturnTo(window.location.pathname + window.location.search + '#bluesky-connections')
function saveConnectionDraft(did: string, subject: string, action: LabConnectionAction) {
  const returnTo = returnHere()
  const raw = JSON.stringify({ did, subject, action, returnTo })
  window.localStorage.setItem(draftKey(did), raw)
  if (window.localStorage.getItem(draftKey(did)) !== raw) throw new Error('Draft storage unavailable.')
  return returnTo
}

export default function BlueskyConnections({ personDid }: { personDid?: string }) {
  const identity = useLabIdentity()
  // No consent or private draft carries across accounts or selected person cards.
  return <ConnectionPanel key={`${identity.session?.did ?? 'guest'}:${personDid ?? 'lookup'}`} personDid={personDid} identity={identity} />
}
function ConnectionPanel({ personDid, identity }: { personDid?: string; identity: LabIdentity }) {
  const [handle, setHandle] = useState('')
  const [loginHandle, setLoginHandle] = useState('')
  const [profile, setProfile] = useState<LabSession | null>(null)
  const [receipt, setReceipt] = useState<LabConnectionReceipt | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [permission, setPermission] = useState<LabConnectionAction | null>(null)
  const [unknownUri, setUnknownUri] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const live = useRef(identity)
  live.current = identity
  const mounted = useRef(true), generation = useRef(0), work = useRef(new AbortController())
  const { session, oauthSession, isAuthenticated, isLoading, capabilities } = identity
  // A client captures one panel/account lifetime; never revive a canceled client.
  const client = useMemo(() => oauthSession ? () => createLabConnectionClient(oauthSession, {
    isCurrent: () => mounted.current && live.current.isSessionCurrent(oauthSession),
    signal: work.current.signal,
  }) : null, [oauthSession])
  function cancelWork() {
    generation.current++
    work.current.abort(new DOMException('Connection panel work was canceled.', 'AbortError'))
    work.current = new AbortController()
  }
  useLayoutEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; cancelWork() }
  }, [oauthSession])
  const action: LabConnectionAction = receipt?.status === 'following' ? 'delete' : 'create'
  const verb = action === 'create' ? 'follow' : 'unfollow'
  const active = (operation: number) => mounted.current && operation === generation.current

  async function lookup(actor: string) {
    cancelWork()
    const operation = generation.current, connection = client?.()
    const signal = AbortSignal.any([work.current.signal, ...(oauthSession ? [labSessionRequestSignal(oauthSession)] : [])])
    setBusy(true); setAgreed(false); setPermission(null); setUnknownUri(null); setReceipt(null); setProfile(null); setMessage(null)
    try {
      const found = await createLabProfileReader(undefined, signal)(actor)
      if (!active(operation)) return
      setProfile(found)
      if (connection && found.did !== session?.did && capabilities?.canConnect) {
        const pending = connection.pending(found.did)
        if (pending) { setUnknownUri(pending.uri); return }
        const state = await connection.inspect(found.did)
        if (active(operation)) setReceipt(state)
      }
    } catch {
      if (active(operation)) setMessage('Could not verify this profile or your current follow. Check the handle and refresh before confirming. No success is claimed.')
    } finally { if (active(operation)) setBusy(false) }
  }
  useEffect(() => {
    let actor = personDid
    if (!actor && session?.did) {
      try {
        const raw = window.localStorage.getItem(draftKey(session.did))
        if (raw && raw.length <= 4096) {
          const draft = JSON.parse(raw)
          assertLabDid(draft.subject)
          if (draft.did === session.did && draft.returnTo === returnHere() && ['create','delete'].includes(draft.action)) actor = draft.subject
        }
      } catch { setMessage('Your saved connection draft could not be read. Find the person again; nothing will run automatically.') }
    }
    if (actor) void lookup(actor)
    // A fresh SDK session requires a fresh review, even when the DID is unchanged.
  }, [personDid, client, session?.did])

  async function confirm() {
    if (!client || !session || !profile || !receipt || !agreed || busy || isLoading || unknownUri) return
    const operation = ++generation.current
    const consent = { public: true as const, did: session.did, subject: profile.did, action }
    setBusy(true); setAgreed(false); setMessage(null); setPermission(null)
    try {
      // Also retain a recoverable target when the existing token already grants
      // this action and no permission-escalation round trip is necessary.
      saveConnectionDraft(session.did, profile.did, action)
      const connection = client()
      const result = receipt.status === 'following'
        ? await connection.unfollow(profile.did, { ...consent, uri: receipt.record.uri, expectedCid: receipt.record.cid })
        : await connection.follow(profile.did, consent)
      if (!active(operation)) return
      setReceipt(result)
      setMessage(result.status === 'following' ? (action === 'delete' ? 'That exact follow was removed, but another follow record remains. Review it before any further change.' : 'Following on Bluesky — verified on your PDS. This is one-way, not a mutual connection.') : 'Not following on Bluesky — verified on your PDS. Existing copies may remain elsewhere.')
      try { window.localStorage.removeItem(draftKey(session.did)) } catch { /* Never turn a verified write into an automatic retry. */ }
    } catch (error) {
      if (!active(operation)) return
      if (error instanceof LabConnectionPermissionError) { setPermission(error.action); setMessage(error.message) }
      else if (error instanceof LabConnectionUnknownError) { setUnknownUri(error.uri); setMessage('Outcome unknown. The public action may already have completed; do not retry it.') }
      else { setReceipt(null); setMessage('Could not safely complete this action. Refresh and review again; no success is claimed.') }
    } finally { if (active(operation)) setBusy(false) }
  }
  async function authorize() {
    if (!permission || !session || !profile || busy) return
    setAgreed(false); setBusy(true); setMessage(null)
    try {
      const returnTo = saveConnectionDraft(session.did, profile.did, permission)
      await identity.authorizeConnection(permission, returnTo)
    } catch { if (mounted.current) setMessage('Authorization did not finish, or draft storage is blocked. Nothing follows automatically. Review and confirm again.') }
    finally { if (mounted.current) setBusy(false) }
  }
  async function recover() {
    if (!client || !profile || busy) return
    const operation = ++generation.current
    setBusy(true); setAgreed(false); setMessage(null)
    try {
      const result = await client().recover(profile.did)
      if (!active(operation)) return
      setReceipt(result); setUnknownUri(null)
      setMessage(result.status === 'following' ? 'Following on Bluesky — exact public outcome recovered without a new write.' : 'The exact follow was removed — public outcome recovered without a new write.')
    } catch { if (active(operation)) setMessage('Outcome is still unknown. No write was retried. Check this exact record again, or review your Bluesky account; do not clear recovery storage to retry.') }
    finally { if (active(operation)) setBusy(false) }
  }
  function cancel() {
    cancelWork()
    setBusy(false); setAgreed(false); setPermission(null); setReceipt(null)
    setMessage('Local work canceled. An action already transmitted may still complete; no success or rollback is claimed.')
    // Local read only. Keep any attempted mutation held for exact recovery.
    try { setUnknownUri(profile && client ? client().pending(profile.did)?.uri ?? null : null) }
    catch { setMessage('Local work canceled. Recovery storage could not be read; do not retry a public action.') }
  }
  const own = profile?.did === session?.did
  return <section id="bluesky-connections" aria-label="Bluesky connections" className="lab-card" style={{ fontSize: 15, minWidth: 0 }}>
    <h2 style={{ fontSize: 20, marginBottom: 12 }}>Connect on Bluesky</h2>
    {!personDid && <form className="lab-form" onSubmit={event => { event.preventDefault(); if (!busy) void lookup(handle) }}>
      <label>Find a public profile<input aria-label="Bluesky handle to find" value={handle} disabled={busy} onChange={e => { cancelWork(); setHandle(e.target.value); setProfile(null); setReceipt(null); setAgreed(false); setPermission(null); setUnknownUri(null); setMessage(null) }} placeholder="name.bsky.social" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={253} required /></label>
      <button className="lab-button" disabled={busy || !handle} type="submit">Find person</button>
    </form>}
    <p style={{ fontSize: 13 }}>Public lookup uses Bluesky’s AppView. A display name is not proof of a person’s identity or affiliation.</p>
    {busy && <div><p role="status">Checking your connection…</p>{!permission && <button type="button" className="lab-button" onClick={cancel}>Cancel pending work</button>}</div>}
    {profile && <div style={{ marginBlock: 12, overflowWrap: 'anywhere' }}>
      {profile.avatar && <img src={profile.avatar} alt="" referrerPolicy="no-referrer" width={40} height={40} style={{ borderRadius: '50%' }} />}
      <strong>{profile.displayName ?? profile.handle}</strong><br />
      <a className="lab-text-button" href={`https://bsky.app/profile/${profile.did}`} target="_blank" rel="noopener noreferrer">@{profile.handle}</a>
      {session && <p>Acting as @{session.handle}</p>}
      <p>A follow is public and one-way. It may notify this person and be replicated; it is not a mutual connection.</p>
      <details data-connection-details style={{ fontSize: 13 }}>
        <summary>Account details</summary>
        <p>Profile identity: <code>{profile.did}</code></p>
        {session && <p>Your identity: <code>{session.did}</code></p>}
        <p>This follows a Bluesky account; it does not create Open Lab membership.</p>
      </details>
      {own && <p>You are viewing your own account.</p>}
    </div>}
    {!isAuthenticated && <form className="lab-form" onSubmit={event => {
      event.preventDefault()
      setMessage(null)
      void identity.login(loginHandle, returnHere()).catch(() => { if (mounted.current) setMessage('Sign-in could not start. Your account provider handles authorization; try again.') })
    }}>
      <label>Your Bluesky handle<input aria-label="Your Bluesky handle" value={loginHandle} onChange={e => setLoginHandle(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="you.bsky.social" maxLength={253} required /></label>
      <button type="submit" className="lab-button" disabled={isLoading || !capabilities?.canSignIn || !loginHandle}>Sign in with Bluesky</button>
      <p>Identity-only sign-in. No posts or follows on login. Never enter a password or app key here.</p>
    </form>}
    {(!capabilities?.canSignIn || (isAuthenticated && !capabilities.canConnect)) && !isLoading && <p role="status">{capabilities?.message ?? 'Checking sign-in configuration. Browsing is still available.'}</p>}
    {unknownUri ? <div role="alert" style={{ overflowWrap: 'anywhere' }}>
      <p>Public action outcome unknown. Only check the exact record; do not send another follow or unfollow.</p>
      <code style={{ fontSize: 12 }}>{unknownUri}</code><br />
      <button type="button" className="lab-button" disabled={busy || isLoading} onClick={() => void recover()}>Check exact public outcome</button>
    </div> : profile && isAuthenticated && capabilities?.canConnect && !own && <div>
      {!receipt && <button type="button" className="lab-button" disabled={busy || isLoading} onClick={() => void lookup(profile.did)}>Refresh connection</button>}
      {receipt && <fieldset disabled={busy || isLoading} style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>{receipt.status === 'following' ? 'Following on Bluesky · review unfollow' : 'Review public follow'}</legend>
        {receipt.status === 'following' && <p style={{ fontSize: 12, overflowWrap: 'anywhere' }}>Exact record: {receipt.record.uri}<br />CID: {receipt.record.cid}</p>}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBlock: 12 }}><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} />I confirm this public {verb} from @{session?.handle} to @{profile.handle}. {action === 'delete' ? 'Removing this record cannot recall existing copies.' : 'This person may be notified.'}</label>
        <button type="button" className="lab-button" disabled={!agreed || !!permission} onClick={() => void confirm()}>Confirm public {verb}</button>
      </fieldset>}
      {permission && <div><p>Authorize only the {permission === 'create' ? 'follow' : 'unfollow'} permission. You will return here and must confirm again.</p><button type="button" className="lab-button" disabled={busy || isLoading} onClick={() => void authorize()}>Authorize {permission === 'create' ? 'follow' : 'unfollow'} permission</button></div>}
    </div>}
    {message && <p role="status" style={{ overflowWrap: 'anywhere' }}>{message}</p>}
  </section>
}
