# Editorial cut-paper intervention covers (Option C)

This is an artwork-only follow-up stacked on PR #172 (`feat/interventions-catalog`), not a replacement catalog or a production release.

## Design and scope

- Preserve the three chosen concept compositions: Sovereign AI, Broad Listening, Connectomics Benchmark + Prize.
- Add twelve companion editorial illustrations in the same charcoal/cream/rust/blue family. Fifteen distinct programs, thirty optimized local WebPs (960×540 covers and 320×180 thumbnails), 440,472 bytes combined.
- Wide featured covers, compact catalog thumbnails, matching program-dialog cover. Titles, descriptions and stage labels remain HTML, outside artwork. The portfolio summary table remains art-free.
- Slug-keyed artwork lives separately from program records. No changes to catalog content, API data, source status, navigation, payment or methodology. New/unknown program slugs retain text-first presentation until explicitly assigned artwork.
- Replace the unsupported “three live” featured heading with the selected mockup’s “Featured interventions”; display each existing record’s actual Proposed stage.
- Gemini illustrations, not Flux2 outputs, documentary images, scientific measurements or completed program results. Exact subject/generation prompts, targeted corrections and output hashes are in `provenance.json`. The original three concept compositions were not regenerated.

## Verification

Runtime source revision: `6f60492930bd588d791947b145b1759bbe05fefc`. Subsequent commits contain review-driven test/QA refinements and this evidence only; application source/assets are unchanged. Final-head gate results are recorded in the PR description.

- Fresh `npx --yes pnpm@10 install --frozen-lockfile` passed, no lockfile delta.
- `npm test`: 147 passed, 0 failed. New tests first failed for absent featured art, absent compact art, absent modal art, incomplete mapping, and missing local images, then passed.
- `npx tsc --noEmit` passed. Production build passed.
- Real headed Chrome via browser-harness, localhost production route: 1440/1024/768/390/320px. All 18 rendered images (3 featured + 15 catalog) loaded; art-free overview; image/card bounds; native grouping; image-click to correct modal, close; direct URL/reload/Escape; keyboard Enter/Escape; dark-mode art remains unfiltered.
- Narrow-screen regression: catalog grid min-content overflow was reproduced at 320px (`right=333.875`) and corrected to `right=296` with explicit min-width boundaries. Mobile emulation: `innerWidth=clientWidth=scrollWidth=320`.
- Existing shell qualification: desktop-mode 320px with a non-overlay 15px scrollbar still has body `min-width:320px`; this is inherited from `src/app/layout.tsx`. Base preview measured client305/scroll334, candidate client305/scroll320. The actual mobile emulation has no overflow; no global body layout change is included in this artwork PR.
- Independent review corrections: validate the fixed commissioned-art inventory rather than coupling asset completeness to all future records; derive stage expectations from the record; cover a mixed catalog with an unmapped future program and Active/Completed stages. Browser layout checks use document client width and report the inherited shell condition explicitly, rather than a false-green no-overflow claim.
- Native replay: `scripts/qa/intervention-cover-art.py`, executed inside browser-harness with `QA_ORIGIN` and `QA_OUT` globals. No production data mutation or authenticated-account claims.

Screenshots are actual local production UI, not the standalone mockup. All records shown retain the draft/source caveats from PR #172. An independent review is recorded in the PR description; deployment/CI status is checked separately at handoff.

## Parallel work / merge order

This branch targets `feat/interventions-catalog`. It does not write to PR #172. Merge this artwork delta into that branch, or retarget/rebase after #172 lands. Reconcile overlapping card-layout hunks if the parallel status/library work changes those components; preserve that work’s data and selection behavior. No merge or live publication is performed here.
