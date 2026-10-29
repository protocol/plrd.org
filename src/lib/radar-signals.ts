// Curated "field signals" for the PL R&D Radar.
//
// These are notable *third-party* developments across our four focus areas that
// we're watching. They appear in the Radar alongside our own talks, papers and
// posts, but are clearly marked as external ("Field signal · <source>") and link
// straight to the primary source — never presented as PL R&D's own output.
//
// Manually maintained in the repository; no external curator or ingestion.
// CURRENT_RADAR_FEATURES is the explicit edition cut. Older FIELD_SIGNALS remain
// available as a recency-based fallback when there is no featured edition.

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
  /** Verified publication date, if known (YYYY-MM-DD). Never infer from curation. */
  date?: string
  /** Repository curation date (YYYY-MM-DD), displayed explicitly as "Added". */
  addedDate?: string
  external?: boolean
  image?: string
  imageAlt?: string
  /** Keep chart labels unobscured by placing attribution outside the image. */
  plainImage?: boolean
  ctaLabel?: string
}

export const CURRENT_RADAR_EDITION = 'October 2026 Radar'

// NeuroAI in public debate: four source-slide features, plus two recent PL cards.
// Keep all four together; the historical one-signal cap does not apply here.
export const CURRENT_RADAR_FEATURES: FieldSignal[] = [
  {
    key: 'signal-amodei-brain-computer-interfaces',
    title: 'Dario and Daniela Amodei on brain–computer interfaces',
    description:
      'On The Builders, Dario and Daniela Amodei discuss linking brains to computers—and explain why they are not interested in doing it themselves.',
    href: 'https://www.youtube.com/watch?v=1OdoSzfUkec',
    source: 'The Builders / Walter Isaacson',
    areaSlug: 'neurotech',
    addedDate: '2026-10-29',
    external: true,
    image: 'https://i.ytimg.com/vi/1OdoSzfUkec/maxresdefault.jpg',
    ctaLabel: 'Watch the conversation',
  },
  {
    key: 'signal-neuralink-speaking-with-the-mind',
    title: 'Neuralink’s brain-to-voice story reaches 10M+ views',
    description:
      'Neuralink’s “Speaking With The Mind” follows Terry, a participant with ALS in its investigational VOICE trial, using a brain-to-voice interface to communicate. The devices are not FDA approved; individual experiences are not representative of outcomes.',
    href: 'https://www.youtube.com/watch?v=_j806JHhCRo',
    source: 'Neuralink',
    areaSlug: 'neurotech',
    addedDate: '2026-10-29',
    external: true,
    image: 'https://i.ytimg.com/vi/_j806JHhCRo/maxresdefault.jpg',
    ctaLabel: 'Watch the video',
  },
  {
    key: 'signal-phase-lock',
    title: 'Phase Lock: a manifesto on BCIs and human agency',
    description:
      'Saturnin Pugnet’s manifesto argues that brain–computer interfaces could help preserve human agency as AI becomes more capable.',
    href: 'https://phaselock.satpugnet.com/',
    source: 'Saturnin Pugnet',
    areaSlug: 'neurotech',
    addedDate: '2026-10-29',
    external: true,
    image: '/images/radar/phase-lock.webp',
    imageAlt: 'Phase Lock: The Brain’s Bitter Lesson, from Saturnin Pugnet’s public manifesto',
    ctaLabel: 'Read the manifesto',
  },
  {
    key: 'signal-neurotech-search-interest',
    title: 'Search interest in neurotech has surged',
    description:
      'Worldwide Google Trends for “neurotechnology” and “brain-computer interface” rose sharply during 2025–26 before falling back. Oct 15, 2023 to Oct 15, 2026 · relative index 0–100. Search attention is not a measure of technical progress or absolute search volume.',
    href: 'https://trends.google.com/trends/explore?date=2023-10-15%202026-10-15&q=neurotechnology,brain-computer%20interface',
    source: 'Google Trends',
    areaSlug: 'neurotech',
    addedDate: '2026-10-29',
    external: true,
    image: '/images/radar/neurotech-search-interest-20261015.webp',
    imageAlt: 'Worldwide Google Trends for neurotechnology and brain-computer interface, October 2023–October 2026, relative index 0–100; both rise in 2025–26 before falling back',
    plainImage: true,
    ctaLabel: 'Explore the comparison',
  },
]

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
