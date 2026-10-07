# Homepage carousel reorder

Source revision: `ba15065` (based on `5a89c4f`). Captured September 15, 2026.

## Scope
The existing Latest from PL R&D section now follows Focus Areas and precedes the complete innovation-chasm heading/copy/graphic section. Team remains below both. No component behavior, content, feed selection, or CSS changed.

## Executed checks
- Fresh pnpm 10 frozen-lockfile install succeeded; no dependency changes.
- Regression failed on the original section order with “latest carousel must precede the innovation-chasm heading,” then passed after the move.
- Standard `npm test`: 115 passed, 0 failed (including the new homepage test).
- Production build and `tsc --noEmit` passed. Build emitted remote indexer/MA Earth fallback and oversized cache warnings unrelated to the moved JSX.
- Built homepage returned HTTP 200 on the loopback server.
- Headed Chrome at 1440 and 390px: focus areas → latest heading/carousel → innovation-chasm heading/graphic → Team. No document horizontal overflow at those widths.
- Native Next button advanced carousel scroll to 360px (desktop) and 300px (390px); Previous became enabled in each case.
- Extra 320px probe: document scroll width 320px vs client width 305px. A temporary DOM-only restoration of the original section order produced identical widths, then the intended order was restored. This is an existing narrow-layout limitation, not a baseline-build comparison; unchanged in this scoped move.

## Screenshot provenance
`desktop.png` and `mobile.png` are real headed Chrome captures of the local production build at source revision ba15065, not production or Vercel preview screenshots. The public URL was checked over HTTP; the container browser blocks that domain. No hosted authentication or settings changed.
