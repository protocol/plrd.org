# GitHub-only editing: verification notes

## Scope

Website copy and editing move to repository Markdown/JSON and reviewed pull requests. Website OAuth, sessions, admin-DID authorization, inline editors, publishing, local community deletion, and credential-based maintenance writers are retired. Public Hypercert/community/profile/DID/impact readers and published external identities remain read-only integrations; no external accounts or records are deleted.

Authoring paths: [content guide](../content-migration.md). Legacy URL/API behavior: [route map](../github-editing-retirement.md).

## Executed checks

- A fresh pnpm 10 frozen install and production build with website credentials unset.
- Targeted auth/session/guide regressions on deployment Node 24, typecheck, and full baseline-aware Node tests. The existing unrelated Diagnose-copy assertion is not weakened.
- Actual local production HTTP: all 17 retired API method cases return 410/no-store; 23 former editor URLs display noindex GitHub guidance with no forms/login/save controls. Anonymous status and the exact existing publication-discovery URI are preserved.
- All 16 former CMS-content routes retain exact main-body text **and ordered links** against independently captured production HTML. This includes all four active Economies & Governance opportunity detail routes.
- Current public profile lookup and aggregate impact API return 200 with populated provider data. Existing GainForest certificate and Ma Earth snapshot-fallback warnings remain; a successful API response is not a claim that every upstream provider is healthy.
- Built dependency traces and JavaScript contain no retired OAuth/session runtime dependencies or authentication markers. Public `@atproto/api` remains; dev-only test dependencies are not production runtime evidence.
- Independent data and security reviews, with editorial positive controls and source-link resolution checks. Initial public-record evidence remains immutable; ordinary future copy edits do not need to rewrite the migration archive or receipt.

## Native browser evidence

These are actual headed-Chrome captures of the local production build at runtime revision `1b336be42189c7b4811a7acbb53f7d1c26a76173`, using real repository content, not mockups. Desktop is 1440px; mobile emulation is 390px. The later runtime change tightens source-management URL validation only; it does not alter these four captured pages or their content. Native mobile menu navigation and Team Advisors selection were also exercised. Mobile emulation is not a physical-phone touch test.

| Page | Desktop | Mobile |
| --- | --- | --- |
| Retired opportunity editor | [Capture](editor-1440.png) | [Capture](editor-390.png) |
| Homepage | [Capture](home-1440.png) | [Capture](home-390.png) |
| Collaboration | [Capture](collaboration-1440.png) | [Capture](collaboration-390.png) |
| Retained EG opportunity | [Capture](eg-opportunity-1440.png) | [Capture](eg-opportunity-390.png) |

These notes document candidate verification, not a production release. Merge and deployment remain separate from the migration PR.
