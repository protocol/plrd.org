# Open Lab v3 — native journey evidence

## Scope and source

These are real Chrome captures and interactions on a localhost Next.js dev server at runtime revision `4584de13227bbb38f45002dd0beac5e1e4e10e41`. All authored listings, reviews, proposals, tasks, and returned results in the captures are explicitly synthetic, browser-local test data. They are not evidence of live community participation or scientific validation. The evidence-only commit does not change runtime code.

This remains the existing draft PR and preview iteration, not a production/public-account launch. The PR records the final clean install/test/build, independent final verdicts, and deployed revision separately.

## Exercised journeys

- **Catch up → work → return → catch up:** acknowledge the old exact feed row, open its same source/task, inspect and download the real plain-text agent brief, return a failed-result note and artifact URL, observe that source become unread again, reopen/review the new revision, acknowledge it, and reload without replaying it. Native selectors use the actual `message:r5` row identity, not a title shared by another discussion row.
- **App catalog:** the actual Find tools route leads with app search/cards, not the old expanded demo discussion. Open marimo's source-attributed listing; save an app and a local review, reload and read both back. No iframe or embedded runtime is mounted. The legacy arcade entrance redirects to the catalog.
- **Authored app listing:** fill and read back every field, save an unpublished synthetic listing, reopen/edit its evidence, reload the exact listing URL, and verify the edit. At 1440, 390, and 320px, app drawers fit the viewport and Escape restores focus to the originating card.
- **GitHub/own-agent handoff:** both destinations preserve the saved task/source identity and its goal, output, limits, and stop condition. The native downloaded file's contents equal the inspected brief. No issue, PR, agent job, or public record is created.
- **Tech tree:** navigate root → Life Sciences → Neuroscience → Cognitive Neuroscience; search the entire snapshot from that narrow branch for CRISPR and Genetic Engineering; open topic T10878, reload its deep link, go up to its parent and back through browser history. Zoom, pan, reset, and mobile default List were exercised. Narrow panes pan rather than auto-shrinking node titles below 14.1px at default zoom.
- **Responsive shell:** requested widths 1440, 1024, 390, and 320px across home, apps, bottlenecks, tech tree, and My bench: 20 route/viewport checks. Requested viewport width, document width, scroll width, active navigation, visible scope/account/search controls, and heading sizes were measured. The standard shell test consumed these real probes rather than skipping its browser gate.
- **Small-phone search:** the magnifier is a real input, expands across the header on focus, accepts a query, and submits the native GET feed search without horizontal overflow.
- **Compact proposal:** the earlier native check saved two synthetic fields, collapsed/reopened their disclosure groups, and reloaded the persisted values. Its source was `a811685`; later changes do not alter the proposal's writer or disclosure structure. The included final-runtime route capture shows the integrated shell.

## Independent review findings resolved in code

- Returned source evidence now participates in deterministic catch-up revisions, without clearing unrelated history or inferring legacy associations.
- App discovery leads its actual route; tool details put contribution preparation behind a disclosure instead of repeating source prose/links.
- URL validation rejects ambiguous HTTPS authority forms before parsing. Tests include mounted GitHub anchors at an HTTPS document origin, no export/write for rejected forms, and exact preservation of unsupported stored input.
- Sparse graphs size to their actual rows; auto-fit has a readable minimum and no 619→620px discontinuity.
- Phone search no longer shows a clipped fragment of its placeholder; repeat-user catch-up explanation is available on demand.

## Source integrity

The bundled OpenAlex hierarchy is research-literature containment: 4 domains, 26 fields, 252 subfields, and 4,516 topics. It is not a prerequisite graph or an exhaustive ontology. Every acquired CSV topic and parent was compared against the bundled snapshot, with the recorded source checksum verified. See [source/navigation decision](./v3-science-map-decision.md) and [science-tree implementation notes](./v3-science-tree.md).

## Honest limits

- Local history, listings, saves, and reviews are scoped by browser, identity, and Demo/live mode—not cross-device or public synchronization. LocalStorage writes are not multi-tab transactions.
- External launch was clicked: a new native tab targeted `https://marimo.io/`. This container's managed-browser allowlist blocked loading that external page. The link target and public HTTP availability were checked separately; execution of the external app was not evaluated, and the browser restriction was not bypassed.
- No new real-account OAuth/PDS roundtrip, native follow, public post, public app review, GitHub mutation, or agent execution was authorized or performed in this iteration.
- These flows are a product hypothesis for useful repeat collaboration, not measured adoption or retention.
