'use client'

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser'
import { ensureValidHandle } from '@atproto/syntax'
import { configForBrowser, safeLabReturnTo, labConnectionScope, type LabConnectionAction, labActionScope, LAB_SIGN_IN_SCOPE, type LabKind, type LabOAuthConfig } from '@/lib/lab-oauth-config'
import { fetchLabCapabilities, type LabAction } from '@/lib/lab-records'
import { assertLabDid } from '@/lib/lab-protocol'
import { Agent } from '@atproto/api'
import { boundedLabFetch } from '@/lib/lab-bounded-transport'

export type LabSession = { did: string; handle: string; displayName?: string; avatar?: string }
// Public AppView data is presentation, not proof of a person's name or affiliation.
// Bind the profile to the SDK's DID, and forward-resolve its current handle too.
export function createLabProfileReader(fetcher: typeof fetch = globalThis.fetch) {
  const agent = new Agent(boundedLabFetch({ fetchHandler: (path, init) => fetcher(new URL(path, 'https://public.api.bsky.app'), { ...init, method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store' }) }))
  return async (actor: string): Promise<LabSession> => {
    let did = actor
    if (actor.startsWith('did:')) assertLabDid(actor)
    else {
      ensureValidHandle(actor)
      did = (await agent.com.atproto.identity.resolveHandle({ handle: actor })).data.did
      assertLabDid(did)
    }
    const { data } = await agent.app.bsky.actor.getProfile({ actor: did })
    if (data.did !== did) throw new Error('Public profile identity mismatch.')
    ensureValidHandle(data.handle)
    if (actor !== data.handle && (await agent.com.atproto.identity.resolveHandle({ handle: data.handle })).data.did !== did) throw new Error('Public profile handle no longer resolves to this DID.')
    let avatar: string | undefined
    try {
      const url = new URL(data.avatar ?? '')
      // Bluesky's image CDN only: no arbitrary tracking/private-network images.
      if (url.origin === 'https://cdn.bsky.app' && !url.username && !url.password && !url.search && !url.hash && url.href === data.avatar && url.pathname.startsWith('/img/avatar/')) avatar = data.avatar
    } catch { /* An unsafe/missing avatar is omitted, never rendered. */ }
    const displayName = typeof data.displayName === 'string' && data.displayName.length <= 640 && !/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(data.displayName) ? data.displayName : undefined
    return { did, handle: data.handle, ...(displayName ? { displayName } : {}), ...(avatar ? { avatar } : {}) }
  }
}
type LabAuthSnapshot = { session: LabSession | null; oauthSession: OAuthSession | null; isAuthenticated: boolean; isLoading: boolean; error: string | null; capabilities: LabOAuthConfig | null }
type LabSdkClient = Pick<BrowserOAuthClient, 'init' | 'authorize'>
type LabAuthDependencies = {
  loadConfig: () => Promise<LabOAuthConfig>;
  loadClient: (config: LabOAuthConfig, onDeleted: (did: string) => void) => Promise<LabSdkClient>;
  location: () => { origin: string; pathname: string };
  replace: (path: string) => void;
  loadProfile?: (did: string) => Promise<LabSession>;
}
const defaults: LabAuthDependencies = {
  loadConfig: fetchLabCapabilities,
  loadClient: async (config, onDeleted) => {
    if (!config.clientId) throw new Error('Open Lab OAuth is not configured.')
    const { BrowserOAuthClient } = await import('@atproto/oauth-client-browser')
    return BrowserOAuthClient.load({ clientId: config.clientId, handleResolver: 'https://bsky.social', responseMode: 'fragment', onSessionDeleted: onDeleted })
  },
  location: () => window.location,
  replace: path => window.location.replace(path),
  loadProfile: did => createLabProfileReader()(did),
}
const initialSnapshot: LabAuthSnapshot = { session: null, oauthSession: null, isAuthenticated: false, isLoading: true, error: null, capabilities: null }

// The SDK owns PKCE, DPoP, callback validation, refresh, revocation and IndexedDB.
// This small adapter owns only UI state. Injected transport is a local test seam.
export function createLabAuthRuntime(deps: LabAuthDependencies = defaults) {
  let snapshot = initialSnapshot
  let client: LabSdkClient | undefined
  let initialized: Promise<void> | undefined
  let signingOut = false
  let generation = 0
  const subscribers = new Set<() => void>()
  function update(patch: Partial<LabAuthSnapshot>) {
    snapshot = { ...snapshot, ...patch }
    subscribers.forEach(listener => listener())
  }
  async function ready() {
    const capabilities = configForBrowser(await deps.loadConfig(), deps.location().origin)
    update({ capabilities })
    if (!capabilities.canSignIn) throw new Error(capabilities.message)
    if (!client) {
      client = await deps.loadClient(capabilities, did => {
        // With no installed identity this can invalidate a pending restore too.
        if (!snapshot.session || did === snapshot.session.did) {
          generation++
          update({ session: null, oauthSession: null, isAuthenticated: false, isLoading: false, error: signingOut ? null : 'Your Open Lab session ended. Sign in again to publish.' })
        }
      })
    }
    return client
  }
  return {
    getSnapshot: () => snapshot,
    isSessionCurrent: (session: OAuthSession) => snapshot.isAuthenticated && !snapshot.isLoading && snapshot.oauthSession === session && snapshot.session?.did === session.sub,
    getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => { subscribers.add(listener); return () => { subscribers.delete(listener) } },
    initialize() {
      return initialized ??= (async () => {
        const operation = generation
        try {
          const sdk = await ready()
          if (operation !== generation) return
          const result = await sdk.init()
          if (operation !== generation) {
            // The SDK owns local-store removal and best-effort remote revocation.
            // A failed cleanup must never reinstall a canceled session.
            try { await result?.session.signOut() } catch { /* Discard locally. */ }
            return
          }
          if (result) {
            assertLabDid(result.session.sub)
            // DID fallback is deliberate: no fabricated or unverified profile/handle.
            update({ session: { did: result.session.sub, handle: result.session.sub }, oauthSession: result.session, isAuthenticated: true })
            if (operation === generation && deps.loadProfile) {
              try {
                const profile = await deps.loadProfile(result.session.sub)
                if (operation === generation && snapshot.oauthSession === result.session && profile.did === result.session.sub) update({ session: profile })
              } catch { /* Public lookup outage never invalidates SDK identity. */ }
            }
            if (operation === generation && 'state' in result) deps.replace(safeLabReturnTo(result.state))
          }
        } catch { if (operation === generation) update({ error: snapshot.capabilities?.canSignIn ? 'Open Lab sign-in could not be restored or completed. Your local drafts are unchanged. Try signing in again.' : snapshot.capabilities?.message ?? 'Open Lab sign-in is unavailable. Browsing still works.' }) }
        finally { if (operation === generation) update({ isLoading: false }) }
      })()
    },
    async login(handle: string, returnTo?: string) {
      try { ensureValidHandle(handle) }
      catch { const message = 'Enter your existing AT Protocol handle, without @, whitespace, or a URL.'; update({ error: message }); throw new Error(message) }
      const operation = ++generation
      update({ error: null, isLoading: true })
      try {
        const sdk = await ready()
        if (operation !== generation) return
        // Keep SDK authorization, but guard the final navigation: its combined
        // signInRedirect helper navigates unconditionally after awaiting PAR.
        const url = await sdk.authorize(handle, { scope: LAB_SIGN_IN_SCOPE, state: safeLabReturnTo(returnTo) })
        if (operation === generation) deps.replace(url.href)
      } catch {
        if (operation !== generation) return
        const message = snapshot.capabilities?.canSignIn ? 'Sign-in was canceled or could not start. Your drafts are unchanged; try again.' : snapshot.capabilities?.message ?? 'Sign-in is unavailable.'
        update({ error: message }); throw new Error(message)
      } finally { if (operation === generation) update({ isLoading: false }) }
    },
    async authorizeWrite(kind: LabKind, action: LabAction, returnTo?: string) {
      const scope = `${LAB_SIGN_IN_SCOPE} ${labActionScope(kind, action)}`
      const did = snapshot.session?.did
      if (!did) throw new Error('Sign in before authorizing a public action.')
      const operation = ++generation
      update({ error: null, isLoading: true })
      try {
        const sdk = await ready()
        if (operation !== generation) return
        if (!snapshot.capabilities?.canPublish) throw new Error('Public publication is disabled on this origin.')
        // Return to a draft, never to an automatic publish/delete continuation.
        const url = await sdk.authorize(did, { scope, state: safeLabReturnTo(returnTo), prompt: 'consent' })
        if (operation === generation && snapshot.session?.did === did) deps.replace(url.href)
      } catch {
        if (operation !== generation) return
        const message = snapshot.capabilities?.canPublish ? 'Authorization was canceled or could not start. Review your draft and try again.' : 'Public publication is disabled on this origin.'
        update({ error: message }); throw new Error(message)
      } finally { if (operation === generation) update({ isLoading: false }) }
    },
    async authorizeConnection(action: LabConnectionAction, returnTo?: string) {
      const scope = `${LAB_SIGN_IN_SCOPE} ${labConnectionScope(action)}`
      const did = snapshot.session?.did
      if (!did) throw new Error('Sign in before authorizing a public follow action.')
      const operation = ++generation
      update({ error: null, isLoading: true })
      try {
        const sdk = await ready()
        if (operation !== generation) return
        if (!snapshot.capabilities?.canConnect) throw new Error('Public connections are disabled on this origin.')
        const url = await sdk.authorize(did, { scope, state: safeLabReturnTo(returnTo), prompt: 'consent' })
        if (operation === generation && snapshot.session?.did === did) deps.replace(url.href)
      } catch {
        if (operation !== generation) return
        const message = snapshot.capabilities?.canConnect ? 'Connection authorization was canceled or could not start. Review and confirm again.' : 'Public connections are disabled on this origin.'
        update({ error: message }); throw new Error(message)
      } finally { if (operation === generation) update({ isLoading: false }) }
    },
    async logout() {
      generation++
      const session = snapshot.oauthSession
      update({ session: null, oauthSession: null, isAuthenticated: false, isLoading: false, error: null })
      signingOut = true
      try {
        await session?.signOut()
      } catch {
        const message = 'Signed out of this page, but SDK local session cleanup could not be confirmed. Clear this site’s browser storage and revoke Open Lab access in your account settings.'
        update({ error: message }); throw new Error(message)
      }
      finally { signingOut = false }
    },
  }
}
type LabAuthRuntime = ReturnType<typeof createLabAuthRuntime>
let browserRuntime: LabAuthRuntime | undefined
const LabAuthContext = createContext<LabAuthRuntime | null>(null)
export function LabAuthProvider({ children }: { children: ReactNode }) {
  const [runtime] = useState(() => typeof window === 'undefined' ? createLabAuthRuntime() : browserRuntime ??= createLabAuthRuntime())
  useEffect(() => { void runtime.initialize() }, [runtime])
  return <LabAuthContext.Provider value={runtime}>{children}</LabAuthContext.Provider>
}
export function useLabAuth() {
  const runtime = useContext(LabAuthContext)
  if (!runtime) throw new Error('useLabAuth requires LabAuthProvider.')
  const snapshot = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getServerSnapshot)
  return { ...snapshot, isSessionCurrent: runtime.isSessionCurrent, login: runtime.login, logout: runtime.logout, authorizeWrite: runtime.authorizeWrite, authorizeConnection: runtime.authorizeConnection }
}
