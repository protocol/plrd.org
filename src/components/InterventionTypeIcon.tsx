import type { InterventionTypeId } from '@/lib/interventions'

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
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {type === 'orient' && (
        <>
          <circle cx="12" cy="12" r="8.2" {...common} />
          <path d="M12 5.5v13M5.5 12h13" {...common} />
          <circle cx="12" cy="12" r="2.2" {...common} />
        </>
      )}
      {type === 'coordinate' && (
        <>
          <circle cx="7" cy="7" r="2.2" {...common} />
          <circle cx="17" cy="7" r="2.2" {...common} />
          <circle cx="7" cy="17" r="2.2" {...common} />
          <circle cx="17" cy="17" r="2.2" {...common} />
          <path d="M9 7h6M7 9v6M17 9v6M9 17h6" {...common} />
        </>
      )}
      {type === 'resource' && (
        <path d="M12 3.4c.5 2.6 1.7 4.3 4 5.6-2.3.8-3.5 2.4-4 5.6-.5-3.2-1.7-4.8-4-5.6 2.3-1.3 3.5-3 4-5.6ZM6.4 14.4c.3 1.6 1 2.7 2.4 3.5-1.4.5-2.1 1.5-2.4 3.5-.3-2-1-3-2.4-3.5 1.4-.8 2.1-1.9 2.4-3.5ZM17.6 13.3c.25 1.3.8 2.1 1.9 2.8-1.1.4-1.65 1.2-1.9 2.8-.25-1.6-.8-2.4-1.9-2.8 1.1-.7 1.65-1.5 1.9-2.8Z" {...common} />
      )}
      {type === 'build' && (
        <path d="M4.6 9.4 12 5.4l7.4 4v9.2L12 22.6l-7.4-4V9.4ZM12 5.4v17.2M8.2 11.6h7.6M8.2 15.4h7.6" {...common} />
      )}
      {type === 'prove' && (
        <>
          <path d="M7.6 4.6h8.8l.4 2.1A6.2 6.2 0 0 1 12 19.4 6.2 6.2 0 0 1 7.2 6.7L7.6 4.6Z" {...common} />
          <path d="m9.4 12.1 1.9 2 3.6-3.8" {...common} />
        </>
      )}
      {type === 'enable' && (
        <>
          <circle cx="10" cy="12" r="3.4" {...common} />
          <path d="M13.6 12H20m-2.3-2.3L20.4 12l-2.7 2.3" {...common} />
        </>
      )}
    </svg>
  )
}
