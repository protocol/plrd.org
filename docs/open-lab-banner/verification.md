# Open Lab homepage invitation

A small website-only follow-up to the old embedded prototype in PR #162. The existing approved invitation copy and placement (after the hero, before Focus Areas) are preserved. The destination is now exactly **https://open-lab-two.vercel.app/**, the standalone app's stable Vercel origin.

The link is a normal native anchor: same-tab navigation, keyboard Enter, browser modifiers/new-tab and no-JavaScript fallback work without an app integration. This change does not bring `/lab/` routes, OAuth, app dependencies, DNS or infrastructure into the website. The optional earlier circular departure animation is not included.

## Verification

Runtime source: `a88b10e54ecbf36b7e96f71fb482aaf329d75ae3` (including the final banner-label contrast correction).

- pnpm 10 frozen install passed. No package/lockfile changes.
- Full standard suite: **116 passed, 0 failed, 0 skipped**, including a new RED/GREEN homepage placement, exact destination and native-anchor test.
- TypeScript passed.
- Production build passed. Local verification temporarily capped Next's build worker count at 1; that operational cap was restored before commit and is not in the PR. Existing upstream data-cache/closed-round snapshot warnings occurred; this banner does not repair those independent sources.
- Actual production-built localhost page: one banner with exact destination, correct placement; 1440px light/dark and 390px checks and screenshots. The dark capture was taken after the existing theme transition settled.
- Native keyboard Enter from the banner reached `https://open-lab-two.vercel.app/lab/` in the headed browser. Direct HTTPS root also returned HTTP 200 after redirecting there; the real hosted sign-in form was visible. No account sign-in or public write was attempted.

- Independent candidate review found one blocker: the original 12px light-mode label had 3.54:1 contrast. Fixed using the existing banner-local `text-dark-blue` token while retaining `dark:text-blue`; RED/GREEN regression now checks actual palette tokens. Final fresh-skeptical review of that finding and recaptured production-browser screenshots passed: measured 6.38:1 light and 5.40:1 dark, readable mobile wrapping, no clipping or destination change. Full suite and build were repeated after the correction.

Screenshots in `screenshots/` are the actual locally served website at the runtime revision above, not hosted deploy-preview screenshots. No production website merge is authorized by this PR preparation.
