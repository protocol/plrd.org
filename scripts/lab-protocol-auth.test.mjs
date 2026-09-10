import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
const origin = 'https://lab.example.org'
function harness({ configPatch = {}, result, initError } = {}) {
  const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: 'true' })
  const calls = []; const redirects = []; const listeners = new Map()
  const oauthSession = { sub: did, did, signOut: async () => { calls.push(['signOut']) } }
  const client = { init: async () => { calls.push(['init']); if (initError) throw initError; return result === 'callback' ? { session: oauthSession, state: '/lab/profile/#draft' } : result === 'restore' ? { session: oauthSession } : undefined }, signInRedirect: async (handle, options) => { calls.push(['signInRedirect', handle, options]) }, addEventListener: (name, cb) => listeners.set(name, cb) }
  const runtime = source('lib/lab-auth.tsx').createLabAuthRuntime({ loadConfig: async () => ({ ...config, ...configPatch }), loadClient: async (c, onDeleted) => { calls.push(['load', c.clientId]); listeners.set('deleted', onDeleted); return client }, location: () => ({ origin, pathname: '/lab/oauth/return/' }), replace: path => redirects.push(path) })
  return { runtime, calls, redirects, listeners, configPatch }
}

test('OAuth return route renders accessible progress without claiming a publication', async () => {
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const Page = source('app/lab/oauth/return/page.tsx').default
  const html = renderToStaticMarkup(React.createElement(Page))
  assert.match(html, /role="status"/)
  assert.match(html, /Nothing is published automatically/)
  assert.match(html, /href="\/lab\/"/)
})

test('handle-only sign-in requests identity, permission escalation requests one exact action and never auto-publishes', async () => {
  const h = harness({ result: 'restore' })
  await h.runtime.initialize()
  for (const input of ['https://pds.example.org', 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', '@science.bsky.social', 'science.bsky.social ', 'bad']) await assert.rejects(() => h.runtime.login(input))
  assert.equal(h.calls.filter(c => c[0] === 'signInRedirect').length, 0)
  await h.runtime.login('science.bsky.social', '//evil.example.org/')
  assert.deepEqual(h.calls.at(-1), ['signInRedirect', 'science.bsky.social', { scope: 'atproto', state: '/lab/' }])
  await h.runtime.authorizeWrite('note', 'create', '/lab/feed/#draft')
  assert.deepEqual(h.calls.at(-1), ['signInRedirect', did, { scope: 'atproto repo:org.plresearch.lab.note?action=create', state: '/lab/feed/#draft', prompt: 'consent' }])
  h.configPatch.canPublish = false
  await assert.rejects(() => h.runtime.authorizeWrite('note', 'create'), /disabled/)
})

test('unconfigured origins, SDK callback errors and invalidated sessions never produce a fake identity', async () => {
  const unavailable = harness({ configPatch: { origin: 'https://wrong.example.org' } })
  await unavailable.runtime.initialize()
  assert.equal(unavailable.calls.length, 0)
  assert.equal(unavailable.runtime.getSnapshot().isAuthenticated, false)
  await assert.rejects(() => unavailable.runtime.login('science.bsky.social'))
  const failed = harness({ initError: new Error('sensitive OAuth state') })
  await failed.runtime.initialize()
  assert.equal(failed.runtime.getSnapshot().session, null)
  assert.equal(failed.runtime.getSnapshot().error.includes('sensitive'), false)
  const restored = harness({ result: 'restore' })
  await restored.runtime.initialize()
  assert.equal(restored.redirects.length, 0)
  restored.listeners.get('deleted')(did)
  assert.equal(restored.runtime.getSnapshot().isAuthenticated, false)
  assert.match(restored.runtime.getSnapshot().error, /session ended/)
})

test('browser auth initializes only once, restores identity, and carries safe callback state without publishing', async () => {
  const { runtime, calls, redirects } = harness({ result: 'callback' })
  await Promise.all([runtime.initialize(), runtime.initialize()])
  assert.equal(calls.filter(c => c[0] === 'init').length, 1)
  assert.equal(runtime.getSnapshot().session.did, did)
  assert.equal(runtime.getSnapshot().isAuthenticated, true)
  assert.equal(runtime.getSnapshot().isLoading, false)
  assert.deepEqual(redirects, ['/lab/profile/#draft'])
  await runtime.logout()
  assert.equal(runtime.getSnapshot().session, null)
  assert.equal(calls.at(-1)[0], 'signOut')
})
