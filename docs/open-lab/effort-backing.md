# Effort backing: a local allocation experiment

## What this is

An optional `/lab/efforts/` route, additive to Open Lab's collaboration and one-minute experiments. The Operate surface pairs a small support ledger with three editorial proposals and a work inspector. They are proposed next steps around a real open scikit-learn example, not active initiatives, staffed campaigns or endorsements. No fictional researchers, supporters, crowd totals or completed work are shown.

`POINT_BUDGET = 100` in `src/lib/lab-efforts.ts` is an illustrative, adjustable design assumption. Initial support is zero for every effort. Setting support, adding/reclaiming a point, or reclaiming an effort's support updates the shared finite budget. Reclaim from one proposal and allocate to another to shift support. Unallocated points are allowed. No authentication, network request, money, global vote, funding commitment, automatic review or remote execution occurs.

## Support is not evidence

Each proposal has work scope, a human acceptance criterion, negative-result handling and real source links. The tutorial and source-audit recipes reference scikit-learn's [common pitfalls documentation](https://scikit-learn.org/stable/common_pitfalls.html). The notebook proposal also links the [Jupyter notebook format](https://nbformat.readthedocs.io/en/latest/format_description.html); its format documentation was corroborated through the [official source](https://github.com/jupyter/nbformat/blob/main/docs/format_description.rst) because Read the Docs returned 403 to the fetch client.

One optional URL + summary per effort is saved separately, even with zero support. Only explicit http(s) URLs are accepted; credentials, whitespace/control characters and other schemes are rejected. Links use `noopener noreferrer`. Saving does not visit the URL or review its contents. A negative observation is welcome. Popularity is not scientific validity.

## Persistence and export

- Local storage key: `open-lab-effort-portfolio-v1`.
- Exact versioned state shape, exact effort IDs, complete allocation map, integer/nonnegative/per-effort and aggregate bounds. Malformed or unknown state is rejected as a whole, not partially restored.
- Corrupt state is visibly ignored, with zero support; no mount-time overwrite. The next intentional change replaces it.
- Storage getter/read/write/quota failures are caught. The UI remains usable in memory and says changes are not saved. Writes are read back before a saved-state claim.
- Same browser/origin only. Clearing storage or using another device creates new local state: this is not one-person-one-budget. Multiple tabs are not synchronized; the last saved edit wins. This is disclosed, not hidden behind fake identity.
- Unsaved evidence edits survive proposal selection within the current mounted component but not a reload; only explicitly saved notes are exported.
- Export downloads `open-lab-effort-portfolio.json`, titled “Open Lab — local effort portfolio,” with allocations, saved evidence, budget assumption, disclaimers, source links and proposed-work design sketches. Nothing is sent. Review private content before sharing it yourself.
- If the budget or effort catalog changes, revisit storage versioning/migration: existing state outside the new bounds is rejected.

## From an effort to a Hypercert

Official primary sources read on September 10, 2026:

- [Core data model](https://docs.hypercerts.org/core-concepts/hypercerts-core-data-model)
- [AT Protocol quickstart](https://docs.hypercerts.org/getting-started/quickstart)

A future integration should reuse `org.hypercerts.claim.activity`, not create a proprietary Open Lab effort-claim lexicon. The activity anchors work scope, contributors, time and location. Separately authored attachments, measurements and evaluations reference records using `{uri,cid}`; evaluators retain their own records on their own PDS. Current documentation says activity claims and linked records are immutable and on-chain tokenization is not implemented.

The expandable preview is explicitly “NOT ISSUED,” a local design sketch, not a validated mint payload or AT Protocol record. It intentionally contains no `$type`, invented DID/CID, contributor identity, work dates or claimed outcome. The human-readable design-sketch envelope is not a proposed protocol schema. Actual schema validation, provenance, authorized identity and explicit publishing would be separate future work. Claims/evidence/evaluations do not themselves certify truth, allocate funds, or convey equity/IP. No OAuth scopes, account operations or certificate issuance are implemented.

## Verification and integration

Run from repository root:

    UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--v8-pool-size=1 node --test --test-concurrency=1 scripts/lab-efforts*.test.mjs
    UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--v8-pool-size=1 node node_modules/typescript/bin/tsc --noEmit --incremental false
    git diff --check

Nine tests cover model defaults; allocate/reclaim/shift and strict bounds; 2,000 deterministic allocation attempts; corrupted reloads; evidence validation; named export/non-issued preview; actual jsdom actions; actual Blob JSON contents/download filename; and corrupt/unavailable storage UI. RED→GREEN was exercised for each slice. A fresh-skeptical review caught validation errors appearing below the evidence form; a failing regression test now requires budget errors beside the support controls.

Plain CSS is entirely scoped to `.effort-backing`, inherits `.open-lab` tokens, and has standalone fallbacks. Numeric controls are at least 46px; keyboard focus is visible; selecting a proposal moves focus to the inspector heading. No modal, layout, nav, shared CSS, package manifest or protocol files changed. The page imports its own CSS and uses alias imports. The parent must integrate its existing `/lab/` layout and may add an optional `/lab/efforts/` link. No shared nav replacement is required.

Standalone real-browser checks use an in-memory local bundle of the actual component (not a full Next build); integrated shell/fonts/dark mode still need the parent's final QA. No installs were needed; local `node_modules` was symlinked to the parent's existing dependencies without changing them.
