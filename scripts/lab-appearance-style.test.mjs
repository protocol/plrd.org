import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';
import { source } from './velocity/test-source-loader.mjs';
const require = createRequire(import.meta.url);
// CSS module names stay readable for selector matching; no substitute component.
require.extensions['.css'] = m => { m.exports = new Proxy({}, { get: (_, p) => p === '__esModule' ? false : String(p) }); };
source('lib/lab-identity.ts').useLabIdentity = () => ({ isLoading: false, isAuthenticated: false, session: null });
const Shell = source('components/lab/LabShell.tsx').default;
const Feed = source('components/lab/FeedWorkbench.tsx').default;
const { PathnameContext } = require('next/dist/shared/lib/hooks-client-context.shared-runtime');
const html = renderToStaticMarkup(React.createElement(PathnameContext.Provider, { value: '/lab/' }, React.createElement(Shell, null, React.createElement(Feed))));
const document = new JSDOM(html).window.document;
const css = file => postcss.parse(readFileSync(file, 'utf8'));
const base = css('src/app/lab/lab.css');
const composition = css('src/components/lab/lab-composition.css');
const shell = css('src/components/lab/lab-app-shell.css');
const feed = css('src/components/lab/feed/feed.module.css');

// Bounded CSS cascade regression, NOT a browser getComputedStyle substitute.
// All matching declarations are read from source, including media queries and
// specificity. Test both chunk orders because the reported bug was a tied rule.
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const add = (a, b) => a.map((n, i) => n + b[i]);
function specificity(selector) {
  let weight = [0, 0, 0];
  selector = selector.replace(/:(is|not|has|where)\(([^()]*)\)/g, (_, kind, body) => {
    if (kind !== 'where') weight = add(weight, postcss.list.comma(body).map(specificity).sort(compare).at(-1));
    return '';
  });
  assert.ok(!selector.includes('('), `Unsupported selector in cascade test: ${selector}`);
  selector = selector.replace(/\[[^\]]+\]/g, () => { weight[1]++; return ''; });
  selector = selector.replace(/#[\w-]+/g, () => { weight[0]++; return ''; });
  selector = selector.replace(/\.[\w-]+|:(?!:)[\w-]+/g, () => { weight[1]++; return ''; });
  weight[2] += (selector.match(/[a-zA-Z][\w-]*/g) || []).length;
  return weight;
}
function active(rule, width) {
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type !== 'atrule') continue;
    assert.equal(parent.name, 'media');
    if (parent.params.includes('prefers-reduced-motion')) return false;
    const limits = [...parent.params.matchAll(/(max|min)-width:\s*(\d+)px/g)];
    assert.ok(limits.length, `Unmodeled query: ${parent.params}`);
    if (limits.some(([, kind, n]) => kind === 'max' ? width > +n : width < +n)) return false;
  }
  return true;
}
function winner(element, prop, sheets, width) {
  let result;
  for (const sheet of sheets) sheet.walkRules(rule => {
    if (!active(rule, width)) return;
    for (const original of postcss.list.comma(rule.selector)) {
      const selector = original.replace(/:global\(([^)]+)\)/g, '$1');
      if (!element.matches(selector)) continue;
      rule.walkDecls(prop, d => {
        const rank = [Number(!!d.important), ...specificity(selector)];
        const rankCompare = result ? rank[0] - result.rank[0] || compare(rank.slice(1), result.rank.slice(1)) : 1;
        if (rankCompare >= 0) result = { value: d.value, rank, selector };
      });
    }
  });
  return result;
}
test('workshop heading wins at <=22px over the actual shell in either CSS chunk order, including mobile', () => {
  const h1 = document.querySelector('h1');
  assert.equal(h1.textContent, 'Catch up');
  assert.ok(h1.closest('[aria-label="Workshop invitation"]'));
  for (const order of [[base, composition, feed, shell], [base, composition, shell, feed]]) {
    for (const width of [1440, 800, 390]) {
      const actual = winner(h1, 'font-size', order, width);
      assert.match(actual.value, /^\d+px$/);
      assert.ok(parseFloat(actual.value) <= 22, `${width}px viewport: ${actual.value} from ${actual.selector}`);
      assert.equal(actual.rank[0], 0, 'No !important workaround');
    }
  }
});
test('small-phone work search is a visible icon that expands to a readable native input on focus', () => {
  const icon = document.querySelector('.lab-global-search > svg');
  const input = document.querySelector('.lab-global-search input');
  for (const width of [320,390]) {
    assert.equal(winner(icon, 'display', [base, composition, shell], width)?.value, 'block');
    assert.equal(winner(input, 'color', [base, composition, shell], width)?.value, 'transparent');
  }
  assert.equal(declarations(shell, '.open-lab.lab-app-shell .lab-global-search:focus-within').position, 'absolute');
  assert.equal(declarations(shell, '.open-lab.lab-app-shell .lab-global-search:focus-within input').color, 'var(--lab-ink)');
});
test('app-wide shell headings stay compact so activity, not display type, leads the screen', () => {
  const size = selector => parseFloat(declarations(shell, selector)['font-size']);
  assert.ok(size('.open-lab.lab-app-shell h1') <= 22, 'Shell h1 still uses marketing display type');
  assert.ok(size('.open-lab.lab-app-shell h2') <= 18);
  assert.ok(size('.open-lab.lab-app-shell h3') <= 16);
  assert.ok(size('.open-lab.lab-app-shell .lab-brand > span') <= 18);
  assert.ok(size('.open-lab.lab-app-shell .lab-workbench-heading h1') <= 22);
  assert.ok(size('.open-lab.lab-app-shell .lab-dialog h2') <= 20);
});
test('feed and bench headings stay compact so activity, not display type, leads the screen', () => {
  const size = selector => parseFloat(declarations(feed, selector)['font-size']);
  assert.ok(size('.root h1') <= 22, 'Feed and people page h1 still uses marketing display type');
  assert.ok(size('.profileRoot :global(.lab-workbench-heading) h1') <= 22, 'My bench heading still uses marketing display type');
  assert.ok(size('.root h2') <= 18);
});
test('bottleneck and effort workbenches stay compact inside the app', () => {
  const bottleneck = css('src/components/lab/BottleneckWorkbench.css');
  const effort = css('src/components/lab/EffortBacking.css');
  const sizes = (sheet, selector) => {
    const values = [];
    sheet.walkRules(selector, rule => rule.walkDecls('font-size', d => values.push(d.value)));
    assert.ok(values.length, `Missing ${selector}`);
    return values.map(parseFloat);
  };
  assert.ok(sizes(bottleneck, '.open-lab .bottleneck-workbench h1').every(n => n <= 22), 'Bottleneck h1 still uses marketing display type');
  assert.ok(sizes(bottleneck, '.open-lab .bottleneck-workbench h2').every(n => n <= 18), 'Bottleneck h2 still uses marketing display type');
  assert.ok(sizes(effort, '.effort-backing h1').every(n => n <= 22), 'Effort h1 still uses marketing display type');
  assert.ok(sizes(effort, '.effort-backing h2').every(n => n <= 18), 'Effort h2 still uses marketing display type');
});

const declarations = (sheet, selector) => {
  const values = {};
  sheet.walkRules(selector, rule => rule.walkDecls(d => { values[d.prop] = d.value; }));
  return values;
};
function palette(dark) {
  const values = { ...declarations(shell, '.open-lab.lab-app-shell'), ...(dark ? declarations(shell, '.dark .open-lab.lab-app-shell') : {}) };
  const resolve = (name, seen = []) => {
    assert.ok(!seen.includes(name), `Cyclic token ${name}`);
    const value = values[name]; assert.ok(value, `Missing semantic token ${name}`);
    const alias = value.match(/^var\((--[\w-]+)\)$/);
    return alias ? resolve(alias[1], [...seen, name]) : value;
  };
  return resolve;
}
function contrast(a, b) {
  const luminance = hex => {
    assert.match(hex, /^#[\da-f]{6}$/i, 'Contrast evidence requires resolved opaque source colors');
    const rgb = hex.slice(1).match(/../g).map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
test('feed, details and composer contain no fixed theme paint or !important color patches', () => {
  feed.walkDecls(d => {
    if (!/^(color|background(?:-color)?|border(?:-.*)?|outline(?:-.*)?)$/.test(d.prop)) return;
    assert.doesNotMatch(d.value, /#[\da-f]{3,8}\b|\b(?:white|black|rgba?|hsla?)\b/i, `${d.parent.selector} ${d.prop}: ${d.value}`);
    assert.equal(!!d.important, false, `${d.parent.selector} must win through scope, not !important`);
  });
});
for (const dark of [false, true]) {
  test(`${dark ? 'dark' : 'light'} source token ratios: body, muted, links, selections, primary ink, errors and control outlines`, t => {
    const token = palette(dark);
    const pairs = [
      ['--lab-ink', '--lab-paper', 4.5], ['--lab-ink', '--lab-card', 4.5],
      ['--lab-muted', '--lab-paper', 4.5], ['--lab-muted', '--lab-card', 4.5],
      ['--lab-ink', '--lab-input', 4.5], ['--lab-muted', '--lab-input', 4.5],
      ['--lab-blue', '--lab-paper', 4.5], ['--lab-blue', '--lab-card', 4.5],
      ['--lab-selected-ink', '--lab-selected-bg', 4.5],
      ['--lab-primary-ink', '--lab-primary', 4.5],
      ['--lab-error-ink', '--lab-error-bg', 4.5],
      ['--lab-error-line', '--lab-error-bg', 3],
      ['--lab-control-line', '--lab-input', 3], ['--lab-control-line', '--lab-paper', 3],
      ['--lab-selected-line', '--lab-selected-bg', 3], ['--lab-selected-line', '--lab-card', 3],
      ['--lab-blue', '--lab-input', 3],
    ];
    for (const [ink, background, minimum] of pairs) {
      const ratio = contrast(token(ink), token(background));
      t.diagnostic(`${ink} ${token(ink)} / ${background} ${token(background)} = ${ratio.toFixed(3)}:1 (source, not browser)`);
      assert.ok(ratio >= minimum, `${ink} / ${background}: ${ratio.toFixed(3)} < ${minimum}`);
    }
  });
}
test('real feed/composer selectors bind readable tokens including primary and selected button ink', async () => {
  const Composer = source('components/lab/feed/InventionComposer.tsx').default;
  const tree = () => React.createElement(PathnameContext.Provider, { value: '/lab/' }, React.createElement(Shell, null, React.createElement(Composer, { onClose() {} })));
  const server = new JSDOM(renderToStaticMarkup(tree())).window.document;
  assert.equal(server.querySelector('input[aria-label="Build title"]'), null, 'SSR must not expose an unrestored identity-scoped editor');
  assert.match(server.body.textContent, /Restoring your scoped bench/);
  const dom = new JSDOM('<div id="root"></div>', {url:'http://localhost/lab/'});
  const keys = ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLDialogElement','Event','StorageEvent','localStorage','sessionStorage','self','IS_REACT_ACT_ENVIRONMENT','fetch'];
  const originals = new Map(keys.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  for (const k of keys.filter(k => !['self','IS_REACT_ACT_ENVIRONMENT','fetch'].includes(k))) Object.defineProperty(globalThis, k, {value:dom.window[k], configurable:true, writable:true});
  globalThis.self = dom.window;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.fetch = async () => new Response(JSON.stringify({canSignIn:false,canPublish:false,mode:'unconfigured'}), {headers:{'content-type':'application/json'}});
  dom.window.HTMLDialogElement.prototype.showModal = function(){ this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function(){ this.open = false; };
  sessionStorage.setItem('open-lab:welcome:v2', 'seen');
  const {createRoot} = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root'));
  try {
  await React.act(async () => { root.render(tree()); });
  const composer = dom.window.document;
  const input = composer.querySelector('input[aria-label="Build title"]'); assert.ok(input, 'Restored scoped bench must render the actual editor');
  const primary = composer.querySelector('button.primary'); assert.ok(primary);
  const selected = composer.querySelector('.chips button'); assert.ok(selected); selected.setAttribute('aria-pressed', 'true');
  for (const order of [[base, composition, feed, shell], [base, composition, shell, feed]]) {
    assert.equal(winner(document.querySelector('.layout'), 'color', order, 1440).value, 'var(--lab-ink)');
    assert.equal(winner(composer.querySelector('.detail'), 'color', order, 1440).value, 'var(--lab-ink)');
    assert.equal(winner(input, 'color', order, 1440).value, 'var(--lab-ink)');
    assert.equal(winner(input, 'background', order, 1440).value, 'var(--lab-input)');
    assert.equal(winner(primary, 'background', order, 1440).value, 'var(--lab-primary)');
    assert.equal(winner(primary, 'color', order, 1440).value, 'var(--lab-primary-ink)');
    assert.equal(winner(selected, 'background', order, 1440).value, 'var(--lab-selected-bg)');
    assert.equal(winner(selected, 'color', order, 1440).value, 'var(--lab-selected-ink)');
  }
  assert.match(declarations(feed, '.layout input, .detail input, .detail textarea').border, /var\(--lab-control-line\)/);
  const paints = [];
  feed.walkRules(rule => { if (rule.selector.includes(':focus-visible')) rule.walkDecls('outline', d => paints.push(d.value)); });
  assert.ok(paints.length > 0 && paints.every(value => /2px solid var\(--lab-blue\)/.test(value)), 'Focus stays visible in both palettes');
  const errors = [];
  feed.walkRules(rule => { if (rule.selector.includes('.detail [role="alert"]')) rule.walkDecls('color', d => errors.push(d.value)); });
  assert.ok(errors.includes('var(--lab-error-ink)'), 'Actual detail/composer role=alert messages need error ink too');
  } finally {
    await React.act(async () => { root.unmount(); });
    dom.window.close();
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
