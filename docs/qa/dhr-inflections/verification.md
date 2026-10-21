# DHR inflection readability — October 21, 2026

Requested follow-up to PR #143: separate the “Observable, and not yet true” passage in each inflection card and replace Will Scott with Molly Mackinlay as this article’s author.

## Scope

- All four inflections now have a semantic title, an opening explanation, a divider and explicit criterion heading, and a separate concluding implication.
- Original article wording is preserved except for the removed label colon and capitalization at the new paragraph starts.
- The author is `molly-mackinlay`, resolved through the existing Molly Mackinlay author record. No team/area ownership was changed.
- The old unlisted DHR preview and all non-DHR blog records remain unchanged. No merge or production publication is performed by this follow-up.

## Evidence

- `before-1440.png`: previous hosted PR preview at source `96f0667cfbe99530f45377383a0f93cf701347f8`.
- `inflection-1440.png`, `inflection-390.png`, `inflection-dark-1440.png`, `byline-1440.png`: real headed-Chrome captures of the local production build of this change, not hosted-deployment screenshots.
- `browser-results.json`: all four cards measured at 1440, 768, 390, and 320px. Checks include viewport/document bounds, no text overflow, separated heading/criterion geometry, visible divider, and author readback.

## Checks

- Fresh pnpm 10 frozen-lockfile install passed; no dependency or lockfile change.
- The new layout regression failed against the previous markup; the author regression separately failed against Will Scott. Both pass after the requested edits.
- Full suite: 183 tests passed, none failed.
- TypeScript `--noEmit`, production build, and `git diff --check` passed.
- Deterministic source comparison confirms the article’s text was preserved apart from the presentation punctuation/capitalization changes. Every non-DHR generated blog record matches the previous PR head.
- Desktop, mobile, byline, and dark-mode screenshots were opened and reviewed. The criterion reads as a distinct section; there is no clipping or overlap in the cards.

The build still emits nonfatal external-data fallback/cache-size warnings. This is a presentation/byline edit, not a new factual audit of the article’s claims.
