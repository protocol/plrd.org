# Methodology under Interventions — September 29, 2026

User-facing contract: the catalog's existing “Explore how we accelerate fields” CTA opens the approved Diagnose / Intervene / Learn methodology. Desktop breadcrumb is **Home / Interventions / Methodology**; the existing mobile breadcrumb convention is **← Interventions**.

Runtime SHA: `3fd6d552ef0a1024e68532716c7da6b81417fb33`.

PR172's merged main (`e32f3819c360a15eb74109d912cc9710334750ac`) is included. No merge of PR171 and no change to public-discovery/noindex policy.

## Changes

- Replace the catalog methodology placeholder with the same implementation as the approved methodology preview.
- Both entry routes display the nested breadcrumb and share the new canonical URL/title. Existing Impact preview links, area parameters and fragments continue to work.
- Use a native document-navigation anchor for the methodology CTA. A native browser replay exposed Next's dynamic program-modal interception: previously the URL changed to methodology while the catalog stayed displayed. The native anchor bypasses this program-only interception; program links are unchanged.
- Retain full-bleed footer spacing on the nested route, plus the existing high-z-index / scrollable off-canvas navigation from both branches.

## Verification

- Four new regressions exercised RED → GREEN: nested content/breadcrumb, metadata/noindex, shell spacing, document-navigation CTA.
- Final isolated checkout: **173 tests passed**, TypeScript and production build passed. This is a fresh build directory, not the prior task's running server directory.
- Actual headed Chrome: native catalog CTA → methodology → each tab → parent breadcrumb at 1440, 768, 390 and 320px.
- Asserted actual route, three tabs, absence of program modal, breadcrumb labels/links, 44px/32px headline, viewport/client/scroll bounds, canonical and robot directives.
- Fresh direct nested and legacy URLs retain `?area=neurotech#learn` and render Learn.
- HTTP nested route: 200 and X-Robots-Tag noindex/nofollow/noarchive. Public `/impact` and `/interventions` remain unpublished.
- Screenshots are actual local production-build captures at the runtime SHA, not hosted screenshots or mockups.

The general mobile breadcrumb is intentionally collapsed to its parent rather than forcing a three-item trail into 320px. Provider fallback/cache warnings are pre-existing and this route integration does not certify live-provider data.
