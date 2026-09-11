import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'

const require = createRequire(import.meta.url)
require.extensions['.css'] = m => { m.exports = new Proxy({}, { get: (_, p) => p === '__esModule' ? false : String(p) }) }
const dom = new JSDOM('<main class="open-lab"><div id="root"></div></main>', { url: 'https://lab.example.org/lab/onboarding/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'localStorage']) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
globalThis.IS_REACT_ACT_ENVIRONMENT = true
// JSDOM lacks the native dialog methods; the dialog and both pickers are real React components.
dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true }
dom.window.HTMLDialogElement.prototype.close = function () { this.open = false }
const React = await import('react')
const { createRoot } = await import('react-dom/client')
const auth = source('lib/lab-identity.ts')
const social = source('lib/lab-social.ts')
const { DISCIPLINES } = source('lib/lab-following.ts')
const { saveDraft, draftKey } = source('lib/lab-drafts.ts')
const Gate = source('components/lab/social/LabOnboardingGate.tsx').default
const { InterestOnboarding } = source('components/lab/social/InterestOnboarding.tsx')
const ownerA = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
const ownerB = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'
let root, identity, networkCalls
const signedIn = did => ({ isLoading: false, isAuthenticated: true, session: { did, handle: 'synthetic.example.org', displayName: 'Synthetic scientist' } })
const button = text => {
  const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text || b.getAttribute('aria-label') === text)
  assert.ok(el, `Missing real control: ${text}`)
  return el
}
const click = text => React.act(() => button(text).click())
const selected = label => button(label).getAttribute('aria-pressed') === 'true'
const render = (Component, ownerId = identity.session.did) => React.act(() => root.render(React.createElement(Component, { ownerId })))
const remount = async (Component, ownerId) => {
  await React.act(() => root.unmount())
  root = createRoot(document.getElementById('root'))
  await render(Component, ownerId)
}
const savedInterests = (owner = identity.session.did) => social.profileInterests(social.loadSocialState(localStorage, owner).profile.interests)

for (const [name, Component, saveLabel] of [['first-login', Gate, 'Save and continue'], ['ongoing', InterestOnboarding, 'Save starting choices']]) test(`${name}: local interests leave all feed follows untouched and explain the separate choice`, async () => {
  const following = source('lib/lab-following.ts')
  // Preserve populated stores for another owner and demo mode; never create a live follow for this owner.
  assert.equal(following.updateFollowing(localStorage, ownerB, 'live', { type: 'toggle', kind: 'disciplines', id: 'physics' }).ok, true)
  assert.equal(following.updateFollowing(localStorage, ownerA, 'demo', { type: 'toggle', kind: 'disciplines', id: 'biology' }).ok, true)
  const original = Object.fromEntries(Object.entries(localStorage))
  await render(Component)
  await click('Mathematics')
  await click(saveLabel)
  assert.deepEqual(savedInterests(), ['math'], 'The local value must not be collapsed to its public cross-field mapping')
  for (const [key, value] of Object.entries(original)) assert.equal(localStorage.getItem(key), value)
  assert.equal(localStorage.getItem(following.followingKey(ownerA, 'live')), null)
  assert.deepEqual(Object.keys(localStorage).filter(k => !Object.hasOwn(original, k)).sort(), [draftKey('profile', ownerA), draftKey('social', ownerA)].sort())
  await remount(InterestOnboarding)
  assert.match(document.body.textContent, /Feed follows are a separate choice/)
  if (Component === Gate) {
    assert.equal(social.saveSocialMeta(localStorage, ownerA, { onboardingCompleted: false }).ok, true)
    await remount(Gate)
    assert.match(document.body.textContent, /Feed follows are a separate choice/)
  }
})

test('recommendation links from every discipline and legacy value open a populated real destination', async () => {
  const Workbench = source('components/lab/BottleneckWorkbench.tsx').default
  for (const interest of [...DISCIPLINES.map(d => d.id), 'old specialty']) {
    assert.equal(social.saveSocialProfile(localStorage, ownerA, { interests: [interest] }).ok, true)
    await remount(InterestOnboarding)
    const links = [...document.querySelectorAll('section[aria-label="Recommended starting places"] a')].map(a => a.getAttribute('href'))
    assert.ok(links.length > 0)
    for (const href of links) {
      assert.ok(href.startsWith('/lab/bottlenecks/'), 'The default contribution mode starts with a concrete case')
      window.history.replaceState(null, '', href)
      await remount(Workbench)
      assert.ok(document.querySelector('[data-baseline]'), `${interest}: empty destination at ${href}`)
      assert.doesNotMatch(document.body.textContent, /No editorial case matches|Unknown field/)
      const { BOTTLENECK_CASES } = source('lib/lab-bottlenecks.ts')
      assert.ok(BOTTLENECK_CASES.some(c => c.title === document.querySelector('[data-baseline] h2').textContent))
    }
  }
})

beforeEach(() => {
  localStorage.clear()
  identity = signedIn(ownerA)
  networkCalls = 0
  // Only the external identity boundary is supplied. Hooks, writer, storage reader, and controls are production code.
  mock.method(auth, 'useLabIdentity', () => identity)
  mock.method(globalThis, 'fetch', async () => { networkCalls++; throw Error('No network is permitted in local onboarding') })
  root = createRoot(document.getElementById('root'))
})
afterEach(async () => {
  await React.act(() => root.unmount())
  mock.restoreAll()
  assert.equal(networkCalls, 0, 'Local interest editing must not publish or subscribe remotely')
})

for (const discipline of DISCIPLINES) test(`round trip: ${discipline.label} is selectable and removable after reload in both pickers`, async () => {
  await render(Gate)
  await click(discipline.label)
  assert.equal(selected(discipline.label), true)
  await click('Save and continue')
  assert.deepEqual(savedInterests(), [discipline.id])
  assert.equal(social.loadSocialState(localStorage, ownerA).meta.onboardingCompleted, true)
  await remount(InterestOnboarding)
  for (const offered of DISCIPLINES) assert.ok(button(offered.label))
  assert.equal(selected(discipline.label), true)
  await click(discipline.label)
  await click('Save starting choices')
  await remount(InterestOnboarding)
  assert.equal(selected(discipline.label), false)
  assert.deepEqual(savedInterests(), [])
  await click(discipline.label)
  await click('Save starting choices')
  assert.deepEqual(savedInterests(), [discipline.id])
  assert.equal(social.saveSocialMeta(localStorage, ownerA, { onboardingCompleted: false }).ok, true)
  await remount(Gate)
  assert.equal(selected(discipline.label), true)
  await click(discipline.label)
  await click('Save and continue')
  assert.deepEqual(savedInterests(), [])
})

for (const [name, Component, saveLabel] of [['first-login', Gate, 'Save and continue'], ['ongoing', InterestOnboarding, 'Save starting choices']]) test(`${name}: max8 is visible, blocks the ninth, and every maximum set saves without loss`, async () => {
  for (const excluded of DISCIPLINES) {
    localStorage.clear()
    await remount(Component)
    const chosen = DISCIPLINES.filter(d => d.id !== excluded.id)
    for (const d of chosen) await click(d.label)
    assert.equal(button(excluded.label).disabled, true, 'The unselected ninth must be visibly unavailable, not silently dropped at save')
    assert.match(document.body.textContent, /8 of 8 interests selected/)
    assert.match(document.body.textContent, /[Dd]eselect.*before adding/)
    await click(excluded.label)
    assert.equal(selected(excluded.label), false)
    for (const d of chosen) assert.equal(button(d.label).disabled, false, 'Selected interests stay removable at the limit')
    await click(saveLabel)
    assert.deepEqual(savedInterests(), chosen.map(d => d.id))
    if (Component === Gate) assert.equal(social.loadSocialState(localStorage, ownerA).meta.onboardingCompleted, true)
    await remount(InterestOnboarding)
    for (const d of chosen) assert.equal(selected(d.label), true)
    assert.equal(selected(excluded.label), false)
    await click(chosen[0].label)
    assert.equal(button(excluded.label).disabled, false)
    await click(excluded.label)
    await click('Save starting choices')
    assert.deepEqual(savedInterests(), [...chosen.slice(1).map(d => d.id), excluded.id])
  }
})

const legacy = ['digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech', 'cross-field', 'archived-specialty', 'custom interest']
for (const [name, Component, saveLabel] of [['first-login', Gate, 'Save and continue'], ['ongoing', InterestOnboarding, 'Save starting choices']]) {
  test(`${name}: old IDs and custom interests survive and can be explicitly toggled off before saving`, async () => {
    const profile = { interests: legacy, workingOn: 'Keep this work', lookingFor: 'A reviewer', githubUrl: 'https://github.com/example' }
    assert.equal(saveDraft(localStorage, 'profile', ownerA, profile).ok, true)
    await render(Component)
    for (const id of legacy) assert.equal(selected(DISCIPLINES.find(d => d.id === id)?.label || id), true)
    await click('Mathematics')
    assert.match(document.body.textContent, /8 of 8 interests selected/)
    await click(saveLabel)
    assert.deepEqual(savedInterests(), [...legacy, 'math'])
    assert.deepEqual(social.loadSocialState(localStorage, ownerA).profile, { ...profile, interests: [...legacy, 'math'].join(', ') })
    if (Component === Gate) assert.equal(social.saveSocialMeta(localStorage, ownerA, { onboardingCompleted: false }).ok, true)
    await remount(Component)
    await click('custom interest')
    assert.equal(selected('custom interest'), false)
    await click('custom interest') // Undo an explicit removal before saving.
    assert.equal(selected('custom interest'), true)
    await click('custom interest')
    await click('archived-specialty')
    await click(saveLabel)
    await remount(InterestOnboarding)
    assert.deepEqual(savedInterests(), [...legacy.slice(0, 5), 'math'])
    assert.doesNotMatch(document.body.textContent, /custom interest|archived-specialty/)
  })

  test(`${name}: an inherited over-limit set stays intact until explicit removals make it saveable`, async () => {
    const inherited = [...DISCIPLINES.map(d => d.id), 'old specialty']
    assert.equal(saveDraft(localStorage, 'profile', ownerA, { interests: inherited, workingOn: 'Keep over-limit original' }).ok, true)
    const original = localStorage.getItem(draftKey('profile', ownerA))
    await render(Component)
    assert.match(document.body.textContent, /10 of 8 interests selected/)
    assert.equal(button(saveLabel).disabled, true)
    for (const d of DISCIPLINES) assert.equal(button(d.label).disabled, false)
    assert.equal(button('old specialty').disabled, false)
    await click(saveLabel)
    assert.equal(localStorage.getItem(draftKey('profile', ownerA)), original)
    await click('old specialty')
    assert.equal(button(saveLabel).disabled, true)
    await click('Mathematics')
    assert.equal(button(saveLabel).disabled, false)
    await click(saveLabel)
    assert.deepEqual(savedInterests(), DISCIPLINES.filter(d => d.id !== 'math').map(d => d.id))
    assert.equal(social.loadSocialState(localStorage, ownerA).profile.workingOn, 'Keep over-limit original')
  })
}

for (const [name, Component, saveLabel] of [['first-login', Gate, 'Save and continue'], ['ongoing', InterestOnboarding, 'Save starting choices']]) {
  test(`${name}: owner switching never carries unsaved interests or overwrites another identity`, async () => {
    assert.equal(social.saveSocialProfile(localStorage, ownerA, { interests: ['math', 'A specialty'], workingOn: 'A work' }).ok, true)
    assert.equal(social.saveSocialProfile(localStorage, ownerB, { interests: ['physics', 'B specialty'], workingOn: 'B work' }).ok, true)
    const originalA = localStorage.getItem(draftKey('profile', ownerA))
    await render(Component)
    await click('Mathematics')
    await click('Biology')
    identity = signedIn(ownerB)
    await render(Component, ownerB)
    assert.equal(selected('Physics'), true)
    assert.equal(selected('Biology'), false)
    assert.equal(selected('Mathematics'), false)
    assert.doesNotMatch(document.body.textContent, /A specialty/)
    await click('Materials science')
    await click(saveLabel)
    assert.deepEqual(savedInterests(ownerB), ['physics', 'B specialty', 'materials'])
    assert.equal(localStorage.getItem(draftKey('profile', ownerA)), originalA)
    identity = signedIn(ownerA)
    await render(Component, ownerA)
    assert.equal(selected('Mathematics'), true)
    assert.equal(selected('Biology'), false)
    assert.equal(selected('A specialty'), true)
  })

  for (const failure of ['throw', 'silent']) test(`${name}: ${failure} storage writes keep originals and unsaved choices available for retry`, async () => {
    assert.equal(social.saveSocialProfile(localStorage, ownerA, { interests: ['math', 'custom interest'], workingOn: 'Preserved work' }).ok, true)
    const original = localStorage.getItem(draftKey('profile', ownerA))
    await render(Component)
    await click('Physics')
    const blocked = mock.method(dom.window.Storage.prototype, 'setItem', () => { if (failure === 'throw') throw Error('Quota exceeded') })
    await click(saveLabel)
    assert.match(document.querySelector('[role="alert"]').textContent, /Could not save/)
    assert.equal(localStorage.getItem(draftKey('profile', ownerA)), original)
    assert.equal(selected('Physics'), true)
    assert.equal(selected('custom interest'), true)
    assert.equal(social.loadSocialState(localStorage, ownerA).meta.onboardingCompleted, false)
    blocked.mock.restore()
    await click(saveLabel)
    assert.deepEqual(savedInterests(), ['math', 'custom interest', 'physics'])
    await remount(InterestOnboarding)
    assert.equal(selected('Physics'), true)
    assert.equal(selected('custom interest'), true)
  })

  for (const slot of ['profile', 'social']) test(`${name}: unreadable ${slot} prevents saving over any existing local data`, async () => {
    assert.equal(social.saveSocialProfile(localStorage, ownerA, { interests: ['math', 'custom interest'], workingOn: 'Preserved original' }).ok, true)
    localStorage.setItem(draftKey(slot, ownerA), '{broken')
    const original = Object.fromEntries(Object.entries(localStorage))
    await render(Component)
    await click('Physics')
    await click(saveLabel)
    assert.match(document.querySelector('[role="alert"]').textContent, /could not be read/)
    assert.deepEqual(Object.fromEntries(Object.entries(localStorage)), original)
  })
}
