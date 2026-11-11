# Juan Benet bio update — November 11, 2026

## Scope

Replace Juan's biography with the supplied copy verbatim, retaining the two supplied hyperlink targets. Remove the personal-website social entry for `juan.benet.ai` as separately requested. Edit the Markdown author source and regenerate checked-in author HTML; leave the role, education, Twitter/X, GitHub, LinkedIn, avatar, roster ordering and every other author unchanged.

Current public routes are `/authors/` (Team) and `/authors/juan-benet/` (profile). The requested `/team` and `/team/` return 404 on the current site. No routing changes are included in this content-only PR.

## Verification

- Exact plain-text equality against the supplied paragraph: **PASS** in generated HTML, rendered profile, and the team card after native Read more activation.
- Exact profile link pairs: **PASS** — Protocol Labs → `https://protocol.ai/`; PLC Neurotech → `https://plcapital.xyz/neurotech`.
- Both supplied destinations respond with HTTP 200 after redirects. Preserve the supplied hrefs rather than substituting their redirect destinations.
- All other author records and author ordering: **unchanged**, confirmed against base `adc96c5dd1b5d7837c166fac415f5c40a1a9a21d`. The follow-up changes only Juan's personal-website social entry relative to `343d695132242a7667f8594d4bd66b32cfb03c46`; all remaining fields, including the supplied bio, are unchanged.
- Content generation and production build: **PASS**. The build retains unrelated indexer schema, GainForest certificate and Ma Earth snapshot warnings; no changes to those integrations are included.
- TypeScript (`npx tsc --noEmit`): **PASS**.
- Full suite on the initial bio revision (`343d695`): **243 passed / 244 tests**. The sole failure is the existing Diagnose-copy assertion at `scripts/velocity/impact-methodology-tabs.test.mjs:73`; the same failure was independently reproduced on the unchanged base commit (2 passed / 3 focused tests). After the website-link removal, production build, TypeScript and the focused Team test passed again (1/1).
- `git diff --check`: **PASS**.
- Headed-browser QA against the task-owned production build: desktop 1440px, mobile 390px; exact bio and links on the profile, native team-card Read more expansion. No horizontal overflow (desktop client/scroll widths 1425/1425; mobile 390/390).
- Fresh-skeptical review: **PASS** for this copy-only change. Source↔generated scope reconciliation, actual rendered text and screenshot inspection find no omissions, unrequested metadata changes, clipping or overlap. This does not independently fact-check the owner-supplied investment history.
- Website-link follow-up: **PASS**. The rendered profile contains no `juan.benet.ai` anchor; Person JSON-LD `sameAs` retains exactly Twitter/X, GitHub and LinkedIn. Fresh desktop/mobile profile captures show the removed icon and unchanged bio.

## Screenshots

The PNGs are screenshots of the local production build, not production-site or hosted-preview captures.

- `profile-desktop.png` — full profile biography and links at desktop width.
- `profile-mobile.png` — full profile biography and links at mobile width.
- `team-expanded-desktop.png` — full team-card biography after native Read more activation.

The existing team-card UI renders its expanded summary as plain text; the two hyperlinks remain active on the full profile. No shared card-renderer behavior is changed.

## Publication boundary

This PR is for review. It is not a merge or production deployment.
