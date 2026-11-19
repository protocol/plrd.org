# Neuro Atlas launch links — November 19, 2026

## Scope and architecture

This refreshes existing PR #169, retaining its compact Neurotech linked preview and small hero action. Both are ordinary same-tab anchors to **https://www.plneuro.xyz/neuro-atlas**. The PL Neuro Website action and Opportunity Spaces remain intact; there is no new homepage or main-menu entry.

Merged main `b4bc35177deec394042f079b21320ccf1fd1125d` into the existing branch without rewriting its history. All current-main work is retained. `.env.example`, `next.config.ts`, `src/middleware.ts`, existing redirect tests, package scripts and both lockfiles are identical to that main revision. The old PLRD-host proxy additions and obsolete paired-cutover docs/screenshots no longer appear in the PR diff. Main's existing PLRD → PL Neuro temporary redirects remain in place.

## Static preview provenance

`public/images/neuro-atlas-preview.png` is a real 1200×900 headed-Chrome capture made November 19, 2026, not a mockup, chart reconstruction or live embed. It replaces the old purple interface, obsolete menu ordering and contribution actions.

Capture origin: `https://plneuro-3j4pxf3h6-protocol.vercel.app/neuro-atlas`, the production deployment currently assigned to `www.plneuro.xyz`. Read-only Vercel lookup confirmed deployment `dpl_9DkJ5KzsAM5GXG3YLrywK1WAtVTh`, project `prj_tEPplATADTZC9R4FJbtqJsW4lCAm`, PL Neuro mount-repository SHA `132d96694b4f6b57dc6eff38611196f4842ff9a6`. This identifies the mount deployment, not the separately maintained upstream Neuro Atlas application's source SHA. The card labels the image “Static interface preview.”

## Native verification

Node **24.22.3**, matching Vercel's configured Node 24 family; pnpm **10.34.9**; Next **15.5.28**.

- Frozen `pnpm install --frozen-lockfile`: passed; lockfiles unchanged. pnpm reported its existing ignored `core-js`/`sharp` lifecycle-script warning; no policy change was made.
- Canonical hero regression: observed RED with the old relative destination, then GREEN after changing it.
- Compact-preview regression: observed RED when absent from the main-based route, then GREEN after restoration with its canonical destination.
- Full `pnpm test`: **256 passed / 1 failed / 257 total**. The only failure is the existing Diagnose-copy assertion in `scripts/velocity/impact-methodology-tabs.test.mjs:73` (test declared at line 44). An isolated exact-main replay produced **254 passed / the same 1 failed / 255 total**. No new full-suite failures; the two additional UI tests pass. This is not an all-green-suite claim.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm build`: passed, native production build, with `NEXT_TELEMETRY_DISABLED=1 UV_THREADPOOL_SIZE=1 taskset -c 8,9`.
- Existing `scripts/verify-neuro-atlas-redirects.mjs` against the production-mode loopback server: **24/24 passed**, including root/deep/mixed-case/query/assets, near-prefix exclusions and ordinary PLRD pages.
- `git diff --check`: passed.

## Browser evidence

The six `local-*.png` files are real headed-Chrome captures of the production-mode build at source revision **`acf267f29e448509347f5f87dae479ae96806f93`**, loopback `http://127.0.0.1:38469/areas/neurotech/`. Later evidence-only commits do not change runtime source/assets. `browser-results.json` records geometry and assertions.

- Desktop 1440×1000; mobile emulation 390×844 and 320×812. Both hero and scrolled preview captured at every size. Mobile requested/inner/client/scroll widths agree; desktop client width is reduced by its normal 15px scrollbar, with no content overflow. Heading text and card remain in bounds; preview image is loaded.
- Exactly two visible Neuro Atlas links, both canonical same-tab anchors; retained Website/strategy links; no Atlas header-menu item or iframe/canvas embed.
- Native preview pointer activation and native Enter activation on the hero both **landed at `https://www.plneuro.xyz/neuro-atlas`**, with title “Neuro Atlas.”
- Native Tab/Shift+Tab verified the preview receives visible keyboard focus with a solid outline.
- `deployed-main-before-1440.png` is the pre-change main branch deployment's hero; it has no Neuro Atlas action. The production vanity PLRD host was browser-allowlist blocked, so this before image is explicitly from `https://plrdorg-git-main-protocol.vercel.app/areas/neurotech/`, not claimed as a direct vanity-domain browser capture. A public HTTP read independently confirmed the same live content.

No merge, production deployment, auth change or hosting-setting mutation is authorized or performed. The branch push creates only its normal PR preview; hosted exact-head status is recorded in the PR description.
