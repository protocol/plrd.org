# Team page hiring CTA — verification

Runtime revision: `469beac`. Later evidence commits do not change runtime/test source.

## Scope

Replaces the two specific role cards with a generic **Join our team** section and one **See open roles →** link to https://os.pl.xyz/jobs. Copy explicitly describes opportunities across the Protocol Labs network, matching the destination's scope. The section remains after the profiles and outside team-tab state. No CMS writes, authentication changes, dependencies, merge, or production deployment.

## Current checks

- Revised regression failed against the old cards (2 articles instead of 0), then passed. Full `npm test`: 118 passed, 0 failed.
- `npx tsc --noEmit`: passed.
- Production build compiled and typechecked, but twice failed during static generation with `spawn /usr/local/bin/node EAGAIN`; the retry also reported worker cleanup `EPERM`. Local production build is NOT claimed passed for this revision. Frozen pnpm install passed in the preceding iteration; no package/lock changes here.
- Actual local **development** route in headed Chrome at 1440, 390, and 320px: exactly one board link, no role cards; CTA entirely within client width and visible viewport.
- Native clicks on Advisors, Alumni, and Leadership preserve the single link.
- Native keyboard navigation back to CTA: focus-visible and 2px outline.
- Native click on CTA reaches https://os.pl.xyz/jobs with title Jobs | Protocol Labs Directory. The public PL Join page points to directory.plnetwork.io/jobs, whose 301 redirects to this exact destination. Destination displays the network-wide board.
- Known page-level 15px overflow remains at desktop-emulated 320px (305px client width, 320px scroll width); the new CTA ends at 138.55px and is not clipped. Not physical-phone testing.

## Fresh skeptical review

PASS for requested scoped change. Reviewed component and regression diff plus actual desktop/mobile screenshots: two role entries and their specific descriptions/URLs are removed; the one ordinary anchor retains keyboard focus and a 44px hit area; descriptive copy matches the board's network scope; no auth/CMS/route changes. Both images show readable complete section content with inherited generous profile/footer spacing. Local production-build limitation remains explicit above; hosted CI is reported separately in the PR.

## Evidence

`generic-1440.png`, `generic-390.png`, and `generic-320.png` are actual local development screenshots, NOT production or hosted-preview screenshots. `browser-checks.json` contains current measurements, tab checks and focus results. Earlier two-role screenshots were superseded.
