# Team page openings — verification

Runtime revision: `3bbdae3` (subsequent changes in this PR are evidence only).

## Scope

Adds a static, curated hiring section after the existing team profiles on `/authors/`, outside the Leadership / Advisors / Alumni tab state. No CMS writes, authentication changes, new dependencies, or production deployment. The Directory listings remain the application source of truth; this is not a synchronized job feed.

## Checks

- `npx --yes pnpm@10 install --frozen-lockfile`: passed.
- Regression first failed on baseline because the hiring section was absent, then passed with the implementation.
- `npm test`: 118 passed, 0 failed.
- `npx tsc --noEmit`: passed.
- `UV_THREADPOOL_SIZE=1 NEXT_TELEMETRY_DISABLED=1 taskset -c 0,1 npm run build`: passed. Existing tooling deprecation warnings and a Ma Earth closed-round fallback message were emitted; they are unrelated to this section.
- Actual production build served at loopback `/authors/`; headed Chrome checks at 1440, 390, and 320px. Cards align in two columns on desktop and stack on mobile. New card contents stay within the available width. The 320px desktop-emulated viewport reports a 305px client width and 320px document scroll width (15px horizontal overflow); both new cards end at 296px, inside the client width. The page-level overflow is not diagnosed or changed by this scoped PR.
- Native clicks on Advisors, Alumni, and Leadership preserve both hiring cards.
- Native Tab reaches the second role CTA with a role-specific accessible name and visible 2px outline.
- Both exact supplied Directory URLs, including query parameters, resolve to the intended role pages.
- Native theme toggle verified light/dark rendering. No auth or application submission performed.
- Independent source-review critic: PASS. Parent inspected actual screenshots and ran native checks separately.

## Editorial note

The Neuro listing headline is **Program Manager, Neurotech**, while its body uses **PL Neuro Operations Lead**. The card deliberately follows the listing headline; this PR does not alter the external listing.

## Evidence

All screenshots are local production-build captures, not a hosted Vercel or live production verification. `browser-checks.json` records dimensions, exact hrefs, tab state, and keyboard focus. Mobile captures show the first and second card separately so both remain legible.
