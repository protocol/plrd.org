import { draftKey, loadDraft, saveDraft } from '@/lib/lab-drafts'
import { validateLabData } from '@/lib/lab-validation'

export const PROFILE_LINKS = [
  { key: 'linkedinUrl', label: 'LinkedIn', example: 'https://www.linkedin.com/in/your-name/', why: 'Give context on your work and collaborations.' },
  { key: 'scholarUrl', label: 'Google Scholar', example: 'https://scholar.google.com/citations?user=your-id', why: 'Help others find your published work.' },
  { key: 'githubUrl', label: 'GitHub', example: 'https://github.com/your-name', why: 'Point to tools and reproducible code.' },
] as const
export function validProfileLink(key: string, value: unknown): boolean {
  if (!PROFILE_LINKS.some(l => l.key === key) || typeof value !== 'string' || !value.trim()) return false
  try { validateLabData('profile', { workingOn: 'Local validation', lookingFor: 'Local validation', interests: [], [key]: value }); return true } catch { return false }
}
export function profileCompletion(profile: SocialProfile, skippedLinks: string[] = []) {
  const fieldValid = (key: string, value: unknown) => {
    try { validateLabData('profile', { workingOn: 'Local validation', lookingFor: 'Local validation', interests: [], [key]: value }); return true } catch { return false }
  }
  const interests = profileInterests(profile.interests)
  const fields = [
    { key: 'workingOn', label: 'What you are working on', done: fieldValid('workingOn', profile.workingOn) },
    { key: 'lookingFor', label: 'The help you are looking for', done: fieldValid('lookingFor', profile.lookingFor) },
    { key: 'interests', label: 'Your interests', done: interests.length > 0 && fieldValid('interests', interests) },
    ...PROFILE_LINKS.filter(l => !skippedLinks.includes(l.key) && !!profile[l.key]).map(l => ({ key: l.key, label: `${l.label} link`, done: validProfileLink(l.key, profile[l.key]) })),
  ]
  const completed = fields.filter(f => f.done).length, total = fields.length
  return { fields, completed, total, percent: Math.round(completed / total * 100) }
}

export type SocialProfile = Record<string, unknown>
export type SocialStore = Pick<Storage, 'getItem' | 'setItem' | 'length' | 'key'>
export type SocialMeta = { mode: ContributionMode; onboardingSkipped: boolean; skippedLinks: string[]; read: string[]; dismissed: string[] }
export type SocialDraft = { slot: string; kind: string; data: SocialProfile; savedAt?: string }
export type SocialState = { profile: SocialProfile; meta: SocialMeta; drafts: SocialDraft[]; error: string }
export type SocialSaveResult = { ok: boolean; error?: string }
const emptyMeta = (): SocialMeta => ({ mode: '', onboardingSkipped: false, skippedLinks: [], read: [], dismissed: [] })
export const emptySocialState = (): SocialState => ({ profile: {}, meta: emptyMeta(), drafts: [], error: '' })
export function profileInterests(value: unknown): string[] {
  return [...new Set((Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []).filter((s): s is string => typeof s === 'string').map(s => s.trim()).filter(Boolean))]
}
const readError = (status: string) => status === 'corrupt' ? 'A local draft could not be read. It has not been overwritten.' : status === 'blocked' ? 'Browser storage is unavailable. Changes cannot be saved here.' : ''
function parseMeta(data: SocialProfile | null): SocialMeta {
  if (!data) return emptyMeta()
  const meta = { ...emptyMeta(), ...data }
  if (!['', 'evidence', 'tools', 'intervention'].includes(String(meta.mode)) || typeof meta.onboardingSkipped !== 'boolean' ||
    !['skippedLinks', 'read', 'dismissed'].every(k => Array.isArray(meta[k as keyof SocialMeta]) && (meta[k as keyof SocialMeta] as unknown[]).length <= 1000 && (meta[k as keyof SocialMeta] as unknown[]).every(v => typeof v === 'string' && v.length <= 4096))) throw Error('Invalid local preferences')
  return { mode: meta.mode, onboardingSkipped: meta.onboardingSkipped, skippedLinks: meta.skippedLinks, read: meta.read, dismissed: meta.dismissed }
}
export function loadSocialState(storage: SocialStore, owner = 'guest'): SocialState {
  const state = emptySocialState()
  const profile = loadDraft(storage, 'profile', owner)
  const preferences = loadDraft(storage, 'social', owner)
  state.profile = profile.data || {}
  state.error = readError(profile.status) || readError(preferences.status)
  try { state.meta = parseMeta(preferences.data) } catch { state.error = readError('corrupt') }
  try {
    const prefix = draftKey('', owner)
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key?.startsWith(prefix)) continue
      const slot = key.slice(prefix.length), kind = slot.split(':')[0]
      if (!['note', 'app', 'contribution', 'participation'].includes(kind)) continue
      const draft = loadDraft(storage, slot, owner)
      if (draft.data) state.drafts.push({ slot, kind, data: draft.data, savedAt: draft.savedAt })
      if (!state.error) state.error = readError(draft.status)
    }
    state.drafts.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || '') || a.slot.localeCompare(b.slot))
  } catch { state.error = readError('blocked') }
  return state
}
function patchSlot(storage: SocialStore, owner: string, slot: string, patch: SocialProfile): SocialSaveResult {
  const current = loadDraft(storage, slot, owner)
  const error = readError(current.status)
  if (error) return { ok: false, error }
  const data = { ...current.data, ...patch }
  if (slot === 'social') {
    try { parseMeta(data) } catch { return { ok: false, error: readError('corrupt') } }
  }
  if (!saveDraft(storage, slot, owner, data).ok || JSON.stringify(loadDraft(storage, slot, owner).data) !== JSON.stringify(data)) return { ok: false, error: 'Could not save in this browser. Storage may be full or blocked; keep this page open and retry.' }
  return { ok: true }
}
export function saveSocialProfile(storage: SocialStore, owner: string, patch: SocialProfile): SocialSaveResult {
  const next = { ...patch }
  if ('interests' in next) {
    const interests = profileInterests(next.interests)
    if (interests.length > 8 || interests.some(s => [...s].length > 60)) return { ok: false, error: 'Keep up to 8 interests, each at most 60 characters. Existing interests have not been removed.' }
    // RecordEditor uses EntryValues strings; public profile records use arrays.
    next.interests = interests.join(', ')
  }
  return patchSlot(storage, owner, 'profile', next)
}
export function saveSocialMeta(storage: SocialStore, owner: string, patch: Partial<SocialMeta>): SocialSaveResult {
  // Do not silently replace malformed metadata with defaults.
  try { parseMeta(loadDraft(storage, 'social', owner).data) } catch { return { ok: false, error: readError('corrupt') } }
  return patchSlot(storage, owner, 'social', patch)
}

export type LocalAction = { id: string; title: string; detail: string; href: string; draftSlot?: string }
export function localNextActions(state: SocialState): LocalAction[] {
  if (state.error) return [] // Unknown local state is not an incomplete profile.
  const actions: LocalAction[] = []
  const completion = profileCompletion(state.profile, state.meta.skippedLinks)
  if (completion.completed < completion.total) actions.push({ id: 'profile', title: 'Complete your profile draft', detail: 'Describe your work and the help you need. Optional links never gate contributions.', href: '/lab/onboarding/#profile-completion' })
  if (!profileInterests(state.profile.interests).some(i => SOCIAL_INTERESTS.some(s => s.id === i)) && !state.meta.onboardingSkipped) actions.push({ id: 'starting-area', title: 'Choose a starting area', detail: 'Get concrete starting places based on your interests, or skip this prompt.', href: '/lab/onboarding/' })
  for (const draft of state.drafts) actions.push({
    id: `draft:${draft.slot}`, title: draft.kind === 'contribution' ? 'Review your local evidence proposal' : `Resume your saved ${draft.kind} draft`,
    detail: 'Saved in this browser only. Open My bench to inspect the draft; nothing has been submitted for review.', href: '/lab/profile/', draftSlot: draft.slot,
  })
  return actions
}

export const SOCIAL_INTERESTS = [
  { id: 'digital-human-rights', label: 'Digital Human Rights' },
  { id: 'economies-governance', label: 'Economies & Governance' },
  { id: 'ai-robotics', label: 'AI & Robotics' },
  { id: 'neurotech', label: 'Neurotech' },
  { id: 'cross-field', label: 'Other / cross-field' },
] as const
export const CONTRIBUTION_MODES = [
  { id: 'evidence', label: 'Check evidence' },
  { id: 'tools', label: 'Build tools' },
  { id: 'intervention', label: 'Design interventions' },
] as const
export type ContributionMode = '' | (typeof CONTRIBUTION_MODES)[number]['id']
export type StartingPlace = { id: string; title: string; href: string; why: string; next: string }
export function recommendStartingPlaces(interests: string[], mode: ContributionMode): StartingPlace[] {
  const selected = SOCIAL_INTERESTS.filter(i => interests.includes(i.id))
  const places: StartingPlace[] = selected.filter(i => i.id !== 'cross-field').map(i => ({
    id: i.id, title: `${i.label}: find a bottleneck`, href: `/lab/bottlenecks/?field=${i.id}`,
    why: `You chose ${i.label}. Start with a constraint before choosing a solution.`,
    next: 'Inspect the bottleneck, name who is affected, and identify the evidence an intervention would need.',
  }))
  if (mode === 'evidence' || !places.length) places.push({
    id: 'reproducibility', title: 'Work through the reproducibility case', href: '/lab/bottlenecks/?case=reproducibility',
    why: mode === 'evidence' ? 'You want to check evidence. Reproducibility makes assumptions and outcome tests concrete.' : 'A cross-field starting case lets you explore without committing to a field.',
    next: 'Trace a claim to its source; distinguish a proposed intervention from a demonstrated outcome.',
  })
  if (mode === 'tools') places.push({ id: 'apps', title: 'Find a tool that addresses the constraint', href: '/lab/apps/', why: 'You chose building tools. Inspect the source and limits before proposing new infrastructure.', next: 'Try a source-labeled app; describe which bottleneck it could relieve and how you would test that.' })
  if (mode === 'intervention' || mode === 'evidence') places.push({ id: 'collaborate', title: 'Prepare a bounded evidence contribution', href: '/lab/collaborate/', why: mode === 'intervention' ? 'You chose intervention design. A bounded task helps make responsibilities, risks, and evidence explicit.' : 'You chose evidence checking. Research and review packets help keep claims and judgments separate.', next: 'Inspect a proposed pilot, define the output and stop conditions, and prepare a work packet. No agent is dispatched.' })
  return places
}
