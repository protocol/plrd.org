# Open Lab v2 — feed / workshop lane

## What the workshop does

The default `/lab/feed/` surface is a compact mixed workshop feed, not a link to the old discussion panel. Its eight initial entries interleave existing public tools/perspectives with the existing Demo provider's reproducibility, neural-duration, and reusable-artifact stories. Each entry identifies an artifact, a bounded next action, and the current epistemic stage. Prototypes in the invented stories are specifications, not working releases. Public tools are editorial links, not inventions claimed by the demo people.

- Discover and Following; Following is the union of followed disciplines, ideas, and people, deduplicated by activity ID. Selected disciplines match any selected tag, then intersect with the subscription union and text search.
- Nine local scientific disciplines: neuroscience, AI/machine learning, scientific software, mathematics, physics, biology, materials science, coordination science, and open systems. Disciplines with no entries show an honest empty state. Named multi-discipline views and idea-level tags persist locally.
- Detail panels lead with a bounded task and an artifact, then the test, uncertainty, contribution form, and supporting discussion. Real tool/source links, the existing contribution editor, and `/lab/collaborate/` run-packet preparation remain accessible. Run packets are not dispatches.
- A test can be saved to My bench, then returned with a result note, optional HTTPS artifact link, and worked/did-not-work/uncertain outcome. This is a personal commitment, not a task reservation or a notification sent to somebody. Results remain self-reported, not externally validated.
- The composer asks “What are you making?” and offers Prototype / Test result / Help wanted. Stage distinguishes idea, unfinished prototype, working, and tested. No stage grants scientific validation. Structured local build updates appear in the same feed and My bench.

## Identity, follows, and storage

`useLabIdentity` is unchanged. `useLabFollowing` composes browser-local preference storage with the current Demo provider's canonical follows/saved discussions. It does not duplicate those events. Shell must pass the actual restored identity to the one Demo provider's existing `storageScope` prop (see integration below).

New keys:

- `open-lab:following:v1:<demo|live>:<encoded owner>` — subscriptions, named views, idea tags, active Following/Discover and discipline filter.
- `open-lab:inventions:v1:<demo|live>:<encoded owner>` — personal bounded tasks, returned result notes, and structured local build updates.

Real identity and guest keys never migrate automatically. Demo/live keys remain separate. Corrupt or unsupported shapes are preserved and block writes with visible errors; writes are read back before the UI reports saved. Text search is transient. Demo people and idea follows still use the provider's `app-demo:community:v1:<scope>` state and actions; point budget, notifications, and replies are unchanged. Existing `plrd:open-lab:v1:<owner>:` social/profile/source-interest and record-editor draft keys are retained, not migrated. The legacy source-interest view is explicitly personal, separate from demo activity, and now refuses to overwrite unreadable data.

The local taxonomy retains compatible original IDs and exports an explicit `protocolFieldForDiscipline()` mapping to the original PDS field enum. Mathematics, physics, biology, and materials map to `cross-field`. No protocol schema, auth module, public record validation, record writer, or permission check changed. New structured build updates currently have no public publication path; public record authoring remains the separate reviewed RecordEditor.

## Profiles and people

`/lab/people/` imports the auth worker's default `BlueskyConnections`, and also presents demo workshop personas. Demo person buttons open the appropriate `LabDialog` with a local Follow action and clear historical-persona disclosure. The six personas reuse existing IDs for compatibility: Ada Lovelace, Hedy Lamarr, Nikola Tesla, Marie Curie, Katherine Johnson, and Leonardo da Vinci. These are fictional inventor-inspired scenarios, not their statements, endorsements, or actual users; no portraits or attributed historical quotations were invented.

My bench retains actual imported auth name/handle/DID/avatar and an actual Bluesky-profile link. A locally chosen display name is explicitly separate, not a replacement for the imported identity. Existing public record inspector/deletion/editing paths remain fail-closed. New bench sections show tasks/results/builds and followed disciplines/ideas/people, with functional details/unfollow controls.

`social/LabOnboardingGate.tsx` is a default export for shell mounting. It appears only after verified `isAuthenticated`, a DID, and completed restoration. It offers display information, interests, and optional Scholar/GitHub/LinkedIn URLs. Profile edits patch only changed fields of the existing profile draft. Completion/skip/local display name live in the existing DID-scoped social metadata. Complete or skipped state suppresses reopening across page mounts. No automatic publication or remote follow occurs. Blocked/corrupt storage stays visible; a separate one-visit dismissal does not claim persistent completion.

## Photo/video: implemented and deferred

Media selection is real local preview, not a fake upload. Accepted MIME types and matching signatures: PNG, JPEG, WebP, MP4, WebM. Images are limited to 8 MiB, video to 50 MiB, with four files and 50 MiB total per composer. SVG, HTML, empty, mismatched, and oversize files fail visibly. Media has alt text/video description, caption, remove, original download, and caption-manifest download. Videos have controls and no autoplay. Decode/playback failures are visible.

Binary persistence is deliberately deferred: no IndexedDB or auth-SDK storage is touched. Object URLs are scoped to the identity/mode composer instance, revoked on remove/unmount/scope change, and pending reads cannot add previews after disposal. Closing/reloading removes previews; the UI explicitly says text saved does NOT mean media saved. Original files and captions can be downloaded before leaving. Selection makes no remote upload calls, and this composer provides no pretend public-post button.

AT Protocol supports media. The missing work is this app's upload/publication/readback integration, not a protocol impossibility:

- https://docs.bsky.app/docs/tutorials/creating-a-post
- https://docs.bsky.app/docs/tutorials/video — video includes processing and account-level limits.

## Integration requirements

1. Integrate auth worker's `social/BlueskyConnections.tsx` first. This lane intentionally does not create a stub production component. Without it, full tsc/build fails with that missing module; People UI tests substitute only that seam in memory.
2. Shell mounts default `LabOnboardingGate` once under LabAuth/Lab contexts.
3. Shell passes `storageScope={session?.did || 'browser'}` to the ONE DemoCommunityProvider after identity restoration. Its existing keyed remount isolates demo state. Do not nest a second independent fixture provider. New preference keys already use verified DID + demo/live independently.
4. Shell's LabDialog change supplies the right drawer/focus/scroll contract; the new person/task/composer details all use LabDialog. This worktree's old centered LabDialog was not edited. Shell owns static left navigation and the one global demo menu. Keep the new persona disclosure in that menu; `DEMO_PERSONA_DISCLOSURE` is exported for reuse.
5. The previous `/lab/profile/` page has a supplementary `DemoPeople` section outside this lane's owned page paths; parent may remove it if redundant after People navigation is integrated.
6. Three old tests outside lane ownership assume the former feed starts with a supplemental discussion panel and eagerly mounts the legacy source controls. Update those assumptions to the new default feed, and click “Public sources & my records” before testing its legacy controls. Do not reintroduce an obsolete panel just to satisfy them.

## Verification

Tests use the standard `scripts/lab-*.test.mjs` glob, actual TypeScript/React sources, and jsdom. RED→GREEN receipts include missing subscription model; missing curator action; missing feed model; missing provider reply projection; missing central feed; central FeedWorkbench returning zero mixed rows; missing authenticated onboarding; missing personal-task model; unsupported structured build action; missing science taxonomy; missing preview validator/picker; missing bench/composer/People UI; auth restoration blanking the feed; and a corrupt legacy bookmark being overwritten. Each was observed failing before its corresponding implementation/fix.

Covered behavior includes OR/dedup semantics, resets, saved views, reload, mode/owner isolation, provider-backed follows/replies, no network calls from local social/media interactions, actual profile fields, no automatic onboarding publication, local bounded-task return, honest stages, MIME/signature/size rejection, local media preview/removal/scope cleanup, and legacy/public fail-closed record tests.

Release notes and exact command exits, commit SHA, browser screenshots, and remaining parent integration gates are in `/opt/data/tmp/openlab-v2-feed-result.md`. This is a lane handoff, not a deployment or a claim that integration build is green.
