# Open Lab v2 — shell design

## Product surface

Open Lab is an operating surface: persistent actions on the left, real work in the center, source/detail inspection on the right. The home route renders the actual `FeedWorkbench` through `Landing`; its only introductory content is the slim “Made something that makes science easier?” invitation with two useful links. It does not repeat the former marketing sections.

The shell owns no feed, profile, social, authentication, or demo state implementation. Peer workbenches and their source/provenance copy remain intact. `lab-app-shell.css` is an explicit scoped composition layer, not a new global site theme.

## Layout and visual rules

- Desktop navigation: 210px, persistent, labeled actions. `/lab/` and `/lab/feed/` both select only “Follow science.” The other actions are Work on ideas, Try tools, Improve the Atlas, Pool your efforts, Find people, and My bench.
- Content: up to 740px feed with a 280px context rail and 24px gap. Existing feed filters move to the right; below 1200px they become an inline reachable filter group rather than disappearing. Below 800px the left navigation becomes an explicit labeled menu, not an unlabeled horizontal icon strip.
- Toolbar: real GET search to `/lab/feed/?q=…`, notification affordance, and an accessible account button in guest, restoring, and authenticated states. Notifications keep their place while identity restores.
- One global Demo control: pinned bottom-left on desktop, in the toolbar on mobile. Its on/off label is visible without opening anything. The disclosure explains example people/activity, local demo actions, no messages sent, no scientific-evidence claim, and the separation from real identity/drafts. Switching off does not claim to connect a backend. Per-item provenance is retained; only the redundant chip inside the notification button is visually removed, with its demo accessible name and disclosure retained.
- Light-first neutral surfaces: paper `#f7f8f7`, white work surfaces, ink `#202729`, muted `#596469`, border `#dde2e3`, restrained blue `#1267bd`. Saved dark appearance remains supported. Aileron is the deliberate work UI face; Newsreader is reserved for brief display headings.
- Type: 32px maximum page headings, 20px section headings, 17–18px entry headings, 14–15px body, 12–13px metadata. Narrower spacing, dividers, and flatter work areas replace page-sized panels. Existing synthetic signal instrument keeps its own dark experiment surface; both ResearchMap and Observatory genuinely switch all instrument surfaces with the theme.

## Drawer and identity contracts

`LabDialog` preserves `title`, `children`, `onClose`, and `wide`. New `variant?: "drawer" | "centered"` defaults to `drawer`; login explicitly requests `centered`. It remains a native modal dialog with named heading, `aria-modal`, Escape, backdrop dismissal, focus containment/return, and nested-dialog-safe body scroll locking. Default detail width is 560px; wide is 760px; narrow viewports use the available width.

The initial login invitation waits for identity restoration and capability discovery. A sessionStorage marker prevents repetition; OAuth/return routes and callback fragments are excluded. Continue browsing is an explicit choice. The form calls the existing `useLabIdentity().login` with the current return URL. Unconfigured sign-in is disabled and honestly explained; provider errors remain visible. No auth configuration or permission scope changed.

`LabOnboardingGate` is imported from `@/components/lab/social/LabOnboardingGate` and mounted once inside Lab context after authenticated identity restoration. Its DID-specific skip/completion logic belongs to the feed worker. This module is absent from the shell lane's base; production contains no stub. A narrowly scoped test-only interface fixture is used only when that worker file has not arrived.

## Verification and review

Vertical RED→GREEN receipts cover home composition, action navigation/search/account, global demo disclosure, once-per-session login, unavailable sign-in, drawer focus/scroll behavior, theme-driven map paint, Observatory surfaces, responsive layout, and the onboarding interface.

Canonical browser-harness QA ran on local webpack dev port 3381, in a dedicated `BU_NAME=openlab-v2-shell` window. Real probes verified:

- No horizontal overflow at 1440, 1024, 768, 390, or 320px on home, with the scope control hit-testable and account/search/navigation reachable.
- Bottlenecks, apps, Atlas, collaboration, and profile returned HTTP 200; each was inspected at 1440 and 390px, with 32px headings and no horizontal overflow.
- GET search reached `/lab/feed/?q=marimo` and returned one editorial starter.
- Demo drawer geometry was x=880, width=560, height=1000 at a 1440×1000 viewport. Escape restored focus to Demo; body scrolling was restored.
- Mobile navigation opened without overflow and Escape returned focus to its toggle.
- Observatory changed from light paper/white nodes and inspector to dark paper/dark nodes and inspector, then back. ResearchMap SVG labels/geometry and white inspector were checked in actual light-mode browser rendering.

A fresh skeptical pass found and fixed a desktop stacking-context defect that initially hid Demo behind the sidebar, a colliding Open Systems map label, a missing loading notification affordance, and overlarge Observatory metadata inherited from generic headings. No nested critic/worker was launched; the parent owns independent product/security review and final integrated release QA.

## Integration status and honest limits

The webpack production build and TypeScript check passed before the final onboarding import. After adding that required cross-lane import, TypeScript/build correctly fail because `LabOnboardingGate.tsx` is not on this worktree's base. Integrate the feed/auth worker first, then shell. The parent must run the exact final build and screenshots; these lane screenshots are dev/pre-onboarding-interface integration evidence, not a final release certification.

The pre-interface full lab suite ran 182 tests: 175 passed, six failed, one optional live-browser probe was skipped. The six failures encode the superseded marketing landing, literal old shell class, and page-wide demo banner/login wording, or mount the formerly static `Landing` without auth context. These out-of-lane test files were not changed. The new shell suite, including recorded actual responsive probes and the test-only pending-worker interface, passes all 13 tests.

No real account authorization, public writes, sends, pushes, deployment, DNS, or external configuration changes were made. The Find people destination and authenticated onboarding behavior require the peer worker integration. Old feed-owned demo supplements remain visible on this isolated base in demo mode; the feed worker owns their redesign.
