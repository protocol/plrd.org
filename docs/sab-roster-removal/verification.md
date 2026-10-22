# Neuro SAB roster correction — October 22, 2026

Runtime revision: `1fc91f8a36d18b5d2e74eba7cf2da8cf9ddfc306`.

Remove Ilan Gur from the current Neuro Science Advisory Board, following the matching PL Neuro website update. This updates the area Markdown/generated roster and the editor's static mirror. His `Neuro Advisors` membership is removed so the Team Advisors tab agrees. His author URL, biography and image are retained with the accurate role `Former Neuro Advisor`; the existing Team Alumni tab now contains him.

## Gates

- Frozen pnpm 10 install passed; package manifests/locks unchanged.
- New roster regression failed before implementation and passes after it. All six targeted Neuro tests pass.
- Full suite: baseline 152/153 pass, candidate 153/154 pass. The **same pre-existing failure** remains: `scripts/velocity/impact-methodology-tabs.test.mjs:73`, which expects retired Diagnose copy. No new test failures; this unrelated test is not changed.
- Typecheck and full production build pass; content regenerated. Semantic comparison proves other area/author records and the seven remaining advisors/order unchanged.
- Native local production page `/areas/neurotech/`: seven advisor chips, no Ilan, at 1440px and 390px. Mobile inner/client/scroll widths all 390px.
- Native Team tab clicks: Advisors excludes Ilan and displays the seven current members; Alumni includes him as `Former Neuro Advisor`.
- `/authors/ilan-gur/` remains HTTP 200 with the former-role label. No profile/history deletion.
- Independent source critic PASS at the runtime SHA, no blocking findings. Screenshots reviewed visually; no empty slots or removal-induced clipping.

Screenshots are actual headed-Chrome local production-build captures, not screenshots of the live public site. The managed browser blocks the public vanity domain; public source content was read cookielessly. A PR is not a production release; merge remains separate.
