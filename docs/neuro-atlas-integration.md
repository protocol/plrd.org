# Neuro Atlas zone: paired preview and launch

PLRD remains the site shell; [protocol/neuro-atlas](https://github.com/protocol/neuro-atlas) remains an independent application and contribution repository. Only `/neuro-atlas` and `/neuro-atlas/*` proxy to Atlas, retaining the prefix. PLRD root routes, `/_next`, `/api`, robots, and auth are not redirected. The Neurotech page has contextual HTML anchors (no Next prefetch across zones), not a main-menu entry.

## Configuration

- `NEURO_ATLAS_ORIGIN`: deployment **origin**, default `https://neuro-atlas-app.vercel.app`. HTTPS only, with optional trailing slash; no credentials, path, query, or fragment. Invalid values fail the build. Use a canonical URL spelling; values are not silently repaired. This is build-time routing configuration: rebuild when it changes.
- Atlas must be built with `NEXT_PUBLIC_BASE_PATH=/neuro-atlas` and its canonical-site configuration set for the intended home. The destination includes that prefix, including assets, fonts, raw files, sitemap, and nested routes. A standalone root build is not a compatible target.
- Local QA only: `NEURO_ATLAS_LOCAL_QA=1` permits `http://127.0.0.1:3491`, `http://localhost:3491`, or `http://[::1]:3491`, including production-mode `next build` / `next start`. Loopback requires this flag even for HTTPS. The exception is rejected whenever `VERCEL`, `VERCEL_ENV`, or `VERCEL_URL` is defined. Remote HTTP is always rejected. Never set the QA flag on a hosted deployment.

## Security and launch blockers

Atlas currently has its own HTTP Basic-auth gate. This change preserves Authorization and does **not** bypass, remove, or replace that gate. Public anonymous launch requires a separate explicit owner approval to remove or replace Basic auth in Atlas. Do not use credentials found in source. Vercel deployment protection can independently block paired previews: resolve access through an owner-approved deployment policy, never inject bypass tokens into the proxy.

The narrowly scoped middleware strips inbound `Cookie` headers before forwarding every Atlas request, including static assets. PLRD session and consent cookies are not needed upstream. It does not set PLRD consent cookies on Atlas requests. Verify this through the actual proxy with an upstream header probe, not just middleware unit tests.

**This is still a shared-origin frontend trust boundary, not a sandbox.** Atlas JavaScript can make same-origin requests to PLRD; responses may also set cookies. Cookie stripping is defense-in-depth only. Review contributor changes before production and do not share PLRD secrets or deployment write access with Atlas contributors. Public source is not a blanket license for underlying datasets. Preserve consent parity and configure any shared analytics separately and explicitly.

## Local verification

Use the repository's native pnpm 10 lockfile; do not switch package managers or regenerate it:

```sh
npx --yes pnpm@10.34.5 install --frozen-lockfile
npx --yes pnpm@10.34.5 test
npx --yes pnpm@10.34.5 exec tsc --noEmit
NEURO_ATLAS_ORIGIN=http://127.0.0.1:3491 NEURO_ATLAS_LOCAL_QA=1 \
  UV_THREADPOOL_SIZE=1 taskset -c 2,3 npx --yes pnpm@10.34.5 build
NEURO_ATLAS_ORIGIN=http://127.0.0.1:3491 NEURO_ATLAS_LOCAL_QA=1 \
  npx --yes pnpm@10.34.5 start --hostname 127.0.0.1 --port 3492
```

Run Atlas on port 3491 with the same `/neuro-atlas` build prefix. Any gate-free browser fixture must be isolated, loopback-only, and never deployed. Check root and deep Atlas URLs, reload/history, query/hash/filter state, modal interactions, return navigation, chunks/CSS/fonts/raw downloads, and auth challenge forwarding. Probe inbound Cookie removal and preserved Authorization on both pages and assets. Check PLRD home, Neurotech, E&G, existing assets, and auth routes for regressions. Inspect the Neurotech preview at 1440, 390, and 320 px and keyboard focus.

The preview uses `public/images/neuro-atlas-preview.png`: a genuine screenshot of the exact new Atlas interface supplied during paired QA, with its source revision and capture details recorded alongside the image. It is labeled “Static interface preview”, not a live dashboard; no dataset or synthetic chart is copied into PLRD. Missing image/provenance is a release blocker, not permission to fabricate it.

## Hosted sequence and rollback

1. Review both exact commits and approve the shared-origin trust model. Before deployment, authorize the Vercel GitHub integration for `protocol/neuro-atlas` and reconnect/verify its Git deployment linkage after the repository transfer. Confirm a new commit can produce a deployment; an existing live deployment alone does not prove this connection works. The deployment origin does not change just because the GitHub owner changes.
2. Deploy a prefixed Atlas preview first; confirm its exact SHA, gate/protection behavior, namespace, canonical metadata, sitemap, and analytics/consent settings. Default standalone builds remain unchanged until deliberately configured.
3. Build a PLRD preview using that exact Atlas preview origin. Verify both deployed SHAs and rerun the paired checks over HTTPS. Local success is not hosted proof.
4. Capture the real screenshot and provenance; include captioned commit-pinned screenshots in review. Do not publish a PR claiming production readiness before the paired hosted proof and the separate anonymous-access decision.
5. After approval, merge/configure Atlas deliberately, verify the prefixed production deployment, then merge/deploy PLRD with the approved origin. Never merge PLRD first against a root-only Atlas build.
6. Check `https://www.plrd.org/neuro-atlas/`, deep paths, and the standalone domain. Atlas owns its prefixed sitemap; contextual links provide discovery. This patch deliberately leaves the PLRD root sitemap/robots unchanged rather than duplicating Atlas route catalogs. No permanent old-origin redirects are introduced; consider them only after migration is verified.
7. Roll back PLRD to the prior verified deployment (or revert the integration and rebuild) to remove the links and rewrites. Revert Atlas build configuration/deployment separately if needed. Avoid irreversible redirects so standalone operation remains recoverable.
