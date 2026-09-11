import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { source } from './velocity/test-source-loader.mjs';

const require = createRequire(import.meta.url);
require.extensions['.css'] = module => { module.exports = {}; };
const origin = 'https://lab.example.org';
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa';
const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: 'true' });
const { createLabAuthRuntime } = source('lib/lab-auth.tsx');
const identity = source('lib/lab-identity.ts');
const client = source('lib/lab-client.ts');
const realClient = client.createLabClient;
const Shell = source('components/lab/LabShell.tsx').default;
const Profile = source('components/lab/ProfileWorkbench.tsx').default;
const { PathnameContext } = require('next/dist/shared/lib/hooks-client-context.shared-runtime');

// Adapted from the independent security probe: only SDK/network boundaries are
// synthetic. Actual auth runtime subscriptions drive the actual keyed Bench UI.
for (const fails of [true, false]) {
  test(fails ? 'deferred SDK cleanup rejection remains visible after the owner Bench unmounts' : 'clean SDK sign-out leaves no recovery alert', async t => {
    const dom = new JSDOM('<div id="root"></div>', { url: origin + '/lab/profile/' });
    const globals = Object.fromEntries(['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'StorageEvent', 'localStorage'].map(key => [key, dom.window[key]]));
    Object.assign(globals, { self: dom.window, IS_REACT_ACT_ENVIRONMENT: true });
    const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    Object.assign(globalThis, globals);
    let root;
    t.after(async () => {
      if (root) await act(() => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    });
    window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    window.HTMLDialogElement.prototype.close = function () { this.open = false; };
    t.mock.method(globalThis, 'fetch', async url => {
      assert.equal(url, '/api/lab/capabilities/', 'No live network or mutations');
      return Response.json(config);
    });

    let resolveCleanup, rejectCleanup, cleanupCalls = 0;
    const sdkSession = { sub: did, did, signOut: () => {
      cleanupCalls++;
      return new Promise((resolve, reject) => { resolveCleanup = resolve; rejectCleanup = reject; });
    } };
    const runtime = createLabAuthRuntime({
      loadConfig: async () => config,
      loadClient: async () => ({ init: async () => ({ session: sdkSession }), authorize: async () => { throw Error('Unexpected authorization'); } }),
      location: () => ({ origin, pathname: '/lab/profile/' }),
      replace: () => { throw Error('Unexpected redirect'); },
    });
    await runtime.initialize();
    t.mock.method(identity, 'useLabIdentity', () => ({
      ...React.useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getServerSnapshot),
      logout: runtime.logout, login: runtime.login, authorizeWrite: runtime.authorizeWrite,
    }));
    t.mock.method(client, 'createLabClient', (...args) => ({
      ...realClient(...args),
      records: async () => ({ profile: null, profileRecord: null, records: [], limit: 30, hasMore: false, cursors: {} }),
    }));
    const { createRoot } = require('react-dom/client');
    root = createRoot(document.getElementById('root'));
    await act(async () => {
      root.render(React.createElement(PathnameContext.Provider, { value: '/lab/profile/' }, React.createElement(Shell, null, React.createElement(Profile))));
    });
    const oldBench = document.querySelector('.lab-workbench');
    const shell = document.querySelector('.open-lab');
    const signOut = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Sign out');
    assert.ok(oldBench);
    assert.ok(signOut);
    assert.equal(runtime.getSnapshot().isAuthenticated, true);
    assert.equal(document.querySelector('[role="alert"]'), null);

    await act(() => signOut.click());
    assert.equal(cleanupCalls, 1);
    assert.equal(oldBench.isConnected, false, 'Owner-keyed Bench unmounts before SDK cleanup settles');
    const guestBench = document.querySelector('.lab-workbench');
    assert.ok(guestBench);
    assert.notEqual(guestBench, oldBench);
    assert.equal(signOut.isConnected, false);
    assert.equal(runtime.getSnapshot().error, null);
    assert.equal(runtime.getSnapshot().isAuthenticated, false);
    assert.equal(runtime.getSnapshot().session, null);
    assert.equal(runtime.getSnapshot().oauthSession, null);

    await act(async () => {
      if (fails) rejectCleanup(Error('Synthetic persistent store failure'));
      else resolveCleanup();
      await new Promise(resolve => setImmediate(resolve));
    });
    assert.equal(runtime.getSnapshot().isAuthenticated, false);
    assert.equal(runtime.getSnapshot().session, null);
    assert.equal(runtime.getSnapshot().oauthSession, null);
    assert.equal(runtime.getSnapshot().isLoading, false);
    assert.equal(document.querySelector('.open-lab'), shell, 'Shell survives logout');
    assert.equal(document.querySelector('.lab-workbench'), guestBench);
    if (fails) {
      const message = runtime.getSnapshot().error;
      assert.match(message, /Signed out of this page.*local session cleanup could not be confirmed/);
      assert.match(message, /Clear this site’s browser storage and revoke Open Lab access in your account settings/);
      const alert = document.querySelector('[role="alert"]');
      assert.ok(alert, 'Runtime cleanup recovery guidance must remain visible after the old Bench unmounts');
      assert.equal(alert.textContent, message, 'Display exact runtime guidance, not a generic failure or guaranteed revocation claim');
      assert.equal(alert.closest('.lab-workbench'), null, 'Recovery alert belongs outside the owner-keyed subtree');
    } else {
      assert.equal(runtime.getSnapshot().error, null);
      assert.equal(document.querySelector('[role="alert"]'), null);
    }
  });
}
