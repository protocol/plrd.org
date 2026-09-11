# Open Lab protocol pilot runbook

## Status and trust boundary

Open Lab uses the official `@atproto/oauth-client-browser` SDK, separate from the existing CMS OAuth client, cookie, admin allowlist, indexer and page-writing identity. The SDK implements PKCE, DPoP, callback verification, refresh, IndexedDB storage and revocation. Open Lab accepts an existing AT Protocol handle; no password, app password, provider key or new confidential-client secret is collected. The browser session grants no CMS admin rights.

This is a working candidate-schema protocol client, not a released or populated social network. Configuration readiness is not account validation: capabilities explicitly return `oauthVerified:false` and `schemaPublished:false`. No real account authorization or public PDS mutation was performed as part of implementation tests. Owner consent and an exact-origin account smoke are separate launch gates.

The records are public, self-reported and potentially replicated. They do not post to the Bluesky timeline, create community membership, imply peer review, update the Neuro Atlas, or make a submission editorially featured. PDS readback is not a cryptographic repository-signature proof. A PDS deletion does not recall replicas or copies. The UI must state these distinctions before every public confirmation.

## Configuration

Use Node 22 or newer for the browser SDK toolchain. Both repository lockfiles are maintained; existing npm/pnpm dependency baselines otherwise remain separate. Native pnpm 10, not a conversion of the npm graph, owns pnpm-lock.yaml.

- `LAB_PUBLIC_URL`: exact public HTTPS origin without credentials, path, query or custom port. Example: `https://lab.example.org`. Empty explicitly disables sign-in. This does not use legacy `PUBLIC_URL` or Host/Forwarded headers to choose the OAuth identity.
- On Vercel previews (`VERCEL=1`, `VERCEL_ENV=preview`), omitting `LAB_PUBLIC_URL` prefers the strict deployment-provided `VERCEL_BRANCH_URL`; if that variable is absent, use strict `VERCEL_URL`. A present malformed/empty branch value fails closed. Non-production Vercel origins must equal a validated deployment or branch URL, never inherited production or an arbitrary alias. Production does not select the preview branch URL. Access-protected previews cannot serve public OAuth metadata: use an owner-approved public deployment. See [v2 auth](v2-auth.md) for exact-alias smoke and the dedicated-domain approval path.
- `LAB_ENABLE_CONNECT`: absent or exactly `true` enables separately consented native Bluesky follow/unfollow on a configured origin; any other explicitly present value disables those controls. This is separate from custom publication.
- `LAB_ENABLE_PUBLISH`: exactly `true` enables custom Lab-record write controls. Default/off keeps custom records local; it does not disable separately consented native follows. This is a cooperative client feature gate, not a revocation of an existing PDS token. Disable/revoke grants at the account too when needed.
- Local: set `LAB_PUBLIC_URL=http://127.0.0.1:3000` and open that exact IP-based origin. IPv6 loopback also works. The official SDK loads the special `http://localhost?redirect_uri=...&scope=...` client ID; the callback remains the IP-based `/lab/oauth/return/`. Plain `http://localhost:3000` is deliberately not treated as the OAuth origin. Production/Vercel cannot use loopback config.

`GET /api/lab/capabilities/` is no-store and checks the request origin against configured identity. `mode:ready` means the complete origin/config is usable in principle, NOT a completed external account test. The browser revalidates the full metadata identity and refreshes capabilities before every authorization/write. `GET /api/lab/oauth/client-metadata.json` must return JSON at that exact URL with no redirect or authentication wall. It permits cross-origin metadata reads, declares a public web client (`none`, PKCE/DPoP) and the five custom collection-specific maxima plus native `app.bsky.graph.follow` create/delete permissions. Metadata does not grant those permissions.

Base login requests only `atproto`. A separate explicit Authorize action requests just one `repo:<collection>?action=<action>`, plus `atproto`. Only profile allows update; all five allow create/delete. Native connection authorization separately requests only `repo:app.bsky.graph.follow?action=create` or `?action=delete`, plus `atproto`. There is no generic transition scope or Bluesky feed/profile write grant. Authorization returns to the draft, NEVER an automatic publish/delete continuation; review and confirm again. A new grant can replace earlier action scopes, so check actual token scope each time.

Browser OAuth stores credentials in the SDK's IndexedDB store. They are accessible to same-origin JavaScript: prevent XSS, do not render user HTML, and do not treat CMS/third-party scripts on the same origin as isolated from these credentials. A dedicated hardened origin/BFF is a possible later hardening choice, not implemented here. Sign-out immediately removes the runtime session and invalidates pending restore/callback/authorization navigation, then asks the SDK to remove its local session with best-effort remote revocation. A late restored session is discarded and passed to SDK sign-out, never installed or redirected. The installed SDK suppresses remote revocation errors: a resolved logout confirms neither remote grant removal nor that revocation failures were observable. If SDK cleanup throws, the runtime remains signed out, but local persistent removal is unconfirmed; clear this site's browser storage. Account-side Open Lab grant revocation is the decisive remote recovery step, including after suspected compromise. Browser storage restrictions and CORS failures are honest failure states.

The fixed `https://bsky.social` handle resolver sees the supplied handle and visitor IP. `plc.directory`, a did:web domain and the resolved PDS see public lookup traffic. Explain this in the login UI. No arbitrary server-side DID/PDS proxy exists.

## Candidate schemas and portability

Static JSON candidate schemas live at `public/lab/lexicons/org.plresearch.lab.{profile,note,app,contribution,participation}.json`. The `org.plresearch` namespace follows the existing project domain, but these five app-specific lexicons have NOT been published through global Lexicon/DNS resolution. Confirm domain authority before registering them. PDS calls explicitly use `validate:false` only after the app's formal Lexicon validator and stricter business validation pass. An owner smoke must check that the actual PDS accepts this candidate-schema flow. A PDS that refuses it is an incompatibility, not a reason to silently switch collections.

All records include `$type`, stable community marker `https://www.plrd.org/lab/`, `createdAt` and kind-specific data. The stable community marker is shared by explicitly enabled pilots; a preview is NOT a private PDS sandbox. Profiles use `self`; other records use SDK TIDs. Profile updates preserve `createdAt` and atomically compare the previously reviewed CID. App records and contributions can reference public artifacts without claiming their creators have joined.

No indexer changes, global discovery or moderation queue are included. The public record inspector reads a supplied exact AT URI. A public member notebook lists one DID/collection page at a time. It is not a list of all community members. Public workbench Bluesky discovery stays separate from this protocol client.

## Frontend integration API

Mount `LabAuthProvider` around the Lab app only. `useLabAuth()` returns:

- `session:{did,handle,displayName?,avatar?}|null` — after official SDK init, the public AppView profile must match the exact SDK DID and the current handle must resolve back to it. Display name is presentation, not identity/affiliation proof. Only safe Bluesky CDN avatars are rendered. Lookup failure retains the DID fallback; generation guards prevent late lookup/restore from undoing logout.
- `oauthSession:OAuthSession|null`, `isAuthenticated`, `isLoading`, `error:string|null`, `capabilities:LabOAuthConfig|null`.
- `login(handle,returnTo?)`, `logout()`, `authorizeWrite(kind,action,returnTo?)`, and `authorizeConnection(action,returnTo?)` — all return promises; catch rejections and display the hook error. Base login remains `atproto` only.
- `isSessionCurrent(oauthSession)` — synchronous runtime guard for work that must stop on logout/session change, even before React renders.

`BlueskyConnections` (default export from `@/components/lab/social/BlueskyConnections`) supports optional `personDid` and otherwise a public handle lookup. The new `@/lib/lab-connections` client performs native follow/unfollow via the SDK session, exact public author/subject consent, minimum per-action scopes, bounded own-repo existing-follow lookup, a standard TID, localStorage recovery journal, and exclusive Web Lock. It requires exact URI/CID/body readback or exact RecordNotFound and never retries an uncertain mutation automatically. Recovery is read-only, remains blocked on uncertain create absence, and survives reload. The component saves the target before scope escalation, returns to that draft, and requires confirmation again. Follow is one-way, not proven mutuality. Detailed contracts, limits, security boundaries and owner-gated smoke: [v2 auth](v2-auth.md).

`@/lib/lab-protocol` exports:

- `readLabRecord(uri:string):Promise<LabRecordView>`.
- `listLabRecords(did:string,kind:LabKind,options?:{limit?:number,cursor?:string}):Promise<LabRecordPage>`.
- `parseLabUri(uri)` returns `{did,collection,kind,rkey}`.

`LabRecordView = {uri,cid,authorDid,kind,record,data,pds,provenance:'pds-https-unverified-signature'}`. `record` has metadata and business fields; `data` contains only business fields typed by `LabDataMap`. `LabRecordPage = {records:LabRecordView[],cursor?:string,authorDid,kind}`. Defaults to 30, maximum 100. Follow each collection's cursor explicitly. A returned page is never a declared complete notebook. Failed/malformed pages throw rather than claiming an empty notebook. No local draft fallback is used for public record inspection.

Public reads use the official DID resolver and Agent directly in the browser, without cookies/auth headers. Only valid did:plc or domain-only did:web identifiers are supported; no handles, encoded ports, did:web paths, arbitrary schemes or literal IP endpoints. PDS origins require public HTTPS, no credential-bearing URLs or private suffixes, and no redirects. Responses have a 12-second network deadline and 1 MiB streamed size bound; request smaller pages if needed. DNS rebinding/public-host DNS and the PDS operator remain trust boundaries; this is not a cryptographic DID/repo proof verifier. Server execution is refused before external fetch.

`@/lib/lab-records` exports:

- `publishLabRecord(oauthSession,kind,data,consent):Promise<LabWriteReceipt>`.
- `deleteLabRecord(oauthSession,uri,consent):Promise<LabDeleteReceipt>`.
- `LabPermissionError` (`kind`, `action`) — offer an explicit Authorize button; don't silently grant/write.
- `LabWriteVerificationError` (`uri`) — the operation may already have committed. Preserve the draft and inspect that URI before retrying. Never automatically duplicate a failed-verification create.

`LabWriteConsent = {public:true,experimental:true,did,action:'create'|'update'|'delete',expectedCid?:string}`. Obtain this from an explicit user review of the exact data and public-replication/candidate-schema notice, not from page load. Create works for all five kinds. Update is profile-only and requires `expectedCid` from the reviewed profile. Delete requires a reviewed exact own URI and `expectedCid`; it cannot delete another DID's record.

Each mutation uses the SDK session's own DID/PDS; caller-supplied author/authority/acceptance fields are refused. Runtime validators enforce exact allowed fields, sizes, enums and safe URLs. Treat text as text, never `dangerouslySetInnerHTML` or unsanitized Markdown. Empty optional URL fields must be omitted, not submitted as empty strings.

Credential-bearing query or fragment parameters (including hash-router queries and percent-encoded parameter names) are rejected before any write. Harmless research anchors are retained; the reviewed URL is never silently stripped or normalized.

Authenticated mutation responses and all preflight/readback responses wrap the official session's `fetchHandler`: each request has a 12-second deadline covering response acquisition and body streaming, and a 1 MiB streamed cap before SDK buffering. A deadline also settles locally if a transport ignores abort or stream cancellation; it cannot undo a committed write. The wrapper neither extracts credentials nor adds retries; SDK token refresh/DPoP behavior remains SDK-owned. Any timeout/oversize after a mutation attempt returns `LabWriteVerificationError` with the exact target URI, never `verified:true`. Preflight failure makes no mutation. `createLabRecordWriter` optionally accepts `{timeoutMs}` as its third argument to tighten (never exceed/disable) the deadline for controlled tests; public helpers use the fixed default.

`LabWriteReceipt = LabRecordView & {verified:true,verification:'pds-readback'}` only follows exact latest URI/CID/body readback. The read intentionally has no historical `cid` argument. `LabDeleteReceipt = {uri,deleted:true,verified:true,verification:'pds-record-not-found'}` requires the exact PDS RecordNotFound response after CAS deletion; 5xx/network failure/still-present are not successful deletion.

There is no new authenticated `/api/lab/records/` server endpoint. Use these browser functions, not the superseded server/API contract.

## Verification and owner-gated launch checklist

Local tests use synthetic records and injected SDK/PDS transport; they make NO live public writes. Run `npm run test:lab` and `node node_modules/typescript/bin/tsc --noEmit --incremental false`. Constrain concurrency with `UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--v8-pool-size=1`. The integration owner runs the full production build and independent UI/security review.

Before enabling a public pilot, obtain the owner's explicit account/write consent, then:

1. Fetch the exact public metadata URL without login/redirect; check client ID, callback and action scopes. Verify an unrelated preview/alias reports unconfigured.
2. Use an owner-approved test account for identity-only login, cancel/back/replay failure, reload/refresh, and logout. Observe the real authorization screen and token scope; never claim the synthetic tests prove these.
3. With separate approval for the exact public text, create each candidate kind; read the returned URI signed out in a different browser. Verify the latest CID and body. Check profile update conflict behavior and own deletion. Confirm no Bluesky timeline post/Atlas edit or legacy CMS access.
4. Verify draft recovery after authorization, accessibility, permissions UI, deletion notice, no raw-HTML rendering, clear outage states, public record links, and per-collection notebook pagination in the integrated UI.
5. Establish moderation/reporting/takedown policy and app-specific discovery/indexing before calling this a released community. Do not fabricate member counts, reviewers, impact or live campaigns to fill the pilot.
