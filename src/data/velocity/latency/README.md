# Latency compression: source contracts and evidence status

Reviewed October 28, 2026. The chart surface is `/methodology/#learn`; the shared
read-only API exports the same records. An evidence gap is not a zero-lag value
or a completed chart. Publication, disclosure and actual event dates are distinct.

## Digital Human Rights — final specification → stable OpenSSL release

The [curated corpus](../corpora/dhr-latency-crypto.json) contains 22 selected
completed transitions, including [ECH in OpenSSL 4.0.0 (April 14, 2026)](https://raw.githubusercontent.com/openssl/openssl/openssl-4.0.0/NEWS.md)
and [DTLS 1.3 in OpenSSL 4.1.0 (October 23, 2026)](https://raw.githubusercontent.com/openssl/openssl/openssl-4.1.0/NEWS.md).
Every row names the final RFC or NIST FIPS and release-pinned feature evidence.

The build-time loader `src/lib/velocity-latency.ts` reports **years**, dividing
elapsed days by 365.25, then taking a median per specification-publication year.
Its existing early/recent comparison uses 2017 and a ±0.5-year band. This is a
selected-library adoption proxy, not first implementation anywhere or a census
of field velocity. The selected completed-transition corpus omits unfinished
transitions and is not random; shared specifications/releases are not independent.
Historical additions can move medians without a real change in the field.

RFC headers supply month precision. The retained month-start encoding can
 overstate lags by up to 30 days, especially material for very short lags; it is
explicit in every row and in visible evidence copy. NIST and release dates use
verified day precision. `checkedAt` is the evidence review, while `measuredAt`
is the latest actual stable-release endpoint. Never advance one by changing the other.

## Neurotech — evidence corrected; plot withheld

The [four retained evidence records](../corpora/neuro-latency-modalities.json)
are **not approved for plotting**. The prior series mixed selected preclinical
publications/disclosures with human implantation events and inconsistent
modality boundaries. In particular, [Kennedy's Table I](https://pmc.ncbi.nlm.nih.gov/articles/PMC2574508/)
dates the first patient's implant to December 4, 1996—not the June 1998 publication.
The selected monkey paper is July 1992, and [Oxley's preclinical paper](https://www.nature.com/articles/nbt.3428)
was published February 8, 2016; neither publication establishes the animal experiment day.

The JSON preserves corrected date precision, date basis, both endpoint sources,
and the unresolved first-milestone/taxonomy questions. `meta.approvedForPlot=false`
forces the loader to withhold a numeric payload, even if parseable legacy dates
reappear. The interface and API show the evidence gap with no series, observation
date or acceleration claim. A source review is not a new implant observation.

A selected-public-disclosure → first-human-implant proxy could be proposed
separately, with a fixed checkpoint rule and interval-aware dates. It has **not**
been substituted for the existing animal-demonstration metric. ECoG and a new
company are not automatically two additional comparable modalities.

## AI & Robotics — not merely awaiting a generator run

The [Papers With Code link archive](https://huggingface.co/datasets/pwc-archive/links-between-paper-and-code)
is frozen at its July 28, 2025 snapshot. A new repository revision or a 2026
query does not create 2026 coverage. It supplies links, not code-release dates,
working-implementation verification, weights availability or arXiv categories.

`scripts/velocity/latency_pwc.py` is an **unvalidated prototype**, not a production
refresh path. Its category option is not enforced, its median is repository-pair
weighted, negative lags are discarded, and one retained observation can yield a
median. It accepts JSON/gzipped JSON while the current archive is Parquet.
Writing its proposed CSV alone does not wire a chart: no AI CSV loader exists.
A root commit can contain only setup files and cannot establish first public
release or working code. Do not label this as open-weights implementation.

Before a series is adopted: define the paper-level reducer and signed-lag
policy, validate code/publication endpoints and cohort categories, pin archive
revision/hash and eligibility denominators, and implement a matching day-unit
loader with uncertainty and observation cutoffs. No diagnostic sample is a
field-level trend. The current reading stays `unwired`.

## Economies & Governance — comparable cohort missing, not completed cases

[UPI](https://ies.gov.in/arthapedia/concept/unified-payments-interface-upi) has
official pilot/public-operation dates, and [Sand Dollar](https://www.sanddollar.bs/history)
explicitly documents pilot-to-production. [Pix's central-bank report](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Pix-Management-Report/pix_management_report_2023.pdf)
distinguishes a restricted-live rollout from full operation.

Those are not interchangeable stage boundaries. A reviewed population,
consistent pilot/production definitions and incomplete-transition handling are
needed before a comparative trend. Do not replace year/month-only evidence with
invented January 1 dates, equate an announcement with completion, or call a
historical selected-case display a current field acceleration series. The
candidate remains pilot-to-production lag for digital public infrastructure;
the current reading stays `unwired`.

## Verification

- `node --test scripts/velocity/latency-refresh.test.mjs scripts/velocity/chart-selection-ui.test.mjs`
- `npm test`, `npx tsc --noEmit`, `npm run build` (record baseline failures separately).
- Browser: all four focus areas, both chart groups, data/source flip, exact data
  table values, evidence-gap states, stable links and Escape/focus at 1440/390/320px.
- The OpenAlex Idea vintage refresh is a separate four-CSV data change; it must
  retain frozen queries, sampling, bootstrap and reliability policy.
