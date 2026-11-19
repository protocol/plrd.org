# Migration verification — November 10, 2026

Runtime source: `906c7ba7d01f3e09843ba1f21a843caea6cfdb2f` (clean before build and native replay), based on `81b1118e5e4e59bd5a9eb9dd5e1a204cc722d279`. This documentation/screenshot commit does not change runtime, assets, tests or routing.

## Executed gates

- Fresh pnpm 10 frozen-lockfile install under Node 24.13.0. No dependency or lockfile changes.
- TypeScript no-emit and actual Next 15.5.28 production build passed.
- Focused migration/interaction/Atlas checks: 17 passed. Full default suite: 244 tests, 243 passed, one pre-existing failure in `scripts/velocity/impact-methodology-tabs.test.mjs:73` (expects a removed Diagnose question). Baseline at the unchanged starting tree: 232 tests, 231 passed, that same failure. No new failing test.
- Independent exact-revision code review: PASS, with no blocking defects. Reviewer independently compared original Git objects, all 18 hashes and actual Next routing/header matchers; focused source tests passed. Optional future hardening: test exact directory membership and reject new symlinks; the present directory contains exactly the 18 expected regular files.
- Real Next production HTTP replay on loopback: 33 passing assertions/check records across bare/slash/query entry paths, all 18 resources and their hashes/MIME types, eight private/near-prefix 404s, and four existing main-site routes. Main page has no `/sov-ai` link. Noindex/CSP remain scoped to the program.
- Headed Chrome native replay: 51 passing checks. Widths 320, 390, 768, 800, 801, 1024, 1440 and 1920; requested viewport versus client/scroll width; unclipped hero text; native mobile menu/Escape/focus/navigation; government/funder pointer and keyboard choices; direct funder link; actual Back to empty hash and Forward; native research expanders; no-JS fallback; all five actual PDF previews and all five native downloads, independently byte-verified.
- Parent inspected desktop/mobile program and funder screenshots. These are local production-build screenshots, not hosted deployment screenshots. Original branding/collages are retained. A desktop funder capture was retaken after the native fragment scroll settled; measured tabs at 106px and funder heading at 293px, below the 84px sticky header. Fresh direct-link navigation also placed the heading below the header.

## Honest limits and failed receipts

An early lazy-image polling expression returned `undefined` because the browser helper treated a callback's inner `return` as a top-level return. An isolated implicit-versus-explicit probe reproduced `None` versus `True`; adding an explicit outer return corrected the harness. The final replay passed without changing the website or its loading behavior. Responsive pointer emulation is not a physical-phone touch test.

This record establishes local and code-review acceptance only. Hosted preview, exact Git deployment/alias identity and live `plrd.org/sov-ai` HTTP/native verification are separate release gates, to be recorded in the PR/release handoff after deployment. No old project or repository was deleted or reconfigured.
