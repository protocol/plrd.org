import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { source } from "./velocity/test-source-loader.mjs";

// DOM fixtures exercise actual components, not OAuth or public repositories.
const dom = new JSDOM('<body><button id="opener">Open</button><div id="root"></div></body>', { url: "https://lab.example/lab/" });
for (const key of ["window", "document", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Event", "MouseEvent", "KeyboardEvent", "localStorage"])
  globalThis[key] = dom.window[key];
globalThis.self = dom.window;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
// jsdom does not implement the browser's native dialog layout/focus trap.
// These shims cover lifecycle only; native trapping is a browser QA gate.
window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
window.HTMLDialogElement.prototype.close = function () { this.open = false; };
const { createRoot } = await import("react-dom/client");
const identityModule = source("lib/lab-identity.ts");
const services = source("components/lab/LabShell.tsx");
const downloads = source("lib/lab-packets.ts");
let root, exports, identity;
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/lab/");
  exports = [];
  identity = { session: null, isAuthenticated: false, isLoading: false, error: null, login: async () => {}, logout: async () => {} };
  mock.method(identityModule, "useLabIdentity", () => identity);
  mock.method(services, "useLab", () => ({ capabilities: { canSignIn: false, canPublish: false, mode: "unconfigured" }, openLogin() {} }));
  mock.method(downloads, "downloadText", (name, text, type) => exports.push({ name, text, type }));
  root = createRoot(document.getElementById("root"));
});
afterEach(async () => { await act(() => root.unmount()); mock.restoreAll(); });
const mount = async (Component, props = {}) => act(() => root.render(React.createElement(Component, props)));
const button = (text) => [...document.querySelectorAll("button")].find(b => b.textContent.includes(text));
const click = async (text) => { assert.ok(button(text), `button exists: ${text}`); await act(() => button(text).click()); };
const change = async (selector, value) => {
  const input = document.querySelector(selector);
  assert.ok(input, selector);
  await act(() => {
    const proto = input.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : input.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(input, value);
    input.dispatchEvent(new window.Event(input.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
};

test("dialog Tab and Shift-Tab wrap within the modal instead of reaching browser chrome", async () => {
  const Dialog = source("components/lab/LabDialog.tsx").default;
  await mount(Dialog, { title: "Focus fixture", onClose() {}, children: React.createElement("a", { href: "https://example.org/", id: "last-modal-control" }, "Last control") });
  const first = document.querySelector('dialog button');
  const last = document.getElementById('last-modal-control');
  last.focus();
  await act(() => last.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })));
  assert.ok(document.activeElement === first, "Tab should wrap to the modal's first control");
  await act(() => first.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })));
  assert.ok(document.activeElement === last, "Shift-Tab should wrap to the last control");
});

test("a publication request keeps the reviewed draft immutable until its fixture receipt returns", async () => {
  identity = { ...identity, isAuthenticated: true, session: { did: "did:plc:fixture-a", handle: "fixture-a.test" } };
  services.useLab.mock.mockImplementation(() => ({ capabilities: { canPublish: true, canSignIn: true, mode: "ready" }, openLogin() {} }));
  let finish;
  mock.method(source("lib/lab-client.ts"), "createLabClient", () => ({ publish: () => new Promise(resolve => { finish = resolve; }) }));
  await mount(source("components/lab/RecordEditor.tsx").default, { kind: "note", initial: { text: "Reviewed fixture" }, onClose() {} });
  await click("Review draft");
  await act(() => document.querySelector('input[type="checkbox"]').click());
  await click("Publish public record");
  try { assert.equal(document.querySelector('#entry-text').disabled, true, "pending receipt must describe the same draft shown on screen"); }
  finally { await act(async () => finish({ uri: "at://did:plc:fixture-a/org.example.note/one", cid: "fixture-cid", record: {} })); }
});

test("reviewing a prefilled draft saves it before sign-in and moves focus to the public decision", async () => {
  await mount(source("components/lab/RecordEditor.tsx").default, { kind: "note", initial: { text: "Synthetic fixture observation", field: "cross-field", postType: "finding" }, onClose() {} });
  await click("Review draft");
  const draft = source("lib/lab-drafts.ts").loadDraft(localStorage, "note", "guest");
  assert.equal(draft.data?.text, "Synthetic fixture observation");
  assert.ok(document.activeElement.classList.contains("lab-record-preview"));
  assert.match(document.querySelector('.lab-record-preview').textContent, /not automatically listed/);
});

test("profile links are local links and a failed public read is never an empty-success claim", async () => {
  source("lib/lab-drafts.ts").saveDraft(localStorage, "profile", "guest", { workingOn: "Local profile fixture", interests: "open tools, signals", githubUrl: "https://github.com/fixture", scholarUrl: "https://scholar.google.com/citations?user=fixture" });
  const Profile = source("components/lab/ProfileWorkbench.tsx").default;
  await mount(Profile);
  assert.ok(document.querySelector('a[href="https://github.com/fixture"]'));
  assert.ok(document.querySelector('a[href="https://scholar.google.com/citations?user=fixture"]'));
  assert.match(document.body.textContent, /Showing your local draft. Not published or synced/);
  mock.method(source("lib/lab-client.ts"), "createLabClient", () => ({ records: async () => { throw Error("Fixture read unavailable"); } }));
  identity = { ...identity, isAuthenticated: true, session: { did: "did:plc:fixture-a", handle: "fixture-a.test" } };
  await mount(Profile);
  assert.match(document.body.textContent, /Fixture read unavailable/);
  assert.ok(!document.body.textContent.includes("No public records were returned"), "failure cannot be presented as a successful empty read");
  assert.ok(!document.body.textContent.includes("Local profile fixture"));
});

test("feed search, filters and local Promising survive reload; records follow the active DID", async () => {
  let recordReads = 0;
  mock.method(globalThis, "fetch", async url => {
    if (String(url).includes("records")) {
      recordReads++;
      return Response.json({ profile: null, records: [{ uri: `at://${identity.session.did}/org.example.note/1`, kind: "note", data: { text: `Record from ${identity.session.handle}`, field: "neurotech", postType: "question" } }] });
    }
    return Response.json({ status: "empty", items: [], fetchedAt: null, sourceLabel: "Public fixture source" });
  });
  const Feed = source("components/lab/FeedWorkbench.tsx").default;
  await mount(Feed);
  await change('[aria-label="Search scientific work"]', "marimo");
  assert.equal(document.querySelectorAll('.lab-feed-entry').length, 1);
  assert.equal(new URLSearchParams(window.location.search).get('q'), "marimo");
  await click("Promising");
  await act(() => root.render(null));
  await mount(Feed);
  assert.ok(button("Promising · saved"));
  await change('[aria-label="Search scientific work"]', "");
  await click("Negative result");
  assert.match(document.querySelector('.lab-empty').textContent, /No editorial starters/);
  await click("All work");
  identity = { ...identity, isAuthenticated: true, session: { did: "did:plc:fixture-a", handle: "fixture-a.test" } };
  await mount(Feed);
  await click("Your records");
  assert.match(document.querySelector('.lab-stream').textContent, /fixture-a.test/);
  identity = { ...identity, session: { did: "did:plc:fixture-b", handle: "fixture-b.test" } };
  await mount(Feed);
  assert.ok(!document.querySelector('.lab-stream').textContent.includes("fixture-a.test"), "clear prior-account records");
  assert.match(document.querySelector('.lab-stream').textContent, /fixture-b.test/);
  assert.equal(recordReads, 2);
});

test("recovering a pre-sign-in draft requires a fresh review and public consent", async () => {
  const { saveDraft } = source("lib/lab-drafts.ts");
  saveDraft(localStorage, "note", "guest", { text: "Guest draft", field: "neurotech", postType: "question" });
  identity = { ...identity, isAuthenticated: true, session: { did: "did:plc:fixture-a", handle: "fixture-a.test" } };
  services.useLab.mock.mockImplementation(() => ({ capabilities: { canPublish: true, canSignIn: true, mode: "ready" }, openLogin() {} }));
  await mount(source("components/lab/RecordEditor.tsx").default, { kind: "note", onClose() {} });
  await change('#entry-text', "Account draft");
  await click("Review draft");
  await act(() => document.querySelector('input[type="checkbox"]').click());
  await click("Recover that draft");
  assert.equal(document.querySelector('#entry-text').value, "Guest draft");
  assert.ok(!button("Publish public record"), "a recovered draft must return to review, not keep publish consent");
  assert.ok(button("Review draft"));
});

test("public consent belongs to one exact draft and DID; account changes cannot carry it forward", async () => {
  const Editor = source("components/lab/RecordEditor.tsx").default;
  identity = { ...identity, isAuthenticated: true, session: { did: "did:plc:fixture-a", handle: "fixture-a.test" } };
  services.useLab.mock.mockImplementation(() => ({ capabilities: { canPublish: true, canSignIn: true, mode: "ready" }, openLogin() {} }));
  const props = { kind: "note", onClose() {} };
  await mount(Editor, props);
  await change('#entry-text', "Draft belonging to fixture A");
  await click("Review draft");
  assert.equal(button("Publish public record").disabled, true);
  await act(() => document.querySelector('input[type="checkbox"]').click());
  assert.equal(button("Publish public record").disabled, false);
  identity = { ...identity, session: { did: "did:plc:fixture-b", handle: "fixture-b.test" } };
  await mount(Editor, props);
  assert.equal(document.querySelector('#entry-text').value, "", "no cross-account draft carryover");
  assert.equal(button("Publish public record"), undefined, "review/consent must reset");
  assert.match(localStorage.getItem(source("lib/lab-drafts.ts").draftKey("note", "did:plc:fixture-a")), /fixture A/);
});

test("evidence drafts stay attached to their own source and remain recoverable from My bench", async () => {
  const Editor = source("components/lab/RecordEditor.tsx").default;
  await mount(Editor, { kind: "contribution", initial: { targetUrl: "https://example.org/first", field: "neurotech" }, onClose() {} });
  await change('#entry-observation', "Observation about the first source");
  await act(() => root.render(null));
  await mount(Editor, { kind: "contribution", initial: { targetUrl: "https://example.org/second", field: "neurotech" }, onClose() {} });
  assert.equal(document.querySelector('#entry-observation').value, "", "never relabel the old observation as evidence about a new source");
  await change('#entry-observation', "Observation about the second source");
  await act(() => root.render(null));
  await mount(source("components/lab/ProfileWorkbench.tsx").default);
  assert.match(document.querySelector('.lab-draft-list').textContent, /first source/);
  assert.match(document.querySelector('.lab-draft-list').textContent, /second source/);
  await click("Observation about the first source");
  assert.equal(document.querySelector('#entry-targetUrl').value, "https://example.org/first");
  assert.equal(document.querySelector('#entry-observation').value, "Observation about the first source");
});

test("collaboration downloads paired compatible packets and exposes the parent return seam", async () => {
  await mount(source("components/lab/CollaborateWorkbench.tsx").default, { evidenceWorkbench: React.createElement("p", null, "Parent evidence return slot") });
  await click("Download researcher packet");
  await click("Download reviewer packet");
  const [a, b] = exports.map(e => JSON.parse(e.text));
  assert.equal(a.taskId, b.taskId);
  assert.equal(a.returnTemplate.role, "research");
  assert.equal(b.returnTemplate.role, "review");
  assert.match(document.body.textContent, /Parent evidence return slot/);
  await change('input[type="number"]', "0");
  assert.equal(button("Download researcher packet").disabled, true);
});

test("sandbox challenge changes the measured signal and downloads a replayable experiment", async () => {
  const Sandbox = source("components/lab/SignalSandbox.tsx").default;
  await mount(Sandbox);
  await click("Try the aliasing challenge");
  assert.equal(document.querySelector('[aria-label="Signal frequency"]').value, "12");
  assert.equal(document.querySelector('[aria-label="Sampling rate"]').value, "16");
  assert.match(document.querySelector('.lab-sandbox-explanation').textContent, /4 Hz/);
  await click("Download experiment");
  const exported = JSON.parse(exports[0].text);
  assert.deepEqual(exported, source("lib/lab-signal.ts").buildSignalExperiment(12, 16, 0));
  await click("Reset");
  assert.equal(document.querySelector('[aria-label="Signal frequency"]').value, "5");
  assert.ok(button("Draft an observation"));
});
