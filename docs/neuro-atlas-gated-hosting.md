# Gated Neuro Atlas hosting

This routing-only change reserves `/neuro-atlas` and its descendants for the separate Atlas deployment. It adds no page, promotion, navigation, preview image, search entry, or sitemap entry. Keep public-integration PR #169 open and unmerged; its UI work is not part of this change.

## Configuration

- PLRD: set `NEURO_ATLAS_ORIGIN` to the exact verified Atlas deployment's HTTPS origin (no credentials, path, query, or fragment). The default is `https://neuro-atlas-app.vercel.app`; it is **not evidence that that deployment is prefix-ready**. Rewrites are resolved at build time: rebuild PLRD after changing this value.
- Atlas: build with `NEXT_PUBLIC_BASE_PATH=/neuro-atlas`, `ATLAS_SITE_URL=https://www.plrd.org`, and `ATLAS_INDEXABLE=false`. Prefix support is in Atlas commit `2e237def40f3bdf27d9be48a5175f1967abaa889` (PR #48).
- Retain Atlas's existing Basic password gate. PLRD strips all inbound cookies from the scoped namespace, including static assets and case variants, while preserving `Authorization`. Other PLRD routes retain existing consent behavior.
- Scoped responses receive `X-Robots-Tag: noindex, nofollow`, independently of credentials, so pages, assets and upstream authentication challenges remain unlisted. This is indexing policy, not authentication.
- For isolated loopback QA only, set `NEURO_ATLAS_LOCAL_QA=1` and a loopback `NEURO_ATLAS_ORIGIN`. This opt-in is rejected when any of `VERCEL`, `VERCEL_ENV`, or `VERCEL_URL` is present. Never deploy it.

## Verification and production cutover gate

Run `npx --yes pnpm@10 install --frozen-lockfile`, `npm test`, `npx --yes pnpm@10 exec tsc --noEmit`, and `npx --yes pnpm@10 run build`. The normal test command includes routing, cookie isolation, Basic-header preservation and noindex regression tests.

Before production cutover, independently review the exact routing SHA and verify a paired Atlas/PLRD preview: prefixed HTML/assets and canonicals, 401 challenge and invalid-password rejection, noindex on page/asset/401, cookie stripping, preserved Authorization, and unaffected PLRD pages. Use only synthetic local credentials for successful-login fixtures; local success is not hosted-password verification.

**Remaining deployment gate:** explicitly approve production cutover after the prefix-configured Atlas deployment is verified, then build/deploy PLRD against that exact origin. Do not change project-wide production environment, promote deployments, remove the password, or merge PR #169 as part of preview validation. Plan legacy root-link handling separately; do not add permanent redirects without approval.
