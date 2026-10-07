// Curated "field signals" for the PL R&D Radar.
//
// These are notable *third-party* developments across our four focus areas that
// we're watching. They appear in the Radar alongside our own talks, papers and
// posts, but are clearly marked as external ("Field signal · <source>") and link
// straight to the primary source — never presented as PL R&D's own output.
//
// Keep the list short, current, and hand-picked. Newest first; the Radar sorts
// by date and reserves a slot so at least one signal is always shown.

export type FieldSignal = {
  key: string
  title: string
  description: string
  /** External URL to the primary / most authoritative source. */
  href: string
  /** Short source attribution shown on the card, e.g. "SCOTUSblog". */
  source: string
  /** Focus-area slug — drives the card's color. */
  areaSlug: 'digital-human-rights' | 'economies-governance' | 'ai-robotics' | 'neurotech'
  /** ISO date (YYYY-MM-DD). */
  date: string
}

export const FIELD_SIGNALS: FieldSignal[] = [
  {
    key: 'signal-chatrie-scotus',
    title: 'The Fourth Amendment now protects your location data',
    description:
      'In Chatrie v. United States, the Supreme Court held that people have a reasonable expectation of privacy in the location data revealing their movements — even short-term tracking is a "search." A landmark extension of Carpenter that reaches geofence warrants and law-enforcement access to location records.',
    href: 'https://www.scotusblog.com/2026/06/court-rules-that-law-enforcements-use-of-geofence-warrant-was-a-search/',
    source: 'SCOTUSblog',
    areaSlug: 'digital-human-rights',
    date: '2026-06-29',
  },
  {
    key: 'signal-robinson-moores-law-neurotech',
    title: "A 'Moore's Law' for therapeutic neurotech",
    description:
      'Jacob Robinson (Rice / Motif Neurotech) shows clinical trials of brain stimulation for mental health doubling roughly every 4.7 years — a ~100× rise since 2000, the growth semiconductors had reached by 1985 — and argues therapeutic BCIs, not communication BCIs, are the larger market. A field-side read that clinical commitment to neurotech is compounding, from inside the vertically integrated era our BCI app-store marker would end.',
    href: 'https://www.embs.org/pulse/articles/making-heads-and-tails-of-the-coming-era-of-neural-devices-could-moores-law-address-the-declining-mental-health-trend/',
    source: 'IEEE Pulse',
    areaSlug: 'neurotech',
    date: '2025-07-21',
  },
]
