# Open Lab entry transition

## Decision and scope

A short threshold is appropriate for entering a somewhat separate workspace; a repeated transition on routine navigation would be distracting. This change enhances only the existing home-page invitation. Its real `href="/lab/"`, copy, and classes remain unchanged. No domain/DNS, theme-toggle, preference, app-navigation, sign-in, or callback changes are included.

`OpenLabLaunchLink` renders a native anchor on the server. With JavaScript and supported motion APIs, an ordinary current-tab activation draws one ink-colored circular cover from the pointer's viewport coordinates, or the invitation's center for keyboard/assistive activation. The cover uses the existing lab dark-surface color `#131c21`, not a theme switch.

The Web Animations duration is **220 ms**, with `cubic-bezier(0.22, 1, 0.36, 1)` easing and a **320 ms watchdog**. Both values are configured behavior, not a browser timing measurement. Normal browser scheduling/throttling can delay timers; this is not a hard real-time guarantee. There is no spinner, minimum loading period, scroll lock, tracking, dependency, persisted flag, or global animation. A fresh explicit entry can animate again after returning; app navigation never invokes this component.

## Public reference, inspected September 11, 2026

The [GainForest home page](https://www.gainforest.earth/) and its linked assets returned HTTP 200 to cookieless public HTTP requests. The mechanism is directly present in the [delivered JavaScript](https://www.gainforest.earth/_next/static/chunks/752fa7128a4d3f31.js?dpl=dpl_ChwgkF17BWtEEFBtGKbor3nNKNvF):

- The theme action calls `startViewTransition`, then animates `clipPath` from `circle(0px at …)` to a radius computed with `Math.ceil(Math.hypot(...))` on `::view-transition-new(root)`.
- It specifies `duration:1200`, `offset:[0,.06,1]`, and `easing:"cubic-bezier(0.22, 1, 0.36, 1)"`.
- It uses the click coordinates, or the control's bounding-box center when `detail` is zero, and immediately applies the theme when reduced motion is requested or View Transitions is unavailable.

The [delivered stylesheet](https://www.gainforest.earth/_next/static/chunks/d82c00ffd0c2140c.css?dpl=dpl_ChwgkF17BWtEEFBtGKbor3nNKNvF) disables default root View Transition animations, sets old/new snapshot stacking, and initializes the new snapshot with a circular clip-path. This identifies a circular snapshot reveal, not a fluid simulation. Its association with the user's visual reference is source-based inference; no visual timing or fidelity is claimed.

The parent reported the headed-browser restriction exactly as “This page is blocked / Your organization doesn’t allow you to view this site.” This lane used no browser, alternate browser, authenticated request, or allowlist bypass. Research was limited to the public page and its linked JS/CSS.

## Navigation and failure contract

- No JavaScript: the anchor still points exactly to `/lab/` with its existing accessible text and native keyboard behavior.
- Ctrl/Meta/Shift/Alt, non-primary/middle/right activation, non-self targets (including a document base target), downloads, already-canceled events, non-HTTP URLs, and same-document links remain native. No custom keydown handler is installed.
- Reduced motion, missing/unsupported CSS clip-path or Web Animations APIs, missing media-query support, or animation setup failure leave the original click unprevented. A scoped media rule also hides the cover if reduced motion becomes active; its change event completes an active departure immediately where supported.
- Finish, asynchronous rejection, and watchdog converge on one guarded completion. The cover, animation, timer, and motion listener are cleaned before navigation. Repeated ordinary clicks do not queue more loads. Unmount, pagehide, pageshow, and popstate cancel pending work; lifecycle listeners are removed on unmount. A synchronous navigation exception leaves the next activation native.
- Navigation uses `window.location.assign` with the anchor's resolved destination, including its query/hash. It deliberately performs a full document load even for `/lab/`. It therefore does not require same-origin View Transitions and can support a future cross-subdomain href without assuming a destination-side animation. The cross-origin test uses a reserved example hostname, not a proposed or changed domain.

This is a departure cover, not a seamless two-document reveal. The old page may briefly reappear between cover removal and the next document's paint on a slow connection. Holding an opaque overlay for an unbounded network load would turn the effect into the loading spectacle this change is meant to avoid. Parent browser QA must judge that handoff before release.

## Verification and remaining gates

Production behavior was added in vertical RED/GREEN cycles: a failing component test (exit 1), minimal implementation, and a passing targeted suite (exit 0). Additional cross-origin, rejection, and theme/storage regression probes exercised already-implemented paths. Tests mount the actual TSX through the repository's existing source loader, React, and jsdom, and inspect real anchor/DOM/CSS behavior. Only browser-only layout/WAAPI/media support, CSS module names, and jsdom's final document-navigation boundary are controlled. `Location.assign` URL parsing itself is real. No mocks substitute for the component.

Verification commands:

```sh
UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--v8-pool-size=1 taskset -c 1 node --test --test-concurrency=1 scripts/lab-launch-transition.test.mjs
UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--v8-pool-size=1 taskset -c 1 node node_modules/typescript/bin/tsc --noEmit --incremental false
```

The targeted suite covers SSR/native href and name, ordinary-only activation, keyboard center/focus, reduced motion (including a mid-cover change), unsupported/setup/async/cancel failures, bounded completion, duplicate suppression, unmount/history/page restoration, exact cross-origin navigation, navigation refusal recovery, and unchanged theme/storage/body styles. A separate byte comparison against the base verifies that `page.tsx` differs only in the invitation component substitution and its import.

Fresh-skeptical source review found and fixed the synchronous navigation-refusal latch; its regression test is included. No nested critic was run. This lane does not claim a visual pass, real tab opening, native Enter dispatch synthesis, network destination loading, bfcache behavior in a browser, or full-site build/integration success.

Parent-owned release gates: desktop and narrow/mobile viewport appearance in both themes; pointer and Enter activation; reduced motion; native modifier/middle/new-tab behavior and JavaScript-disabled navigation; rapid clicks; slow-network cover-to-document handoff; browser Back restoration; and confirmation that routine lab routes and sign-in/callback are unaffected.
