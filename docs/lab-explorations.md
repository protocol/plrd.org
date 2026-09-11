# Open Lab entrance explorations

Two independent, interactive entrances and a product comparison. These are prototype routes, not a second community deployment. All route content and styling is isolated under `src/app/lab/explorations/` and `src/components/lab/explorations/`. The integration owner supplies the outer Open Lab shell; no auth, server, shared stylesheet, shell, or package changes are required.

## Routes

- `/lab/explorations/` — A/B/C comparison with intent-based recommendations and substantive cold-start, maintenance, and trust tradeoffs. A is the main Open Lab foundation; its miniature is labeled a composition sketch, not a screenshot or live feed.
- `/lab/explorations/arcade/` — Science Arcade: a paper-like tool cabinet centered on a deterministic elementary cellular-automaton print instrument. Rule slider (0–255), presets, initial-cell selection, boundary condition, and row count change the actual lattice. Exports are real SVG and JSON files generated in the browser, not placeholder downloads.
- `/lab/explorations/observatory/` — Observatory: dark scientific-question map, with the Neurotech editorial brief selected initially.
- `/lab/explorations/observatory/{question}/` — direct, server-renderable question briefs: `verifiable-artifacts`, `portable-evaluations`, `neural-measurements`, `robust-coordination`. Unknown IDs use Next's `notFound()`. In-place selections update browser history; back/forward restores the brief. Native links remain usable without client navigation. Map/List uses the same accessible link collection. Selecting a question focuses the brief heading, allowing offscreen results to come into view.

## Instrument contract

`lab-explorations.ts` contains the pure model and export builder. Rule numbering follows the elementary cellular-automaton convention: neighborhood `111` is rule bit 7 and `000` is bit 0. Each row updates synchronously from the previous row. Row zero is the seed, columns run left to right. Fixed boundaries are zero outside the lattice; wrapping boundaries connect the edges. A pair seed uses the central cell and its right neighbor.

Bounds: integer rule 0–255; width 3–241; rows 1–160. The UI uses width 121 and 40, 80, or 120 rows. No randomness or clocks participate in output. SVG and JSON derive from the same cell matrix. JSON schema identifier: `org.plrd.explorations.automaton.v1`; fields include `config`, `convention`, `limit`, `cells`. SVG embeds the configuration, convention, and limit in XML metadata. Configuration is validated and narrowed before serialization; the SVG contains no script, remote image, or external app.

This is a synthetic educational model, not biological data, a claim of computational universality, or evidence of discovery. Downloads are explicit user gestures; feedback says the download was requested, not that it was saved or published. No configuration or result is sent to a server. Object URLs are revoked after the download request.

## Editorial boundaries and sources

The Observatory's four questions are editorial starting points, not active campaigns or requests from project maintainers. Lines join questions to a shared methodological lens; positions are not a quantitative embedding and do not describe social relationships. Briefs separate what exists, the proposed opening, a useful contribution, and the limit of the source. No community identities, activity counts, or peer-review claims are invented.

Public sources inspected September 10, 2026:

- IPFS Content Identifiers: https://docs.ipfs.tech/concepts/content-addressing/
- EleutherAI Evaluation Harness: https://github.com/EleutherAI/lm-evaluation-harness
- Neuro Atlas public repository: https://github.com/lksbrssr/neuro-atlas
- PL Neuro published field overview: https://www.plneuro.xyz/insights/neurotech-frontier-human-flourishing/
- PL R&D Economies & Governance: https://www.plrd.org/areas/economies-governance/
- JupyterLite documentation: https://jupyterlite.readthedocs.io/en/stable/
- Observable Plot: https://observablehq.com/plot/

The hosted Neuro Atlas is not claimed to be anonymously accessible. Tool links open only on explicit navigation, with `noopener noreferrer`; there are no iframes, automatic launches, key collection, or agent dispatch. Contribution links return to the parent lab routes and do not prepopulate, publish, or claim to create a task.

## Verification

Uses the existing Node test runner, TypeScript source loader, React, jsdom, and PostCSS. No dependencies or lockfiles changed.

```sh
UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--v8-pool-size=1 node --test --test-concurrency=1 scripts/lab-explorations*.test.mjs
UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--v8-pool-size=1 node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Vertical RED/GREEN slices covered exact lattice evolution, bounded validation, reproducible exports, actual UI controls and downloads, editorial route lookup, Observatory selection/history/list behavior, and intent-based comparison. Regression coverage checks range/row controls, download failure honesty, anonymous server rendering, all four dynamic route params, unknown-question 404, React server-render warnings, focus transfer, scoped CSS class references, and secondary touch targets.

## Integration owner checks still required

No full production build or independent critic was run in this lane. The parent owns integration, production build, browser QA/screenshots, security review, and the PR. In particular:

1. Check the exact routes at 320/390/1440px within the final lab shell, in both site themes. Arcade/comparison intentionally keep a light paper surface; Observatory intentionally keeps a dark instrument surface. All use the existing Aileron/Newsreader, PL mark, and brand blue.
2. Confirm native Next.js back/forward, refresh on every direct question route, keyboard selection, offscreen focus/scroll behavior, and Map/List at narrow widths. DOM tests exercise the history handler but are not a real-browser Next navigation smoke.
3. Download both file types in a real browser, confirm the saved SVG matches the current plot and the JSON reproduces it. DOM tests inspect real generated Blob bytes, not the browser's download manager.
4. Verify inherited root/shell CSS does not change the scoped composition, and the main lab links resolve after integration. The baseline worktree does not contain the parent primary UI.
5. No real OAuth or PDS writes were exercised. These alternatives do not invoke them; any owner-consented account smoke is a separate integration gate.
