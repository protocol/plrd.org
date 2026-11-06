# Weekly full OpenAlex recalculation

`weekly_openalex.py` is a **one-shot runner**, not a scheduler or publisher. It
stages a fresh, complete acquisition of all four citation-latency CSVs used by
Methodology. It never appends only the newest year. The existing source generator
is reused through an optional transport callback; its statistical calculations
are unchanged.

## Frozen measurement contract

- Exact queries and starts in `FIELDS` match `REGENERATE.md`: three areas start
  in 2005, Neurotechnology in 2000; each runs through the current UTC year.
- 80 works/year, first 50 references/work, reference-resolution batches of 50,
  OpenAlex sample seed 42, 500-iteration work-cluster bootstrap with seed 42.
- Reference ages retain the generator's 1900-through-publication-year filter.
- `reliable = 1` only for publication years **strictly before currentYear − 2**.
- `first_time_authors` remains intentionally blank. No proxy or interpolation.
- Each weekly acquisition starts a fresh cache. Explicit resume alone reuses an
  incomplete acquisition's sources; do not reuse last week's cache by default.

## Authentication and free-only acquisition

Requires Python 3 (standard library only), Linux `flock`, and curl with native
`--variable` / `--expand-header` support (curl 8.3+). The managed launcher must
supply the `OPENALEX_API_KEY` environment handle. **Python never reads its value**;
curl imports it using `--variable '%OPENALEX_API_KEY'` and expands a Bearer header
internally. There are no key arguments, credential files, dotenv reads, or auth
values in URLs. Do not turn shell tracing on or print the environment.

The default shared acquisition lock is exactly
`/opt/data/automations/openalex-acquisition.lock`, also used by the Atlas citation
producer. A busy lock aborts before quota preflight. Keep this same lock in all
cooperating OpenAlex launchers. Do not run concurrent acquisition outside it.

Under that lock, `/rate-limit` is projected immediately to the four reviewed
numeric `rate_limit` fields. Its private `api_key` and all unrelated response
fields are discarded, never written or logged. Unknown quota schemas, nonzero
prepaid balances, missing/changed daily quota headers, or insufficient allowance
fail closed. The runner charges **10 credits for every title-and-abstract search
attempt** (including search counts and samples), **1 for other attempts**, before
transport; retries consume both request and credit caps. Remaining daily free
quota is lowered to the minimum of the local estimate and each response's real
quota headers. Defaults: 7,000-credit run cap, 1,000-credit reserve, 10,000 request
attempts, at most 3 attempts/request (configurable up to 6). Daily quota and
permanent errors stop; transient retries have bounded waits (≤120 seconds), with
no final sleep. A conservative full-run upper bound is not an admission gate:
the actual per-request cap/reserve safely stops an incomplete run before spill.

Examples below are operator commands, **not evidence of a real acquisition**:

```bash
# One year in ALL FOUR areas: source/transport smoke only, never installable.
python3 -B scripts/velocity/weekly_openalex.py --acquire --smoke-year 2023 \
  --run /private/path/methodology-smoke-unique

# Full historical recalculation, all four areas, staged only.
python3 -B scripts/velocity/weekly_openalex.py --acquire \
  --max-credits 7000 --reserve-credits 1000 \
  --run /private/path/methodology-full-unique

# After a quota reset: reuse successful partial sources into a NEW run directory.
# The original acquisition timestamp and pinned measurement contract are retained.
python3 -B scripts/velocity/weekly_openalex.py --acquire \
  --resume /private/path/methodology-full-unique \
  --run /private/path/methodology-full-resumed-unique

# Offline, deterministic, byte-exact full replay (zero live requests).
python3 -B scripts/velocity/weekly_openalex.py \
  --replay /private/path/methodology-full-resumed-unique \
  --run /private/path/methodology-replay-unique

# Separate explicit install, only after complete acquisition + replay + review.
python3 -B scripts/velocity/weekly_openalex.py \
  --install-from /private/path/methodology-replay-unique \
  --install-to src/data/velocity
```

No mode pushes, schedules, merges, deploys, posts Slack updates, or changes any
manually curated chart. Publication/build/screenshot/rollback orchestration is
owned by the parent workflow. Generated data must remain separate from code
changes. Never commit source acquisitions or fixtures under `src/data/velocity`.

## Receipts and failure recovery

Each fresh staging directory is private (0700) and contains:

- `manifest.json`: version, status (`incomplete`, `smoke`, or `staged`), acquisition
  timestamp, complete frozen contract, generator source SHA-256, file hashes and
  row counts, request count and conservative spent-credit total.
- `sources/<request-sha256>.json`: durable successful source receipt, sanitized
  request, **exact consumed source fields**, canonical response hash and original
  raw-response SHA-256. Unused API metadata/titles/auth URLs are not retained.
  These are source response projections, not full HTTP bodies or synthetic data.
- `acquisition.json`: complete canonical source/cache receipt index and its
  manifest hash. Partial source files survive process death before this index.
- `requests.jsonl`: fsynced attempt/cache events; `requests.json` and its manifest
  hash summarize a clean exit or caught failure. No headers, error bodies,
  exception strings, secret URLs, environment values, or config paths are saved.
- `csv/`: acquired CSVs. A failure can leave a partial staged directory, but its
  manifest stays `incomplete` and cannot be replayed as complete or installed.
- `install.json`: changed/unchanged names and before/after hashes after install.

Resume reads only schema/hash-validated source receipts with the same generator,
queries, years, and settings. Replay requires a complete capture, consumes the
whole cache, and compares **all four regenerated CSV hashes**, including their
original generated timestamp. Do not describe a synthetic fixture replay as real
source acquisition. Preserve private source receipts for audit; publish only the
validated data files and appropriate sanitized summary.

Validation requires exactly the four filenames, exact ordered columns/provenance,
complete ordered year ranges, cutoff flags, finite bounded ages and confidence
bounds, consistent field/all-work/share counts, 80/50 sample limits, and expected
missingness (zero resolved references → blank median; fewer than 8 contributing
works → blank CI). It rejects an entirely missing reliable series. Legitimate
zero field populations produce a blank observation, never a zero median. Before
install, any new gap in an already populated historical median requires review.

Installation validates everything before live mutation, locks the target, stores
hash-checked rollback backups and a durable journal under
`.openalex-transaction/`, and replaces each changed CSV atomically beside its
target. Unchanged numeric data and matching provenance retain the **original
bytes, generated timestamp, and mtime**; cosmetic numeric formatting alone is not
a change. Failures roll back the whole set, including original mtimes/modes.
A later install recovers an interrupted transaction first; unknown concurrent
target edits or corrupt backups fail closed for manual recovery.

This is a journaled four-file rollback transaction, **not a simultaneous rename
of four paths**: noncooperating readers could observe the short replacement
window, and a killed process can leave a journal requiring the next install to
recover. Do not build/publish until install has returned successfully and readback
hashes are checked. Coordinate builds with the target install lock. Successful
post-publication rollback is a parent-owned Git revert/data-release operation.

## Offline checks and implementation receipts

```bash
python3 -B -m unittest scripts.velocity.test_weekly_openalex \
  scripts.velocity.test_openalex_refresh -v
node --test scripts/velocity/weekly-openalex.test.mjs
npm test
```

The Node wrapper is included by the existing `scripts/velocity/*.test.mjs` npm
test glob. Tests use explicitly synthetic source fixtures only in temporary
directories. They exercise full four-area history, year/schema/numeric/provenance
rejections, sanitized native curl argv/preflight projection, retry/cap/quota
behavior, lock contention, smoke non-installability, partial resume, byte-exact
replay, real subprocess CLI replay/install, no-op file retention, historical
missingness protection, injected third-file failure rollback, and interrupted
transaction recovery. No test contacts OpenAlex or reads a real credential.

Implementation followed vertical RED→GREEN slices: missing runner → staged full
history; missing validator → malformed-set rejection; missing bounded acquisition
→ retry/cap/quota tests; unsafe response projection → allowlist tests; missing
free budget/native transport → budget/handle tests; lost failed-run receipts →
resume/replay; missing installer → rollback/no-op; existing journal obstruction →
crash recovery; accepted historical gap → missingness guard; missing CLI → smoke
and shared-lock path; zero-population rejection → legitimate missing observation.
The real subprocess replay/install test adds integration coverage to those paths.
