# Open Lab demo community

## What this is

An explicitly fictional community that demonstrates the loop:

shared bottleneck → refinement → bounded intervention → contribution → uncertain/negative evidence → design revision.

Six invented humans, three case IDs (`reproducibility`, `neural-measurement`, `open-artifacts`), three proposals, three multi-person discussions, and four small seeded support allocations. The reproducibility story is the deepest. The other cases explore a missing measurement denominator and a reuse-permission blocker. No real company affiliation, profile URLs, remote portraits, DID, AT URI, or claimed published outcome. The illustrative days are story order, not timestamps or simulated live activity. No timers create activity.

The scenarios are original fixtures, not copied console records. Their claims are about invented trials only. Real scientific source links are deliberately not used as evidence that these fictional collaborations occurred. Proposal artifacts are descriptions within the story—not files claimed to have been executed or verified.

## Entry point and imports

Route: `/lab/demo/`

```tsx
import {
  DemoCommunityProvider,
  useDemoCommunity,
  DemoModeBanner,
  DemoCommunityPanel,
  DemoActivityFeed,
  DemoPeople,
  DemoNotifications,
  DemoCommunityExperience,
} from '@/components/lab/demo';
import type { DemoCaseId, DemoContext } from '@/lib/lab-demo';
```

The route includes a provider fallback, banner, and top-right demonstration bell. A nested provider reuses an existing parent instead of resetting it. Route metadata is `noindex, nofollow`.

## Exact component API

- `DemoCommunityProvider({ children, initialMode = 'demo', storageScope = 'browser', storage? })`
  - `initialMode: 'demo' | 'live'` is only the default when no saved preference exists. A stored real/empty choice always wins.
  - `storageScope: string` is an opaque local demo partition. Use a non-identifying stable value; do not pass an authenticated DID or copy profile data into it. Changing it remounts the event store without migration. The default is browser-shared, not per-account.
  - `storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>` supports tests/embedders. Keep an injected object stable across renders. No dependency installation needed.
  - Rendering starts hidden until the stored preference is read. This avoids a flash of fictional profiles when the visitor chose real/empty. Blocked/invalid mode storage fails closed.
- `DemoModeBanner({ className?, showWhenLive = true })`
  - Mount once visibly around any demo content. Includes mode switch, scoped confirmed reset, and storage errors.
  - In real/empty mode it offers a route back to the demo. It never claims the real service is connected.
- `DemoCommunityPanel({ caseId?, context?, className?, title = 'The discussion moves the work', emptyState = null, initialExpandedThreadId?, showPeople = false })`
  - `DemoActivityFeed` is an alias with identical props. It remains a discussion ledger, not a generic primary social feed.
  - Filters combine with AND. `caseId` is one of the three aligned IDs above.
  - `context` is `'landing' | 'feed' | 'bottleneck' | 'atlas' | 'apps' | 'agents'`. Atlas selects only neural-measurement; apps selects reproducibility and open-artifacts; the remaining contexts include all three.
  - Hidden entirely in real/empty mode, except an explicitly supplied `emptyState`.
- `DemoPeople({ caseId?, context?, className?, variant = 'strip' })`
  - `variant: 'strip' | 'cards'`. Fictional role, initial avatars, profile modal, and locally persisted follows. Hidden in real/empty mode.
- `DemoNotifications({ className? })`
  - For a top-right header slot only. Hidden in real/empty mode. Bell count derives from unread, undismissed fixture notifications.
  - Popover uses modal semantics with focus trap/Escape/return focus. Each action has an actual `/lab/demo/?discussion=…#demo-discussion-…` target. Same-route actions open/focus the discussion; elsewhere the anchor navigates normally. Read and dismiss survive reload.
- `DemoCommunityExperience({ showBanner = true, showNotifications = true })`
  - Full page interior, not an extra site shell. Supports `?case=neural-measurement` and discussion deep links. Unknown discussion IDs render a truthful notice.
  - The supplied route uses default props. If parent moves banner/bell into global chrome, parent should change this route composition to `showBanner={false} showNotifications={false}` to avoid duplicates.

## Hook contract

```ts
const {
  mode, isDemo, ready, available, error,
  state, activeThreadId, navigationRevision, unreadCount,
  setMode, act, resetDemo, openDiscussion, counts,
} = useDemoCommunity();

setMode('live'); // persisted global view preference; NOT a live-service connector
act({ type: 'reply', threadId: 'split-boundary', parentId: 'r6', text: 'A smaller test…' });
act({ type: 'save', threadId: 'split-boundary' }); // toggle
act({ type: 'follow', personId: 'mira' }); // toggle
act({ type: 'allocate', proposalId: 'split-check', delta: 1 }); // or -1 to reclaim
act({ type: 'read', notificationId: 'revision-ready' });
act({ type: 'dismiss', notificationId: 'revision-ready' });
openDiscussion('split-boundary'); // opens a matching mounted panel, not a router
counts('reproducibility'); // { people, discussions, messages, points }
resetDemo(true); // caller must first obtain explicit confirmation; banner does so
```

`setMode`, `act`, and `resetDemo` return `{ ok: boolean, error?: string }`. `openDiscussion` returns void. `navigationRevision` increments even for repeated targets, ensuring a previously collapsed discussion reopens. Hook `state` is empty, counts/unread are zero, and `activeThreadId` is null when demo is hidden. Outside a provider the hook is safe and inert (`available: false`, `mode: 'live'`); actions return failure rather than pretending to save. Standalone fixture arrays in `lab-demo.ts` are always fictional and must not be placed into a real feed.

## Parent composition examples

```tsx
// Client adapter mounted by the parent inside Lab layout, above LabShell.
<DemoCommunityProvider initialMode="demo">
  <LabShell>{children}</LabShell>
</DemoCommunityProvider>

// Inside the parent's header, top-right. Keep the real next-action inbox separate.
const { isDemo } = useDemoCommunity();
return isDemo ? <DemoNotifications /> : <YourExistingLocalInbox />;

// Inside the parent's main, once (omit on /lab/demo/ if its built-in banner is used).
<DemoModeBanner />

// Bottleneck surface: supplement, do NOT replace its diagnosis/draft/editor logic.
<YourExistingBottleneckWorkbench caseId={caseId} />
<DemoCommunityPanel caseId={caseId} context="bottleneck" showPeople />

// Atlas: keep real sources and evidence editing separate.
<YourExistingAtlas />
<DemoCommunityPanel context="atlas" title="A measurement question, worked through" />

// Landing or secondary feed lane.
<DemoActivityFeed context="landing" caseId="reproducibility" />
<DemoPeople context="landing" variant="cards" />
```

Placeholder names above refer to parent's existing components, not exports from this module. Parent retains all existing auth, onboarding, canonical profile completion, drafts, real-local inbox, feeds, and bottleneck logic. No integration edits to those modules are included here. The supplemental `/lab/bottlenecks/?case=…` links require the peer route to be integrated; only the demo's own discussion targets were exercised in this worktree.

## Persistence, safety, and reset

Only two key forms are touched:

- `app-demo:mode:v1`: global `'demo' | 'live'` preference.
- `app-demo:community:v1:${encodeURIComponent(storageScope)}`: replies, follows, saved discussions, allocations, read/dismissed notifications.

No access to real profile/draft storage, session, OAuth, PDS, or network clients. User text renders as text, never HTML. A reply author is always the fixed `demo-visitor` label “Your demo note,” never an authenticated identity. The form caps replies at 2,000 characters; total replies are capped at 100; persisted JSON is bounded and structurally/reference validated. Failed saves keep input text. Corrupt or owner-mismatched demo data is preserved and not overwritten by ordinary actions.

Reset requires explicit confirmation and removes only the selected demo event key, not all storage or even all demo scopes. It retains the global mode preference. LocalStorage writes are read back before a successful save is reported. Storage events synchronize the mode and active scope across tabs. Concurrent simultaneous writes from separate tabs are still last-writer-wins; this is not a transactional database.

Five local fictional points are available for interest allocations and can be reclaimed. Counts always derive from the fixtures plus successful local events. Nothing is paid, pooled, dispatched, minted, or issued as a Hypercert. No one is notified. Nothing is publicly posted. The local demo reply store is not a private encrypted vault; do not type sensitive material into a shared browser.

## Verification and limits

Run from repository root:

```sh
node --test scripts/lab-demo*.test.mjs
node --test scripts/lab-demo*.test.mjs scripts/lab-ui-core.test.mjs scripts/lab-record-inspector-ui.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Tests execute the real React components in jsdom and the real TypeScript fixtures/reducer using the project's existing loader. Coverage includes fixture/reference integrity, derived counts, local replies and safe text rendering, profile/follow, save, finite/reclaimable support, notification navigation/read/dismiss/reopen, direct and unknown targets, no-provider safety, context filtering, persistent hiding, confirmed reset preserving a planted genuine draft, corrupt/oversized/mismatched/blocked storage, scope remounts, cross-tab mode sync, Escape/focus return/Tab wrap, and no demo fetch or forbidden shared-store dependency.

Actual Next dev route returned HTTP 200; browser interactions and screenshots checked at 320px, 390px, and 1440px. Existing root chrome in this base still shows the brochure header/footer: parent owns shell integration. The module uses scoped CSS, Aileron + `var(--font-serif)`, warm paper, PL-blue accents, a darker blue for accessible text/actions, and 44px controls. No animation library or generated live events. The demo stays intentionally light-paper even under the parent dark theme; no dark-specific visual QA is claimed.

No full production build, public writes, PDS records, sends, auth tests, merge, push, or deployment. No independent nested critic: a fresh skeptical pass plus deterministic tests/browser probes was used within the specialist scope. Production/server/browser matrix QA and cross-surface composition remain the parent's responsibility.
