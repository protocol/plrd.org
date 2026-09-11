import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import postcss from 'postcss';

const path = 'src/components/lab/lab-app-shell.css';
test('app shell uses a compact scoped responsive layout with drawer and centered geometry', () => {
  assert.ok(existsSync(path), 'App shell stylesheet exists');
  const css = readFileSync(path, 'utf8'); const root = postcss.parse(css);
  const rules = []; root.walkRules(rule => rules.push(rule));
  assert.ok(rules.every(rule => rule.selector.includes('.lab-app-shell') || rule.parent.name === 'keyframes'), 'Styles must stay inside the app shell');
  for (const token of ['--lab-nav-width: 210px','--lab-feed-width: 740px','--lab-context-width: 280px']) assert.ok(css.includes(token), token);
  assert.match(css, /\.lab-sidebar\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\[data-variant="drawer"\]\s*\{[^}]*height:\s*100dvh/);
  assert.match(css, /\[data-variant="centered"\]/);
  assert.match(css, /@media\s*\(max-width:\s*1199px\)/);
  assert.match(css, /@media\s*\(max-width:\s*800px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(readFileSync('src/components/lab/LabShell.tsx','utf8'), /import.*lab-app-shell\.css/);
});

test('Observatory has genuine light instrument, node, inspector and input surfaces with dark opt-in', () => {
  const root = postcss.parse(readFileSync('src/components/lab/explorations/lab-explorations.module.css', 'utf8'));
  const declarations = selector => {const found = {}; root.walkRules(selector, rule => rule.walkDecls(d => found[d.prop] = d.value)); return found;};
  assert.equal(declarations('.observatory')['color-scheme'], 'light');
  assert.equal(declarations('.observatory').background, 'var(--paper)');
  for (const selector of ['.mapCenter','.questionNodes a','.questionBrief','.shareField input']) assert.match(declarations(selector).background, /^var\(/, selector);
  assert.equal(declarations(':global(.dark) .observatory')['color-scheme'], 'dark');
  assert.equal(declarations('.mapGeometry').color, 'var(--line)');
  assert.equal(declarations('.mapGeometry :is(path, ellipse, line)').stroke, 'currentColor');
  assert.equal(declarations('.mapGeometry path[data-selected=\'true\']').stroke, 'var(--accent)');
  const observatory = readFileSync('src/components/lab/explorations/Observatory.tsx', 'utf8');
  assert.doesNotMatch(observatory, /stroke=\"#(?:303843|414a56|566270)\"/, 'Field-map geometry must not hardcode dark strokes in light mode');
  assert.match(observatory, /stroke=\"currentColor\"/, 'Field-map geometry should inherit the light instrument line color');
});

test('public site invitation uses the action-first Open Lab invitation copy', () => {
  const page = readFileSync('src/app/page.tsx', 'utf8');
  assert.match(page, /Made something that makes science easier\?/);
});

// Run after canonical browser-harness records actual layout probes. Normal test runs
// still check the CSS contracts; no synthetic geometry is substituted for a browser.
const probeFile = process.env.LAB_SHELL_PROBE_FILE;
test('real responsive browser probes have no overflow and retain the scope/account/navigation', {skip:!probeFile}, () => {
  const probes = JSON.parse(readFileSync(probeFile, 'utf8'));
  assert.ok(probes.length >= 4, 'Desktop, tablet, mobile, and small mobile required');
  for (const p of probes) {
    assert.ok(p.scrollWidth <= p.width, `No horizontal overflow at ${p.width}: ${p.scrollWidth}`);
    assert.equal(p.activeNavCount, 1, p.route);
    assert.ok(p.scopeVisible && p.accountVisible && p.searchVisible, `Persistent actions at ${p.width}`);
    assert.ok(p.headingSize <= 32, `Heading ${p.headingSize}px at ${p.width}`);
    assert.ok(p.width > 800 ? p.sidebarVisible : p.menuVisible, `Navigation at ${p.width}`);
  }
});
