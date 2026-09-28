import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import { INTERVENTION_TYPES, type InterventionTypeId } from '@/lib/interventions'

const STAGES = [
  {
    kicker: 'Observe',
    title: 'Read the field',
    body: 'Track where a field is moving, stalling or changing.',
  },
  {
    kicker: 'Diagnose',
    title: 'Find the constraint',
    body: 'Turn those signals into a view of what is actually blocking progress.',
  },
  {
    kicker: 'Intervene',
    title: 'Pull the right lever',
    body: 'Choose the lever that loosens that constraint.',
  },
] as const

const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export default function InterventionMethod() {
  return (
    <section aria-labelledby="intervention-method" className="border-y border-black/10 py-12 md:py-14">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">A repeatable method</p>
        <h2
          id="intervention-method"
          className="mt-3 max-w-[22ch] font-serif text-[32px] font-normal leading-[1.05] tracking-tight text-black md:text-[40px]"
        >
          Observe. Diagnose. Intervene. Repeat.
        </h2>
      </div>

      <div className="method-cycle mt-8 md:mt-10">
        <ol className="method-cycle-track">
          {STAGES.map((stage) => (
            <li key={stage.kicker} className="method-cycle-stage">
              <p className="method-cycle-kicker">{stage.kicker}</p>
              <p className="method-cycle-title">{stage.title}</p>
              <p className="method-cycle-body">{stage.body}</p>
            </li>
          ))}
        </ol>
        <p className="method-cycle-return" aria-hidden="true">
          <svg viewBox="0 0 120 36" fill="none">
            <path d="M12 6 H108" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M12 6 L18 2 M12 6 L18 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M108 6 L102 2 M108 6 L102 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <text x="60" y="28" textAnchor="middle" fill="currentColor">
              Repeat
            </text>
          </svg>
        </p>
        <ul className="method-cycle-levers">
          {TYPE_ORDER.map((id) => (
            <li key={id}>
              <InterventionTypeIcon type={id} className="h-3.5 w-3.5 shrink-0" />
              <span>{INTERVENTION_TYPES[id].title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
