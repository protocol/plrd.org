# Canonical Team URL migration

## Requested change

Make `/team/` the actual Team index and permanently redirect the old `/authors` and `/authors/` index URLs to it. This replaces the initial, unmerged PR #207 direction; no reverse `/team` → `/authors/` redirect remains.

Only the listing page moves. Individual `/authors/<slug>/` profiles, their canonical URLs, public image paths and the existing `/authors/edit` admin route stay unchanged. The CMS record key remains `authors`, so existing content, edit permissions and edit history are retained.

## SEO treatment

- One-hop permanent HTTP 308 from either old index spelling to `/team/`, preserving query parameters, including repeated keys.
- `/team` and `/team/` return the page with HTTP 200; the explicit self-referencing canonical and Open Graph URL are `https://www.plrd.org/team/`.
- Header/footer navigation, homepage/About calls to action, profile/editor Team breadcrumbs, sitemap and generated search index link directly to `/team/`.
- Existing profile URLs remain in the sitemap/search index, avoiding an unnecessary migration of every individual profile.
- No new public-page `noindex` rule. Hosted previews retain Vercel's normal preview noindex.
- Keep the old index redirects indefinitely. Do not deploy the earlier reverse redirect alongside this migration.

Google states that 301 and other permanent redirects do not cause a loss in PageRank, but temporary search-ranking fluctuations can occur while URLs are recrawled and reindexed. This is not a guarantee of unchanged traffic. Source: [Google Search Central — Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=en).

## Verification

- Test-first RED → GREEN for the reversed redirect direction, canonical metadata and discovery links.
- Four focused Team tests passed in the standard `npm test` suite.
- Full suite: **246/247 passed**. The sole failure is the pre-existing Diagnose-copy assertion at `scripts/velocity/impact-methodology-tabs.test.mjs:73`, also reproduced on the unchanged base source. It is not modified by this PR.
- Production build and TypeScript passed, using the existing pnpm 10 frozen-lockfile dependency installation; dependencies/lockfiles unchanged.
- Real production-server HTTP replay (`scripts/verify-team-redirect.mjs`): **15 checks passed**, covering permanent redirects, case/slash variants, repeated queries, direct page responses, canonical/OG tags, public indexability, navigation, unchanged Juan profile, sitemap/search and near-prefix exclusions.
- All author data are byte-unchanged against `main`; the moved `AuthorsTabs.tsx` is byte-identical to its original.
- Headed browser: opening old `/authors/` lands on `/team/`; Leadership, Advisors and Alumni work; native Juan-card navigation retains `/authors/juan-benet/`; its native Team breadcrumb returns to `/team/`.
- Desktop 1440px and mobile 390px captures show the unchanged page layout. Mobile inner/client/scroll widths are all 390px.
- Fresh-skeptical review passed the exact migration scope, redirect-loop, discovery-consistency, CMS-identity and unchanged-content checks. No production merge is implied.

## Screenshots

`team-desktop.png` and `team-mobile.png` are actual local production-build captures of the new canonical route, not production-site captures.
