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
export const LAB_MAX_SCOPE = [LAB_SIGN_IN_SCOPE, ...Object.keys(LAB_COLLECTIONS).map(k => labWriteScope(k as LabKind))].join(' ')
export function labActionScope(kind: LabKind, action: 'create' | 'update' | 'delete'): string {
  if (!Object.hasOwn(LAB_COLLECTIONS, kind) || !['create', 'update', 'delete'].includes(action) || (action === 'update' && kind !== 'profile')) throw new Error('Unsupported Open Lab permission.')
  return `repo:${LAB_COLLECTIONS[kind]}?action=${action}`
}
export type LabOAuthEnvironment = { LAB_PUBLIC_URL?: string; LAB_ENABLE_PUBLISH?: string; VERCEL?: string; VERCEL_URL?: string; VERCEL_ENV?: string; NODE_ENV?: string }
export type LabClientMetadata = {
  client_id: string; client_name: string; client_uri: string; redirect_uris: [string];
  scope: string; grant_types: ['authorization_code', 'refresh_token']; response_types: ['code'];
  token_endpoint_auth_method: 'none'; application_type: 'web'; dpop_bound_access_tokens: true;
}
export type LabOAuthConfig = {
  canSignIn: boolean; canPublish: boolean; mode: 'ready' | 'unconfigured';
  oauthVerified: false; schemaPublished: false; message: string;
  origin?: string; clientId?: string; redirectUri?: string; metadata?: LabClientMetadata; loopback?: boolean;
}
const unavailable = (message: string): LabOAuthConfig => ({ canSignIn: false, canPublish: false, mode: 'unconfigured', oauthVerified: false, schemaPublished: false, message })

export function getLabOAuthConfig(env: LabOAuthEnvironment = process.env): LabOAuthConfig {
  // Request Host / Forwarded headers and legacy PUBLIC_URL never define our identity.
  const configured = env.LAB_PUBLIC_URL ?? (env.VERCEL === '1' && /^[a-z0-9-]+\.vercel\.app$/.test(env.VERCEL_URL ?? '') ? `https://${env.VERCEL_URL}` : '')
  let url: URL
  try { url = new URL(configured) } catch { return unavailable('Set LAB_PUBLIC_URL to the exact public HTTPS origin. Browsing and local drafts still work.') }
  const loopback = url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname) && env.VERCEL !== '1' && env.NODE_ENV !== 'production'
  const publicHttps = url.protocol === 'https:' && !url.port && /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(url.hostname) && !/\.(?:localhost|local|internal|test)$/i.test(url.hostname)
  if ((!loopback && !publicHttps) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || configured !== url.origin && configured !== url.origin + '/') {
    return unavailable('LAB_PUBLIC_URL must be an HTTPS origin without credentials, path, query, or custom port; local development must use an explicit loopback IP origin.')
  }
  const origin = url.origin
  if (env.VERCEL === '1' && env.VERCEL_ENV !== 'production' && origin !== `https://${env.VERCEL_URL}`) return unavailable('This preview cannot inherit a production OAuth origin. Configure this exact preview, or leave sign-in disabled.')
  const redirectUri = origin + LAB_CALLBACK_PATH
  if (loopback) {
    // Official BrowserOAuthClient.load invokes atprotoLoopbackClientMetadata.
    const clientId = `http://localhost?${new URLSearchParams({ redirect_uri: redirectUri, scope: LAB_MAX_SCOPE })}`
    return { canSignIn: true, canPublish: env.LAB_ENABLE_PUBLISH === 'true', mode: 'ready', oauthVerified: false, schemaPublished: false,
      message: 'Local loopback configuration only; real account authorization remains unverified.', origin, clientId, redirectUri, loopback: true }
  }
  const clientId = origin + LAB_METADATA_PATH
  return { canSignIn: true, canPublish: env.LAB_ENABLE_PUBLISH === 'true', mode: 'ready', oauthVerified: false, schemaPublished: false,
    message: 'Configuration ready; account OAuth and public publication have not been verified.', origin, clientId, redirectUri,
    metadata: { client_id: clientId, client_name: 'PL R&D Open Lab', client_uri: origin + '/lab/', redirect_uris: [redirectUri], scope: LAB_MAX_SCOPE,
      grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none', application_type: 'web', dpop_bound_access_tokens: true } }
}

export function configForBrowser(config: LabOAuthConfig, origin: string): LabOAuthConfig {
  if (config.canSignIn !== true || config.mode !== 'ready') return unavailable(config.message || 'Open Lab sign-in is not configured.')
  if (config.origin !== origin) return unavailable('Sign-in is configured for a different origin. Open the configured Lab origin; drafts stay on this origin.')
  const expected = getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: config.canPublish === true ? 'true' : 'false', NODE_ENV: 'development' })
  if (!expected.canSignIn || config.clientId !== expected.clientId || config.redirectUri !== expected.redirectUri || JSON.stringify(config.metadata) !== JSON.stringify(expected.metadata)) return unavailable('OAuth configuration is stale or incomplete. Reload from the configured origin.')
  return { ...config, canPublish: config.canPublish === true }
}

export function safeLabReturnTo(input?: string | null): string {
  if (!input || input.length > 1024 || /[\\%\u0000-\u0020]/.test(input)) return '/lab/'
  const match = /^(\/lab\/(?:feed\/|apps\/|atlas\/|collaborate\/|profile\/|record\/)?)((?:\?[^#]*)?)(#[a-zA-Z0-9_-]+)?$/.exec(input)
  if (!match) return '/lab/'
  const query = new URLSearchParams(match[2])
  if ([...query.keys()].some(k => !['type', 'field', 'q', 'uri', 'app', 'task', 'node'].includes(k))) return '/lab/'
  return input
}
