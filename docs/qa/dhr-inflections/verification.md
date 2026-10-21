# DHR inflection readability — October 21, 2026

Requested follow-up to PR #143: separate the “Observable, and not yet true” passage in each inflection card and replace Will Scott with Molly Mackinlay as this article’s author.

## Scope

- All four inflections now have a semantic title, an opening explanation, a divider and explicit criterion heading, and a separate concluding implication.
- Original article wording is preserved except for the removed label colon and capitalization at the new paragraph starts. After owner approval later on October 21, all four criterion headings use “What we’re watching for”; the criterion text itself is unchanged.
- The author is `molly-mackinlay`, resolved through the existing Molly Mackinlay author record. No team/area ownership was changed.
- The old unlisted DHR preview and all non-DHR blog records remain unchanged. No merge or production publication is performed by this follow-up.

## Evidence

- `before-1440.png`: previous hosted PR preview at source `96f0667cfbe99530f45377383a0f93cf701347f8`.
- `inflection-1440.png`, `inflection-390.png`, `inflection-dark-1440.png`, `byline-1440.png`: real headed-Chrome captures of the local production build at `2ea712a`, not hosted-deployment screenshots. The full browser replay also passed after the current-main refresh at `fb2b5c2`; the DHR article, author, and inflection styling are unchanged between those revisions.
- `browser-results.json`: all four cards measured at 1440, 768, 390, and 320px. Checks include viewport/document bounds, no text overflow, separated heading/criterion geometry, visible divider, and author readback.

## Approved heading wording follow-up

- All four headings now read exactly **What we’re watching for**. The updated regression failed on the former heading, then passed after the source/generated-content change.
- `wording-inflection-1440.png`, `wording-inflection-390.png`, and `wording-inflection-dark-1440.png` are local production browser captures at runtime source `e79224a7069247f04c7bec1f8a44ff4f7a4916c2`. Earlier images above deliberately retain the preceding label for provenance.
- `wording-browser-results.json`: all four headings and geometry pass at 1440, 768, 390, and 320px. Molly’s byline is unchanged.
- Seven focused tests, TypeScript, and the production build pass. The full suite again reports 152 passing and only the same known methodology assertion failure described below.
- Fresh skeptical review: PASS. Exact source/generated-data comparison proves only four heading replacements; paragraph copy, author metadata, structure, unlisted preview and other articles are unchanged. Desktop/mobile captures show the approved label without clipping or overlap.

## Checks

- Fresh pnpm 10 frozen-lockfile install passed; no dependency or lockfile change.
- The new layout regression failed against the previous markup; the author regression separately failed against Will Scott. Both pass after the requested edits.
- Before refreshing against current `main`: 183 tests passed, none failed.
- After refreshing against `main` (`10c0816`): 152 passed, one pre-existing failure in `scripts/velocity/impact-methodology-tabs.test.mjs:73`. The test expects the old “which of these is preventing this field from moving faster now?” sentence. An isolated checkout of exact `main` reproduces the identical failure; no DHR regression is implicated. The seven focused DHR/blog metadata checks pass.
- TypeScript `--noEmit`, production build, and `git diff --check` passed.
- Deterministic source comparison confirms the article’s text was preserved apart from the presentation punctuation/capitalization changes. Every non-DHR generated blog record matches the previous PR head.
- Desktop, mobile, byline, and dark-mode screenshots were opened and reviewed. The criterion reads as a distinct section; there is no clipping or overlap in the cards.

The build still emits nonfatal external-data fallback/cache-size warnings. This is a presentation/byline edit, not a new factual audit of the article’s claims.
