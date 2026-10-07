# Impact Methodology v2 — visual cleanup

## Scope

This cleanup updates PR 171's existing unlisted preview only. It does not publish `/impact`, change the proposal's content, replace any field data, or merge the proposal.

- Diagnosis quote: the unlayered global `p + blockquote { margin-block-start: -0.5em }` defeated the Tailwind margin utility. The rendered gap was **−12px** at all seven tested widths. A local CSS Module restores **28px** before and after the callout without changing sitewide article typography.
- Operating model: five desktop columns were activating at 640px; “Compound” intruded into its cell padding. Below 1024px the steps now use compact, numbered rows instead of narrow columns or five 150px-high mobile cards.
- Step numbers and flow arrows: use the site's readable gray rather than its nearly white `gray-300` token. Desktop model dividers also have visible contrast.

## Verification

Actual headed Chrome against the production-built local route `/impact-preview-eb61fba1b98e/`:

- 1440, 1146, 1024, 768, 640, 390 and 320px viewport widths.
- Diagnosis gap, operating-model text containment, readable step numbers, retained noindex metadata.
- Native opening/closing of all six intervention accordions at each width; expanded paragraph width checks.
- Light-mode desktop/mobile screenshots and a dark-mode mobile diagnosis check.
- Inspected the live dashboard, inflection cards and hypercert cards. Their clipped paragraph ranges can appear to intersect following text in a raw DOM Range scan, but screenshots confirm the hidden lines are not painted; they were not treated as actual overlaps.

Repro:

```sh
BU_NAME=<task-thread> browser-harness <<'PY'
QA_ORIGIN='http://127.0.0.1:4171'
QA_OUT='/opt/data/tmp/impact-layout'
exec(open('scripts/qa/impact-methodology-layout.py').read())
PY
```

The same browser regression was run against the original hosted `f97764d` preview first and failed on the quote gap, low-contrast numbers and 640px label padding. The candidate passes these checks.

Fresh pnpm 10 frozen install, TypeScript and production build passed.

### Existing proposal test failures (not hidden)

`npm test` is **122 passed / 4 failed** both before and after this cleanup. Replayed the untouched original PR head `f97764d1ec48a2e9ac02a7e8807192205144a8a2` in a separate worktree to establish the baseline. The four failures still expect the pre-proposal methodology component, section locations or heading anchors:

1. `impact overview accepts validated area deep links and uses exactly the central loader records`
2. `main section headings expose real named anchors, with unique scroll targets`
3. `Neurotech field velocity uses the same theme-aware gray surface as the cross-field overview`
4. `the exact unlisted overview retains all fields, charts, methodology and noindex metadata`

Those assertions were not weakened or rewritten as part of a visual cleanup. The shared Node source loader now stubs CSS Module class names; computed CSS is checked in the real browser, not in Node.

## Screenshot provenance

`before-desktop-diagnosis.png` is the original hosted PR preview. All other committed screenshots are actual Chrome captures of the local production build of this cleanup, not mockups. Hosted preview verification is recorded in the PR after deployment. No signed-in account mutation or data fixture was needed.
