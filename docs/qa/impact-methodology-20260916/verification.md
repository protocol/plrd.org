# Impact methodology wording — September 16, 2026

Runtime revision: `e3654f8623658d62e89d703b9b6ec52bef9947a4`.

- Scope: the seven toolkit card subtitles and summaries on the existing unlisted Impact Preview. Screenshot wording preserved verbatim, including singular “tool,” capitalization, and absent final periods.
- Titles, IDs, examples, long descriptions, layout/classes, noindex/nofollow, and discovery exclusions unchanged.
- Frozen pnpm 10 install passed; 117 tests passed; TypeScript and production build passed.
- The two new copy/render tests failed on baseline, then passed with the update.
- Real local production route checked at 1440, 390, and 320px. All seven native card opens, exact intervention hashes, and Escape dismissals passed.
- Desktop/mobile screenshots are cropped headed-Chrome captures from the actual local production route, not production-deployment screenshots. All seven cards are visible; Culture wraps within its card at 320px.
- Independent bounded critic: PASS at runtime revision; no material findings. The floating feedback control can overlap lower viewport content, and page-wide horizontal overflow was observed outside the cards. These controls and layout are unchanged in this patch; no claim is made that this copy-only change fixes those behaviors.
- Exact supplied production URL was read by HTTP and confirmed to still show old copy and noindex/nofollow. Its custom domain is not allowed in the headed browser. This PR does not publish/promote the preview or alter public navigation.
