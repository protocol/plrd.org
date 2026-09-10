# Open Lab: local onboarding and next actions

This lane implements local self-prompts and useful profile context, not a social-network notification service. The primary path is bottleneck → responsible collective intervention → outcome evidence. Apps and work packets are supporting starting places.

## Public component APIs

```tsx
import { LabActionInbox } from '@/components/lab/social/LabActionInbox'
import { ProfileCompletion } from '@/components/lab/social/ProfileCompletion'
import { InterestOnboarding } from '@/components/lab/social/InterestOnboarding'
import { useLabSocial, LAB_SOCIAL_CHANGED } from '@/components/lab/social/useLabSocial'

// In LabShell's .lab-header-actions, after identity restoration:
<LabActionInbox ownerId={session?.did || 'guest'} />

// In ProfileWorkbench, using the same actual Open Lab DID:
<ProfileCompletion ownerId={session?.did || 'guest'} />

// Standalone starting-choices surface:
<InterestOnboarding ownerId={session?.did || 'guest'} />
```

All three default `ownerId` to `guest`. Do not render a guest editor while an authenticated identity is still restoring; wait for `isLoading` to finish. Components remount their inner state on owner changes, and never transfer guest drafts.

`LabActionInbox` also accepts `onResumeDraft?: (slot: string) => void`. If supplied, a draft action calls it with the exact canonical draft slot, for example `contribution:<encoded target>`. Parent can set RecordEditor `draftId` to that slot and derive the record kind from `slot.split(':')[0]`. Without this callback the real link opens `/lab/profile/`, where the existing bench lists the saved draft. It does not pretend to deep-open a draft without an integration handler.

The actual `/lab/onboarding/` route contains both the editable onboarding flow and a profile-completion form (`#profile-completion`). It supplies `LabAuthProvider` because the base tree has no Open Lab layout. The existing auth provider reuses its browser runtime if also present in the integrated layout. Parent may remove this route-local provider after verifying the layout supplies it. It does not use legacy CMS identity. Only the provider performs its existing read-only readiness/session initialization; the social components themselves do not fetch.

## One profile draft, not two

`src/lib/lab-social.ts` imports `draftKey`, `loadDraft`, and `saveDraft` from the existing canonical draft foundation. It reads and patches:

- `draftKey('profile', ownerId)` → existing `{version: 1, data, savedAt}` envelope.
- `draftKey('social', ownerId)` → ONLY mode, onboarding-skip choice, skipped optional links, read action IDs, and dismissed action IDs. No profile copy or public record lives here.

The current UI RecordEditor persists `EntryValues` with comma-separated `interests` strings. This adapter accepts either strings or arrays on read and writes the compatible comma-separated string. It merges against the latest stored profile, preserving unrelated fields and drafts. Onboarding preserves custom existing interests. Bounds failures do not silently truncate interests. Public payload conversion remains the bench's responsibility.

`useLabSocial(ownerId)` returns `profile`, `meta`, `drafts`, `ready`, `error`, `readError`, `refresh()`, `saveProfile(patch)`, and `saveMeta(patch)`. Save results are `{ok, error?}`. Saves are explicit, local-only and read back before success. Corrupt envelopes are not overwritten. Errors are visible; there is no destructive recovery button.

Same-tab updates made here emit `window.dispatchEvent(new Event(LAB_SOCIAL_CHANGED))`. Parent should emit this after successful canonical saves in RecordEditor and refresh its displayed bench draft list on this event. Components also refresh on native storage events and window focus; the inbox refreshes when opened. No polling. A simultaneously open external editor still needs this event to update immediately.

## LinkedIn schema integration

Only the profile lexicon gains optional `linkedinUrl` (URI string, maxLength 2048). Required fields, record key and all existing properties are unchanged. `LabDataMap.profile` adds the optional property. Runtime business validation requires a public HTTPS `linkedin.com/in/...` or `www.linkedin.com/in/...` URL, without a query or fragment; existing URL safety rules also apply. Other record kinds still reject this field.

Parent/bridge owns `lab-entry`, `lab-types`, `ProfileWorkbench`, and `RecordEditor`; this lane does not edit them. To publish/display the new optional link through the bench, add `linkedinUrl` to the profile entry defaults/field descriptor, profile payload optional-URL mapping, profile type, initial public-profile-to-entry mapping, and displayed link list. Preserve all existing fields when doing so. Until that bridge lands the new URL is functional locally and validates in the protocol layer, but the older bench editor does not necessarily include it in its public payload. These links are self-supplied, never verified credentials or synced connections.

Do not automatically seed a new local profile from a guest or public record. If adding an explicit public-profile-to-local-draft edit action, copy the complete profile only after that user action so omitted fields are not lost.

## Behavior and acceptance

- Completion uses the actual profile validator for field validity. Denominator: three useful core fields plus optional nonempty links that were not skipped. Omitted/skipped links confer no bonus and carry no penalty. This is not an expertise score, prestige ranking, or access gate.
- Optional links offer a skip path. Skipping clears only that local draft URL and stores the local preference, never modifying any public record. Invalid URLs may stay as unfinished local drafts but earn no completion credit.
- Recommendations use an explainable fixed ordering, known field IDs only, and contribution mode. They link to `/lab/bottlenecks/?field=<known field>`, `/lab/bottlenecks/?case=reproducibility`, `/lab/apps/`, and `/lab/collaborate/`. They claim neither AI matching nor active community participation.
- Inbox prompts derive from canonical profile/interests and actual saved note/app/contribution/participation drafts. A saved contribution is labeled a local evidence proposal, not an accepted or submitted intervention. Any future bottleneck-specific proposal store needs a separate parent adapter; this lane does not guess that store's schema.
- Read and dismiss are different explicit actions. Opening the inbox does not mark anything read. Completion removes the corresponding prompt. Dismissal survives mounts; restoring dismissed prompts is explicit. Draft IDs are stable by slot, so editing a dismissed draft does not nag again automatically.
- No peers, likes, invitations, online counts, browser Notification permission requests, external messages, automatic public posting, or remote execution.
- CSS is confined to `.open-lab` plus new `lab-social-*` names in the owned stylesheet. It uses existing paper/ink/blue tokens with fallbacks, Aileron body, serif `var(--font-serif)`, 44px controls, and narrow-screen rules. No shared style or existing component changes.

## Verification and integration limits

Tests: `node --test scripts/lab-social*.test.mjs scripts/lab-protocol-validation.test.mjs`

Types: `./node_modules/.bin/tsc --noEmit --incremental false`

The tests execute real React components in JSDOM, the actual route, the canonical draft helpers, and actual schema validation. They cover save/reload/recommendations, invalid and skipped links, owner changes, blocked dismiss, corruption/no overwrite, persistent read/dismiss, Escape/focus return, and no public writes. Synthetic test data is test-only, not seeded into product UI.

No production build, browser OAuth/account smoke, PDS write, browser mobile screenshot validation, or deployment was performed. Parent owns integrated 320px/390px/header/dark-mode visual QA, shared editor event wiring, the LinkedIn bench bridge, destination route integration, and final feature PR/release gating. Local storage is not multi-tab transactional storage: simultaneous edits to the same field still require a future conflict UX.
