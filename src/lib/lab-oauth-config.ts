// This module contains public configuration only. Never import legacy CMS auth.
export const LAB_COLLECTIONS = {
  profile: 'org.plresearch.lab.profile',
  note: 'org.plresearch.lab.note',
  app: 'org.plresearch.lab.app',
  contribution: 'org.plresearch.lab.contribution',
  participation: 'org.plresearch.lab.participation',
} as const
export type LabKind = keyof typeof LAB_COLLECTIONS
export const LAB_CALLBACK_PATH = '/lab/oauth/return/'
export const LAB_METADATA_PATH = '/api/lab/oauth/client-metadata.json'
export const LAB_SIGN_IN_SCOPE = 'atproto'
export const labWriteScope = (kind: LabKind) => `repo:${LAB_COLLECTIONS[kind]}?action=create${kind === 'profile' ? '&action=update' : ''}&action=delete`
export const LAB_FOLLOW_COLLECTION = 'app.bsky.graph.follow'
export type LabConnectionAction = 'create' | 'delete'
export function labConnectionScope(action: LabConnectionAction): string {
  if (!['create', 'delete'].includes(action)) throw new Error('Unsupported connection permission.')
  return `repo:${LAB_FOLLOW_COLLECTION}?action=${action}`
}
export const LAB_MAX_SCOPE = [LAB_SIGN_IN_SCOPE, `repo:${LAB_FOLLOW_COLLECTION}?action=create&action=delete`, ...Object.keys(LAB_COLLECTIONS).map(k => labWriteScope(k as LabKind))].join(' ')
export function labActionScope(kind: LabKind, action: 'create' | 'update' | 'delete'): string {
  if (!Object.hasOwn(LAB_COLLECTIONS, kind) || !['create', 'update', 'delete'].includes(action) || (action === 'update' && kind !== 'profile')) throw new Error('Unsupported Open Lab permission.')
  return `repo:${LAB_COLLECTIONS[kind]}?action=${action}`
}
export type LabOAuthEnvironment = { LAB_PUBLIC_URL?: string; LAB_ENABLE_PUBLISH?: string; LAB_ENABLE_CONNECT?: string; VERCEL?: string; VERCEL_URL?: string; VERCEL_BRANCH_URL?: string; VERCEL_ENV?: string; NODE_ENV?: string }
export type LabClientMetadata = {
  client_id: string; client_name: string; client_uri: string; redirect_uris: [string];
  scope: string; grant_types: ['authorization_code', 'refresh_token']; response_types: ['code'];
  token_endpoint_auth_method: 'none'; application_type: 'web'; dpop_bound_access_tokens: true;
}
export type LabOAuthConfig = {
  canSignIn: boolean; canConnect: boolean; canPublish: boolean; mode: 'ready' | 'unconfigured';
  oauthVerified: false; schemaPublished: false; message: string;
  origin?: string; clientId?: string; redirectUri?: string; metadata?: LabClientMetadata; loopback?: boolean;
}
const unavailable = (message: string): LabOAuthConfig => ({ canSignIn: false, canConnect: false, canPublish: false, mode: 'unconfigured', oauthVerified: false, schemaPublished: false, message })

export function getLabOAuthConfig(env: LabOAuthEnvironment = process.env): LabOAuthConfig {
  // Request Host / Forwarded headers and legacy PUBLIC_URL never define our identity.
  // Only deployment-provided values confer trust, never a matching URL suffix on
  // a request. An explicitly present malformed/empty branch URL fails closed.
  const vercelHost = (value: string | undefined) => typeof value === 'string' && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/.test(value) ? `https://${value}` : ''
  const deploymentOrigin = env.VERCEL === '1' ? vercelHost(env.VERCEL_URL) : ''
  const branchOrigin = env.VERCEL === '1' && env.VERCEL_ENV === 'preview' && env.VERCEL_BRANCH_URL !== undefined ? vercelHost(env.VERCEL_BRANCH_URL) : undefined
  const configured = env.LAB_PUBLIC_URL ?? (branchOrigin ?? deploymentOrigin)
  let url: URL
  try { url = new URL(configured) } catch { return unavailable('Set LAB_PUBLIC_URL to the exact public HTTPS origin. Browsing and local drafts still work.') }
  const loopback = url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname) && env.VERCEL !== '1' && env.NODE_ENV !== 'production'
  const publicHttps = url.protocol === 'https:' && !url.port && /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(url.hostname) && !/\.(?:localhost|local|internal|test)$/i.test(url.hostname)
  if ((!loopback && !publicHttps) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || configured !== url.origin && configured !== url.origin + '/') {
    return unavailable('LAB_PUBLIC_URL must be an HTTPS origin without credentials, path, query, or custom port; local development must use an explicit loopback IP origin.')
  }
  const origin = url.origin
  if (env.VERCEL === '1' && env.VERCEL_ENV !== 'production' && origin !== deploymentOrigin && origin !== branchOrigin) return unavailable('This preview cannot inherit a production OAuth origin. Configure the exact trusted deployment or branch URL, or leave sign-in disabled.')
  const redirectUri = origin + LAB_CALLBACK_PATH
  if (loopback) {
    // Official BrowserOAuthClient.load invokes atprotoLoopbackClientMetadata.
    const clientId = `http://localhost?${new URLSearchParams({ redirect_uri: redirectUri, scope: LAB_MAX_SCOPE })}`
    return { canSignIn: true, canConnect: (env.LAB_ENABLE_CONNECT === undefined || env.LAB_ENABLE_CONNECT === 'true'), canPublish: env.LAB_ENABLE_PUBLISH === 'true', mode: 'ready', oauthVerified: false, schemaPublished: false,
      message: 'Local loopback configuration only; real account authorization remains unverified.', origin, clientId, redirectUri, loopback: true }
  }
  const clientId = origin + LAB_METADATA_PATH
  return { canSignIn: true, canConnect: (env.LAB_ENABLE_CONNECT === undefined || env.LAB_ENABLE_CONNECT === 'true'), canPublish: env.LAB_ENABLE_PUBLISH === 'true', mode: 'ready', oauthVerified: false, schemaPublished: false,
    message: 'Configuration ready; account OAuth and public publication have not been verified.', origin, clientId, redirectUri,
    metadata: { client_id: clientId, client_name: 'PL R&D Open Lab', client_uri: origin + '/lab/', redirect_uris: [redirectUri], scope: LAB_MAX_SCOPE,
      grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none', application_type: 'web', dpop_bound_access_tokens: true } }
}

export function configForBrowser(config: LabOAuthConfig, origin: string): LabOAuthConfig {
  if (config.canSignIn !== true || config.mode !== 'ready') return unavailable(config.message || 'Open Lab sign-in is not configured.')
  if (config.origin !== origin) return unavailable('Sign-in is configured for a different origin. Open the configured Lab origin; drafts stay on this origin.')
  const expected = getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: config.canPublish === true ? 'true' : 'false', NODE_ENV: 'development' })
  if (!expected.canSignIn || config.clientId !== expected.clientId || config.redirectUri !== expected.redirectUri || JSON.stringify(config.metadata) !== JSON.stringify(expected.metadata)) return unavailable('OAuth configuration is stale or incomplete. Reload from the configured origin.')
  return { ...config, canConnect: config.canConnect === true, canPublish: config.canPublish === true }
}

// Next may expose its internal listener origin in Request.url. A matching Host
// and protocol can confirm ONLY the identity already selected from deployment
// configuration; no forwarded host is ever used to construct an OAuth identity.
// The browser independently enforces its own window.location.origin as well.
export function configForRequest(config: LabOAuthConfig, request: Request): LabOAuthConfig {
  const url = new URL(request.url)
  if (url.origin === config.origin) return configForBrowser(config, url.origin)
  if (config.origin && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    const expected = new URL(config.origin)
    const protocol = request.headers.get('x-forwarded-proto') ?? url.protocol.slice(0, -1)
    if (request.headers.get('host') === expected.host && protocol === expected.protocol.slice(0, -1)) return configForBrowser(config, config.origin)
  }
  return unavailable('Sign-in is configured for a different origin. Open the configured Lab origin; drafts stay on this origin.')
}

export function safeLabReturnTo(input?: string | null): string {
  // Check the original path BEFORE decoding or constructing a URL (which normalizes it).
  if (!input || input.length > 4096 || /[\\\u0000-\u0020\u007f]/.test(input)) return '/lab/'
  const match = /^(\/lab\/(?:feed\/|people\/|apps\/|atlas\/|collaborate\/|profile\/|record\/|bottlenecks\/|onboarding\/|demo\/|efforts\/|explorations\/(?:arcade\/|observatory\/)?)?)((?:\?[^#]*)?)(#[a-zA-Z0-9_-]{1,80})?$/.exec(input)
  if (!match) return '/lab/'
  const seen = new Set<string>()
  const fields = ['all', 'digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech', 'cross-field']
  for (const pair of match[2].slice(1).split('&').filter(Boolean)) {
    const parts = pair.split('=')
    if (parts.length !== 2 || !/^[a-z]+$/.test(parts[0]) || seen.has(parts[0])) return '/lab/'
    const key = parts[0]
    seen.add(key)
    let value: string
    try { value = decodeURIComponent(parts[1].replace(/\+/g, ' ')) } catch { return '/lab/' }
    if (!value || /[\\%\u0000-\u001f\u007f]/.test(value)) return '/lab/'
    if (key === 'uri' || key === 'response') {
      if (match[1] !== '/lab/record/' || !safeReturnRecordUri(value)) return '/lab/'
    } else if (key === 'discussion') {
      if (match[1] !== '/lab/demo/' || !['split-boundary', 'duration-denominator', 'receipt-permission'].includes(value)) return '/lab/'
      if (match[3] && match[3] !== `#demo-discussion-${value}`) return '/lab/'
    } else if (key === 'field') {
      if (!fields.includes(value)) return '/lab/'
    } else if (key === 'type') {
      if (!['all', 'question', 'finding', 'tool', 'help', 'negative'].includes(value)) return '/lab/'
    } else if (key === 'case') {
      if (!['reproducibility', 'neural-measurement', 'open-artifacts'].includes(value)) return '/lab/'
    } else if (key === 'q') {
      if (value.length > 200) return '/lab/'
    } else if (['app', 'task', 'node', 'thread', 'person'].includes(key)) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(value)) return '/lab/'
    } else return '/lab/'
  }
  if (seen.has('response') && !seen.has('uri')) return '/lab/'
  return input
}
// Deliberately dependency-light: this public config module also runs on the server.
function safeReturnRecordUri(value: string): boolean {
  if (value.length > 1024) return false
  const match = /^at:\/\/(did:plc:[a-z2-7]{24}|did:web:[a-z0-9.-]+)\/(org\.plresearch\.lab\.(profile|note|app|contribution|participation))\/([a-zA-Z0-9._~:-]{1,512})$/.exec(value)
  if (!match || ['.', '..'].includes(match[4]) || (match[3] === 'profile' && match[4] !== 'self')) return false
  if (match[1].startsWith('did:web:')) {
    const domain = match[1].slice(8)
    if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/.test(domain) || /\.(local|localhost|internal|test)$/.test(domain)) return false
  }
  return true
}
