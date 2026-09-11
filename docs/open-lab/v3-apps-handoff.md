# Open Lab v3 — app catalog and source-bound handoff

## Delivered behavior

`/lab/apps/` is a source-attributed catalog, not an execution surface. Its five editorial starter listings lead to a use-case preview, maintainer attribution, license/source links, limitations, local save/follow actions, and a review draft. Launch opens the actual external site with `noopener noreferrer`. There is no iframe, simulator, install, invented review score, member count, or implied usage metric. Local listing creation/editing is unpublished and explicitly scoped to this browser, identity, and Demo/live mode.

App shelves use `open-lab:apps:v1:<demo|live>:<encoded owner>`. The loader and writer share the same validator, including entry and serialized-size bounds. Corrupt, unknown-version, unknown-field, unavailable, and unconfirmed storage does not become a success or get silently replaced. Selection is an ID rederived from the current shelf; account/mode changes remount the catalog and editor, not merely the review textarea. Validation errors are correctable in the open editor rather than locking all subsequent writes.

Feed tool details expose the same app listing while preserving the existing bounded-task, evidence, source-result, build-edit, and record-editor paths. `WorkHandoff` offers Work here / Work on GitHub / Use my agent. Copy/download rereads the bench, saves the exact source-correlated task first, and then exports a text brief with task/source IDs, the exact goal, source context, source/artifact links, expected output, limits, and stop condition. Exports preserve an existing task's original goal/artifact/title and result. Current source context is explicitly distinguished from the older saved task snapshot. Missing or mismatched legacy source correlation blocks export instead of silently remapping it.

The exported brief is a manual handoff, not a dispatch. GitHub destinations require HTTPS on github.com without credentials or control characters and are not verified as belonging to the source project. No URL is fetched by the catalog/handoff code. No issue, PR, agent, account action, public record, or sync is created. Return remains the existing self-reported result path on the same source and My bench.

`/lab/explorations/arcade/` now redirects to `/lab/apps/`; its old implementation and standalone unit probes remain for compatibility, but this route no longer mounts it. Source discovery must not promote the retired runtime. The daily-shell lane owns the remaining feed-model action label change from “Try prototype” to “View app.”

## Verification and review

The original interrupted lane's TDD history is in session `20260911_131309_70068f`: catalog missing-model RED (message 7957), handoff missing-model RED (8137), and the earlier UI/storage/snapshot iterations. Its redirected worker log was empty on resume, so it was not treated as evidence of success.

Resume RED → GREEN:

- Invalid GitHub source URL followed by a corrected value: observed the corrected value was not persisted because the save button remained disabled; fixed action-error handling and reran the real React editor probe.
- Local idea brief: observed the actual idea text was absent; added source context with explicit current-vs-saved snapshot labeling and reran model/UI handoff probes.
- Broader Lab replay exposed two obsolete app-entry test assumptions: the retired arcade route was expected to render instead of redirect, and app SSR omitted the now-required auth provider and expected removed execution-oriented labels. Updated only those app assertions to the v3 contract; no production guards were relaxed.

Additional deterministic probes cover same-ID listings in different identity/mode shelves with open review/editor drafts; no network on local catalog/handoff paths; actual external launch links; readback/persistence; shelf bounds; export after storage corruption; preservation of original task goals and negative results; and return-to-source behavior. Parent review note 2 is covered by the open-dialog/open-editor account-and-mode regression.

Fresh-skeptical lane review: no remaining scoped logic/security blocker identified after those fixes. Source/code review and tests are not visual or independent release approval. No nested reviewer, browser, build, push, PR, merge, or deployment was run in this lane.

## Parent gates

- Integrate with daily-shell/science-tree at one pinned revision and rerun the full repository tests, frozen pnpm install, typecheck, and isolated production build.
- Inspect real desktop and 390/320px mobile catalog and detail drawers, light/dark hierarchy, actual clipboard/download flows, Back/Escape/focus return, and source-bound result return. CSS/jsdom checks do not establish geometry.
- Confirm the daily-shell feed action says “View app” and the catalog has no promoted embedded runtime entry.
- Independent exact-revision review and preview release remain parent-owned. Local listings/reviews are deliberately unpublished; cross-device sync, public UGC moderation/reviews, agent dispatch, and GitHub sync are not implemented or represented as working.

Exact local commit, commands, logs, counts, and integration notes are in `/opt/data/tmp/openlab-v3-apps-handoff-result.md`.
