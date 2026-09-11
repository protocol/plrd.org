import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';

// Execute the literal first-paint script shipped by RootLayout, not a copy of its logic.
const layout = readFileSync('src/app/layout.tsx', 'utf8');
const boot = layout.match(/__html:\s*`([^`]+)`/)?.[1];
assert.ok(boot, 'RootLayout must still ship an executable before-paint theme script');
function initialize({ path = '/lab/', saved = null, osDark = true, storageFails = false, mediaFails = false }) {
  const dom = new JSDOM('', { url: `https://lab.example.org${path}` });
  const writes = [];
  const localStorage = {
    getItem(key) { assert.equal(key, 'theme'); if (storageFails) throw Error('Storage blocked'); return saved; },
    setItem(...args) { writes.push(args); },
  };
  dom.window.matchMedia = query => {
    assert.equal(query, '(prefers-color-scheme: dark)');
    if (mediaFails) throw Error('Media query unavailable');
    return { matches: osDark };
  };
  runInNewContext(boot, { window: dom.window, document: dom.window.document, localStorage });
  const dark = dom.window.document.documentElement.classList.contains('dark');
  dom.window.close();
  assert.deepEqual(writes, [], 'An automatic theme must never be persisted as a user choice');
  return dark;
}

for (const path of ['/lab', '/lab/', '/lab/feed/', '/lab/explorations/observatory/']) {
  test(`OS-dark without a choice starts light before paint on ${path}`, () => {
    assert.equal(initialize({ path }), false);
  });
}
for (const path of ['/lab/', '/about/']) {
  for (const saved of ['light', 'dark']) {
    test(`explicit ${saved} is honored before paint on ${path}`, () => {
      assert.equal(initialize({ path, saved, osDark: saved === 'light' }), saved === 'dark');
    });
  }
}
for (const path of ['/', '/about/', '/laboratory/']) {
  for (const osDark of [true, false]) {
    test(`marketing ${path} without a choice retains OS ${osDark ? 'dark' : 'light'}`, () => {
      assert.equal(initialize({ path, osDark }), osDark);
    });
  }
}
test('blocked storage still resolves Lab light and marketing OS-dark without crashing', () => {
  assert.equal(initialize({ storageFails: true }), false);
  assert.equal(initialize({ path: '/about/', storageFails: true }), true);
});
test('invalid stored values are automatic, not explicit light', () => {
  assert.equal(initialize({ saved: 'system' }), false);
  assert.equal(initialize({ path: '/about/', saved: 'system' }), true);
});
test('unavailable preference APIs fall back to readable light', () => {
  assert.equal(initialize({ path: '/about/', storageFails: true, mediaFails: true }), false);
});
