# October 28, 2026 chart refresh — latency corrections

Latest combined replay and review corrections: [final verification](final/README.md).
The earlier test counts and screenshots below are retained as historical checkpoints.

## Scope and status

This is the latency/data-integrity part of the request to refresh Idea vintage
and Latency compression for all four focus areas on `/methodology/#learn`.
The four OpenAlex CSVs are intentionally handled in a separate data PR, per
`scripts/velocity/UPDATING.md`. Nothing here merges or deploys production.

| Focus area | Latency result | Numeric chart delivered by this change |
|---|---|---|
| Digital Human Rights | 22 source-paired specification → stable OpenSSL transitions, including two 2026 completions | 13 annual median points, in years |
| Economies & Governance | Completed DPI transitions exist; comparable pilot/production cohort still absent | None; explicit sourced gap |
| AI & Robotics | July 2025 archive and prototype generator cannot support the claimed working-code trend without further validation | None; explicit sourced gap |
| Neurotech | Corrected historical evidence; old publication/event mixture and modality boundaries invalidate the prior plot | None; prior four-point plot withheld |

An evidence-gap correction is **not** a newly completed chart. No replacement
latency definition has been silently adopted. Patent-vintage placeholders are
unchanged: no PatentsView cohort/ingestion was added.

## Data changes

- DHR retains the fixed OpenSSL endpoint, adds omitted completed transitions,
  and corrects SHA-3's final NIST date from August 5 to August 4, 2015.
  [ECH](https://raw.githubusercontent.com/openssl/openssl/openssl-4.0.0/NEWS.md)
  and [DTLS 1.3](https://raw.githubusercontent.com/openssl/openssl/openssl-4.1.0/NEWS.md)
  have verified stable releases in 2026. The median is 1.75 years; early/recent
  medians are 2.32/0.65 years under the unchanged split/band. Those describe the
  selected completed sample—not first implementation anywhere or causal field
  acceleration. Month-normalized RFC dates retain explicit precision caveats.
- Neurotech preserves four corrected evidence records and source links,
  distinguishing publication/disclosure dates from implant events. The
  [1996 first implant](https://pmc.ncbi.nlm.nih.gov/articles/PMC2574508/)
  is not a 1998 publication. The loader's explicit evidence hold prevents old
  parseable dates from restoring a misleading trend.
- AI and E&G retain their candidate definitions but replace inaccurate blockers.
  The [source-contract README](../../src/data/velocity/latency/README.md) owns the
  evidence and methodological limitations.
- Latency values and table headers now explicitly use years; DHR's short title
  keeps the full definition on its data face. Reviewed gaps show dates and links,
  not fabricated zero values or a promise that a chart is coming soon.
- OpenAlex request failures no longer log URL-bearing exceptions or credentials.
  Daily quota errors stop promptly; transient waits are bounded; output replacement
  is atomic. Sampling, bootstrap, frozen keyword queries and reliability math
  are unchanged. Offline tests use visibly synthetic fixtures, never published data.

## Verification and limits

Base: `90c5e44463bbdaf3cac2e03227e0ed1cc013d2bb` (main, verified October 28).

- TypeScript check passed.
- Seven isolated OpenAlex failure/atomic-write tests passed.
- Targeted latency and chart-selection tests passed.
- Full suite: 161/162 passed. The same pre-existing Diagnose-copy assertion fails
  on untouched main (156/157 there). It expects a question removed by a prior
  methodology change; this refresh does not restore that copy.
- Untouched-main full build compiles/typechecks, then fails prerendering
  `/areas/economies-governance/` after retries. Its logs include external fetch
  failures and oversized cache entries. This is not a successful full build.
- Local native-browser QA exercises all four areas × two groups × three widths
  (1440/390/320): actual chart counts, plot presence, exact data-table values,
  units, source/evidence state, stable chart hashes, flips, Escape/focus and
  document/modal bounds. Gap counts are kept separate from numeric charts.
- Production browser navigation was blocked by the managed browser's domain
  policy. Public API snapshots were readable, and UI verification is explicitly
  local, not a claim that the change is live on plrd.org.

Screenshots in `screenshots/` are unaltered local browser captures. The JSON
browser receipt records per-case output counts and viewport bounds.
