import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { source } from "./velocity/test-source-loader.mjs";
import { readFileSync, existsSync } from "node:fs";
import { JSDOM } from "jsdom";
// Next sets this from next.config.ts when rendering the real app.
process.env.__NEXT_TRAILING_SLASH = "true";

test("signal SVG is stable across tiny math-library rounding differences during hydration", () => {
  const Sandbox = source("components/lab/SignalSandbox.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Sandbox));
  const sin = Math.sin;
  let other;
  try {
    Math.sin = v => sin(v) + 1e-15;
    other = renderToStaticMarkup(React.createElement(Sandbox));
  } finally { Math.sin = sin; }
  const svg = h => new JSDOM(h).window.document.querySelector('svg').outerHTML;
  assert.ok(svg(html) === svg(other), "SVG geometry should be display-rounded, not raw engine-dependent floats");
});

test("the first screen offers a real experiment, and featured source views carry an actionable brief", () => {
  const html = renderToStaticMarkup(React.createElement(source("components/lab/Landing.tsx").default));
  assert.ok(new JSDOM(html).window.document.querySelector('.lab-hero-copy a[href="/lab/apps/#signal-sandbox"]'), "experiment belongs in the first-use invitation");
  const app = renderToStaticMarkup(React.createElement(source("components/lab/AppsWorkbench.tsx").default));
  for (const label of ["What exists", "Specific opening", "Inspect or try", "Useful contribution"]) assert.ok(app.includes(label), label);
  const map = renderToStaticMarkup(React.createElement(source("components/lab/ResearchMap.tsx").default));
  assert.match(map, /Which measurement bottleneck/);
  assert.match(map, /Editorial opening/);
});

test("visitors without an account get a separate signup route; Atlas points to the public field article", () => {
  const login = readFileSync("src/components/lab/LabShell.tsx", "utf8");
  assert.ok(login.includes('href="https://bsky.app/"'), "provide a signup starting point without discarding local drafts");
  const atlas = renderToStaticMarkup(React.createElement(source("components/lab/AtlasWorkbench.tsx").default));
  assert.ok(atlas.includes('https://www.plneuro.xyz/insights/neurotech-frontier-human-flourishing/'));
  assert.match(atlas, /access required/);
});

test("Open Lab has one distinct shell with every browse destination and accessible native dialog", () => {
  for (const path of [
    "page.tsx",
    "feed/page.tsx",
    "apps/page.tsx",
    "atlas/page.tsx",
    "collaborate/page.tsx",
    "profile/page.tsx",
  ])
    assert.ok(existsSync("src/app/lab/" + path), path);
  const shell = readFileSync("src/components/lab/LabShell.tsx", "utf8");
  for (const path of [
    "/lab/",
    "/lab/feed/",
    "/lab/apps/",
    "/lab/atlas/",
    "/lab/collaborate/",
    "/lab/profile/",
  ])
    assert.ok(shell.includes(path));
  assert.match(
    readFileSync("src/components/lab/LabDialog.tsx", "utf8"),
    /showModal/,
  );
  assert.match(readFileSync("src/components/SiteShell.tsx", "utf8"), /isLab/);
});
