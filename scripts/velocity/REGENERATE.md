# Regenerating the field-velocity CSVs (agent runbook)

Hand this file to a coding agent (or follow it yourself) to regenerate the four
committed CSVs under `src/data/velocity/` with the current generator. Read
[`AGENTS.md`](../../AGENTS.md) and [`../../src/data/velocity/README.md`](../../src/data/velocity/README.md)
first. Stack: Next.js 15 / TypeScript. Verify with `npx tsc --noEmit`,
`npm test`, `npm run build`.

## Why this is a separate PR

The generator (`field_velocity_openalex.py`) uses a **cluster bootstrap**
(resamples works, not references) and writes an `n_works_sampled` column. When
the CI method or sampling changes, all four CSVs change. That data diff must land
in its **own PR**, separate from any code change, so the two can be reviewed
independently. Never hand-edit or synthesise a CSV — an absent file is the
correct empty state, and a regenerated file must come straight from the script.

## Credentials (never commit these)

The generator reads credentials from the environment (CLI flags `--api-key` /
`--email` still win if passed):

```bash
export OPENALEX_API_KEY=...            # optional; lifts OpenAlex rate limits
export OPENALEX_EMAIL=you@protocol.ai  # joins OpenAlex's polite pool
```

Never write the key into a CSV, a commit, a log line, or a PR description. The
CSV provenance header records only the query string and the timestamp. Confirm
afterwards: `grep -ri "api_key\|OPENALEX_API_KEY" src/data/velocity` should
return nothing but this line's neighbours in docs.

## Setup

```bash
# Branch off whatever currently has the clustered generator
git checkout lukas/impact-v2 && git pull      # (or the branch where PR #107 landed)
git checkout -b lukas/velocity-csv-regen

# Sanity check: the generator is the clustered version
grep -n "cluster_bootstrap_ci\|n_works_sampled\|OPENALEX_API_KEY" \
  scripts/velocity/field_velocity_openalex.py   # all three should hit
```

## Run — one per focus area (slow; many API calls; let each finish)

Queries and `--from-year` are the **frozen field definitions** — keep them
byte-identical to what each CSV's `# query:` header already records, so every
series stays comparable against its own history. `--reliable-cutoff-year`
defaults to (current year − 2), which is correct. `--works-per-year 80` and
`--max-refs-per-work 50` match the existing sampling density, so only the CI
method changes.

```bash
python scripts/velocity/field_velocity_openalex.py \
  --search "content addressing|peer-to-peer network|censorship resistance|decentralized storage" \
  --from-year 2005 --works-per-year 80 --max-refs-per-work 50 \
  --out src/data/velocity/digital-human-rights.csv

python scripts/velocity/field_velocity_openalex.py \
  --search "mechanism design|public goods funding|quadratic funding|digital public infrastructure" \
  --from-year 2005 --works-per-year 80 --max-refs-per-work 50 \
  --out src/data/velocity/economies-governance.csv

python scripts/velocity/field_velocity_openalex.py \
  --search "decentralized training|federated learning|multi-agent coordination|embodied AI" \
  --from-year 2005 --works-per-year 80 --max-refs-per-work 50 \
  --out src/data/velocity/ai-robotics.csv

python scripts/velocity/field_velocity_openalex.py \
  --search "brain-computer interface|connectome|neural implant|whole brain emulation" \
  --from-year 2000 --works-per-year 80 --max-refs-per-work 50 \
  --out src/data/velocity/neurotech.csv
```

## Offline failure-handling checks

Run `python3 -B -m unittest scripts.velocity.test_openalex_refresh -v` from the
repository root. Tests mock the HTTP transport, use only synthetic fixtures and
an explicitly fake sentinel key, and write only into temporary directories.
They do not read credentials or contact OpenAlex.

Request diagnostics omit URLs, parameters, response bodies, and upstream exception
messages. Explicit daily-quota exhaustion stops immediately; transient failures
have bounded retries (at most six attempts, waits capped at 120 seconds, numeric
or HTTP-date `Retry-After`). Existing output survives request failures. A complete
CSV is flushed to a temporary file beside `--out`, then atomically replaced;
this guarantee is per file, not a transaction across all four refresh commands.
Queries, cohorts, sampling, and bootstrap/direction calculations are unchanged.

## Checks before committing

- Each CSV header row includes `n_works_sampled`, and the `# sample:` provenance
  line mentions `ci=cluster_bootstrap`.
- No credential appears anywhere under `src/data/velocity/`.
- The new `vintage_ci_lo/hi` bands are **wider** than before (expect ~2–4×).
  Spot-check a few rows in `git diff`.
- `npx tsc --noEmit` clean; `npm test` passes (idea-vintage direction tests);
  `npm run build` compiles and `assertInstrumentRecords()` passes. (The build may
  fail only on the network-bound `/areas/economies-governance/impact/live-dashboard`
  page — a known unrelated timeout; ignore it.)
- Sanity-check the idea-vintage direction each field now yields:

```bash
node -e "import('./scripts/velocity/vintage-direction.mjs').then(async m=>{const fs=await import('fs');for(const a of['digital-human-rights','economies-governance','ai-robotics','neurotech']){const L=fs.readFileSync('src/data/velocity/'+a+'.csv','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));const h=L.shift().split(',');const iy=h.indexOf('year'),im=h.indexOf('idea_vintage_median_years'),ir=h.indexOf('reliable');const p=[];for(const l of L){const c=l.split(',');if(c[im]==='')continue;if((c[ir]||'').trim()==='1')p.push({x:+c[iy],y:+c[im]})}console.log(a,m.ideaVintageDirection(p))}})"
```

## Commit + PR

- Commit **only** the four CSVs.
- Title: `data: regenerate field-velocity CSVs with clustered bootstrap (wider CIs)`.
- Body: note the CIs widened as intended, that only the bootstrap method changed
  (queries and sampling params unchanged), and paste the per-field idea-vintage
  directions from the sanity check.
- Open the PR with **base `lukas/impact-v2`** (or wherever the generator change landed).
- Do not hand-edit any CSV value, do not commit the key, do not put the key in the PR.
