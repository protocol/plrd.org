import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("new work briefs and dark experiment guidance have scoped readable styles and focus targets", () => {
  const css = readFileSync("src/app/lab/lab.css", "utf8");
  assert.match(css, /\.open-lab \.lab-work-brief/);
  assert.match(css, /\.open-lab \.lab-artifact-brief summary:focus-visible/);
  assert.match(css, /\.open-lab \.lab-sandbox \.lab-smallprint\s*\{[^}]*color:\s*#bed6e8/);
  assert.match(css, /\.open-lab \.lab-paired-audit/);
});

test("mobile hero has deliberate compact type so the work is not below a giant wall of words", () => {
  const css = readFileSync("src/app/lab/lab.css", "utf8");
  assert.match(
    css,
    /@media\s*\(max-width:\s*700px\)[\s\S]*?\.lab-hero h1\s*\{[^}]*font-size:\s*62px/,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*380px\)[\s\S]*?\.lab-hero h1\s*\{[^}]*font-size:\s*52px/,
  );
  assert.match(
    readFileSync("src/components/lab/LabShell.tsx", "utf8"),
    /pl_logo_mark\.svg/,
  );
});
