# Impact headline sizing — September 29, 2026

Request: match “How we build fields” to PR172's headline size; Lukas clarified that he meant smaller. Scope is headline font size only, not typeface/weight, copy, navigation or publication.

Reference: PR172 commit `982985a14aa5e1ded2146b6914c2f7f12cdc3222`, `src/components/InterventionsIndex.tsx`; current hosted catalog computed sizes checked at 1440/768/640/390px: 44/44/32/32px.

Implementation: replace 42px → 56px (sm) → 72px (lg) with 32px → 44px (md) in the existing unlisted Impact route. All other headline classes and page content unchanged.

Verification:
- Regression test failed on the old classes, then passed on the new classes.
- Full `npm test`: 128 passed, zero failed. `npx tsc --noEmit`, `npm run build`, `git diff --check`: pass.
- Real headed Chrome against the local production build on `http://127.0.0.1:4171/impact-preview-eb61fba1b98e/`: 1440/768/640/390/320px, expected 44/44/32/32/32px. Heading DOM Range is within its bounds, viewport has no horizontal overflow, noindex retained.
- Screenshots here are local production-build captures, not hosted screenshots. `results.json` records computed geometry.
- Fresh-skeptical review of scoped diff and actual desktop/320px pixels: PASS. Desktop title remains above the section-heading hierarchy; narrow title is legible without clipping or overlap. No copy/typeface/weight/publication changes.

PR remains draft and unmerged. Hosted verification is recorded separately after preview deployment.
