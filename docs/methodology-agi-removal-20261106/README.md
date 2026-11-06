# AGI forecast removal — November 6, 2026

Runtime revision: `4a0c2a7df7d3b1cb6c381ad5abf7f3756c09036b`.

The AGI forecast and implied 50/50 arrival headline are removed from the shared public data projection and Methodology UI. The archived Full Takeoff Model source JSON remains unchanged. The separate economic-automation chart keeps its original `secondary` ID, all 14 plotted observations and its source date. Its preview remains populated when no live-market peer is available. Old `markets/primary` URLs reveal the selected area without reopening the retired chart or substituting another forecast.

Citation latency, translation latency, other Markets cards, source CSVs and weekly acquisition code are unchanged.

## Verification

- RED: retirement regression first failed with 11 primary AGI points still present.
- RED: retained-automation preview regression failed before secondary-only cover support.
- GREEN: 20 focused retirement/gallery/navigation tests passed.
- Complete suite: 231/232 passed; the same stale Diagnose-copy test fails on untouched base `1e8897a68dbf80c468cd7e646ba905266e497483` (229/230 passed).
- Frozen pnpm 10 install, TypeScript and production build passed.
- Local production API: no primary AGI series/headline, 14 exact retained automation coordinates, original source date.
- Real browser at desktop/mobile: no retired primary modal, three Markets previews when both live peers are available, retained automation chart opens at its old URL and renders a real line. Canonical-domain browser navigation is organizationally blocked; these captures are explicitly local production-build evidence.

## Captures

- `overview-1440.png`: local Methodology AI & Robotics overview, citation and retained Markets preview.
- `automation-1440.png`: retained economic-automation chart at its original secondary URL.
- `automation-390.png`: same chart at mobile width.

No source data was re-acquired or modified for this presentation removal.
