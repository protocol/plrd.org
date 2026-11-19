# Sovereign AI program at `/sov-ai`

The existing Sovereign AI program website is now maintained in this repository at `public/sov-ai/`. It is a self-contained static document, not an iframe or a proxy to the earlier Vercel project. The independent design and native JavaScript/no-JavaScript interactions are preserved.

## Entry points and discovery

- Canonical: `https://www.plrd.org/sov-ai` (the apex domain uses PLRD's existing canonical-domain redirect).
- `/sov-ai/` also serves the same document. The funder route is `/sov-ai#for-funders`; governments use `/sov-ai#for-governments`.
- There is no new main-site menu, footer, search-index or sitemap entry. Existing published Sovereign AI briefs and their URLs remain unchanged.
- The page and its resources retain the original `noindex, nofollow, noarchive` policy and namespace-scoped security headers. Unlisted is not access control; the page is publicly accessible.
- `next.config.ts` rewrites only the two entry spellings to `/sov-ai/index.html`. Asset and PDF references have explicit `/sov-ai/` prefixes, so neither entry depends on trailing-slash resolution. The original standalone project is not a runtime dependency and is not deleted or reconfigured by this change.

## Source and editing

`import-manifest.json` records the original revision and source/mounted hashes for the explicit 18-file import. Only the previously shipped files were imported; no private project documents, configuration, tests or credentials are served. All CSS, JavaScript, artwork, full-page PDF previews and five original PDFs are byte-identical to that revision. The HTML changes are the mount paths, approved introductory copy, canonical/social metadata and removal of draft-only labels.

Edit `public/sov-ai/index.html`, `styles.css` and `app.js` directly. Update the manifest's mounted hashes when intentionally changing them; upstream hashes remain historical provenance. PDF changes require the original source and regenerated full-page previews, not replacement artwork. The PDF ignore exception is scoped to `public/sov-ai/briefs/*.pdf`.

## Checks

- `npm test` includes `scripts/sov-ai-*.test.mjs` and the inherited native-enhancement DOM regressions.
- `npx tsc --noEmit` and `npm run build` check the actual Next application.
- Use the repository's pnpm 10 frozen install for deployment parity.
- Check actual HTTP for both entry spellings, every imported file/hash, noindex/CSP headers and private-file 404s. Native desktop/mobile QA should exercise menu, audience deep links/history, research expanders, no-JS mode and all five PDF links. Verify the live main site's navigation remains unchanged.
