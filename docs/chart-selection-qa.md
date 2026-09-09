# Per-chart selection QA (supersedes the v7 contact sheet)

## Contract

- Compact cover at rest; hover, focus or tap reveals real, titled preview charts in an **absolute-positioned spread**, not a group modal or decorative backs.
- Choose one preview to open only that chart/reading. Three targets per page maximum; additional views use Previous/More previews. Mobile uses a stacked, internally scrollable spread.
- Fan padding/gaps remain inside the same pointer region. Keyboard focus retains it; Escape or Close previews collapses and restores the cover. Modal activity does not hide the selected return target.
- Existing data/source 3D flips, rotating outlines, always-visible methodology, non-toggle legends and per-point provenance remain intact. Historical readings are not counted as charts.
- URLs use source identities, not card order: `#fv/<area>/<instrument>/<encodeURIComponent(item.id)>`. There is intentionally no matching DOM id: fresh URLs and history navigation must not scroll the page to a fragment target.
- Area-only history entries use `#fv/<area>`. Fresh chart URLs restore the relevant overview tab. Invalid/unavailable charts and a different area's chart on a fixed-area detail route fail closed.
- Ordinary preview activation pushes history without rewriting the preceding entry/fragment or Next's existing state; closing a locally opened chart goes Back. A fresh-link modal closes in place to its area fragment. Pending Back retains the modal input boundary until traversal completes. While the dashboard subscribes, it owns `history.scrollRestoration = 'manual'` and restores the prior value on unmount.
- Direct link and Copy link preserve origin, pathname and query. Modifier-click follows native link behavior. Clipboard failures are visible instead of claiming success.
- Modal body locking compensates the scrollbar and restores prior overflow/padding exactly; ownership is reference-counted during modal replacement.

## Routes

Cross-area overview: `/impact-preview-eb61fba1b98e/` (existing unlisted/noindex route retained).

Neuro detail: `/areas/neurotech/`.

The same selection component is also used on `/areas/digital-human-rights/`, `/areas/economies-governance/`, and `/areas/ai-robotics/`.

Append these Neuro fragments to either the overview or Neuro detail:

- `#fv/neurotech/performance_curves/primary` — neuron-recording series
- `#fv/neurotech/performance_curves/tissue-mapped`
- `#fv/neurotech/performance_curves/neural-recording-hours`
- `#fv/neurotech/revealed_commitments/reading` — historical scalar reading (not a chart)
- `#fv/neurotech/revealed_commitments/bci-implants`
- `#fv/neurotech/idea_vintage/primary` — selected-area paper vintage

Use actual preview `href` values for other areas and live market views; market URLs are encoded as one item-id segment.

## Selectors

- Cover: `button[data-instrument="performance_curves"]`
- Deck: `[data-chart-deck="performance_curves"]`; state: `data-expanded="true"`
- Spread: `[data-chart-fan]`; closed state is `inert` and `aria-hidden="true"`
- Individual target: `[data-chart-target="tissue-mapped"]`
- Current page only: `[data-chart-target]:not([hidden])`
- Preview title: `[data-preview-title]`; actual plot: `.chart-fan-plot svg`
- Modal: `.instrument-gallery-dialog[role="dialog"]`
- Selected card: `[data-gallery-item]` (exactly one for chart/reading URLs)
- True chart count: `[data-gallery-item][data-is-chart="true"]`
- Sharing: `[data-chart-direct]`, `[data-chart-copy]`
- Close modal: `[aria-label="Close gallery"]`
- Flip: `[data-flip-action]`; rotator: `.gallery-card-rotator[data-flipped]`
- Physical faces: `[data-face="chart"]`, `[data-face="data"]`
- Definition: `.gallery-methodology`

## Local verification

Run from the checkout; **pnpm 10** is the deployment install gate. No dependency or lockfile changes are required.

```sh
npx --yes pnpm@10 install --frozen-lockfile
npx --yes pnpm@10 test
npx --yes pnpm@10 exec tsc --noEmit
UV_THREADPOOL_SIZE=1 GOMAXPROCS=2 NEXT_TELEMETRY_DISABLED=1 taskset -c 0,1 npx --yes pnpm@10 build
```

After the production build (never dev/build concurrently against this `.next`):

```sh
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3398
```

Check port availability first. Stop the exact task-owned server before rebuilding.

Node/jsdom regressions cover selection across all four overview tabs and Neuro detail, every fresh static chart/status URL, invalid hashes, actual history traversal, encoded identities, exact copy payload, focus/Escape, fan-region continuity, viewport placement math, scroll-lock styles/replacement, all chart-kind flips and source tooltip/legend behavior. Geometry fixtures test placement calculations, **not browser pixels**; clipboard is an API test double, **not native clipboard readback**.

## Parent browser acceptance still required

The delegated task explicitly did not use a browser. Parent reported the shared Chrome harness blocked; no restart or workaround was attempted here.

At desktop, 390px and 320px: sample actual intermediate spread and flip transforms, reduced-motion behavior, every fan target/pagination, stationary-pointer + keyboard interactions, pointer travel across gaps, touch cover → chart, all fresh URLs, Back/Forward/tab recovery, close/backdrop/Escape, focus restoration, native clipboard readback and document overflow. Compare background X/width/scrollY **while the modal is open**, as well as after closing. Verify the spread remains reachable at viewport edges. Do not treat the previous v7 screenshots as evidence for this interaction.
