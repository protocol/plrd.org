# Lukas Bresser — team-page title and bio

## Scope

Use **Research Strategy & Programs Lead**, the title Lukas explicitly chose, and his two approved bio paragraphs verbatim. The shorter “Research Strategy & Operations” line in the pasted draft is superseded by his explicit title choice. Preserve his avatar, social links, education, slug, and team membership.

Runtime source: `2117557c396b839d980389dc52bd661d0822f752`, based on main `2554b46aeb286fcb6cea2b54f7025203fe7d81b0`.

## Checks

- Frozen pnpm 10 installation passed, without dependency or lockfile changes.
- Approved Markdown body matches both supplied paragraphs exactly.
- Generated authors and search index each change only Lukas's record; every other record remains identical to the base.
- TypeScript check passed.
- Production build passed (327 static pages). Existing upstream-data warnings reported an indexer GraphQL field, GainForest TLS hostname mismatch, and Ma Earth closed-round fallback; none concerns the author content pipeline.
- Full suite: 231 passed, 1 failed. The failing assertion at `scripts/velocity/impact-methodology-tabs.test.mjs:73` expects earlier Diagnose copy. The same failure was reproduced in a separate, unmodified checkout of base `2554b46`; it is outside this content change.

## Rendered evidence

Screenshots are from the local production build of the runtime source above, using the real `/authors/` and `/authors/lukas-bresser/` routes. They are local render checks, not evidence of a production publication.

- Profile at 1440px and 390px: title and both rendered paragraphs exactly match the approved copy.
- Team at 1440px and 390px: selected title renders; a native **Read more** click expands both supplied paragraphs, including the Project Leader addition.
- Mobile document/client/scroll widths are all 390px, with no horizontal overflow.
- `profile-desktop.png`, `profile-mobile.png`, `team-desktop.png`, `team-expanded-desktop.png`, and `team-mobile.png` record those states.
