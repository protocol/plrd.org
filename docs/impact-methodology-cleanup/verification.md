# Impact methodology cleanup — September 29, 2026

Runtime revision: `4084394038fd5f1b6b7f94b0a27b21db1961bbcb` (evidence-only commit follows).
Base revision: `5114ad2645f38133d95263b38767b756ff9e89ab`.

## Requested scope

Remove the entire “Documenting our hand” section, the bottom “Back to the methodology” link, and the two proposed-intervention preview cards at the bottom of Diagnose. The interventions will have a separate page. Preserve the three tabs, ten bottlenecks, binding question, Intervene taxonomy/banners, and Learn's field-velocity view. Keep this an unlisted/noindex preview; do not publish `/impact`.

## Executed verification

- Fresh `pnpm@10 install --frozen-lockfile`: passed, no dependency changes.
- Each requested removal was observed failing in the source-loaded real-page regression before its implementation; all pass afterward.
- Baseline full suite: 127/127 passed.
- Final full suite: 127/127 passed. The named-anchor test now explicitly asserts the removed showcase wrapper is absent, rather than requiring its retired anchor.
- TypeScript `tsc --noEmit`: passed.
- Production build: passed. Existing data-provider fallback warnings (indexer/closed-round snapshot) remain; no application/auth configuration changed.
- Actual production server on loopback `127.0.0.1:4279`, not a mock or synthetic component render.
- Headed Chrome: 1440, 1146, 1024, 768, 640, 390, and 320px. All three tabs and all six native Intervene accordions exercised; ten bottlenecks retained; requested removals absent; no horizontal overflow; noindex retained. Full results: `results.json`.
- Desktop/mobile screenshots capture the end of Diagnose and Learn, where the removals matter. Source revision and served HTML were checked against the committed runtime.

## Fresh-skeptical review

Verdict: **PASS for the requested preview cleanup**, not approval to publish the broader proposal.

- Scope: page diff removes only the requested blocks and their now-unused hypercert imports/fetch. Other routes, components, intervention records, and auth are untouched.
- Diagnose: both program cards and their introductory label are absent; all ten bottleneck tiles and the binding question remain.
- Learn: field velocity and inflection-point content remain; the entire contribution showcase, link, and fetch are gone.
- Layout: inspected all four actual desktop/mobile ending screenshots. The page flows directly into the site footer without an empty showcase wrapper or back-link band. Sticky tabs remain functional. The topmost partial card in a scrolled capture is normal viewport occlusion, not lost content.
- Release boundary: preview route still noindex; PR remains draft. No merge or production publication authorized or performed.
