# Open Lab v2: authentication and native connections

## What is implemented — and what is not verified

The Lab uses the official `@atproto/oauth-client-browser` public client, independent of CMS auth. Identity-only login is real SDK authorization, not a demo account toggle. After SDK init, public Bluesky profile data is read by the exact authenticated DID and its handle is forward-resolved to that DID. A profile read failure retains the authenticated DID fallback. Display name and avatar are self-reported presentation, not proof of a human's name, affiliation, or Open Lab membership.

The new default-export `BlueskyConnections` component supports `personDid?: string`; without it, it presents a public handle lookup. Parent/feed lane mounts it in PeopleWorkbench. It is not a fixture-person connector. Native follow/unfollow uses the official SDK session and the standard `app.bsky.graph.follow` collection, not a custom Lab graph or a CMS proxy.

All authorization/mutation tests in this lane are LOCAL tests with injected synthetic transport. No real account authorization, follow, unfollow, post, PDS mutation, deployment, external configuration change, or DNS change was performed. `oauthVerified:false` and `schemaPublished:false` remain literal truth markers. A successful local test is not an owner-authorized account smoke.

## Preview origin fix

At investigation time the existing deployed alias returned `canSignIn:false`, `mode:unconfigured`, and “Sign-in is configured for a different origin”; its exact metadata URL returned HTTP 404. The root cause is that the prior helper selected the unique `VERCEL_URL` even while the browser was on the stable branch alias.

Configuration precedence:

1. An explicitly supplied `LAB_PUBLIC_URL` is authoritative. An empty value disables login; an invalid origin fails closed. It is NOT replaced by an automatic fallback.
2. Only when `VERCEL=1` and `VERCEL_ENV=preview`, the deployment-provided `VERCEL_BRANCH_URL`, if present, is preferred. It must be a strict single-label `*.vercel.app` generated host: no scheme, path, port, credentials, query, fragment, whitespace, leading/trailing hyphens, or overlong label. A present but invalid/empty value fails closed rather than falling through.
3. Otherwise use strict deployment-provided `VERCEL_URL`. A missing branch variable can therefore use the unique deployment URL, but that does not authorize a different alias.
4. Outside trusted Vercel context, require explicit `LAB_PUBLIC_URL` (or the existing explicit loopback development setup).

Non-production Vercel explicitly configured origins must equal the validated deployment URL or validated preview branch URL. Production origins cannot be inherited into preview. `Host`, `Forwarded`, `X-Forwarded-Host`, legacy `PUBLIC_URL`, and `VERCEL_PROJECT_PRODUCTION_URL` never define the OAuth identity. Request/browser origins are comparison inputs only; matching a `.vercel.app` suffix does not confer trust. An arbitrary alias remains unconfigured. The generic helper contains no repository/team/branch name.

The exact branch fixture exercised locally is:

- origin: `https://plrdorg-git-feat-open-lab-protocol.vercel.app`
- client ID/metadata: `https://plrdorg-git-feat-open-lab-protocol.vercel.app/api/lab/oauth/client-metadata.json`
- callback: `https://plrdorg-git-feat-open-lab-protocol.vercel.app/lab/oauth/return/`

Parent must integrate and deploy before this can fix the live alias. Verify `VERCEL_BRANCH_URL` actually equals the desired alias in that deployment's exposed system variables. If it is missing, a branch-scoped `LAB_PUBLIC_URL` only works if it equals one of the trusted deployment-provided origins; do not add arbitrary alias trust or change legacy CMS `PUBLIC_URL` as a workaround. The system variable must be exposed/correct, or use the exact trusted unique URL. An access-protected deployment cannot serve public OAuth metadata: parent must choose an approved public preview; do not transmit bypass secrets in client IDs.

[Vercel documents the generated deployment and branch URL system variables](https://vercel.com/docs/environment-variables/system-environment-variables). Readiness at one URL never validates another URL.

## Permissions and public action boundary

[AT Protocol permissions](https://atproto.com/specs/permission) define `repo` write permissions with `create`, `update`, and `delete`; repository reads are public. [Identity-only OAuth](https://atproto.com/guides/permission-sets) needs only `atproto`.

- Login: `atproto` only. No user content writes, auto-follow, auto-post, or profile writes.
- Follow permission: `atproto repo:app.bsky.graph.follow?action=create`.
- Unfollow permission: `atproto repo:app.bsky.graph.follow?action=delete`.
- Maximum metadata adds `repo:app.bsky.graph.follow?action=create&action=delete` alongside the existing five exact custom collection maxima. Metadata is not a grant. No native update, feed post, blob, generic transition, wildcard, account-management, or authenticated AppView RPC permission is requested.
- `canConnect` is independent of `canPublish`. Valid origin configuration enables connection controls by default. `LAB_ENABLE_CONNECT=true` explicitly enables them; any explicitly present other value, including empty/false/typos, disables them. `LAB_ENABLE_PUBLISH` still requires exactly `true`; native follows do not turn custom publication on.
- Capability flags are cooperative app gates, not revocation of an existing token. Revoke account grants when access must actually end.

Public profile lookup uses the fixed `https://public.api.bsky.app`, with unauthenticated official Agent calls to `resolveHandle` and `getProfile`. The public AppView observes the lookup/IP. Profile-by-DID must return that exact DID, and the current handle must resolve back to it. Avatars are limited to canonical, query/fragment/credential-free HTTPS `cdn.bsky.app/img/avatar/` URLs; unsafe URLs are omitted. Images use no-referrer. These are HTTPS AppView checks, not cryptographic repository proofs. The lane also exercised the actual reader against the public `bsky.app` profile without authenticating.

## Connection execution and recovery

`createLabConnectionClient(oauthSession, {isCurrent, ...optionalTestDependencies})` exports `inspect(subjectDid)`, `follow(subjectDid, consent)`, `unfollow(subjectDid, consent)`, `pending(subjectDid)`, and `recover(subjectDid)`.

The caller must supply a synchronous live-session guard; the component uses `useLabAuth().isSessionCurrent(session)`, which reads runtime state, not a possibly stale React render. Each PDS request rechecks it. Logout, session invalidation, a new authorization, or unmount prevents subsequent requests and success UI. A request already sent may have committed: it is not retrospectively canceled or labeled failed.

Consent is `{public:true,did,subject,action:'create'|'delete'}`. Unfollow additionally requires the reviewed exact own native follow `uri` and `expectedCid`. Both DIDs are strictly validated; self-follow, account mismatch, wrong subject, wrong collection, missing permission, and stale origin are refused. The user sees both author and target handle/DID, the public/replicated/notification consequences, and an unchecked explicit confirmation. No matching display name is used as account proof.

The native follow schema declares `key:'tid'`. Rather than inventing a nonstandard hash key, the client scans existing own-PDS follow records before allocating a standard SDK TID. An existing match is fetched by exact URI and CID before it is accepted; no duplicate record is created. Scans are bounded to ten pages of 100, reject repeated/malformed cursors, and check a 20-second budget between pages; each call still has its own fixed deadline. Incomplete scans fail closed instead of treating a partial result as absence. Accounts beyond this limit can manage connections in Bluesky. No full graph is fetched on login.

Mutations hold an exclusive, nonqueued Web Lock for the author/subject, plus an in-tab guard. Browsers without Web Locks cannot mutate via this UI; do not silently degrade duplicate protection. This coordinates this origin's tabs, not another client/device. A competing outside client can still create duplicates; deletion rechecks for remaining follows and never calls that state “not following.” There is no cross-device atomic uniqueness guarantee for the subject in the AT Protocol repository API.

Before sending a mutation, a small author/subject-scoped recovery journal is persisted and read back from localStorage. It contains only the public action, intended exact record/URI, and known CID, never OAuth secrets. Storage failure blocks the mutation. Native create uses `validate:true`; delete uses `swapRecord` with the reviewed CID. PDS responses go through the existing `boundedLabFetch`: official session credential/DPoP/refresh handling, no application retry, 12-second acquisition/body deadline and 1 MiB streamed size limit. No legacy protocol writer was changed.

Create success requires the latest exact URI/CID/body readback, without a historical CID query. Delete success requires exact PDS `400 RecordNotFound`, followed by checking for another follow to the subject. Network errors, 5xx, timeouts, oversized/malformed responses, or mismatch after a mutation attempt yield `LabConnectionUnknownError(uri)` and retain the journal. They do not yield a false success or create a new record key on retry.

Recovery is explicit and READ-ONLY. It loads the persisted exact target, validates own DID/subject/action, and checks latest state. A recovered create must match the intended entire body and known CID when available. A recovered delete must be absent and checks for remaining duplicates. Merely observing absence after an uncertain create does NOT prove a delayed request cannot still commit, so the pending journal remains and retry stays blocked. An existing record after uncertain deletion also remains unresolved. Inspect/manage the account on Bluesky or seek owner-assisted recovery; do not clear storage to bypass the hold. Repeated automatic writes are never the recovery strategy.

Follow is one-way. No reverse relationship is fetched; the UI makes no mutual-connection claim. PDS readback is not AppView indexing confirmation or cryptographic repo-signature proof. Public copies/notifications cannot be recalled by unfollowing.

## Permission-return UX

`authorizeConnection(action, returnTo)` uses the official OAuth client with `prompt:'consent'`, `atproto`, and only the requested exact action scope. It is separate from `authorizeWrite` and `canPublish`.

Before navigating for authorization AND before a confirmed mutation with an already-authorized token, the UI saves a per-author draft containing the target DID, action, and safe return destination. Thus an ambiguous action restores its target after reload even when no scope-escalation round trip was needed. It stores no checked confirmation and no automatic-write continuation. The allowed `/lab/people/` route is additive; existing safe Lab destinations and validated queries remain allowed. On return, the target is looked up again and its current follow is freshly inspected. Confirmation starts unchecked and must be performed again. Failed/canceled authorization leaves the draft and shows an honest error. The component also provides a handle-only login form for signed-out users; never a password or app-key field.

## Parent-owned exact-origin smoke

1. Integrate auth before feed; mount `BlueskyConnections` in PeopleWorkbench. Update the old out-of-lane `scripts/lab-protocol-config.test.mjs` exact metadata expectation to add the native follow maximum (the old test intentionally knows only the five custom collections). Run all Lab tests, typecheck, production webpack build, and independent integrated product/security/browser QA.
2. After an approved deployment, fetch the exact alias capabilities and metadata without credentials or redirects. Require `canSignIn:true`, `canConnect:true`, `canPublish:false` unless explicitly approved, `oauthVerified:false`, exact client ID/redirect, `token_endpoint_auth_method:none`, and DPoP binding. Wrong unique URL/arbitrary alias must fail if branch URL is the chosen canonical identity. No authentication or deployment-protection HTML in metadata.
3. Only with owner-approved account consent: open the exact canonical alias, sign in using a handle, inspect the real provider consent showing identity only, and verify actual DID/handle enrichment. Check cancel/back/replay, reload/refresh, logout, storage restrictions, and that login performs NO create/put/delete PDS calls or CMS-account activity. Do not collect or log access tokens.
4. Only after separate exact target + author consent: search the target's public handle, verify its DID/profile, inspect current follow, confirm the public notification/replication notice, and request the separate follow scope. On callback verify the same draft and unchecked confirmation; it must not have followed yet. Confirm again, then inspect exact native record URI/CID/body in the PDS. AppView/UI indexing may lag.
5. Only after separate exact own-record unfollow consent: recheck current follow URI/CID, request delete-only permission if absent, return and reconfirm, execute CAS delete, and verify exact RecordNotFound plus any remaining follows. Do not claim copy retraction, mutuality, or Open Lab membership.
6. Run synthetic fault injection for unknown outcomes rather than deliberately creating ambiguous real public writes. Verify reload preserves recovery, retry stays blocked, and recovery only reads.

## Dedicated domain: approval path, not a performed migration

`openlab.plrd.org` is the user's desired eventual domain. This lane has made no DNS/domain/deployment changes. Parent should first obtain approval for domain ownership, hosting, routing, public access, and the security/isolation model. A new origin is a new OAuth client and new browser-storage space: it does not inherit preview grants or drafts. Offer explicit local draft export/import; never copy SDK IndexedDB credentials.

For an approved dedicated deployment in a production context, explicitly configure `LAB_PUBLIC_URL=https://openlab.plrd.org` (not the CMS `PUBLIC_URL`), keep custom publication off unless separately approved, and expose public metadata at the same `/api/lab/oauth/client-metadata.json` path with callback `/lab/oauth/return/`. Verify TLS, public metadata and the full owner-gated smoke before linking users there. A custom-domain preview is deliberately not admitted by the current strict generated-Vercel-host rule; supporting that would require a separately reviewed explicit trust configuration, not a suffix wildcard or request-derived origin.

DNS alone does not isolate browser OAuth secrets: all same-origin JavaScript can access the SDK's IndexedDB. A dedicated hardened Lab deployment should exclude CMS/admin routes and unnecessary third-party scripts; deploying this whole existing site under another hostname does not accomplish that isolation. Review CSP, XSS surfaces, account revocation and moderation/abuse handling before calling this a released social service.
