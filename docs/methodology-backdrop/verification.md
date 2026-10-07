# Methodology backdrop verification

Runtime and test revision: `610ee1ad0f217a8370603325dd85fb7c0f41f0eb`.

## Requested change

Field velocity should not have a different gray backdrop from the other methodology tabs. Merge and redeploy approved by Lukas in the September 29 follow-up.

- Diagnose and Learn now inherit the page background, like Intervene.
- The nested chart-gallery viewport also inherits the page background, via a local CSS-module rule. Shared focus-area galleries, cards, chart data, layout, links and publication boundaries are unchanged.
- Both `/interventions-preview-872d1767c376/methodology/` and the compatibility preview route share the implementation. Both remain unlisted/noindex.

## Evidence

- New unit regression failed before the outer-backdrop fix; then passed.
- Full suite initially caught the superseded cross-field/Neuro shared-gray contract. Revised only the overview expectation; the separate Neuro area still asserts `bg-gray-100`.
- Native browser regression then failed on the inner gallery at `rgb(248, 247, 243)`, before the scoped transparency fix. Final replay passes.
- Final runtime: **174/174 tests**, TypeScript, production build and clean diff check pass.
- Actual headed Chrome: all three tabs at 1440, 390, 320px in light and simulated dark CSS themes. The section and inner gallery backgrounds are transparent; effective page color matches body in all 18 cases. No document horizontal overflow.
- Native catalog CTA → methodology → tabs → parent breadcrumb at 1440, 768, 390, 320px; nested/legacy area and fragment compatibility; noindex/canonical checks pass.
- Independent bounded code critic: PASS at `610ee1a`, with no blocking findings. Final visual review confirms removal of both gray layers and retained card outlines.

`before-*.png`: hosted production alias `plrdorg.vercel.app`, source `23ba3f75d48fbb7e2e6408b38c73cc6933c8e878`.
`after-*.png`: local production build at `610ee1a`, `http://127.0.0.1:3291`, not hosted captures.
`browser-results.json` / `navigation-results.json`: exact native browser probe outputs.

The existing dark-mode tab-bar contrast and provider fallback/cache warnings are outside this background-only change; this does not certify provider data freshness or redesign global navigation.
