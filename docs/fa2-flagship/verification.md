# E&G flagship program and leaner page — verification

Presents **Sovereign AI** as the flagship program of `/areas/economies-governance/`, in the place and shape the Digital Human Rights page gives its own (`docs/dhr-flagship/verification.md`): a `#flagship-program` box after the introduction and before Opportunity Spaces, labelled "A PL R&D flagship program", with **Explore Sovereign AI ↗** to `/sov-ai`. The rest of the page is reordered around it. Other focus areas, the four Opportunity Spaces and their subpages are unchanged.

## Wording

The box's two paragraphs are the first two paragraphs of the program overview on `/sov-ai` (`public/sov-ai/index.html`, `.overview-copy`), word for word. They live in `flagshipCopy` (`src/lib/sovereign-ai.ts`) and a test fails if they stop matching that page. The line about the one-pagers is the sentence the old "Sovereign AI program" block carried. No figure, cohort or result is stated in the box.

## Picture

The left half of the box was empty under the title, so it now carries a picture: a paper-cut collage of four people around a table with a computer, beside a civic building with three arches and a coral sun (`public/images/fa2/sovereign-ai/flagship-collage.svg`, 900 × 425, 14 KB; `sovAiArt` in `src/lib/sovereign-ai.ts`).

- **It was drawn by an image model** (GPT Image 2.6 Sunburst, through David Dao's account, 18 November 2026), with the program site's hero collage (`public/sov-ai/assets/sovai-hero.webp`) as the style reference, so the box and `/sov-ai` read as one program. It is an illustration, not a photograph of anything real. Cropped to its content and levelled to a pure white ground; nothing else was retouched.
- **The file is an SVG that only wraps a WebP** (the picture as base64 in one `<image>`). The route used to push this branch carries text files only. A plain `.webp` can replace it at any time; only `sovAiArt` changes.
- **From tablet width up** it fills the empty space beside and under the title; the box keeps its height (526 px at 1440). **On a phone** it sits above the title, which makes the box 154 px taller at 390 px (page 8,887 to 9,041 px).
- Alt text: "Paper-cut illustration: four people around a table with a computer, beside a civic building".
- `mix-blend-mode: multiply` lets the box's ground show through the white, so the picture has no frame, corner or colour of its own; on the dark theme it is inverted with the hue kept and screened. There its small yellow cloud turns dark brown.
- Checked against the local build at 1440 and 390 px, light and dark, by eye; at 1024, 768 and 320 px by measurement (no sideways overflow added).

## What moved where

| Before (top to bottom) | After |
|---|---|
| Hero | Hero, unchanged |
| Live ecosystem signal (4 numbers, "Open live dashboard") | Moved down into **Explore**, above the four tools it belongs with |
| Introduction | Introduction, unchanged, now directly under the hero as on DHR |
| Featured Work: Simocracy, AI4PG (two tall cards, image on top) | Moved below Opportunity Spaces. Same words and links; each card is now a row with its drawing at the side (on a phone, a shorter drawing on top) |
| "For governments and funders · Sovereign AI program": the five one-pagers on a shelf | Replaced by the **flagship box**. The five one-pagers are listed in it by name, each linked to its web edition, which offers the PDF |
| Opportunity Spaces (4) | Unchanged, now directly under the flagship box |
| Explore (4 tools) | Unchanged cards, with the live numbers above them |
| How to Engage (5 items, "Share feedback") | Same five items and button. Three across on a wide screen, a ruled list on a phone |

Nothing was deleted. Two things are no longer on the page as they were:

- **The shelf** (`SheetShelf.tsx`) with its take-down card offering "web edition" and "PDF" side by side. The component, the plates and the PDFs stay in the repository; the PDFs are reached through each web edition.
- **The live numbers at the top of the page.** They are still on the page, in Explore.

## Length

Full page height, footer included (the footer is 520 px on desktop and 965 px on a phone):

| | Before | After | DHR today |
|---|---|---|---|
| 1440 px | 5,194 | 4,962 | 3,661 |
| 390 px | 8,857 | 9,041 | 5,905 |

The page reads in FA1's order now, but it is **not much shorter**, and on a phone it is slightly longer (8,887 px before the picture went into the box). The four Opportunity Spaces take 1,050 px on desktop and 2,340 px on a phone and are not to be touched. What E&G still has beyond DHR is Featured Work, Explore and How to Engage, about 1,900 px on desktop together. Making the page as short as DHR means taking one of those off this page, which this change does not do.

## Checks — 18 November 2026

- Fresh `pnpm@10 install --frozen-lockfile`: passed, no dependency or lockfile changes.
- `node --test scripts/fa2-flagship.test.mjs`: 8 passed. Against the untouched page, all but one fail (that one checks the other focus areas).
- `scripts/fa2-sovereign-ai.test.mjs`: 6 passed. Its shelf test is rewritten: it now checks that the flagship box links every sheet, above Opportunity Spaces.
- `npx tsc --noEmit`: passed. Production `npm run build`: passed. The repository has no linter.
- Full `npm test`: **254 passed, 1 failed**. The failure, `scripts/velocity/impact-methodology-tabs.test.mjs:44`, expects old methodology wording and fails the same way on the untouched base `872fc12`.
- Headless Chromium against the local production build at 1440, 768, 390 and 320 px: no broken image, no console error, flagship title not clipped, four opportunity cards, all six links of the box answer 200. At 320 px the document is 9 px wider than the screen; the live site is too, from the closed navigation drawer, and nothing in this change adds to it.
- Link contrast in the box, from computed styles: **6.48:1 light**, **11.48:1 dark** (the same colours as the DHR box).
- `/areas/economies-governance/#sovereign-ai`, the address the sheets, the PDFs and the redirects use, lands on the box.

## Evidence

Screenshots were taken of the live site before this change (1440 and 390 px) and of the local build after it (1440 and 390 px, light and dark, and the box with its picture). **They are not in the repository:** the route used to push this branch carries text files only. The Vercel preview of the pull request shows the same page.

## For the reviewers to decide

- `/sov-ai` still answers `X-Robots-Tag: noindex, nofollow, noarchive`, and `docs/sov-ai/README.md` describes it as unlisted with no entry from the main site. This change links to it from a main page, as asked, and leaves the header as it is. If the program is launched, the noindex policy and that README want a decision.
- "Explore Sovereign AI" opens in a new tab, like the DHR box's link, although it stays on plrd.org: `/sov-ai` is a standalone document with its own navigation and no way back.
- Not checked: a real phone, Safari, a screen reader.
