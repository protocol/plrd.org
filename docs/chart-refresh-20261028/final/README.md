# Final scoped verification — October 28, 2026

**Partial coverage: four Idea vintage charts refreshed; DHR latency corrected and
extended; three latency charts still missing.** Nothing merged or deployed.

Runtime/source-data revision: `942facff52da6602f54d2aa006023a0cde97357f`.
Code-only branch head: `06635e5` (four generated vintage CSVs excluded).
Before screenshots use untouched main `90c5e44463bbdaf3cac2e03227e0ed1cc013d2bb`.
All screenshots are local, not a hosted-release claim. This evidence-only commit
changes no runtime source, data, dependencies or build configuration.

## Review corrections

- **F1 fixed:** completed-only OpenSSL samples no longer export a field-direction
  claim or show a green Accelerating badge. The overview says selected completions;
  the visible plot explains annual medians by final-specification publication year,
  missing unfinished transitions, and month-normalized RFC dates. Numerical series
  and descriptive early/recent medians are unchanged.
- **F2 fixed:** all three reviewed unwired latency records say Evidence gap on both
  overview and modal, rather than Coming soon. Unreviewed placeholders are unchanged.
- **F3.a–c retained coverage blockers:** E&G needs comparable pilot/production
  endpoints and a cohort; AI needs a validated historical paper-level code proxy
  and loader; Neurotech needs comparable preclinical event dates and modality
  boundaries. No invented points, restored invalid plot, or silent metric substitution.

## Executed checks

- Production `npm run build`: exit 0 on this runtime revision.
- `npx tsc --noEmit`: exit 0.
- Targeted chart/latency JavaScript tests: 22/22 passed.
- Isolated OpenAlex failure/atomic-write Python tests: 7/7 passed.
- Full suite: 163/164 passed, with only the pre-existing Diagnose-copy assertion
  at `scripts/velocity/impact-methodology-tabs.test.mjs:73`. Untouched base was
  156/157 with the same failure. This is **not** an all-green full suite.
- Native browser: 24/24 cases, four areas × two chart groups × 1440/390/320 px,
  on the actual local production server. Exact table values, point counts,
  reliability, data sources, flips, URL selection, Escape/focus and bounds passed.
  Added visible-face assertions cover F1 and all three overview statuses for F2.
- Images at 320px now exist as well as numeric bound assertions. The DHR 320px
  image shows the full plot, year endpoints, caption, measured date and controls.
- Acquisition hashes and values remain identical to the audited 93-row OpenAlex
  refresh. Headline vintage readings still end at 2023; 2024–2026 are under-indexed.

The root and `openalex/` screenshots/receipts are earlier checkpoints. This folder
supersedes their DHR badge/overview-status evidence. The comparison deck contains
actual before/after captures of both requested groups for all four areas, with
native editable annotations and explicit missing-chart status.
