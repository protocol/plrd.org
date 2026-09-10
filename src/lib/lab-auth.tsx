'use client'

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser'
import { ensureValidHandle } from '@atproto/syntax'
import { configForBrowser, safeLabReturnTo, labActionScope, LAB_SIGN_IN_SCOPE, type LabKind, type LabOAuthConfig } from '@/lib/lab-oauth-config'
import { fetchLabCapabilities, type LabAction } from '@/lib/lab-records'
import { assertLabDid } from '@/lib/lab-protocol'

export type LabSession = { did: string; handle: string; displayName?: string; avatar?: string }
type LabAuthSnapshot = { session: LabSession | null; oauthSession: OAuthSession | null; isAuthenticated: boolean; isLoading: boolean; error: string | null; capabilities: LabOAuthConfig | null }
type LabSdkClient = Pick<BrowserOAuthClient, 'init' | 'signInRedirect'>
type LabAuthDependencies = {
  loadConfig: () => Promise<LabOAuthConfig>;
  loadClient: (config: LabOAuthConfig, onDeleted: (did: string) => void) => Promise<LabSdkClient>;
  location: () => { origin: string; pathname: string };
  replace: (path: string) => void;
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
}
const initialSnapshot: LabAuthSnapshot = { session: null, oauthSession: null, isAuthenticated: false, isLoading: true, error: null, capabilities: null }

// The SDK owns PKCE, DPoP, callback validation, refresh, revocation and IndexedDB.
// This small adapter owns only UI state. Injected transport is a local test seam.
export function createLabAuthRuntime(deps: LabAuthDependencies = defaults) {
  let snapshot = initialSnapshot
  let client: LabSdkClient | undefined
  let initialized: Promise<void> | undefined
  let signingOut = false
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
        if (did === snapshot.session?.did) update({ session: null, oauthSession: null, isAuthenticated: false, error: signingOut ? null : 'Your Open Lab session ended. Sign in again to publish.' })
      })
    }
    return client
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => { subscribers.add(listener); return () => { subscribers.delete(listener) } },
    initialize() {
      return initialized ??= (async () => {
        try {
          const sdk = await ready()
          const result = await sdk.init()
          if (result) {
            assertLabDid(result.session.sub)
            // DID fallback is deliberate: no fabricated or unverified profile/handle.
            update({ session: { did: result.session.sub, handle: result.session.sub }, oauthSession: result.session, isAuthenticated: true })
            if ('state' in result) deps.replace(safeLabReturnTo(result.state))
          }
        } catch { update({ error: snapshot.capabilities?.canSignIn ? 'Open Lab sign-in could not be restored or completed. Your local drafts are unchanged. Try signing in again.' : snapshot.capabilities?.message ?? 'Open Lab sign-in is unavailable. Browsing still works.' }) }
        finally { update({ isLoading: false }) }
      })()
    },
    async login(handle: string, returnTo?: string) {
      try { ensureValidHandle(handle) }
      catch { const message = 'Enter your existing AT Protocol handle, without @, whitespace, or a URL.'; update({ error: message }); throw new Error(message) }
      update({ error: null, isLoading: true })
      try {
        const sdk = await ready()
        await sdk.signInRedirect(handle, { scope: LAB_SIGN_IN_SCOPE, state: safeLabReturnTo(returnTo) })
      } catch {
        const message = snapshot.capabilities?.canSignIn ? 'Sign-in was canceled or could not start. Your drafts are unchanged; try again.' : snapshot.capabilities?.message ?? 'Sign-in is unavailable.'
        update({ error: message }); throw new Error(message)
      } finally { update({ isLoading: false }) }
    },
    async authorizeWrite(kind: LabKind, action: LabAction, returnTo?: string) {
      const scope = `${LAB_SIGN_IN_SCOPE} ${labActionScope(kind, action)}`
      const did = snapshot.session?.did
      if (!did) throw new Error('Sign in before authorizing a public action.')
      update({ error: null, isLoading: true })
      try {
        const sdk = await ready()
        if (!snapshot.capabilities?.canPublish) throw new Error('Public publication is disabled on this origin.')
        // Return to a draft, never to an automatic publish/delete continuation.
        await sdk.signInRedirect(did, { scope, state: safeLabReturnTo(returnTo), prompt: 'consent' })
      } catch {
        const message = snapshot.capabilities?.canPublish ? 'Authorization was canceled or could not start. Review your draft and try again.' : 'Public publication is disabled on this origin.'
        update({ error: message }); throw new Error(message)
      } finally { update({ isLoading: false }) }
    },
    async logout() {
      update({ error: null })
      signingOut = true
      try {
        await snapshot.oauthSession?.signOut()
        update({ session: null, oauthSession: null, isAuthenticated: false })
      } catch { update({ error: 'Sign-out could not be confirmed. Retry, or revoke Open Lab access in your account settings.' }); throw new Error('Sign-out could not be confirmed.') }
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
  return { ...snapshot, login: runtime.login, logout: runtime.logout, authorizeWrite: runtime.authorizeWrite }
}
