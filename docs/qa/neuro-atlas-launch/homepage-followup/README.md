# Neuro Atlas homepage follow-up — verified

## Scope

- Remove only the visible **Static interface preview** caption from Neurotech’s Neuro Atlas Explore card. Keep its image, description, linked card and Open action.
- Add **Introducing Neuro Atlas** (November 19, 2026) to the existing native Blog pipeline; it is the first homepage Insights carousel card and links directly to the published PL Neuro article, using its exact supplied hero.
- Preserve all prior content, carousel ordering/controls and curated Radar sources. The new search alias redirects to the existing article rather than producing an empty local page.
- Source attribution for the new article is `plneuro.xyz` in the Neurotech and Blog listings; historical publisher labels remain unchanged.
- PL Neuro’s production homepage already has this article first. Its native carousel and article navigation were verified at 1440, 390 and 320px; no PL Neuro code change is needed.

## Revision and actual browser evidence

Runtime: `d7e4cc5c15573bba42f3ac0b7a3d644af2bf4bac`.
Preview: `https://plrd-bz5zrhpjq-protocol.vercel.app/#latest-insights`.
The screenshot/receipt commit following it changes only documentation and moves the new attribution test into the existing `neuro-atlas*.test.mjs` standard test glob. Runtime, content, image bytes, dependencies and package locks are unchanged.

Actual hosted Chrome replay at **1440, 390 and 320px** verifies:
- launch post is the first native carousel card; original 2400×1350 hero loads;
- bounded responsive card and page, native Next/Previous scrolling, Enter opens the actual published post;
- caption absent, original Explore image/action retained;
- correct source label in the Neurotech row and native Blog listing.

The `receipts.json` and four PNGs in this directory are actual hosted captures, not mocks. Mobile is Chrome emulation, not a physical-phone test. The explicit homepage anchor was also opened directly and its landing position checked. The canonical PLRD domain was checked by HTTP; organization browser policy blocks that hostname, so PLRD native browser captures use the verified Vercel deployment alias. PL Neuro native checks used its real production domain.

## Executed checks

- Native frozen pnpm 10 install; dependency and lockfiles unchanged.
- RED→GREEN regressions for caption, missing carousel item, local search aliases, stable preview anchor, and actual source attribution in both new listing appearances.
- Standard final suite: **261 passed / 1 existing failure (262 tests)**. The existing stale Diagnose-copy assertion at `scripts/velocity/impact-methodology-tabs.test.mjs:73` also fails on pristine main (256 passed / 1 failure). Full suite is explicitly not all-green.
- TypeScript and native production build pass. Existing indexer/schema, external GainForest fetch and package/runtime warnings remain in internal raw logs; those integrations are outside this change.
- Actual hosted GETs verify homepage post/card, retained Neuro Atlas link and absent caption. Both `/blog/introducing-neuro-atlas` spellings return 308 to `https://www.plneuro.xyz/insights/introducing-neuro-atlas/`.
- Current published hero bytes equal the owner-supplied PNG, SHA256 `628f0ecd450acd8deb7600d710709c6d1b3dfe06d289362383352b93b08fac84`.
- Complete base-to-candidate preservation check: exactly one Blog/search/RSS entry added; prior records/order retained. Independent source review passed; final desktop/mobile screenshots were inspected after the source-label correction.

PR-only handoff. No merge, production deployment, auth/indexability change or ATProto/PDS write.
