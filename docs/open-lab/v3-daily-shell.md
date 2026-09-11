# Open Lab v3 — daily catch-up and shell

## Behavior

The home/feed surface is now Catch up. The default unread view is browser-local acknowledgement history, not a claim that an item is new today. Readers can move directly to unread followed work, narrow to explicit help requests, inspect a source, and acknowledge only the exact revisions they opened or explicitly marked Reviewed in the current filtered view. Rendering a row alone does not acknowledge it. A changed source returns to unread; hidden/unreviewed items are not cleared. All activity reopens caught-up work. Reset filters also exits Needs a hand.

Demo examples, editorial starters, and local unpublished work keep visible provenance. Empty, loading, failed, and truncated public reads are not presented as a complete all-caught-up result. No dates, live community activity, collaboration metrics, or scientific validation are manufactured.

On your bench offers up to three unfinished, scoped task snapshots and a link to the full bench. Return a result opens the existing exact-ID result editor. It does not substitute a recipe, claim a reservation, submit an issue, or dispatch an agent. The result remains on the existing source-associated bench task, with its actual self-reported outcome and optional artifact URL.

## Storage contract

New key: `open-lab:catchup:v1:<demo|live>:<encoded owner>`.

The owner is the restored authenticated DID or guest; mode, owner, and version are checked at read time. No automatic guest/account/Demo migration. Scope changes remount the feed so reviewed selections, notices, and task drawers cannot follow another identity.

A receipt identifies a feed row and its source-content revision; it is not a timestamp. Receipt IDs and revision strings have strict limits. Both reader and writer enforce the same schema, 1,000 distinct row IDs, and a 1,048,576-byte UTF-8 serialized envelope. Reads reject oversized envelopes before parsing. Writers re-read current history, validate the complete merged envelope before writing, and require exact readback before reporting success.

Corrupt, unknown, wrong-scope, oversized, and unavailable reads block writes. Full history is preserved rather than silently evicted or overwritten; no new acknowledgement is saved when a bound would be exceeded. Existing IDs can still receive a revised receipt at the count cap if the envelope remains valid. A future explicit history-management/export flow is not implemented. LocalStorage merging is synchronous best effort, not cross-tab transactional synchronization; simultaneous independent writes can still race. This is not cross-device sync.

## Layout and navigation

Static left navigation, white working stream, tinted context, and existing right drawers have distinct surfaces. The shared canvas uses available width up to 1,600 px. Row sources/tags and branch management are progressively disclosed; provenance and next action stay visible. Existing responsive context drawer, native detail controls, keyboard focus treatment, touch target rules, light-first behavior, and dark tokens remain in place.

Primary navigation: Catch up; Work on ideas; Find tools; Explore the tech tree; Contribute; Find people; My bench. Improve the Atlas and Efforts experiment remain secondary with correct active states. `/lab/feed/` still maps to Catch up. Routes retain trailing slashes. The shell search says Search work and explicitly searches feed ideas, tools, and requests; it does not pretend to search the new science taxonomy. Tool rows say View app; the app listing and external-launch behavior belong to the apps-handoff lane.

## Verification and handoff

New model, UI, and CSS contract tests supplement the existing feed/following/bench, public-source isolation, shell/auth, theme-cascade/contrast, and security regression tests. UI tests execute the actual React components in jsdom with synthetic fixtures; they cover read/acknowledge/reload, filtered-out reviews, Demo/account isolation, failed saves, incomplete sources, exact stored-task continuation, negative result persistence, and reset from empty help views.

The resumed regression pass reproduced and fixed count overflow, UTF-8 envelope/writer-reader parity, a trapped empty help view, overbroad search wording, and a stale success notice after failed acknowledgement. A legacy appearance-test heading assertion was updated from The workshop to Catch up; its actual cascade, sizing, and theme assertions were retained.

This lane does not build, browse, publish, push, merge, deploy, or invoke other workers. Parent must replay the integrated exact revision, review App Store/feed detail interoperability, and verify actual desktop/mobile/dark layouts and native disclosure/focus interactions in a browser. CSS source tests and jsdom are not screenshot evidence. Exact local commit and test receipts are recorded in `/opt/data/tmp/openlab-v3-daily-shell-result.md`.
