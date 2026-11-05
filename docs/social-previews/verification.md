# PLRD social link-preview images

Runtime revision: `e1e2ddec339f3282f753484ce8070c0b0d7a4a4a`.

## Change

Blog article metadata already selects each article's hero image. Talk/video metadata previously omitted Open Graph images and inherited the generic site title, description, and image on X.

Talk pages now explicitly publish their own title/description and the embedded YouTube video's `hqdefault.jpg` image in both Open Graph and X metadata. This standard rendition avoids relying on a max-resolution upload that may not exist; social crawlers cannot execute client-side image-error fallback handlers. Non-YouTube talks retain the standard site image. Canonicals, indexing rules, content, and page layout are unchanged.

## Verification

- Regression demonstrated RED on the baseline: the AUA talk had no Open Graph image. After the fix, all eight targeted talk/blog tests pass.
- TypeScript check and production build pass.
- Actual production-server HTTP checked all 83 talk routes: matching OG/X images, each talk's own title/description, and unchanged canonical. 78 use source-linked YouTube IDs; five use the site fallback. Next omits empty descriptions rather than emitting empty tags.
- Actual HTTP checked all 14 blog routes: their existing hero images match OG/X tags; canonical and unlisted noindex behavior are preserved.
- The AUA, Adam Marblestone, and Allison Duettmann thumbnails returned HTTP 200, image/jpeg. Remote image availability was sampled, not exhaustively verified for every historical video.
- Headed Chrome confirmed the actual served AUA metadata. The illustrative card render loaded the actual article hero and AUA thumbnail at desktop and 390px; no mobile horizontal overflow.
- Independent critic PASS on the exact runtime revision; no blocking findings.
- Full suite: **224 passed, one failed**. The unrelated `scripts/velocity/impact-methodology-tabs.test.mjs:73` assertion expects removed Diagnose copy. The same failure was replayed on the unchanged baseline `d1c606c`; it is not introduced by this change.
- Build completed with an unrelated existing GainForest API certificate warning; this patch does not change that data connector.

## Screenshot meaning

`desktop.png` and `mobile.png` are local illustrative card renders populated from the build's actual emitted Open Graph tags and publicly fetched source image bytes. They are **not** screenshots of Slack/X unfurls and do not prove a social platform's cached card has refreshed. Platforms can crop differently and continue to display old cached metadata after deployment.

The implementation is metadata-only: no in-site card redesign, production release, cache purge, or posting to a social platform is included.
