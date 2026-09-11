# Bottleneck co-creation workbench

## What exists

`/lab/bottlenecks/?case=reproducibility` is a compact, anonymous-first co-creation workbench, not a second operations console or a general feed. The loop is diagnose/refine → design an intervention → rally contributions → test outcomes → revise/retire. This lane prepares proposals; it does not run, staff, fund, accept, or publish them.

Exactly one case is implemented: `reproducibility`. `neural-measurement` and `open-artifacts` are not implemented. The case is an **editorial public-source starter**, not a fixture presented as activity, not an imported Console object, and not a validated or active campaign. Its primary source is the official [scikit-learn data-leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage), reviewed September 10, 2026. It establishes the leakage mechanism and split-first/train-only-fit practices, not the frequency of leakage or any measured improvement in an actual project. No notebook was audited. No people, measurements, or endorsements were invented.

`editorial-reproducibility-v1` identifies the reviewed editorial brief. It is not a source commit, immutable snapshot, AT URI, or CID. The upstream `stable` URL can change. Revise that editorial identifier whenever the baseline statement, interpretation, or source changes; existing drafts then require explicit recovery/reconciliation instead of being silently retargeted.

## UI and integration

- `BottleneckWorkbench` defaults to `owner="guest"`. Pass a stable local owner identifier when available; the prop is storage isolation, not an authentication assertion. It is omitted from exported packets.
- `onPrepareContribution?: (initial: Record<string,string>) => void` is the only contribution seam. The integration owner may open the existing `RecordEditor` with `kind="contribution"` and these initial values. This component does not import the editor, auth, or a network client.
- Mapping: `targetUrl` is the browser origin plus `/lab/bottlenecks/?case=reproducibility`; `evidenceUrl` is the primary source; `field` is the case's `ai-robotics` field, never a misleading filter value; `observation` names case/revision and includes labeled excerpts of every required proposal field. Arbitrary URL queries/fragments are stripped. HTTP/local/internal URLs cannot prepare public contributions; local JSON export still works in preview. A public HTTPS preview origin remains the browser's origin, not a claim of production deployment.
- The observation is validated at no more than 1,200 UTF-16 characters, including labels and warnings, with at most 80 characters per field excerpt and no split surrogate pair. Tests also pass the actual existing contribution validator. The full JSON is not attached automatically. The UI explicitly asks visitors to export it separately and review the summary. Preparation is not publishing, source-author approval, or acceptance.
- The default route has no callback and says contribution publishing is not connected. Parent owns any client wrapper, navigation changes, and final auth/public-write checks. Never make this callback auto-publish.
- `?case=` and `?field=` are URL-authoritative, including Back/Forward. Allowed fields are `digital-human-rights`, `economies-governance`, `ai-robotics`, `neurotech`, and `cross-field`; `all` is filter-only. The one starter appears under AI & Robotics and cross-field. Other/unknown fields and unknown case IDs show an honest empty state, not a substitute target.
- Links to `/lab/collaborate/` and `/lab/efforts/` are supporting tools only. They do not imply case-specific campaign membership, allocations, or network activity.

The route imports a lane-owned stylesheet. Every selector is under `.open-lab` and a bottleneck class; no existing UI, shared styles, or auth code is modified. Typography follows Aileron body / `var(--font-serif)` headings, warm paper/ink/blue, and dark-mode inherited tokens. Controls have 44px minimum height; layouts collapse at 900px and 600px, including 390px and 320px. Mounted tests do not establish pixel geometry; parent must check integrated mobile screenshots and keyboard flow.

## Draft and export contract

One independent local draft per owner × case × proposal kind (`refinement` or `intervention`). Incomplete, valid text autosaves on change; Save local draft retries explicitly. Eight fields are required for export/preparation:

1. Hypothesis and causal link (or a refined diagnosis).
2. Smallest useful action to test it.
3. Success signal.
4. Measurement/comparison and retained evidence.
5. People/roles to involve or consult, without assigning them.
6. Foreseeable harms, risks, and constraints.
7. Stop/review date or bounded criterion; when to revise or retire.
8. Requested evidence, reproduction, design, or review contributions; no funds or execution requests.

All fields are bounded to 1,000 UTF-16 characters, with unsafe controls rejected. Draft parsing is an exact-shape, owner/case/kind/source-revision check with a 48,000-byte UTF-8 cap. Exports are also capped and explicitly state `not-published`, `not-executed`, and `not-accepted`. Their target includes the case identity, editorial source revision, source URL, reviewed date, and browser-origin same-case permalink. These are local proposal packets, not public records. No fictional public URI/CID is supplied.

Baseline/source state is never patched by a proposal. Negative or inconclusive results can disconfirm a hypothesis or warrant revision/retirement; a lower corrected model score may be a useful result. This lane collects the proposed evaluation contract, not executed outcomes or accepted retros.

Malformed, foreign-owner, unknown-version, or stale-source saved data is not overwritten. A bounded recovery textarea exposes the original as explicitly unvalidated text for manual copying; oversized originals remain in browser storage. There is no raw-document importer and no reset/delete button. Recovery is deliberately manual, not automatic source migration. Browser-storage failures remain visible; the current in-memory draft remains editable/exportable. Device storage is not encrypted or account synchronization. Guest drafts are shared within one browser profile. Concurrent same-owner tabs are not collaborative editing and can race; export a copy before parallel work. No storage events, cloud sync, or multi-draft history are promised.

## Real Console bridge: gated design, not a live connector

The underlying Console model has one intervention targeting exactly one bottleneck. A bottleneck carries identity, focus area, type, statement, lifecycle/validation state, affected actors, resolution signal, optional inflection links, evidence/investigation, and version/edit metadata. Interventions add hypothesis, success signal, owner/collaborators, review checkpoint, activations, and evaluation/retro. These semantics are reimplemented generically here; private content and implementation are not copied.

Crucial storage distinction: Console bottlenecks are array objects within logical document `iv4:bottlenecks`, in private member-gated Habitat space type `org.plrd.interventions.workspace`, document collection `org.plrd.interventions.doc`. They are **not independent public PDS records**. Their private records do not belong in a public repo, public search, or the firehose. There is no anonymous query or browser proxy to that workspace.

An authorized operator can later establish selected **public projections**, using this runbook:

1. **Select privately.** Through existing team permissions, an authorized operator selects an object, not an entire document. Privately record the exact workspace locator, logical document key, object ID, object edit/version metadata, and current document revision/CID where the actual storage system supplies it. Preserve the source tuple and review evidence in a private mapping ledger. Do not put private workspace locators, owner identifiers, private version hashes, raw exports, or the ledger into public code or projection metadata.
2. **Whitelist a standalone brief.** Create a new public brief with only approved title/statement, public field/type, non-identifying affected-party categories, public evidence URLs with carefully scoped claims, uncertainty, proposed resolution signal, and explicitly approved status wording. Inflection descriptions are eligible only if already public and separately reviewed. Do not copy seeds, personnel/staff references, funder/deal notes, private links, owner/collaborator DIDs, evidence containing private data, unrelated fields, or whole source arrays. Private `ratified`/`binding` labels do not automatically become public validation claims.
3. **Obtain explicit owner review.** Show the exact proposed public envelope and all URLs to the appropriate source owner. Record approval of that specific revision privately. Confirm public evidence and privacy/licensing/consent implications. No inferred authorization from repository access or workspace membership. Approval must cover provenance wording; even revealing a relationship to a private source can require consent.
4. **Publish only the approved projection.** A separately authorized publishing flow writes only that envelope to the selected public surface and reads it back. Save the real returned public projection URI and CID/version. Do not invent record IDs or assume a webpage is an AT record. Add only the real public URI/CID and public revision to public provenance; bind these back to the private source tuple in the private ledger. This workbench does none of this today.
5. **Accept independent proposals, not edits.** Each author creates a separate proposal referencing exactly one public projection URI **and CID/revision**; record its author and record identity only through the real public publishing path. A proposal, contribution, local interest, and machine output are never acceptance, assignment, funding, or proof of effectiveness. Preserve competing diagnoses and negative results. Moderation and removal handling are required before public aggregation.
6. **Reconcile through human team permissions.** An authorized human compares a proposal with the publicly approved revision and privately re-reads the original object/document. If source version or the public projection CID changed, stop: rebase the proposal onto the new context and obtain renewed owner review as needed. Apply only explicitly accepted changes through the existing guarded team writer, scoped to the intended object while preserving all other array members. Use the provider's supported compare-and-swap/version preconditions where available; never pretend an `updatedAt` check alone is atomic. Without atomic write preconditions, serialize the authorized reconciliation and re-read immediately before/after; unresolved concurrency blocks automatic acceptance.
7. **Read back and retain the decision.** Verify the changed object and untouched neighboring state; keep actor, accepted proposal IDs, before/after source versions, rationale, and timestamps privately. Publish a new reviewed public revision only on fresh authorization. Retain negative/inconclusive outcomes and retirement reasons with their evidence. Never push private state back wholesale or auto-apply public proposals. Public withdrawal cannot guarantee deletion of already syndicated copies.

There is no import UI in this implementation. If added later, it must accept only a strictly bounded, exact-schema, pre-reviewed public-brief envelope with explicit provenance and actual public URI/CID (if published), reject any raw workspace document/array or private locator fields, and stay local until explicit publication. Merely including `reviewed: true` in an uploaded file is not authorization: verify approval through the actual authorized review process. This documented gate is intentional, not a fake connector.

## Bounded verification

Run from the worktree:

```
node --test scripts/lab-bottlenecks*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Vertical TDD covers source-linked model creation, strict parsing/export, callback schema compatibility, mounted local save/reload/download, incomplete-draft autosave, per-owner and per-kind isolation, stale recovery, blocked storage, URL fields and real history Back/Forward. Test text is synthetic proposal input, not public starter content or claimed results. No account, OAuth, PDS, payment, or live private data test is performed. No production build is required for this lane. Integration owner owns final visual QA, accessibility audit, release/account tests, and any PR/publication.
