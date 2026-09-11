import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const social = source('lib/lab-social.ts')
const { DISCIPLINES } = source('lib/lab-following.ts')
function memoryStore() {
  const map = new Map()
  return { get length() { return map.size }, key: i => [...map.keys()][i] ?? null, getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
}

for (const discipline of DISCIPLINES) test(`completed ${discipline.label} alone is a local starting area after writer reload`, () => {
  const storage = memoryStore()
  assert.equal(social.saveSocialProfile(storage, 'guest', { interests: [discipline.id], workingOn: 'A concrete question', lookingFor: 'An independent reviewer' }).ok, true)
  assert.equal(social.saveSocialMeta(storage, 'guest', { onboardingCompleted: true }).ok, true)
  const state = social.loadSocialState(storage, 'guest')
  assert.equal(social.profileCompletion(state.profile).percent, 100)
  assert.deepEqual(social.localNextActions(state), [], 'Completed valid local interests must not be contradicted by a missing-area nudge')
})

const { BOTTLENECK_CASES, BOTTLENECK_FIELDS } = source('lib/lab-bottlenecks.ts')

test('the real writer rejects nine without trimming and keeps public field mapping separate', () => {
  const store = memoryStore()
  const { draftKey } = source('lib/lab-drafts.ts')
  const ids = DISCIPLINES.map(d => d.id)
  assert.equal(social.saveSocialProfile(store, 'guest', { interests: ids.slice(0, 8) }).ok, true)
  const original = store.getItem(draftKey('profile', 'guest'))
  const rejected = social.saveSocialProfile(store, 'guest', { interests: ids })
  assert.equal(rejected.ok, false)
  assert.match(rejected.error, /up to 8/)
  assert.equal(store.getItem(draftKey('profile', 'guest')), original)
  const { protocolFieldForDiscipline } = source('lib/lab-following.ts')
  const { validateLabData } = source('lib/lab-validation.ts')
  for (const id of ['math', 'physics', 'biology', 'materials']) {
    assert.equal(protocolFieldForDiscipline(id), 'cross-field')
    assert.throws(() => validateLabData('note', { text: 'Test note', field: id, postType: 'question' }))
    assert.equal(social.saveSocialProfile(store, 'guest', { interests: [id] }).ok, true)
    assert.deepEqual(social.profileInterests(social.loadSocialState(store, 'guest').profile.interests), [id])
  }
})
for (const interest of [...DISCIPLINES, { id: 'legacy specialty', label: 'legacy specialty' }]) test(`${interest.label}: recommendations reference existing routes and populated cases, not invented field IDs`, () => {
  for (const mode of ['', 'evidence', 'tools', 'intervention']) {
    const places = social.recommendStartingPlaces([interest.id], mode)
    assert.ok(places.length > 0)
    assert.equal(new Set(places.map(p => p.id)).size, places.length)
    assert.equal(new Set(places.map(p => p.href)).size, places.length, 'Do not repeat the fallback case for evidence mode')
    for (const place of places) {
      const url = new URL(place.href, 'https://lab.example.org')
      assert.equal(url.origin, 'https://lab.example.org')
      assert.ok(url.pathname.endsWith('/'))
      assert.ok(existsSync(`src/app${url.pathname}page.tsx`), place.href)
      if (url.pathname === '/lab/bottlenecks/') {
        const caseId = url.searchParams.get('case')
        const field = url.searchParams.get('field')
        const target = BOTTLENECK_CASES.find(c => c.id === caseId)
        assert.ok(target, `Recommendation must name a real case: ${place.href}`)
        assert.ok(!field || BOTTLENECK_FIELDS.some(([id]) => id === field), `Unknown field: ${field}`)
        assert.ok(!field || target.focusArea === field || target.relatedFields.includes(field), `Empty field/case combination: ${place.href}`)
      }
    }
    assert.ok(places.some(p => p.why.includes(interest.label)), 'Explain the actual local choice, including saved custom values')
    if (!BOTTLENECK_CASES.some(c => c.focusArea === interest.id || c.relatedFields.includes(interest.id))) {
      assert.match(places.map(p => p.why).join(' '), /no .*specific.*case|no .*case.*specific/i, 'Disclose cross-field fallback rather than imply discipline-specific content')
    }
    assert.deepEqual(places, social.recommendStartingPlaces([interest.id], mode))
  }
})
