# September 10: overview layout and chart stacks

Application revision: `5c954f5b8d3556b4d6b7eb3a881acdcfd57a9ea8`. Follow-up to PR #153, retaining its equal fan-card widths. The screenshot commit changes documentation/assets only.

## Changes

- Cross-field focus-area tabs sit above the content rather than reserving a left column. The overview uses the same 72rem outer / 69rem inner content width as the rest of the page, instead of the previous 96rem maximum. Tabs wrap on narrow screens.
- Multi-view covers show offset back sheets at rest, alongside accurate chart/view counts. A scalar historical reading still counts as a view, not a fabricated chart.
- One shared owner controls the open fan. Hover, focus, and tap replace the previous fan, including pinned previews. If a replaced fan held keyboard focus, focus returns to its cover before paint without reopening it or scrolling the page.
- Neurotech's Field velocity section now uses the overview's gray-100 (#F8F7F3), not the light-blue gray-200 token. Its otherwise empty fourth opportunity quadrant is white and noninteractive; no blank mobile card is introduced.
- The full stocks-versus-velocity paragraph is omitted from the cross-field UI; shared API methodology and source data remain intact.
- The repeated general Definition & methodology footer is removed from chart popouts. Per-chart data, definitions, sources, dates, and coverage remain.
- The latency animal-model qualifier appears in Data & sources, no longer in the preview or chart title. The provider metric/source string is unchanged.

## Verified on the application revision

- 73 tests passed; TypeScript and production build passed, using a pnpm10 frozen install. No package/lockfile changes.
- The exact two-open-stack reproduction failed before the ownership fix. A separate old-focus-in-inert-fan reproduction failed before the focus fix; both now pass.
- Independent isolated code critic: final PASS. Parent reproduced and fixed its one focus-recovery finding before delivery.
- Headed Chrome: 63 chart/evidence selections across all four overview areas plus Neuro detail, including pointer traversal, exact selected-chart URLs, isolated modals, Escape and stable page position at desktop / 390 / 320px.
- Headed Chrome: 12 fan geometry cases at 1440 / 768 / 390 / 320px preserve equal preview widths across one/two/three-view fans. Desktop cards remain 265px inside 306 / 583 / 860px frames.
- 21 fresh URLs with native clipboard readback, plus Back/Forward, focus-open and while-open geometry at desktop / 390 / 320px.
- Dedicated 1440 / 390 / 320px acceptance checks: top tabs, bounded width, visible displaced stack sheets, only one fan for mouse/focus/touch, matching computed gray, white desktop quadrant hidden on mobile, latency qualifier on data face only, repeated footer absent.
- Actual intermediate fan and two-way 3D flip transforms; reduced motion; CDP native touch input. No physical-device or screen-reader certification claimed.

## Scope / known unchanged behavior

No provider schema, observation, corpus, source API or other application changed. The overview remains unlisted/noindex, not newly published. This PR is unmerged.

The existing cross-field Hypercerts strip has an approximately 8px native-scrollbar overhang; this revision does not introduce or fix it. Long data faces retain their intentional internal scroll. Local captures are evidence of the proposed UI, not production deployment.
