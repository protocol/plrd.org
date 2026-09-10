import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

function memoryStore() {
  const map = new Map()
  return { get length() { return map.size }, key: i => [...map.keys()][i] ?? null, getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
}

test('profile edits share the bench draft, preserve fields, and never transfer between owners', () => {
  const api = social()
  assert.equal(typeof api.saveSocialProfile, 'function', 'canonical profile seam missing')
  const { saveDraft, loadDraft } = source('lib/lab-drafts.ts')
  const store = memoryStore()
  saveDraft(store, 'profile', 'guest', { workingOn: 'Synthetic draft', lookingFor: 'Source checks', interests: 'custom interest', githubUrl: 'https://github.com/example' })
  assert.equal(api.saveSocialProfile(store, 'guest', { interests: ['neurotech', 'custom interest'] }).ok, true)
  const data = loadDraft(store, 'profile', 'guest').data
  assert.equal(data.workingOn, 'Synthetic draft')
  assert.equal(data.githubUrl, 'https://github.com/example')
  assert.equal(data.interests, 'neurotech, custom interest')
  assert.deepEqual(api.loadSocialState(store, 'did:plc:test-owner').profile, {})
  assert.equal(api.saveSocialMeta(store, 'guest', { mode: 'evidence', dismissed: ['profile'] }).ok, true)
  assert.equal(api.loadSocialState(store, 'guest').meta.mode, 'evidence')
  assert.deepEqual(api.loadSocialState(store, 'did:plc:test-owner').meta.dismissed, [])
})

test('corrupt and blocked storage fail visibly and never overwrite unreadable drafts', () => {
  const api = social()
  assert.equal(typeof api.loadSocialState, 'function', 'safe persistence missing')
  const { draftKey } = source('lib/lab-drafts.ts')
  const store = memoryStore()
  store.setItem(draftKey('profile', 'guest'), '{broken')
  assert.match(api.loadSocialState(store, 'guest').error, /could not be read/)
  assert.equal(api.saveSocialProfile(store, 'guest', { interests: ['neurotech'] }).ok, false)
  assert.equal(store.getItem(draftKey('profile', 'guest')), '{broken')
  const blocked = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') }, get length() { throw Error('blocked') } }
  assert.match(api.loadSocialState(blocked, 'guest').error, /unavailable/)
  assert.equal(api.saveSocialMeta(blocked, 'guest', { mode: 'tools' }).ok, false)
  const silent = { ...memoryStore(), setItem() {} }
  assert.equal(api.saveSocialProfile(silent, 'guest', { workingOn: 'Lost write' }).ok, false)
})

test('completion counts useful fields, excludes omitted/skipped links, and rejects malformed links', () => {
  const api = social()
  assert.equal(typeof api.profileCompletion, 'function', 'completion missing')
  const profile = { workingOn: 'Synthetic work', lookingFor: 'Source review', interests: ['neurotech'] }
  assert.deepEqual([api.profileCompletion({}).completed, api.profileCompletion({}).total], [0, 3])
  assert.deepEqual([api.profileCompletion(profile).completed, api.profileCompletion(profile).total], [3, 3])
  const invalid = api.profileCompletion({ ...profile, linkedinUrl: 'javascript:alert(1)' })
  assert.deepEqual([invalid.completed, invalid.total, invalid.percent], [3, 4, 75])
  assert.equal(api.profileCompletion({ ...profile, scholarUrl: 'https://scholar.google.com/citations?user=sample' }).completed, 4)
  assert.equal(api.profileCompletion({ ...profile, githubUrl: 'https://github.com/example/repo' }).completed, 3)
  assert.equal(api.profileCompletion({ ...profile, linkedinUrl: 'bad' }, ['linkedinUrl']).total, 3)
  assert.equal(api.profileCompletion({ ...profile, interests: [] }).completed, 2)
  assert.equal(api.profileCompletion({ ...profile, workingOn: 'unsafe\u202evalue', interests: ['bad\u0000interest'] }).completed, 1)
  assert.equal(api.profileCompletion({ ...profile, workingOn: 'é'.repeat(1200) }).completed, 3)
})

test('LinkedIn profile support is optional and retains profile and other record constraints', () => {
  const { validateLabData } = source('lib/lab-validation.ts')
  const data = { workingOn: 'Synthetic work', interests: [], lookingFor: 'Source review' }
  const url = 'https://www.linkedin.com/in/sample-person/'
  assert.deepEqual(validateLabData('profile', { ...data, linkedinUrl: url }), { ...data, linkedinUrl: url })
  assert.deepEqual(validateLabData('profile', data), data)
  for (const linkedinUrl of ['https://linkedin.com/company/example/', 'https://linkedin.com.evil.org/in/example', 'http://linkedin.com/in/example', 'https://www.linkedin.com/in/example?token=secret', 'https://www.linkedin.com/in/example#bad', 'javascript:alert(1)', 'https://www.linkedin.com/in/']) assert.throws(() => validateLabData('profile', { ...data, linkedinUrl }))
  assert.throws(() => validateLabData('profile', { ...data, verified: true }))
  assert.throws(() => validateLabData('note', { text: 'A note', field: 'neurotech', postType: 'question', linkedinUrl: url }))
})

test('unreadable storage never invents incomplete-profile actions', () => {
  const api = social()
  const blocked = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') }, get length() { throw Error('blocked') } }
  const actions = api.localNextActions(api.loadSocialState(blocked, 'guest'))
  assert.deepEqual(actions, [])
})

function social() {
  assert.ok(existsSync('src/lib/lab-social.ts'), 'social recommendations are not implemented')
  return source('lib/lab-social.ts')
}

test('starting places prioritize bottlenecks and explain interest/mode choices deterministically', () => {
  const { recommendStartingPlaces } = social()
  const result = recommendStartingPlaces(['neurotech', 'unknown'], 'evidence')
  assert.equal(result[0].href, '/lab/bottlenecks/?field=neurotech')
  assert.match(result[0].why, /Neurotech/)
  assert.ok(result.some(r => r.href === '/lab/bottlenecks/?case=reproducibility'))
  assert.deepEqual(result, recommendStartingPlaces(['neurotech', 'unknown'], 'evidence'))
  assert.ok(recommendStartingPlaces(['cross-field'], 'tools').some(r => r.href === '/lab/apps/'))
  assert.ok(recommendStartingPlaces([], 'intervention').some(r => r.href === '/lab/collaborate/'))
  assert.ok(recommendStartingPlaces(['unknown'], '').every(r => !r.href.includes('unknown')))
})
