# Team hiring link — compact layout verification

Runtime revision: `1b38994`. Following evidence-only commit leaves runtime unchanged.

## Requested correction

The generic hiring link should be subtle and sit closer to the team profiles, not read as a separate large section. Removed the stacked leadership-grid bottom margin and page padding; kept a small divider and a compact row. Heading is 20px, supporting copy 14px. Desktop link sits on the right; mobile stacks naturally. Job board URL remains https://os.pl.xyz/jobs.

## Checks

- Native layout regression RED on preceding revision: grid-to-heading gap 257px, heading 40px, section height 347px.
- GREEN at 1440/390/320px: gap 57px and heading 20px throughout; section 124.75px desktop and 199.5px mobile. Link is entirely inside client width and retains its 44px hit area.
- Full npm test and npx tsc --noEmit pass. No dependency changes.
- Native Advisors / Alumni / Leadership clicks preserve exactly one job-board link.
- Keyboard focus-visible still has a 2px outline.
- Actual local development screenshots: compact-1440.png, compact-390.png, compact-320.png. Not production or hosted-preview captures.
- Known preexisting document-level overflow at desktop-emulated 320px remains (320px scroll width versus 305px client width); hiring row stays in bounds. No physical-phone claim.
- This turn did not rerun the local production build (the previous attempt hit process exhaustion); hosted Vercel status is tracked separately.

## Fresh skeptical review

PASS for this scoped correction: inspected the exact component/spacing diff and actual desktop/mobile screenshots. Hiring text is subordinate to the profiles, aligns to the same left edge, and sits beneath the final row without the previous large empty band. Desktop CTA is horizontally balanced; mobile copy wraps legibly and link is unclipped. Heading, destination, tabs and keyboard access remain intact. No CMS/auth changes or production publication.

Replay: `QA_ORIGIN=http://127.0.0.1:<port> QA_OUT=<evidence-directory> BU_NAME=<thread> browser-harness < scripts/team-compact-browser.py`.
