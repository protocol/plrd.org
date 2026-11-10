import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, key } from './sov-ai-tests/dom-helper.mjs';

test('audience tabs enhance real anchors, select one panel, and expose coherent ARIA state', t => {
  const dom = boot(); t.after(() => dom.window.close());
  const doc = dom.window.document;
  assert.equal(doc.querySelector('[data-audience-tabs]').getAttribute('role'), 'tablist');
  const gov = doc.querySelector('#government-tab');
  const funder = doc.querySelector('#funder-tab');
  assert.equal(gov.getAttribute('role'), 'tab');
  assert.equal(gov.getAttribute('aria-selected'), 'true');
  assert.equal(funder.tabIndex, -1);
  assert.equal(doc.querySelector('#for-funders').hidden, true);
  funder.click();
  assert.equal(funder.getAttribute('aria-selected'), 'true');
  assert.equal(funder.getAttribute('aria-controls'), 'for-funders');
  assert.equal(funder.tabIndex, 0);
  assert.equal(gov.tabIndex, -1);
  assert.equal(doc.querySelector('#for-funders').hidden, false);
  assert.equal(doc.querySelector('#for-governments').hidden, true);
  assert.equal(doc.querySelector('#for-funders').getAttribute('aria-labelledby'), funder.id);
  assert.equal(doc.activeElement, funder);
});

test('audience tabs support arrows, wrapping, Home, End, Space and Enter without hijacking other keys', t => {
  const dom = boot(); t.after(() => dom.window.close());
  const { window } = dom;
  const doc = window.document;
  const gov = doc.querySelector('#government-tab');
  const funder = doc.querySelector('#funder-tab');
  gov.focus();
  assert.equal(key(window, gov, 'ArrowRight').defaultPrevented, true);
  assert.equal(doc.activeElement, funder);
  key(window, funder, 'ArrowRight'); assert.equal(doc.activeElement, gov);
  key(window, gov, 'ArrowLeft'); assert.equal(doc.activeElement, funder);
  key(window, funder, 'Home'); assert.equal(doc.activeElement, gov);
  key(window, gov, 'End'); assert.equal(doc.activeElement, funder);
  gov.focus(); key(window, gov, ' ');
  assert.equal(gov.getAttribute('aria-selected'), 'true');
  funder.focus(); key(window, funder, 'Enter');
  assert.equal(funder.getAttribute('aria-selected'), 'true');
  assert.equal(key(window, funder, 'Tab').defaultPrevented, false);
});

test('audience routes resolve deep links and native Back/Forward without moving focus on hash changes', async t => {
  const dom = boot({ hash: '#for-funders' }); t.after(() => dom.window.close());
  const { window } = dom; const doc = window.document;
  const gov = doc.querySelector('#government-tab');
  assert.equal(doc.querySelector('#for-funders').hidden, false, 'Direct funder route is visible');
  assert.equal(doc.querySelector('#for-governments').hidden, true);
  gov.click();
  assert.equal(window.location.hash, '#for-governments');
  const popped = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true }));
  window.history.back(); await popped;
  assert.equal(doc.querySelector('#for-funders').hidden, false);
  const next = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true }));
  window.history.forward(); await next;
  assert.equal(doc.querySelector('#for-governments').hidden, false);
  doc.querySelector('.brand').focus();
  window.location.hash = '#funder-title';
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  assert.equal(doc.querySelector('#for-funders').hidden, false, 'Deep child route reveals its panel');
  assert.equal(doc.activeElement, doc.querySelector('.brand'));
  window.location.hash = '#%E0%A4%A';
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  assert.equal(doc.querySelector('#for-funders').hidden, false, 'Unknown/malformed hashes preserve the selection');
});

test('native Back to the initial empty route restores the default audience', async t => {
  const dom = boot(); t.after(() => dom.window.close());
  const { window } = dom; const doc = window.document;
  doc.querySelector('#funder-tab').click();
  assert.equal(doc.querySelector('#for-funders').hidden, false);
  const popped = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true }));
  window.history.back(); await popped;
  assert.equal(window.location.hash, '');
  assert.equal(doc.querySelector('#for-governments').hidden, false, 'Initial route restores governments');
  assert.equal(doc.querySelector('#government-tab').getAttribute('aria-selected'), 'true');
});

test('mobile navigation opens, closes on Escape/outside/link, restores focus and survives breakpoint changes', t => {
  const dom = boot({ width: 390 }); t.after(() => dom.window.close());
  const { window } = dom; const doc = window.document;
  const toggle = doc.querySelector('.menu-toggle');
  const nav = doc.querySelector('#site-nav');
  assert.equal(toggle.hidden, false, 'Mobile menu control is enabled');
  assert.equal(nav.hidden, true);
  toggle.click(); assert.equal(nav.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  nav.querySelector('a').focus();
  assert.equal(key(window, nav, 'Escape').defaultPrevented, true);
  assert.equal(nav.hidden, true); assert.equal(doc.activeElement, toggle);
  toggle.click();
  doc.querySelector('h1').dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(nav.hidden, true);
  toggle.click(); nav.querySelector('a[href="#research"]').click();
  assert.equal(nav.hidden, true); assert.equal(doc.activeElement, doc.querySelector('#research'));
  window.innerWidth = 1440; window.dispatchEvent(new window.Event('resize'));
  assert.equal(nav.hidden, false); assert.equal(toggle.hidden, true);
  nav.querySelector('a').focus();
  window.innerWidth = 320; window.dispatchEvent(new window.Event('resize'));
  assert.equal(nav.hidden, true); assert.equal(toggle.hidden, false);
  assert.equal(doc.activeElement, toggle, 'Never leave keyboard focus in hidden navigation');
});

test('research uses native expanders and Escape closes only the current one with focus restored', t => {
  const dom = boot(); t.after(() => dom.window.close());
  const { window } = dom; const doc = window.document;
  const first = doc.querySelector('#listening-details');
  const second = doc.querySelector('#hypercerts-details');
  first.querySelector('summary').click(); second.querySelector('summary').click();
  assert.equal(first.open, true); assert.equal(second.open, true);
  const link = first.querySelector('a'); link.focus();
  assert.equal(key(window, link, 'Escape').defaultPrevented, true);
  assert.equal(first.open, false); assert.equal(second.open, true);
  assert.equal(doc.activeElement, first.querySelector('summary'));
  assert.equal(key(window, first, 'Escape').defaultPrevented, false);
});

test('navigation never leaves focus in a hidden menu or a breakpoint-hidden toggle', t => {
  const dom = boot({ width: 390 }); t.after(() => dom.window.close());
  const { window } = dom; const doc = window.document;
  const toggle = doc.querySelector('.menu-toggle');
  const nav = doc.querySelector('#site-nav');
  toggle.click(); nav.querySelector('a').focus();
  doc.querySelector('h1').dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(nav.hidden, true);
  assert.equal(doc.activeElement, toggle, 'Outside dismissal repairs focus when the active link is hidden');
  window.innerWidth = 1440; window.dispatchEvent(new window.Event('resize'));
  assert.equal(doc.activeElement, nav.querySelector('a'), 'Desktop breakpoint transfers focus off the hidden toggle');
});
