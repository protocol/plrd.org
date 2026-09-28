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

      <div className="method-cycle mt-8 pb-8 md:mt-10 md:pb-9">
        <ol className="method-cycle-track">
          {STAGES.map((stage, index) => (
            <li key={stage.kicker} className="method-cycle-stage">
              {index < STAGES.length - 1 && <span className="method-cycle-forward" aria-hidden="true" />}
              <p className="method-cycle-kicker">{stage.kicker}</p>
              <p className="method-cycle-title">{stage.title}</p>
              <p className="method-cycle-body">{stage.body}</p>
              {stage.kicker === 'Intervene' && (
                <ul className="method-cycle-levers">
                  {TYPE_ORDER.map((id) => (
                    <li key={id}>
                      <InterventionTypeIcon type={id} className="h-3.5 w-3.5 shrink-0" />
                      <span>{INTERVENTION_TYPES[id].title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        <p className="method-cycle-return" aria-hidden="true">
          <svg viewBox="0 0 1000 28" fill="none" preserveAspectRatio="none">
            <path
              d="M833 2 C 833 22, 167 22, 167 2"
              stroke="currentColor"
              strokeWidth="1.25"
              vectorEffect="non-scaling-stroke"
            />
            <path d="M161 8 L167 2 L173 8" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          </svg>
        </p>
      </div>
    </section>
  )
}
