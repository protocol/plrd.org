# AI context — local verification

Screenshot and first served-sweep revision: `0651f818dfc2f69b97859095b038f90c68870730`, tested 2026-09-11. Subsequent shared-gate hardening covers metadata references and slash/host boundaries; the complete current-corpus Markdown export was verified byte-for-byte identical to the downloaded capture. Guide/component source is unchanged. The final exact SHA is recorded in the PR review.

## Executed

- pnpm 10 frozen installation succeeded; dependency declarations and lockfiles unchanged.
- Final default suite: 128 tests passed, zero failures/skips. Generated content source parity, mixed-case IDs, exact bylines, visibility gates, direct hidden details and query bounds are covered. Metadata disclosure and technical read/write prose each have verified RED→GREEN regressions; the metadata fixture exercises index, search, JSON detail, Markdown detail and the full export.
- Ordinary API/preview/edit prose was observed failing before its correction. A `/lab/` reference in a text field was also observed leaking before its correction; private absolute/relative references now deny while an external public lab URL remains eligible.
- Typecheck passed. Production build passed, with 322 static pages generated.
- Real local production server: 818 HTTP checks passed (794 successes, six expected 400s, twelve expected 404s and six expected 405s). Every one of the 261 exported records had its JSON detail, Markdown and source page fetched. All four topic routes worked.
- Separate parent probes: 13 entrypoint/link checks plus 18 pagination/source-parity/negative-input checks passed. Source IDs match all 261 eligible records across six collections.
- Real Chrome: desktop 1440px, mobile 390px and narrow 320px document/heading bounds passed. Copy prompt and footer-to-guide navigation worked. Clicking the actual download produced `plrd-context.txt`, 254,802 bytes.

## Screenshot provenance

The four PNGs are actual local Chrome captures of `/ai/` on the runtime revision above, not hosted previews. No authentication fixture or production setting was changed. Viewport captures: `ai-1440.png`, `ai-390.png`; full-page companions use `-full`.

## Scope and limits

This is a build-time snapshot, not a live CMS mirror or whole-site dump: native blog/tutorial text, publication abstracts/metadata, talk summaries/recording links, author metadata and shared area descriptors. Live overview copy, ATProto posts, dashboards and nested tutorial lessons remain outside coverage. Canonical links preserve attribution; no new rights or guaranteed AI discovery are claimed.

The build reported existing external-data path warnings (indexer query failure, closed-round fallback and oversized uncacheable payloads) but exited 0. Those paths are unchanged; a separate base-only build was not repeated, so no independently verified baseline diagnosis is claimed. Third-party destination contents were not re-researched.

Independent exact-revision review is a separate required handoff gate, recorded in the PR. No merge or production deployment is part of these local checks.
