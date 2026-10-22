# DHR flagship program — verification

Adds **Open-Source Security Acceleration** to `/areas/digital-human-rights/#flagship-program`, after the introduction and before Opportunity Spaces. It identifies POSSUM (Prosperous Open Source Software Universe Maintenance) as the starting initiative, credits Public Goods Foundation, and adds **Explore POSSUM** above **Visit Public Goods Foundation**, linking to the owner-supplied Papermark one-pager. Other focus areas and the retired interventions catalog are unchanged.

## Checks — October 22, 2026

- Fresh `pnpm@10 install --frozen-lockfile`: passed, no dependency or lockfile changes.
- `node --test scripts/dhr-content.test.mjs`: 5 passed. The new flagship assertion first failed on the missing section before implementation.
- `npx tsc --noEmit`: passed.
- Production `npm run build`: passed.
- Full `npm test`: **154 passed, 1 failed**. The failure in `scripts/velocity/impact-methodology-tabs.test.mjs:73` expects old methodology wording. The identical failure was reproduced in an untouched worktree at base `29ef011503d801f379a4767f362645d8775dfce3`. No introduced failures; the unrelated assertion is not changed here.
- Headed Chrome against the actual local production route: checked 1440, 768, 390, and 320px. No horizontal overflow or clipped flagship title; all three exact external links and all four existing opportunity cards are present.
- Link contrast measured from computed styles: **6.48:1 light**, **11.48:1 dark**. Both exceed WCAG AA normal-text contrast. The initial dark-link failure was corrected and replayed after a hard reload.
- Original independent review: PASS. Follow-up reviewer-mode pass: PASS on the acronym, exact one-pager URL, stacked CTA order, preserved partner link, DHR-only scope, and screenshots. The follow-up regression first failed on the absent expansion and then the missing link; final focused tests, full-suite comparison, TypeScript, build, and four-width browser checks were replayed.

## Evidence

The PNGs are **local production-build screenshots**, not captures of the live production website. They show this change's runtime source, including the final dark-link correction.

- `dhr-1440.png`: desktop section and its placement before Strategy.
- `dhr-390.png`: mobile section and complete outbound CTA.
- `dhr-dark.png`: desktop dark theme.

The public DHR page and PGF homepage/projects were read over HTTP. The owner-supplied **Explore POSSUM** URL is preserved exactly: https://www.papermark.com/view/cmun40jb4002wl904fozsoy98. It reaches a Papermark email-address gate; no address was submitted and the document behind that gate was not verified. The existing **Visit Public Goods Foundation** link remains below it. Program copy follows the owner-provided source material; it does not publish fundraising figures, unconfirmed backers, private Google Docs, or completed-delivery claims.

This PR is for review. No merge or production publication is included.
