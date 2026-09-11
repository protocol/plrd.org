# Open Lab v3: science-tree lane

## Implemented surface

`/lab/explorations/observatory/` now explores a bundled OpenAlex research-literature hierarchy rather than treating four PL R&D questions as the entire tree. The existing question routes remain source-linked contextual briefs.

- Four domains → 26 fields → 252 subfields → 4,516 topics, plus one explicitly app-owned `science` root (4,799 navigable nodes).
- Full-snapshot search across labels, keywords, descriptions and ancestry. Exact labels rank first; search does not narrow to the current branch or PL overlay.
- HTML/SVG branch graph, bounded to eight children per page, with real scroll/drag/button/keyboard pan, bounded zoom and reset. List/search pages contain at most 24 nodes. No WebGL, force simulation, new dependencies, runtime taxonomy service or credential is required.
- Source breadcrumbs, explicit Up, native anchor fallback/modifier clicks, selected-node URLs and history restoration. Query, layout, pagination and overlay controls are encoded in the current view URL. Search edits replace the current history entry; opening a branch pushes an entry so returning restores the search. Escape and Clear search retain input focus.
- Branch and view links are available in an optional inspector disclosure. Canonical branch links omit transient controls. Question links remain canonical, resetting to the device-default layout and turning off the overlay; their source brief receives focus on arrival/selection.
- Mobile starts with the list. Light-first white work surface and tinted source inspector have an explicit dark variant, 22/17/15px heading/body hierarchy, dividers and visible focus. Parent browser QA remains required; CSS/JSDOM probes are not screenshots.

## Source and reproduction

Publisher: OpenAlex / OurResearch. Metadata license: CC0 (not a license to redistribute linked full text).

The official [classification repository](https://github.com/ourresearch/openalex-topic-classification) links the [exact source table](https://docs.google.com/spreadsheets/d/1v-MAq64x4YjhO7RWcB-yrKV5D_2vOOsxl4u6GBKEXY8/export?format=csv). [Classification method](https://help.openalex.org/data/topics/) and [data access/license](https://help.openalex.org/access/get-the-data) are linked in the inspector.

Source checked September 11, 2026. CSV SHA-256:

`f1493b5448d6998b58a76e62b6829401ca2771300b713ce5d8803780ca9d47be`

The bundled JSON preserves IDs, labels, one source parent, descriptions and semicolon-delimited keywords. Numeric source topic ID `10429` is explicitly namespaced to `topic:T10429`; it is not silently treated as an already canonical OpenAlex ID. The refresh script rejects malformed IDs rather than normalizing them.

After separately acquiring and reviewing the official CSV, run from the repository root:

```sh
python3 scripts/refresh-lab-science-tree.py --input /path/to/reviewed-topics.csv --checked-on YYYY-MM-DD
node --test --test-concurrency=1 scripts/lab-science-tree*.test.mjs
```

The refresh is offline, stamps the input bytes' hash, validates stable ancestor labels/parents, unique topics, nonempty descriptions and exact per-level counts, then atomically replaces the output. A changed/incomplete universe fails closed; review intentional source changes before adjusting expected counts and count assertions. It does not run during builds or at runtime. Python 3 is only needed to refresh/test the source pipeline, not serve the app.

The September 11 CSV was replayed into a separate output and compared byte-for-byte with the bundle. Bundled JSON: 3,325,230 bytes; gzip probe: 874,604 bytes. This is a route-local static import, not a measured production JavaScript transfer size. Parent should inspect the actual built route's payload/startup on mobile.

## Meaning and boundaries

Lines mean source containment only—not similarity, prerequisites, progress, peer review or current community activity. Topic names/descriptions are machine-generated from citation clusters and explicitly labeled as such. Coverage reflects indexed research and its publication/language biases. This finite literature classification is not an exhaustive ontology of every science or technology.

The PL overlay is an editorial starting-point mapping from the four existing briefs to Computer Science (`field:17`), Neuroscience (`field:28`), and Economics, Econometrics and Finance (`field:20`), including their ancestors. It highlights but never hides other science, and does not claim that OpenAlex, PL R&D, or a topic's authors endorse a whole field. The existing compact social interest taxonomy is unchanged.

No storage reads/writes, public mutations, arbitrary execution, account changes, server fetches, synthetic activity or hidden scientific dependencies were added. Invalid node URLs visibly return to All sciences without changing saved data.

## Verification and remaining integration gates

Targeted command:

```sh
node --test --test-concurrency=1 scripts/lab-science-tree*.test.mjs scripts/lab-explorations.test.mjs scripts/lab-explorations-ui.test.mjs scripts/lab-shell-responsive.test.mjs
node_modules/.bin/tsc --noEmit --incremental false
```

At lane completion: 34 tests passed, zero failed, one existing real-browser probe skipped; typecheck passed. JSDOM reports its expected unsupported native document-navigation diagnostic when the modifier-click test deliberately leaves the event native. No full build or browser session was run by this lane.

Resume red-green evidence covers the initial contextual-brief focus regression, missing search/view URL restoration, and lost view/overlay URL state on opening a branch. Added offline pipeline regression tests verify exact node preservation and that malformed IDs, duplicate topics, conflicting ancestry, missing descriptions and incomplete input cannot replace the previous snapshot. Original interrupted-run red/green receipts were not available; resumed-run results do not claim to reconstruct those executions.

Fresh-skeptical code review found and resolved the focus/history gaps above and moved sharing fields behind a disclosure so they do not consume the primary navigation surface. Source checksum, all parent paths, exact counts and zero duplicate visible keyword keys were independently checked with deterministic probes.

Parent owns: full frozen-install/integrated test/build replay; native browser Back/Forward and Next navigation integration; graph drag/zoom/reset/focus at desktop and 390/320px; actual long-label card geometry (e.g. `topic:T11672`), light/dark screenshots, no-WebGL operation, startup payload/performance, final independent review and release decisions. Search in the shell should remain labeled as work search; this route's explicit “Search all sciences” is the full taxonomy search. This lane does not change the shell.
