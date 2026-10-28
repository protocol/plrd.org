# Refreshing the field-velocity dashboard (agent runbook)

The `/methodology/#learn` page reads **field velocity** through five
instruments per focus area, plus inflection points. This is the master runbook
for keeping all of it current: what each piece is, where it lives, how to refresh
it, and what needs a human. Hand this file to an agent ("follow
`scripts/velocity/UPDATING.md` and refresh what's stale").

## Ground rules (do not break these)

- **Real data only.** Never invent, interpolate, or backfill a value, date, or
  series. If the data does not exist, ship an honest `unwired` record (a named
  `candidateMetric` + a real `blocker`) or `not_applicable` (a `reason`). This is
  enforced at build time by `assertInstrumentRecords()`.
- **Prose matches code.** The "Our methodology" section is a public description
  of how the instruments actually work. Any change to how a reading is computed,
  sourced, dated, or displayed requires the matching prose change in the same PR
  (`VELOCITY_INSTRUMENTS[].description`, `INFLECTION_EXPLAINER`, and the
  methodology copy in the page + `MeasuringQuestionsV2.tsx`). If you change the
  number of instruments, fix every "five/six instruments" mention.
- **Data lands in its own PR.** Generated CSVs (OpenAlex, PWC) go in a separate
  PR from code, so the data diff is reviewable on its own.
- **Never commit a credential** (OpenAlex key, GitHub token) to a file, log,
  commit, or PR. All are read from the environment.
- **Verify every change:** `npx tsc --noEmit`, `npm test` (node --test), and
  `npm run build` (runs the assertion). Then eyeball `/impact-preview-eb61fba1b98e/`.

## Staleness cadence

`STALE_AFTER_MONTHS = 12` (`src/lib/velocity-instruments.ts`). Any reading whose
`measuredAt` is older than that renders a "stale" marker and its trend arrow is
withheld. **So every live reading below should be refreshed at least once a year.**
Idea vintage is the one exemption (its data is structurally ~2 years lagged).

---

## 1. Idea vintage + revealed commitments (OpenAlex CSVs)

- **Files:** `src/data/velocity/{slug}.csv` (four). **Ingestion:** `src/lib/velocity-openalex.ts`.
- **Refresh:** re-run the generator per focus area. **Full step-by-step (frozen
  queries + checks) is in [`REGENERATE.md`](./REGENERATE.md).** Needs
  `OPENALEX_EMAIL` (+ optional `OPENALEX_API_KEY`) in the env. Land the four CSVs
  in their own data PR.
- **Cadence:** yearly (the reliable window advances one year at a time).

## 2. Latency compression — reviewed corpora

- Read [`src/data/velocity/latency/README.md`](../../src/data/velocity/latency/README.md)
  before collection. It records the October 28, 2026 audit and endpoint limitations.
- DHR remains wired: final RFC/FIPS publication → first stable OpenSSL support,
  displayed in **years**, with row-level date precision and both source endpoints.
- Neurotech evidence is retained but **withheld from plotting**. Do not remove
  `meta.approvedForPlot=false` merely because dates parse or a new company ships.
  Selected preclinical disclosure dates are not animal-event dates; the existing
  first-modality contract has not been replaced with a device/company proxy.
- An evidence audit may advance `checkedAt`/`meta.generated`, never the actual
  observation endpoint. Do not change dates to make a reading appear current.

## 3. Latency compression — AI & Robotics and Economies & Governance

- AI's PWC generator is an unvalidated prototype, **not simply awaiting a run**.
  The [archive](https://huggingface.co/datasets/pwc-archive/links-between-paper-and-code)
  is frozen in July 2025. Category filtering, paper-level aggregation, negative
  lags, first-commit semantics and a compatible loader require review. No
  fabricated annual CSV or substituted well-known-model timeline.
- E&G has completed DPI transitions; it lacks a curated comparable cohort with
  consistent pilot/production boundaries. Do not claim that no completed cases
  exist, and do not pool unlike pilot types to force an acceleration chart.
- Keep both evidence gaps explicit until the metrics have defensible observations.

## 4. Static readings (hand-maintained in `velocity-instruments.ts`)

These are sourced readings typed directly into `INSTRUMENT_RECORDS`. Refresh by
editing the record and **bumping `measuredAt`** (and adding series points):

- **AI & Robotics · performance curves** — METR time-horizon doubling. TODO:
  transcribe the METR points as a `series` so the arrow can render.
- **Neurotech · performance curves** — simultaneously-recorded neurons (Stevenson
  dataset). TODO: add post-2014 frontier points if sourceable.
- **DHR · revealed commitments** — Electric Capital developer count. Refresh from
  the next annual report; update `value`, `trend`, `measuredAt`.

## 5. Markets (`src/lib/market-signals.ts`)

- **Live at build** (Polymarket / Kalshi / Metaculus). Nothing to regenerate.
- **To add/adjust a market:** edit `MARKET_MAPPINGS` (key must equal the inflection
  point's `title`). Every rendered market must resolve to a question, a venue, a
  **resolution date**, and a URL (`isRenderableMarket`); the fetchers pull the
  probability, volume, and resolution date. `METACULUS_API_TOKEN` (env) enables
  live Metaculus numbers.

## 6. Live outputs (Simocracy / GainForest / Glow)

- Fetched at build in `src/app/impact-*/page.tsx` via `@/lib/{simocracy,gainforest,glow}`.
  Live; nothing to refresh. They degrade gracefully if the endpoints are down.

## 7. Inflection points + interventions (`src/lib/inflection-points.ts`)

- **Interventions ("Our hand"):** each point lists tagged example interventions.
  When PL runs a new convening / grant / roadmap, add it as an intervention with
  an `href` (e.g. PL Neuro events from https://www.plneuro.xyz/events/), or as
  `liveEvidence`. Keep a Legibility entry linking that focus area's insights.
- **Resolving a marker:** set `outcome` (`reached`/`missed`/`retired`), `mattered`
  (+ required `matteredEvidence`), `predictedBy`/`falsifiesIf`, and `asOf`. Until
  then it reads "pending". The label is derived in `inflectionLabel()`.

## 8. Patent vintage (idea vintage's invention-side twin)

- **Not a separate instrument.** It is the second reading of **idea vintage**:
  median age of the patents a new patent cites as prior art. Injected per focus
  area by `withPatentVintage()` in `src/lib/velocity-instruments.ts` and rendered
  as a second chart in the idea-vintage modal (`PatentVintagePanel`).
- `unwired` for AI & Robotics and Neurotech (needs a USPTO PatentsView ingestion +
  a frozen CPC/keyword cohort; neuro carries an assignee-country split),
  `not_applicable` for DHR and Economies & Governance (open-source / public-goods
  native). To wire: build a PatentsView generator that emits median prior-art age
  per year, read with the same changepoint logic as paper vintage
  (`scripts/velocity/vintage-direction.mjs`), carrying the ~18-month lag caveat,
  and populate the `patentVintage` reading fields in `patentVintageFor()`.

## 9. Direction math (`scripts/velocity/vintage-direction.mjs`)

- The changepoint direction used by idea vintage (and, when built, patents). Covered
  by `vintage-direction.test.mjs`; run `npm test`. If you touch the math, add a case.

---

## Quick "what's live vs pending" check

```bash
# idea-vintage direction per field, from the current CSVs:
node -e "import('./scripts/velocity/vintage-direction.mjs').then(async m=>{const fs=await import('fs');for(const a of['digital-human-rights','economies-governance','ai-robotics','neurotech']){const L=fs.readFileSync('src/data/velocity/'+a+'.csv','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));const h=L.shift().split(',');const iy=h.indexOf('year'),im=h.indexOf('idea_vintage_median_years'),ir=h.indexOf('reliable');const p=[];for(const l of L){const c=l.split(',');if(c[im]==='')continue;if((c[ir]||'').trim()==='1')p.push({x:+c[iy],y:+c[im]})}console.log(a,m.ideaVintageDirection(p))}})"
```

Where things render: the field-velocity box + its modal show the five instruments
per focus area; the inflection cards show markers + interventions; the
methodology section explains all of it. Keep the two in sync.
