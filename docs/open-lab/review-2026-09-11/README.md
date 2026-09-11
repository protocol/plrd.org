# Open Lab — September 11 review evidence

This packet contains **13 native localhost browser screenshots**, captured from implementation revision `4bcbeaf2debd14b7386719f9dc99ff5eae3811e9` at `http://127.0.0.1:3390`. They are local development-server captures, not hosted-preview captures or proof of authenticated provider behavior. The evidence-only commit does not change application code, tests, dependencies, or infrastructure.

[`manifest.json`](manifest.json) records each image's SHA-256, source revision, and origin. All 13 hashes were checked before attachment. PNGs contain only IHDR/IDAT/IEND chunks; no embedded text or EXIF metadata. Visual review found only labeled local QA/demo content, public site material, and the public `bsky.app` profile/DID. No credentials, signed URLs, private team records, or authenticated account content are included. Historical-person personas are fictional examples, not mapped accounts.

## Captions

| File | Evidence and limits |
|---|---|
| `home-1440.png` | Compact left navigation, workshop feed, branch context, persistent account/My bench; local QA build and fictional demo activity. |
| `home-390.png` | 390×844 mobile workshop, visible Curate and first local QA row. |
| `home-320.png` | 320×812 mobile workshop with naturally wrapped controls/content. |
| `profile-320.png` | 320×812 My bench; local profile draft, not a public profile. |
| `observatory-320.png` | 320×812 tech tree defaults to List. |
| `tech-tree-light-desktop.png` | 1440×1000 light tech-tree Map and source-linked editorial brief; geometry is not a measured live relationship. |
| `tech-tree-dark-desktop.png` | Same desktop route with explicit dark appearance. |
| `first-arrival-real-login.png` | Skippable real-SDK sign-in entry UI; empty handle and no account authorization. |
| `real-bluesky-profile.png` | Public `bsky.app` lookup while signed out; Open Lab subscription is local, not a native Bluesky follow. |
| `real-public-read-provenance.png` | Four supported public collections honestly return no activity for the selected DID; bounded read, not a complete network feed. |
| `global-demo-control.png` | Explicit global Demo/real-empty separation and local-only/no-messages notice. |
| `final-media-reopened.png` | Saved local QA build retains decoded PNG/MP4, caption, and source-linked negative result after reopening; not scientific evidence or a public upload. |
| `homepage-openlab-ad.png` | Local PL R&D homepage invitation; no production launch. |

[`shell-probes.json`](shell-probes.json) covers requested widths 1440/1024/390/320 and required shell controls. [`route-probes.json`](route-probes.json) covers eight secondary routes at 320px. [`media-final-probes.json`](media-final-probes.json) records retained image/video dimensions, duration, controls, one saved build, and negative-result presence. The accompanying responsive assertion run passed 5/5 with no skip.

## Exact implementation validation

At `4bcbeaf2debd14b7386719f9dc99ff5eae3811e9`, the completed isolated replay used a fresh pnpm 10 frozen install, then the full suite (**519 tests: 518 passed, 0 failed, 1 optional native-probe-file skip**), typecheck, and production build. The native-probe assertion was separately exercised, not silently counted as a pass in the full suite. Build completed with existing remote-data/cache warnings; completion is not a dependency/security clearance.

Independent product/QA review: **PASS for draft review preview**, no reproduced material fix queue. Independent security review: **PASS CONDITIONAL for draft review preview**, no reproduced material finding. Both reviewed this exact implementation revision and completed before the preview push. The parent reproduced the reviewers' three product and ten security probes. Cancellation at the real installed SDK's final fetch boundary prevents later resource transmissions; already-transmitted writes can still commit and remain conservatively recoverable, never automatically retried.

The earlier [`verification.md`](../verification.md) describes the previous preview iteration; use this packet and the current PR deployment readback for the September 11 update.

## Held gates

- Hosted configuration/metadata readiness must be read back at the exact deployed origin. Local sign-in UI is not that readback; see the current PR description for the result.
- Consented real-account authorization, callback, refresh/logout, authenticated profile completion, native follow/unfollow, and public-record receipts remain unverified. No real account was authenticated or mutated for this packet.
- Custom publication remains default-off. Local bench, media, results, bookmarks, subscriptions, and saved views are not cross-user synchronization. Populated/error public-feed cases use synthetic responses in tests, not fabricated live activity.
- Canonical schema publication, discovery/indexing, moderation, abuse handling, dedicated-origin security, and dependency/hosting review remain launch gates.
- No merge, production deployment, domain/DNS change, or `openlab.plrd.org` launch is authorized by this review.
