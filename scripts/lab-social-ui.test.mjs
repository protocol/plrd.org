import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { source } from './velocity/test-source-loader.mjs'
const require = createRequire(import.meta.url)
require.extensions['.css'] = () => {}
const dom = new JSDOM('<main class="open-lab"><div id="root"></div></main>', { url: 'http://localhost/lab/onboarding/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'CustomEvent', 'KeyboardEvent', 'localStorage']) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const React = await import('react')
const { createRoot } = await import('react-dom/client')
let networkCalls = 0
globalThis.fetch = async () => { networkCalls++; throw Error('No network allowed in social UI') }
const click = async text => {
  const el = [...document.querySelectorAll('button, a')].find(el => el.textContent.trim() === text)
  assert.ok(el, `Missing action: ${text}`)
  await React.act(() => el.click())
}
const fill = async (label, value) => {
  const el = document.querySelector(`[aria-label="${label}"]`)
  assert.ok(el, `Missing field: ${label}`)
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  await React.act(() => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })) })
}
async function mount(name, props = {}) {
  const file = `components/lab/social/${name}.tsx`
  assert.ok(existsSync(`src/${file}`), `${name} missing`)
  const Component = source(file)[name]
  const root = createRoot(document.getElementById('root'))
  await React.act(() => root.render(React.createElement(Component, props)))
  return { root, unmount: () => React.act(() => root.unmount()) }
}

test('blocked dismiss is visible and keeps the action; changing owner never exposes guest prompts or drafts', async () => {
  localStorage.clear()
  const { saveDraft } = source('lib/lab-drafts.ts')
  saveDraft(localStorage, 'note', 'guest', { text: 'Guest-only synthetic note' })
  const view = await mount('LabActionInbox')
  const original = dom.window.Storage.prototype.setItem
  try {
    await React.act(() => document.querySelector('button[aria-label^="Your next actions"]').click())
    dom.window.Storage.prototype.setItem = () => { throw Error('quota exceeded') }
    await React.act(() => document.querySelector('button[aria-label="Dismiss Complete your profile draft"]').click())
    assert.match(document.querySelector('[role="alert"]').textContent, /Could not save/)
    assert.ok(document.querySelector('button[aria-label="Dismiss Complete your profile draft"]'))
    dom.window.Storage.prototype.setItem = original
    const Component = source('components/lab/social/LabActionInbox.tsx').LabActionInbox
    await React.act(() => view.root.render(React.createElement(Component, { ownerId: 'did:plc:test-only-owner' })))
    assert.equal(document.querySelector('[role="dialog"]'), null)
    assert.match(document.querySelector('button[aria-label^="Your next actions"]').getAttribute('aria-label'), /2 unread, 2 actions/)
  } finally { dom.window.Storage.prototype.setItem = original; await view.unmount() }
})

test('onboarding route uses the parent provider and never attempts a public write', async () => {
  localStorage.clear()
  const Page = source('app/lab/onboarding/page.tsx').default
  const calls = []
  const previous = globalThis.fetch
  globalThis.fetch = async (url, init) => { calls.push({ url, method: init?.method || 'GET' }); throw Error('Unconfigured synthetic test environment') }
  const root = createRoot(document.getElementById('root'))
  try {
    await React.act(async () => { root.render(React.createElement(source('lib/lab-auth.tsx').LabAuthProvider, null, React.createElement(Page))); await new Promise(resolve => setTimeout(resolve, 20)) })
    assert.match(document.body.textContent, /Save starting choices/)
    assert.match(document.body.textContent, /Save profile locally/)
    assert.ok(calls.every(c => c.method === 'GET'))
  } finally { await React.act(() => root.unmount()); globalThis.fetch = previous }
})

test('bell counts real local actions, persists mark/dismiss across reopen, restores focus, and resolves completed profile prompts', async () => {
  localStorage.clear()
  const { saveDraft } = source('lib/lab-drafts.ts')
  saveDraft(localStorage, 'note', 'guest', { text: 'Test-only unfinished note' })
  saveDraft(localStorage, 'contribution:example', 'guest', { observation: 'Test-only evidence proposal' })
  let view = await mount('LabActionInbox')
  const bell = () => document.querySelector('button[aria-label^="Your next actions"]')
  try {
    assert.match(bell().getAttribute('aria-label'), /4 unread, 4 actions/)
    await React.act(() => bell().click())
    assert.match(document.body.textContent, /Review your local evidence proposal/)
    assert.match(document.body.textContent, /Resume your saved note draft/)
    const mark = document.querySelector('button[aria-label="Mark Complete your profile draft read"]')
    await React.act(() => mark.click())
    assert.match(bell().getAttribute('aria-label'), /3 unread, 4 actions/)
    const dismiss = document.querySelector('button[aria-label="Dismiss Complete your profile draft"]')
    await React.act(() => dismiss.click())
    assert.match(bell().getAttribute('aria-label'), /3 unread, 3 actions/)
    await React.act(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    assert.equal(document.querySelector('[role="dialog"]'), null)
    assert.equal(document.activeElement, bell())
    await view.unmount()
    view = await mount('LabActionInbox')
    assert.match(bell().getAttribute('aria-label'), /3 unread, 3 actions/)
    await React.act(() => bell().click())
    await click('Restore dismissed prompts')
    assert.match(bell().getAttribute('aria-label'), /3 unread, 4 actions/)
    saveDraft(localStorage, 'profile', 'guest', { workingOn: 'Test-only question', lookingFor: 'Test-only help', interests: 'neurotech' })
    await React.act(() => window.dispatchEvent(new Event('open-lab:local-drafts-changed')))
    assert.match(bell().getAttribute('aria-label'), /2 unread, 2 actions/)
    assert.doesNotMatch(document.body.textContent, /Complete your profile draft/)
    assert.equal(networkCalls, 0)
  } finally { await view.unmount() }
})

test('completion panel saves actual work and optional links, gives no credit for invalid URLs, and supports skipping', async () => {
  localStorage.clear()
  const { loadDraft, saveDraft } = source('lib/lab-drafts.ts')
  saveDraft(localStorage, 'profile', 'guest', { interests: 'neurotech' })
  const view = await mount('ProfileCompletion')
  try {
    await fill('What are you working on?', 'A test-only reproducibility question')
    await fill('What help are you looking for?', 'A source checker')
    await fill('LinkedIn URL', 'https://www.linkedin.com/company/not-a-person/')
    await click('Save profile locally')
    assert.equal(loadDraft(localStorage, 'profile', 'guest').data.workingOn, 'A test-only reproducibility question')
    assert.match(document.body.textContent, /3 of 4 useful fields/)
    assert.match(document.body.textContent, /Check this LinkedIn profile URL/)
    await click('Skip LinkedIn')
    assert.match(document.body.textContent, /3 of 3 useful fields/)
    assert.equal(networkCalls, 0)
  } finally { await view.unmount() }
})

test('React onboarding saves/reloads canonical interests and mode, preserves work, and recomputes recommendations without publishing', async () => {
  localStorage.clear()
  const { saveDraft, loadDraft } = source('lib/lab-drafts.ts')
  saveDraft(localStorage, 'profile', 'guest', { workingOn: 'Test-only draft', interests: 'existing specialty', githubUrl: 'https://github.com/example' })
  let view = await mount('InterestOnboarding')
  try {
    await click('Neuroscience')
    await click('Check evidence')
    assert.ok(document.querySelector('a[href="/lab/bottlenecks/?case=reproducibility"]'))
    assert.match(document.querySelector('.lab-social-recommendations').textContent, /You chose Neuroscience/)
    await click('Save starting choices')
    const saved = loadDraft(localStorage, 'profile', 'guest').data
    assert.equal(saved.workingOn, 'Test-only draft')
    assert.equal(saved.githubUrl, 'https://github.com/example')
    assert.match(saved.interests, /existing specialty/)
    assert.match(saved.interests, /neurotech/)
    assert.match(document.body.textContent, /Saved in this browser/)
    await view.unmount()
    view = await mount('InterestOnboarding')
    assert.equal([...document.querySelectorAll('button')].find(b => b.textContent === 'Neuroscience').getAttribute('aria-pressed'), 'true')
    assert.equal([...document.querySelectorAll('button')].find(b => b.textContent === 'Check evidence').getAttribute('aria-pressed'), 'true')
    await click('Neuroscience')
    await click('AI & machine learning')
    assert.equal(document.querySelector('a[href="/lab/bottlenecks/?field=neurotech"]'), null)
    assert.ok(document.querySelector('a[href="/lab/bottlenecks/?case=reproducibility"]'))
    assert.match(document.querySelector('.lab-social-recommendations').textContent, /You chose AI & machine learning/)
    assert.doesNotMatch(document.querySelector('.lab-social-recommendations').textContent, /You chose Neuroscience/)
    assert.equal(networkCalls, 0)
  } finally { await view.unmount() }
})
