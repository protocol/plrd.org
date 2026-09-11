import { artifacts } from '@/lib/lab-data'

export type AppListing = {
  id: string; title: string; description: string; field: string; origin: 'editorial' | 'local';
  maintainer: string; license: string; useCase: string; evidence: string;
  sourceUrl: string; launchUrl: string; codeUrl: string; licenseUrl?: string;
}
/** Reject before URL normalization: browsers otherwise erase whitespace/control characters. */
export function safeAppUrl(value: unknown, githubOnly = false): value is string {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\s\u0000-\u001f\u007f]|%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && (!githubOnly || url.hostname === 'github.com')
  } catch { return false }
}
const text = (v: unknown, max: number) => typeof v === 'string' && !!v.trim() && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)
const fields = ['cross-field', 'neurotech', 'ai-robotics', 'digital-human-rights', 'economies-governance']
export function validAppListing(app: AppListing): boolean {
  return !!app && !Object.keys(app).some(k => !['id','title','description','field','origin','maintainer','license','useCase','evidence','sourceUrl','launchUrl','codeUrl','licenseUrl'].includes(k)) && text(app.id, 120) && text(app.title, 200) && text(app.description, 2000) && fields.includes(app.field) &&
    ['editorial', 'local'].includes(app.origin) && text(app.maintainer, 200) && text(app.license, 500) && text(app.useCase, 2000) && text(app.evidence, 2000) &&
    safeAppUrl(app.sourceUrl) && safeAppUrl(app.launchUrl) && (app.codeUrl === '' || safeAppUrl(app.codeUrl, true)) && (app.licenseUrl === undefined || safeAppUrl(app.licenseUrl))
}
const evidence: Record<string, string> = {
  marimo: 'Official project and public source repository. Reproducibility depends on your inputs and pinned environment; this listing is not an independent evaluation.',
  neuromatch: 'Public course materials and tutorial source. Learning examples are not clinical guidance or validated findings from your own data.',
  jupyterlite: 'Project Jupyter documentation and linked browser notebook. Browser storage and available packages differ from a full Python environment.',
  cadcad: 'Official project and simulation source. Simulated policy outcomes depend on the model assumptions; they are not measured outcomes.',
  allen: 'Allen Institute resource portal. Check the exact dataset, release, methods, and terms before interpreting or reusing results.',
}
// Official license files inspected September 11, 2026. Terms may change; links remain authoritative.
const licenses: Record<string, { license: string; licenseUrl: string }> = {
  marimo: { license: 'Apache-2.0 (source code)', licenseUrl: 'https://github.com/marimo-team/marimo/blob/main/LICENSE' },
  jupyterlite: { license: 'BSD-3-Clause (source code)', licenseUrl: 'https://github.com/jupyterlite/jupyterlite/blob/main/LICENSE' },
  cadcad: { license: 'MIT (source code)', licenseUrl: 'https://github.com/cadCAD-org/cadCAD/blob/master/LICENSE.txt' },
}
export const APP_CATALOG: AppListing[] = artifacts.filter(a => a.app).map(a => ({
  id: a.id, title: a.title, description: a.description, field: a.field, origin: 'editorial',
  maintainer: a.source, license: licenses[a.id]?.license || a.license || 'Not verified here — check the source license and data terms.',
  useCase: a.prompt, evidence: evidence[a.id], sourceUrl: a.url, launchUrl: a.demoUrl || a.url, codeUrl: a.codeUrl || '',
  licenseUrl: licenses[a.id]?.licenseUrl,
}))
export type AppShelf = { version: 1; owner: string; mode: 'demo' | 'live'; saved: string[]; reviews: Record<string, string>; listings: AppListing[] }
type Store = Pick<Storage, 'getItem' | 'setItem'>
export const appShelfKey = (owner: string, mode: 'demo' | 'live') => `open-lab:apps:v1:${mode}:${encodeURIComponent(owner)}`
const emptyShelf = (owner: string, mode: 'demo' | 'live'): AppShelf => ({ version: 1, owner, mode, saved: [], reviews: {}, listings: [] })
function parseShelf(raw: string, owner: string, mode: 'demo' | 'live'): AppShelf {
  if (raw.length > 1_000_000) throw Error('App shelf is too large.')
  const s = JSON.parse(raw)
  if (!s || Object.keys(s).some(k => !['version', 'owner', 'mode', 'saved', 'reviews', 'listings'].includes(k)) || s.version !== 1 || s.owner !== owner || s.mode !== mode ||
      !Array.isArray(s.saved) || s.saved.length > 200 || !s.saved.every((id: unknown) => text(id,120)) || new Set(s.saved).size !== s.saved.length ||
      !s.reviews || Array.isArray(s.reviews) || typeof s.reviews !== 'object' || Object.keys(s.reviews).length > 200 || !Object.entries(s.reviews).every(([id,v]) => text(id,120) && text(v,4000)) ||
      !Array.isArray(s.listings) || s.listings.length > 100 || !s.listings.every((a: AppListing) => validAppListing(a) && a.origin === 'local' && a.id.startsWith('local:')) || new Set(s.listings.map((a: AppListing) => a.id)).size !== s.listings.length) throw Error('Invalid app shelf.')
  return s
}
export function loadAppShelf(storage: Store, owner: string, mode: 'demo' | 'live') {
  try { const raw = storage.getItem(appShelfKey(owner,mode)); return { state: raw === null ? emptyShelf(owner,mode) : parseShelf(raw,owner,mode), error: '' } }
  catch { return { state: emptyShelf(owner,mode), error: 'Your app shelf could not be read. The original is preserved; no changes were saved.' } }
}
export type AppShelfAction = { type: 'save'; id: string } | { type: 'review'; id: string; text: string } | { type: 'listing'; listing: AppListing }
export function changeAppShelf(storage: Store, owner: string, mode: 'demo' | 'live', action: AppShelfAction): { ok: boolean; error?: string } {
  const loaded = loadAppShelf(storage,owner,mode)
  if (loaded.error) return { ok:false, error:loaded.error }
  try {
    const s = loaded.state
    if (action.type === 'listing') {
      if (!validAppListing(action.listing) || action.listing.origin !== 'local' || !action.listing.id.startsWith('local:')) throw Error('Complete the listing with valid HTTPS links; GitHub source links must use github.com.')
      s.listings = [...s.listings.filter(a => a.id !== action.listing.id), { ...action.listing }]
    } else {
      if (![...APP_CATALOG, ...s.listings].some(a => a.id === action.id)) throw Error('Unknown app. Nothing was saved.')
      if (action.type === 'save') s.saved = s.saved.includes(action.id) ? s.saved.filter(id => id !== action.id) : [...s.saved, action.id]
      else if (action.type === 'review') {
        if (!text(action.text,4000)) throw Error('Add a review note of at most 4,000 characters.')
        s.reviews = { ...s.reviews, [action.id]: action.text }
      } else throw Error('Unknown app action.')
    }
    const raw = JSON.stringify(s); parseShelf(raw,owner,mode)
    storage.setItem(appShelfKey(owner,mode),raw)
    if (storage.getItem(appShelfKey(owner,mode)) !== raw) throw Error('Browser storage did not confirm the save.')
    return { ok:true }
  } catch (error) { return { ok:false, error:error instanceof Error ? error.message : 'App shelf not saved.' } }
}
export function filterApps(apps: AppListing[], { query = '', field = 'all' }: { query?: string; field?: string }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return apps.filter(a => (field === 'all' || field === a.field) && words.every(word => `${a.title} ${a.description} ${a.maintainer} ${a.useCase}`.toLowerCase().includes(word)))
}
