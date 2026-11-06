# Methodology: citation naming and weekly source refresh

## Requested behavior

On `/methodology/#learn`, use **Citation latency** for the OpenAlex median-reference-age chart, matching Neuro Atlas. Keep **Latency compression** for the distinct discovery-to-deployment intervals. Preserve schema IDs and old chart links (`idea_vintage`, `#fv/<area>/idea_vintage/primary`).

Weekly validated data-only refreshes publish automatically. Changed-update summaries go to the websites channel, with a source revision and rollback path. Manually curated research charts, source definitions, field queries, sampling and statistical methods are not automatically edited.

## Coverage

- **Four OpenAlex citation charts:** full frozen year ranges and keyword definitions, 80 sampled works/year, at most 50 references/work, source sample seed 42, work-cluster bootstrap 500 iterations/seed 42. The current-year-minus-two reliability cutoff remains unchanged. A weekly pull can revise historical membership and reference years; it does not imply a new reliable observation year.
- **AI & Robotics forecast term structure:** reobserve the existing Bayes Market FTM source identities. Preserve all ten archived families/441 points and existing rounding. Only the existing AGI and full-economic-automation families are plotted by the loader. These are probability-over-future-horizon curves, not an observed acceleration trend.
- **Existing marker-market prices:** already use an hourly provider cache with the Methodology page revalidating every 60 seconds. No new weekly collector is needed for these reads.
- **Manual:** performance/reconstruction/recording/implant datasets, reviewed DHR stable-OpenSSL transitions, other translation evidence, patent gaps and static developer counts remain manually reviewed. No fabricated series, source substitution or new attribution claim.

## Safety and release

OpenAlex acquisition uses curl's native named-environment binding; Python never reads the key. The shared acquisition lock prevents overlapping Atlas/Methodology pulls. A numeric-only free-budget preflight, per-request cap, remaining-quota checks, bounded retries, and retained source receipts prevent accidental paid spill or untraceable recomputation. Quota exhaustion, invalid responses and partial acquisitions retain the existing chart data and dates.

Stage and validate all four OpenAlex files before installation. Replay acquired source receipts before publication. Timestamp-only changes are no-ops. The forecast snapshot is an independent source unit: failure retains its own last-good snapshot and must not suppress a successful OpenAlex update (and vice versa). Data-only commits/PRs stay separate from implementation changes, with automatic publication after checks rather than another human approval cycle. No force pushes.

Rollback uses the exact generated data commit attached to the Slack update. Revert only that update; pause the named source refresh if Lukas requests a stop. Do not undo unrelated site changes.

## Verification evidence

- Naming regression demonstrated RED with the old label and GREEN after the change.
- Real local production builds of untouched `main` and the candidate; four focus areas at 1440, 390 and 320 px, legacy URLs, native source-face flip, exact source table values/intervals/reliability and Escape dismissal.
- `browser-qa.json` records the replay. Screenshots here are **local production-build captures**, not canonical-site browser screenshots; the canonical domain is blocked in the organizational browser. The public page was read separately over HTTP.
- Full-suite baseline contains the pre-existing Diagnose-copy expectation failure. Report that separately from new tests, types/build, provider health and hosted deployment status.
- A real Bayes Market response returned 909 source nodes; the staged snapshot's 441 existing points matched their primary-source probabilities exactly. This acquisition is staged separately from the implementation PR.
