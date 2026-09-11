# Open Lab prototype

A public-facing place to turn a shared bottleneck into a responsible intervention, a small test, and inspectable evidence. This branch is a product proposal and working prototype, **not a production community launch**. The existing PL R&D brochure is preserved.

## Try the proposal

On the deployment preview, begin at `/lab/`.

- **Bottlenecks:** `/lab/bottlenecks/` — inspect a public-source diagnosis, refine it, or sketch an intervention with a causal hypothesis, affected parties, measurement, risks and stopping condition. Preparation is not acceptance or publication.
- **Community:** `/lab/demo/` — follow three fictional collaborations, inspect people and discussion, reply locally, and follow a notification to the exact discussion. The demo label is intentional. Switching to real/empty mode hides this activity without deleting personal drafts.
- **Apps:** `/lab/apps/` — try the synthetic signal experiment, change its sampling, and export its actual configuration/results; inspect external source-linked science tools.
- **Atlas:** `/lab/atlas/` — prepare source-linked evidence proposals. These do not automatically change an Atlas.
- **Collaborate:** `/lab/collaborate/` — export bounded researcher/reviewer packets, import their return files, retain disagreement, and export a human-resolution bundle. No agent is launched and no model-provider account is collected.
- **Your starting point:** `/lab/onboarding/` and `/lab/profile/` — choose interests and contribution style, keep an owner-scoped profile draft, and optionally provide work/publication links. LinkedIn and Scholar are self-supplied links, not verified credentials or connected accounts.
- **Effort backing:** `/lab/efforts/` — allocate and reclaim a finite illustrative local budget while recording evidence separately. No money moves and no Hypercert is issued. This experiment is separate from the demo community’s small fictional interest budget.
- **Public record inspection:** `/lab/record/?uri=<encoded-exact-AT-URI>` — read a deliberately shared record from its current PDS. HTTPS retrieval is not repository-signature verification or scientific review.

The alternative entrances are at `/lab/explorations/`: **Science Arcade**, a real cellular-automaton instrument, and **Observatory**, a source-linked question map. They explore different ways in, rather than merely changing colors.

## What is real, illustrative, and not yet verified

| Layer | Boundary |
| --- | --- |
| Local tools and drafts | Interactive computation, saving, bounded imports, comparisons and exports run locally. Browser storage is not encrypted or cross-device sync. |
| Fictional community | People, discussion, proposals and narrative outcomes are clearly labeled fixtures. Local replies/interest never become public posts or actual notifications to other people. |
| Public sources | Editorial artifacts and attributed Bluesky reads are separate from demo activity and membership. Outages remain unavailable states, not fabricated live feeds. |
| AT Protocol | Dedicated official browser SDK, identity-only login followed by explicit per-action permissions, candidate schemas, direct PDS operations and exact current URI/CID/content readback. No CMS/admin identity reuse. |
| Account-level verification | Real account OAuth and public PDS create/update/delete need a separately approved test account and exact public text. Injected transport tests do not establish hosted account compatibility. |
| Launch operations | Global discovery/indexing, moderation, reporting/appeals, accepted-evidence workflow, founding cohort and public schema registration remain launch work. |

`LAB_ENABLE_PUBLISH` is off by default. A configured origin is not a passed OAuth test. A public record is not accepted science. A preview is not a private PDS sandbox.

## Local development and verification

Use Node 22 or newer. Vercel uses the repository’s **pnpm 10 lockfile**, so a successful npm install alone is not the deployment install gate.

```sh
npx --yes pnpm@10.17.1 install --frozen-lockfile
npm test
npx tsc --noEmit --incremental false
npm run build
npm start
```

The tests include local synthetic fixtures and injected protocol transport, not real public mutations. The release evidence must additionally include actual desktop/mobile interaction checks and an independent review at the final source revision. If dependencies change, maintain both lockfiles without re-resolving unrelated packages.

For identity-only local development, the runbook documents explicit IP-loopback configuration. Do not copy production credentials, disable a preview access gate, or reuse CMS authentication to make a test pass.

## Design and technical notes

- [Product rationale and launch experiment](strategy.md)
- [Acceptance and evidence standard](acceptance.md)
- [Protocol, candidate schemas and owner-gated launch checklist](protocol-runbook.md)
- [Bottleneck model and permissioned-console boundary](bottleneck-co-creation.md)
- [Demo fixtures, interactions and isolation](demo-community.md)
- [Onboarding, optional links and local action inbox](social-onboarding.md)
- [Finite backing and Hypercerts design](effort-backing.md)
- [Alternative entrance comparison](../lab-explorations.md)

The release PR is the home for the final revision, test/build receipts, screenshots, preview status and remaining limitations.
