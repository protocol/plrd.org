# Open Lab verification evidence

## What this evidence proves

Local production-build evidence was captured on September 11, 2026 from source commit `6e582b12b5c83f3a3d897fd5c1829ff45268118b`. The screenshots in this directory are actual Chrome captures, not generated mockups. Any subsequent screenshot/documentation-only commit must have an empty runtime/test delta and receive final review at its own SHA.

This is a prototype verification record, not production launch approval, a comprehensive security audit, an accessibility certification, or proof of community adoption. The PR reports its own current hosted-preview/check state.

## Executed checks

- Fresh isolated pnpm 10 frozen-lockfile install, followed by the project-wide test command: **275 passed, zero failed**. `npm test` includes the root `scripts/*.test.mjs` suites and the field-velocity suites. The evidence-recovery regressions are included in that standard gate.
- No-emit TypeScript check: passed.
- Next.js production build: passed; the task-owned production server answered the actual Lab routes.
- Responsive route sweep at an intended **320px** viewport: all 14 listed routes rendered a heading and had document, layout, and scroll widths no greater than 320px. Comparing only `scrollWidth` to `innerWidth` would have missed the original Arcade overflow, because Chrome expanded both to 350px.
- Desktop screenshots at **1440 × 1000**, mobile landing/inbox at **390 × 844**, and the repaired Arcade at **320 × 844**. The focused Arcade image is deliberately scrolled to show its complete headline and instrument.

Route sweep: `/lab/`, `/lab/bottlenecks/`, `/lab/feed/`, `/lab/apps/`, `/lab/atlas/`, `/lab/collaborate/`, `/lab/profile/`, `/lab/onboarding/`, `/lab/efforts/`, `/lab/record/`, `/lab/explorations/`, `/lab/explorations/arcade/`, `/lab/explorations/observatory/`, and `/lab/explorations/observatory/portable-evaluations/`.

## Interaction and recovery evidence

The browser pass exercised the notification-to-discussion path; local reply and finite-point persistence across reload; real/empty mode; optional interests and self-supplied profile links; proposal preparation/export; Observatory question selection and accessible list mode; light/dark switching; and explicitly confirmed demo reset without removing the ordinary guest profile. Earlier captures of those unchanged paths were made during integration; the bundled screenshots and following repaired-path checks use the source SHA above.

- **Evidence recovery:** an explicitly synthetic malformed original survived opening the workbench and scratch edits unchanged. The native backup download contained the exact original UTF-8 bytes. Replacement stayed gated by a separate acknowledgment; the deliberately replaced draft then survived reload. Mounted regressions also cover incompatible versions, oversized storage, unavailable reads, failed export/replacement, StrictMode, unrelated-key preservation, and permitted inputs whose serialized envelope exceeded the old restore limit.
- **Computed instrument:** selecting Rule 30 and using the actual JSON download control produced an 80-row, 121-column result. The downloaded configuration, method, limitation, and cells matched the real generator. This is an explicitly synthetic educational model, not a biological simulation or scientific finding.
- **Review boundary:** paired synthetic returns retain disagreement; import validates shape/source/role, not scientific truth. Review export requires an explicit local review. No remote agent execution is inferred from a prepared packet.
- **Identity boundary:** real component/SDK-boundary tests cover owner isolation, restored-session races, fresh consent, exact URI/CID receipts, uncertain-write recovery, stale-version refusal, and deletion confirmation. These are controlled transport tests, not a real-account OAuth/PDS pass. Cleanup-failure guidance remains visible after the owner Bench unmounts; expected default-off setup guidance stays in the sign-in flow.

## Remaining launch gates

In the local replay, capabilities reported `mode=unconfigured`, `canSignIn=false`, `canPublish=false`, `oauthVerified=false`, and `schemaPublished=false`. No real account was authenticated or publicly written for this verification. Canonical OAuth/schema setup, a consented real-account round trip, discovery/indexing, moderation and community operations remain separate launch work. LinkedIn/Scholar links are self-supplied, not imported or independently verified. Backing is local points, with no payment or Hypercert issuance.

See [the protocol runbook](protocol-runbook.md), [acceptance boundaries](acceptance.md), and [product rationale](strategy.md) for the precise next gates. Preserve the brochure; do not merge or launch merely because a preview builds.
