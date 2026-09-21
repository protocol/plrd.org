# Gated Neuro Atlas hosting

This routing-only change reserves `/neuro-atlas` and its descendants for the separate Atlas deployment. It adds no page, promotion, navigation, preview image, search entry, or sitemap entry. Keep public-integration PR #169 open and unmerged; its UI work is not part of this change.

## Configuration

- PLRD: set `NEURO_ATLAS_ORIGIN` to the exact verified Atlas deployment's HTTPS origin (no credentials, path, query, or fragment). The default is `https://neuro-atlas-app.vercel.app`; it is **not evidence that that deployment is prefix-ready**. Rewrites are resolved at build time: rebuild PLRD after changing this value.
- Atlas: build with `NEXT_PUBLIC_BASE_PATH=/neuro-atlas`, `ATLAS_SITE_URL=https://www.plrd.org`, and `ATLAS_INDEXABLE=false` at build and runtime. PR #48 supplies prefix support, but **also require the bare-base-path auth fix** (`fix/gated-subpath-root`): its explicit `/` proxy matcher protects `/neuro-atlas`, which the prior catch-all misses. Do not cut over using PR #48 alone.
- Retain Atlas's existing Basic password gate. PLRD strips all inbound cookies from the scoped namespace, including static assets and case variants, while preserving `Authorization`. Other PLRD routes retain existing consent behavior.
- Require Atlas PR49's originating `X-Robots-Tag: noindex, nofollow` on pages/assets and auth challenges when configured nonindexable. PLRD also declares scoped headers as defense in depth, but Next external rewrites can discard locally added headers: verify the actual upstream-proxied response, not just middleware unit output. This is indexing policy, not authentication.
- For isolated loopback QA only, set `NEURO_ATLAS_LOCAL_QA=1` and a loopback `NEURO_ATLAS_ORIGIN`. This opt-in is rejected when any of `VERCEL`, `VERCEL_ENV`, or `VERCEL_URL` is present. Never deploy it.

## Verification and production cutover gate

Run `npx --yes pnpm@10 install --frozen-lockfile`, `npm test`, `npx --yes pnpm@10 exec tsc --noEmit`, and `npx --yes pnpm@10 run build`. The normal test command includes routing, cookie isolation, Basic-header preservation and noindex regression tests.

Before production cutover, independently review the exact routing SHA and verify a paired Atlas/PLRD preview: prefixed HTML/assets and canonicals, 401 challenge and invalid-password rejection, noindex on page/asset/401, cookie stripping, preserved Authorization, and unaffected PLRD pages. Use only synthetic local credentials for successful-login fixtures; local success is not hosted-password verification.

**Remaining deployment gate:** explicitly approve production cutover after the prefix-configured Atlas deployment is verified, then build/deploy PLRD against that exact origin. Do not change project-wide production environment, promote deployments, remove the password, or merge PR #169 as part of preview validation. Plan legacy root-link handling separately; do not add permanent redirects without approval.

Run Atlas's `scripts/verify-auth-gate.mjs <origin> /neuro-atlas` against both exact preview origins; the bare prefix, trailing slash, deep pages and sitemap must finish at 401 without credentials and with invalid credentials. Do not treat a deep-page-only challenge as full gate coverage.

**Rollback:** record previous production deployment IDs and build settings before cutover. Restore PLRD's previous deployment/config first to remove the new route, then restore Atlas's prior standalone deployment/settings if those were changed. Preserve its password gate and recheck both domains and old deep links. Preview validation never changes production aliases.
