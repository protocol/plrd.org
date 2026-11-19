# GitHub-only website editing: route migration

Website login, CMS editing, browser publishing, local community deletion, and credential-based maintenance writers are retired. Content changes go through a pull request to [protocol/plrd.org](https://github.com/protocol/plrd.org), review, merge, and deployment. A successful GitHub edit is not an immediate production update.

**Integration boundary:** this auth/write retirement requires the companion content migration. It supplies `src/data/site-content/pages.json`, `opportunities.json`, and repository-backed implementations of the existing `src/lib/indexer.ts` read contracts. The auth lane deliberately does not modify that module or those data/scripts. Its guide-link tests verify the exact destination strings; parent integration must verify the two source files exist and retained rendered-copy parity. The parent also reconciles public publication discovery with the companion recorded URI. Do not ship auth retirement alone as a claim that remote content overrides have been fully migrated.

## Legacy HTML routes (trailing-slash URLs)

These routes remain as noindex, read-only contribution guidance. They do not authenticate, load CMS records, render forms/editors/save buttons, or publish/delete anything. Query strings such as `/admin/?page=landing` do not restore an editor.

| Legacy route | Authoritative GitHub editing source / context | Public content URL retained |
| --- | --- | --- |
| `/admin/` | `CONTRIBUTING.md` and this route map; choose the source below | `/` |
| `/write/` | `content/blog/` for new/updated articles; follow the contribution guide | `/blog/` |
| `/edit/` | `src/data/site-content/pages.json`: `landing`; `src/app/page.tsx` for hardcoded layout/copy | `/` |
| `/about/edit/` | `src/data/about.json` | `/about/` |
| `/areas/edit/` | `src/data/site-content/pages.json`: `areas`; `content/areas/` | `/areas/` |
| `/areas/ai-robotics/edit/` | `content/areas/ai-robotics/_index.md`, shared `src/app/areas/[slug]/page.tsx`; existing canonical subtitle constants remain part of that renderer | `/areas/ai-robotics/` |
| `/areas/digital-human-rights/edit/` | `content/areas/digital-human-rights/_index.md`, shared area renderer | `/areas/digital-human-rights/` |
| `/areas/neurotech/edit/` | `content/areas/neurotech/_index.md`, shared area renderer | `/areas/neurotech/` |
| `/areas/[slug]/edit/` (unknown area) | `content/areas/` directory; no fabricated per-slug source link | `/areas/` |
| `/areas/economies-governance/edit/` | `src/data/site-content/pages.json`: `area-economies-governance`; route component for hardcoded sections | `/areas/economies-governance/` |
| `/areas/economies-governance/subareas/edit/` | `src/data/site-content/pages.json`: `area-eg-subareas` | `/areas/economies-governance/subareas/` |
| `/areas/economies-governance/impact/edit/` | `src/data/site-content/pages.json`: `area-eg-impact`; independent metrics remain read-only | `/areas/economies-governance/impact/` |
| `/areas/ai-robotics/[slug]/edit/` | `src/data/fa2/ai-opportunityspaces.json`: opportunity `id` | `/areas/ai-robotics/[slug]/` |
| `/areas/digital-human-rights/[slug]/edit/` | `src/data/fa2/dhr-opportunityspaces.json`: opportunity `id` | `/areas/digital-human-rights/[slug]/` |
| `/areas/neurotech/[slug]/edit/` | `src/data/fa2/neuro-opportunityspaces.json`: opportunity `id` | `/areas/neurotech/[slug]/` |
| `/areas/economies-governance/[slug]/edit/` | `src/data/site-content/opportunities.json`: active `eg--[slug]` record. Do not edit only stale `src/data/fa2/opportunityspaces.json` fallback fields and expect an override to change | `/areas/economies-governance/[slug]/` |
| `/authors/edit/` | `src/data/site-content/pages.json`: `authors`; `content/authors/` for bios/profiles | `/team/` and `/authors/[slug]/` |
| `/blog/edit/` | `src/data/site-content/pages.json`: `blog`; `content/blog/` for articles | `/blog/` |
| `/insights/edit/` | `src/data/site-content/pages.json`: `insights`; route/component data for local Radar | `/insights/` |
| `/publications/edit/` | `src/data/site-content/pages.json`: `publications`; `content/publications/` for research papers | `/publications/` |
| `/talks/edit/` | `src/data/site-content/pages.json`: `talks`; `content/talks/` for talks | `/talks/` |
| `/tutorials/edit/` | `src/data/site-content/pages.json`: `tutorials`; `content/tutorials/` | `/tutorials/` |
| `/outreach/collaboration/edit/` | `src/data/site-content/pages.json`: `collaborate` plus its historical About collaboration alias as documented by the companion migration; `content/outreach/collaboration.md` remains a fallback, not a replacement for the migrated override | `/outreach/collaboration/` |

`/areas/edit/` was advertised by the former edit-button map but had no exact editor route; it now has explicit honest guidance. AI/DHR/Neuro area editors also need explicit paths: their neighboring `[slug]` opportunity routes shadow the shared `/areas/[slug]/edit/` route and would otherwise treat `edit` as a nonexistent opportunity (verified as a 404 in the built production server before adding those paths). Those area guides link `src/lib/focus-area-descriptions.ts` as well as Markdown and the shared renderer, so canonical subtitle edits are not lost behind fallback precedence. Dynamic opportunity guides link to the authoritative dataset without inventing a per-record GitHub filename. All existing content slugs, article/profile/program data, and published external records stay intact.

## Legacy API contract

Formerly supported methods below return JSON **410 Gone**, `Cache-Control: no-store`, `readOnly: true`, and a canonical GitHub `contentUrl`. They ignore cookies, request bodies, OAuth callback parameters, and credentials. No provider/client/session is initialized, no cookie is read/set, no redirect is issued, no indexer/PDS network call is made, and no cache invalidation/edit-audit write occurs. Unsupported methods remain the framework's 405; they have no write handler.

| Method | Path | Replacement |
| --- | --- | --- |
| POST | `/api/login/` | No website login; GitHub PR workflow |
| POST | `/api/logout/` | No website session; no cookie inspection or mutation |
| GET | `/api/oauth/callback/` | No callback/session restoration or provider redirect |
| GET | `/api/oauth/client-metadata.json/` | No OAuth client metadata |
| GET | `/api/oauth/jwks.json/` | No signing keys/client |
| GET | `/api/pages/` | Repository content and normal public pages |
| GET, PUT | `/api/pages/[rkey]/` | Repository content; arbitrary/encoded rkeys are equally retired |
| GET, PUT | `/api/pages/about/` | `src/data/about.json`; preserves its specific GitHub URL |
| GET, PUT | `/api/opportunity-spaces/[rkey]/` | Authoritative repository opportunity JSON |
| POST | `/api/posts/` | Article Markdown in a GitHub PR; no standard.site record creation |
| POST | `/api/hypercerts/delete-record/` | Manage at originating service; no local deletion |
| GET | `/api/edit-history/` | GitHub history; no old editor audit disclosure or writes |

`GET /api/status/` alone keeps a minimal anonymous compatibility response, always `200 {"did":null,"handle":null,"loggedIn":false}` with `Cache-Control: private, no-store`. It never trusts even a forged old `plrd_session` cookie and never refreshes it. Retired encrypted cookies may expire naturally in visitors' browsers; server-side session processing is gone.

## Public integrations kept

- `/api/users/[handle]/`: public Bluesky profile/handle reads, retaining `@atproto/api`.
- Public DID/PDS resolution, Hypercert claim/creator reads, Constellation community evidence/comments, public profile/avatar links, and GainForest public blob URLs.
- Separate Simocracy, GainForest, FtC and other public impact/metric clients. Some public readers send GraphQL POST **queries**, not repository mutations. Do not shut down a shared external indexer/account because the website CMS was retired.
- `/.well-known/site.standard.publication`: read-only published-record discovery; the parent integrates the companion recorded publication URI. No publication/account creation is authorized or needed.
- Community content stays visible. A management link uses only an explicit safe HTTPS `sourceURL` carried by the current record, with no URL credentials. If missing, the UI directs users to the service where they created the record, without inventing a management URL. Existing contribution links remain external links, not local login/write flows.

## Removed implementation and operational commands

Removed: website AuthProvider/useAuth, OAuth/JWK client/stores, session encryption/env validator, authenticated agent restoration, runtime TID generator, admin DID allowlist, CMS/post/delete/audit writers, and obsolete inline/Markdown/page/opportunity editors/history controls. `PUBLIC_CONTENT_DID` names the preserved read identity, not an authorization role.

Removed maintenance commands/scripts: `generate-jwk.js`, `create-publication.mjs`, `sync-pages.mjs`, `publish-hypercerts.mjs`, and the `generate-jwk` package command. They are not supported alternate website-editing paths. Historical `data/atproto/` snapshots and external published records/accounts are unchanged. No credential/provider/account/source deletion is performed.

Unused direct dependencies removed: `@atproto/common-web`, `@atproto/jwk-jose`, `@atproto/oauth-client-node`, `@atproto/syntax`, `envalid`, `iron-session`. Public `@atproto/api` still transitively needs common-web/syntax. Both lockfiles remove the OAuth/session dependency chain and its undici 6 runtime package, without upgrading retained package versions. pnpm's pre-existing **dev-only jsdom → undici 8** remains; Node/Next built-in HTTP internals and unrelated advisories are not a claim of universal repository security.

## Verification

Run `npm test`, `npx tsc --noEmit`, `env -u COOKIE_SECRET -u ATPROTO_HANDLE -u ATPROTO_PASSWORD -u ATPROTO_JWK_PRIVATE npm run build`, and pnpm 10 `install --frozen-lockfile`. Standard tests include `scripts/session-security.test.mjs`, `scripts/auth-retirement.test.mjs`, and `scripts/site-content-*.test.mjs` from the companion lane. The source loader no longer injects a fixture secret.

Behavioral tests exercise retired methods with missing/forged/identity-claiming synthetic cookies, malformed bodies, callback code/state, absent secrets, and a fetch trap; require 410/no-store, no cookies/redirects, and no network calls. Tests also render every legacy guide, reject auth/write imports and maintenance writers, preserve public community/DID/profile reads, and validate source-provided management links. About's existing regression tests retain approved-copy checks and encoded-rkey retirement coverage. The real Hypercert modal/navigation regression test no longer mocks a deleted auth module.

The untouched baseline has a known Diagnose-copy assertion mismatch in `scripts/velocity/impact-methodology-tabs.test.mjs`; this migration does not weaken that assertion or change unrelated approved copy. Integration/release must still review exact-revision behavior, retained content parity, and any unrelated provider availability warnings. This document grants no release authority.
