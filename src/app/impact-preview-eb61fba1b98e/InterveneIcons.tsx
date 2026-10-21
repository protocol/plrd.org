import type { ReactNode } from 'react'

// Minimal inline glyph set for the intervention levers, in the site's
// currentColor stroke style. No icon dependency; keep paths on a 24px grid.
type GlyphProps = { className?: string }

function Glyph({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function OrientGlyph({ className }: GlyphProps) {
  // compass / radar
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.1 5-5 2.1 2.1-5z" />
    </Glyph>
  )
}

export function CoordinateGlyph({ className }: GlyphProps) {
  // connected nodes
  return (
    <Glyph className={className}>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="19" cy="5.5" r="2.2" />
      <circle cx="19" cy="18.5" r="2.2" />
      <path d="M7 11.2 16.9 6.3M7 12.8l9.9 4.9" />
    </Glyph>
  )
}

export function ResourceGlyph({ className }: GlyphProps) {
  // diamond / capital
  return (
    <Glyph className={className}>
      <path d="M12 3l7 9-7 9-7-9z" />
    </Glyph>
  )
}

export function BuildGlyph({ className }: GlyphProps) {
  // modular block
  return (
    <Glyph className={className}>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="13" width="7" height="7" />
      <path d="M11 7.5h5.5V13M13 16.5H7.5V11" />
    </Glyph>
  )
}

export function ProveGlyph({ className }: GlyphProps) {
  // evidence / check
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.8 2.8L16.5 9" />
    </Glyph>
  )
}

export function EnableGlyph({ className }: GlyphProps) {
  // outward / upward movement
  return (
    <Glyph className={className}>
      <path d="M7 17 17 7M9 7h8v8" />
    </Glyph>
  )
}

export function CultureGlyph({ className }: GlyphProps) {
  // a mark people gather around
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </Glyph>
  )
}

export const INTERVENTION_GLYPHS = {
  Orient: OrientGlyph,
  Coordinate: CoordinateGlyph,
  Resource: ResourceGlyph,
  Build: BuildGlyph,
  Prove: ProveGlyph,
  Enable: EnableGlyph,
  Culture: CultureGlyph,
} as const

export type InterventionGlyphKey = keyof typeof INTERVENTION_GLYPHS

// Compact item glyphs for the "What we do" chips. Same 24px stroke grid.
export type ItemIcon =
  | 'map'
  | 'doc'
  | 'people'
  | 'money'
  | 'chip'
  | 'check'
  | 'box'
  | 'arrow'
  | 'trophy'
  | 'stack'
  | 'flag'
  | 'shield'

export function ItemGlyph({ icon, className }: { icon: ItemIcon; className?: string }) {
  switch (icon) {
    case 'map':
      return (
        <Glyph className={className}>
          <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5-6 2.5zM9 4v13.5M15 6.5V20" />
        </Glyph>
      )
    case 'doc':
      return (
        <Glyph className={className}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4M9 12h6M9 16h6" />
        </Glyph>
      )
    case 'people':
      return (
        <Glyph className={className}>
          <circle cx="9" cy="8.5" r="2.7" />
          <path d="M3.5 19c.6-3 2.8-4.7 5.5-4.7S13.9 16 14.5 19" />
          <path d="M15.5 6.5a2.5 2.5 0 1 1 1.4 4.7M16.5 13.6c2.2.4 3.6 1.9 4 4.4" />
        </Glyph>
      )
    case 'money':
      return (
        <Glyph className={className}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v10M15 9.2c-.6-1-1.7-1.4-3-1.4-1.6 0-2.8.8-2.8 2s1.1 1.8 2.8 2.2c1.7.4 2.9 1 2.9 2.2 0 1.3-1.3 2.1-3.1 2.1-1.4 0-2.6-.5-3.2-1.5" />
        </Glyph>
      )
    case 'chip':
      return (
        <Glyph className={className}>
          <rect x="7" y="7" width="10" height="10" rx="1" />
          <path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" />
        </Glyph>
      )
    case 'check':
      return <ProveGlyph className={className} />
    case 'box':
      return <BuildGlyph className={className} />
    case 'arrow':
      return <EnableGlyph className={className} />
    case 'trophy':
      return (
        <Glyph className={className}>
          <path d="M8 4h8v5.5a4 4 0 0 1-8 0zM8 5.5H4.5V7A3.5 3.5 0 0 0 8 10.4M16 5.5h3.5V7a3.5 3.5 0 0 1-3.5 3.4M12 13.5V17M8.5 20h7M10 17h4v3h-4z" />
        </Glyph>
      )
    case 'stack':
      return (
        <Glyph className={className}>
          <path d="M12 3 3 8l9 5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />
        </Glyph>
      )
    case 'flag':
      return (
        <Glyph className={className}>
          <path d="M6 21V4M6 5c2-1.3 4-1.3 6 0s4 1.3 6 0v8c-2 1.3-4 1.3-6 0s-4-1.3-6 0" />
        </Glyph>
      )
    case 'shield':
      return (
        <Glyph className={className}>
          <path d="M12 3l7 3v5.5c0 4.6-3 7.8-7 9.5-4-1.7-7-4.9-7-9.5V6z" />
        </Glyph>
      )
  }
}
