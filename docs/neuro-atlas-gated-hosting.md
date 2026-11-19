# Legacy Neuro Atlas redirects

PLRD's `/neuro-atlas` namespace now redirects to `https://www.plneuro.xyz/neuro-atlas`. This routing-only change adds no page, promotion, navigation, preview image, search entry, or sitemap entry. Public-integration PR #169 remains separate and must not be merged as part of the move.

## Routing contract

- Root, trailing-slash, deep-page and asset URLs return **307 Temporary Redirect**. Next matches the namespace case-insensitively; the destination prefix is canonical lowercase while descendant path casing is retained.
- Deep routes and query parameters are retained. Trailing slashes are normalized away on the destination, matching the Atlas mount. Redirects contain no fragment, so browsers inherit the original fragment; fragments are never sent to the server.
- The destination uses canonical `www.plneuro.xyz` directly, avoiding an extra apex-to-www hop. Near-prefix names such as `/neuro-atlas-other/` do not match.
- PLRD keeps `X-Robots-Tag: noindex, nofollow` on the legacy namespace. The destination must independently retain Atlas's nonindexable policy and existing password gate. A redirect does not authenticate the visitor; a browser may ask for the same password again on the new host.
- PLRD no longer proxies Atlas or forwards its request headers. The old Atlas-only cookie-isolation branch is replaced with the redirect; the case-insensitive asset matcher is retained. Ordinary PLRD consent behavior is unchanged. Redirects intentionally live in middleware, not `next.config`: Next 15's production config-redirect handler drops configured response headers, including noindex.
- `NEURO_ATLAS_ORIGIN` and `NEURO_ATLAS_LOCAL_QA` are obsolete in PLRD. Existing hosted values are ignored; this change does not alter hosted environment settings.

## Verification

```sh
npx --yes pnpm@10 install --frozen-lockfile
npm test
npx --yes pnpm@10 exec tsc --noEmit
npx --yes pnpm@10 run build
npx --yes pnpm@10 start --hostname 127.0.0.1 --port 3492
# In a separate shell:
node scripts/verify-neuro-atlas-redirects.mjs http://127.0.0.1:3492
```

The local production HTTP verifier never follows the external redirect and needs no production password. It checks mixed-case pages/assets, repeated query keys, encoded paths, bare/trailing-slash links, noindex, invalid auth, cookie-free responses, near-prefix boundaries and ordinary PLRD routes. These runtime checks matter: Next 15's experimental config-test helper does not faithfully handle case-insensitive regex matching or repeated query parameters.

## Cutover and rollback

Before an approved production cutover, independently verify the exact PL Neuro/Atlas revisions: the mounted HTML/assets and canonicals, unchanged password/content, bare prefix and deep-route authentication, invalid-password rejection, and noindex on pages/assets/auth challenges. In a browser, follow a legacy deep link with a query and fragment to the new mount. PLRD's local redirect tests do not prove the destination is deployed or password-protected.

Deploy the verified destination before enabling the PLRD redirect. Keep the redirects temporary initially. Record previous deployment IDs and configuration; to roll back, restore PLRD's previous deployment first and preserve the Atlas deployment/settings that its old proxy expects. Then recheck old root/deep links and the gate. Local validation is not authorization to push, deploy, promote aliases, change production environment or remove authentication.
