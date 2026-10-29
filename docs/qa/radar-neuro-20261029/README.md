# Native Radar verification

Runtime source: `e2ad9d4719aa48516519b1913d01e1dbac89aab0`.
Local production build, real headed Chrome through browser-harness; not a production-deployment claim. Subsequent evidence-only commits do not change runtime source/assets.

- Frozen pnpm 10.34.9 install passed; package manifests/lockfiles unchanged.
- Focused Radar suite: **11/11 passed**.
- TypeScript `tsc --noEmit`: passed.
- Full suite: **219 passed / 1 failed / 220 total**. The sole failure is the existing stale Diagnose-copy assertion at `scripts/velocity/impact-methodology-tabs.test.mjs:73`; independently reproduced at base `1331af3`. No unrelated assertion was changed.
- Production build passed.
- Native replay at **1440, 390, and 320px**: all six cards in expected order; full titles/source descriptions and image loads; CTA and document bounds; next controls through the final slide; Hide/Show round trip.
- Native click on **Explore the comparison** opened the exact Google Trends source query in a new tab; test-created tab closed afterward.
- Signal card screenshots cover all four new cards at each viewport; `results.json` carries exact title/link/copy/geometry values and build identity. These are responsive pointer/viewport tests, not physical-device touch tests.
- Final screenshots were visually inspected, including the complete corrected clinical qualifier at 320px and the chart's unoccluded axes/legend at desktop. The chart remains a compact visual preview on phones; its CTA opens the full comparison.
- Independent critic initially found one P1 source-wording overstatement. F1 was corrected to the source's **may not reflect all participants or future outcomes**; independent final review passed F1 at the exact runtime revision. No newly introduced P0 found. Native replay above then reran at that same final revision.

Screenshots are WebP conversions of actual browser captures. No synthetic content, credentials, private deck link, or private source file is included.
