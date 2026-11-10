import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

export function boot({ hash = '', width = 1440 } = {}) {
  assert.ok(existsSync('public/sov-ai/app.js'), 'The enhancement script must exist');
  const dom = new JSDOM(readFileSync('public/sov-ai/index.html', 'utf8'), {
    url: `https://sovai.test/sov-ai${hash}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  Object.defineProperty(dom.window, 'innerWidth', { value: width, writable: true });
  dom.window.eval(readFileSync('public/sov-ai/app.js', 'utf8'));
  return dom;
}

export function key(window, target, value) {
  const event = new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}
