# Sideways chart previews

## Scope

This preview-only change adapts the horizontal chart-deck interaction from `protocol/plneuro.xyz#23` (reference head `2a066e3ce7e577a6063e5617f24cb29b51c1e3eb`) to PLRD's existing chart system.

- Multi-view groups slide sibling previews sideways from beneath the cover rather than opening an overlay over their neighbors.
- The selected group expands within a horizontal viewport, physically displacing and dimming neighboring groups and separating them with a divider.
- Mobile uses tap-to-spread and local horizontal scrolling with the next card visible. Single-view cards open their chart directly; evidence-only cards retain their existing explanation.
- PLRD's visual language, selected-field data, two-face chart/source cards and shareable chart URLs remain its own. This is not a port of PL Neuro's methodology or navigation changes.

## Publication boundary

The base includes merged hide PR #154. All four public focus-area detail pages remain without field-velocity mounts or links to the cryptic preview. `/impact-preview-eb61fba1b98e/` remains noindex and absent from site navigation, sitemap, search and RSS. No `/impact/` route is promoted. Draft restoration PR #155 remains a separate launch decision.

## Verification record

The full interaction matrix passed at application revision `083b694c028854404fa1415736a41658702d1da3`: 83 Node tests, typecheck, production build, and 88 headed-browser cases across all four focus areas at 1440/390/320px. The browser checked real intermediate slide positions, peer displacement, every chart/evidence destination, both data/chart faces, touch swipes, local-scroll geometry and reduced motion.

A subsequent focused fix at `e19063a415b1623d82d71d13f0898b167f8e4e40` keeps the restored cover visible inside the local viewport after closing a horizontally scrolled spread. A failing-first test reproduced the offscreen-focus case; all 84 Node tests and typecheck passed after the fix. This does not change colors, dimensions, data, routes or chart URLs. The PR description records the final build, independent review and browser replays.

Repeatable local checks: `npx --yes pnpm@10 install --frozen-lockfile`, `npx --yes pnpm@10 test`, `npx --yes pnpm@10 exec tsc --noEmit`, `npx --yes pnpm@10 build`. Node/DOM tests are not evidence of real visual motion; the parent browser matrix supplies that evidence.

Known baseline: the existing full-width page band contributes 8px of document width beyond the client area at 1440/390px; the site's 320px minimum width contributes 15px at a 320px viewport with native scrollbars. The port must not increase these existing deltas. It must not use document scrolling as its mobile gallery interaction.

Before screenshots are local production captures at `c4628b3dfd337dd4afd2ff07b1176efa8ac5986e`, whose entire `src` tree was verified identical to the post-#154 base `e1923a6e693eb3b45fcbaaa0efea196d279ca577`. After screenshots are local production captures at `083b694c028854404fa1415736a41658702d1da3`, before the focus-restoration-only fix. Neither is a claim that this change was merged to production.

- `screenshots/sideways/before-overlay-desktop.png` and `before-overlay-mobile.png`: previous overlay fan.
- `screenshots/sideways/after-slide-desktop.png` and `after-slide-mobile.png`: sideways performance previews and local-scroll behavior.
- `screenshots/sideways/after-markets-desktop.png`: all four real AI Markets views, independently selectable.
- `screenshots/sideways/after-chart-320.png`: selected recording-hours chart at 320px.

No native screen-reader or physical touch-device test is claimed. Mobile touch gestures were exercised through CDP in the existing headed Chrome.
