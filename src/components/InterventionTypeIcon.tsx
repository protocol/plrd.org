import type { InterventionTypeId } from '@/lib/interventions'

// A shared six-mode vocabulary: radar, nodes, diamond, module, evidence, outward.
// Stroke glyphs so the same marks can sit on cards, the map, and later site surfaces.

export default function InterventionTypeIcon({
  type,
  className = 'h-3.5 w-3.5',
}: {
  type: InterventionTypeId
  className?: string
}) {
  const common = {
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {type === 'orient' && (
        <>
          <circle cx="12" cy="12" r="8" {...common} />
          <circle cx="12" cy="12" r="4.2" {...common} />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20" {...common} />
        </>
      )}
      {type === 'coordinate' && (
        <>
          <circle cx="6.5" cy="7" r="2" {...common} />
          <circle cx="17.5" cy="7" r="2" {...common} />
          <circle cx="12" cy="17" r="2" {...common} />
          <path d="M8.3 8.1 10.4 15.2M15.7 8.1 13.6 15.2M8.5 7h7" {...common} />
        </>
      )}
      {type === 'resource' && (
        <path d="M12 3.2 15.6 12 12 20.8 8.4 12 12 3.2Z" {...common} />
      )}
      {type === 'build' && (
        <>
          <rect x="4" y="4" width="7" height="7" rx="0.4" {...common} />
          <rect x="13" y="4" width="7" height="7" rx="0.4" {...common} />
          <rect x="4" y="13" width="7" height="7" rx="0.4" {...common} />
          <rect x="13" y="13" width="7" height="7" rx="0.4" {...common} />
        </>
      )}
      {type === 'prove' && (
        <>
          <rect x="4.5" y="3.5" width="15" height="17" rx="0.6" {...common} />
          <path d="M8 12.2 10.6 14.7 16.2 9.2" {...common} />
        </>
      )}
      {type === 'enable' && (
        <>
          <path d="M5 16.5 12 5.5l7 11" {...common} />
          <path d="M8.2 16.5h7.6" {...common} />
          <path d="M12 16.5v3" {...common} />
        </>
      )}
    </svg>
  )
}
