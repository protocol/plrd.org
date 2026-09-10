# Public field-velocity feed

The canonical data stays in this repository; no database or migration is required.
`src/lib/field-velocity-data.ts` assembles the existing curated records, patent-vintage
metadata, OpenAlex CSVs, latency corpora, market-curve snapshot and resolved forecasts.
The impact overview, all four area panels and this endpoint use that loader. PL live
outputs remain in a separate server module and are not part of the public feed.

## Read-only contract

`GET https://www.plrd.org/api/field-velocity/[area]/`

Exact supported slugs: `digital-human-rights`, `economies-governance`, `ai-robotics`,
`neurotech`. Unknown slugs return HTTP 404 with `{"error":"Unknown focus area"}`.
Trailing slashes are required. No auth, credentials, database, or write methods.
Simple browser GET requests are supported with `Access-Control-Allow-Origin: *`
on both success and unknown-area responses; credentialed CORS is not enabled.

```ts
{
  schemaVersion: 1,
  generatedAt: string, // envelope generation, never observation freshness
  area: { key: FocusAreaKey, label: string },
  source: { url: string, repository: string, methodologyUrl: string },
  instruments: { id: string, label: string, subtitle: string, description: string }[],
  records: InstrumentRecord[],
  measurementSeries: MeasurementSeries[], // additive; Neuro has three, other fields []
  inflectionPoints: InflectionPoint[],
  marketSignals: Record<string, MarketSignal>, // only this area's point titles
  toolkit: typeof TOOLKIT_V2,
  methodology: { intro: string, attribution: string, observedVelocity: string, stocksAndFlows: string }
}
```

Types remain canonical in `velocity-instruments.ts`, `inflection-points.ts`,
`market-signals.ts` and `field-velocity.ts`. This API explicitly projects the fields
above; it never spreads internal objects with `liveOutputs` or hypercert inputs.
`records` retain source-specific `measuredAt`, `checkedAt`, provenance and stale/unwired
states. `generatedAt` is not evidence that the observations are current. Existing
commitment records may pair a cumulative headline with a separately described
OpenAlex talent-entry chart; consumers must preserve those different units.

Cache policy: route revalidation 300 seconds; browser max-age 60 seconds;
shared cache max-age 300 seconds and stale-while-revalidate 600 seconds. Forecast
resolvers retain their existing provider caching and explicit unavailable states.

## Sourced Neuro measurements

`src/lib/measurement-series.ts` defines `MeasurementSeries`, `MeasurementTrack` and
`MeasurementPoint` and validates the committed `src/data/velocity/neuro-measurement-series.json`.
The [evidence ledger](neuro-measurement-series-evidence.md) records the exact primary
sources, derivations, date choices, exclusions and coverage limitations.

The five instrument categories and existing `records` are unchanged. Additional
series are mapped into them, rather than claiming eight independent instruments:

| Series ID | Existing instrument | Lens | Unit / chart |
| --- | --- | --- | --- |
| `tissue-mapped` | `performance_curves` | capability | mm³; log scatter |
| `bci-implants` | `revealed_commitments` | adoption | participants; within-cohort lines |
| `neural-recording-hours` | `performance_curves` | data-supply | hours; scatter |

Every series carries `description`, `coverage`, `caveat`, `checkedAt`, `chartKind`,
`scale` and named `tracks`. Each track has its own definition and sorted points.
Every point preserves positive `value`, HTTPS source URL and label, an explanatory
note, `datePrecision` (day/month/year), `dateBasis` (release/publication/observation/disclosure)
and optional approximate/at-least/greater-than qualifier. The ISO `date` coordinate
must not be displayed as an exact event day when the source only gives a month/year.

Charts never sum datasets or overlapping cohorts. Only compatible points within a
single track can be connected; only Neuralink currently has a connected history.
The H01 and MICrONS points are near-coincident: keyboard-accessible legend buttons
isolate tracks on fixed axes, without moving the dates or removing source rows.
Source disclosures retain all points regardless of the selected chart track.

Area panels use a page-width CSS grid and `subgrid` to keep their content aligned
with surrounding sections; the section itself spans all columns. The background
is the exact Neuro opportunity-grid `bg-gray-200` token: `#F6F9FD` in light mode,
`#21242c` in dark mode. No `100vw`, negative-margin escape or overflow clipping is
needed, so the layout does not introduce scrollbar-width bleed or clip modals.

## Overview and consumer dependency

The overview is currently `/impact-preview-eb61fba1b98e/`; `?area=neurotech#field-velocity`
selects Neurotech on first render. `#methodology` and `#toolkit` are stable anchors.
All four area overviews link there without replacing their original content.
The preview's noindex metadata remains in place. When the separate impact go-live
work changes its public URL, update `FIELD_VELOCITY_OVERVIEW` in one place.

**Merge/deploy this PLRD endpoint before a PL Neuro consumer relies on its live URL.**
Until then the production route does not exist. A downstream fallback must be generated
from this exact candidate's real response, not hand-copied metric values, and identify
its snapshot status rather than restamping its observations. This change does not
deploy PL Neuro or Neuro Atlas.

## Verification

`npm test` runs the existing vintage math and new real-source Node tests (tested on
Node 26; TS/TSX compiled in-process with the existing TypeScript dependency). Network
outage tests explicitly mock provider failures, never synthesize measurement data.
Run `npx tsc --noEmit` and `npm run build` too. On process-constrained local machines,
Next's `CIRCLE_NODE_TOTAL=2 npm run build` limits static-generation workers without
changing the production configuration.
