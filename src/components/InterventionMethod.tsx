import InterventionTypeIcon from '@/components/InterventionTypeIcon'
import { INTERVENTION_TYPES, type InterventionTypeId } from '@/lib/interventions'

const CHAIN = [
  { label: 'Field', note: 'A frontier domain, not a general stall' },
  { label: 'Bottleneck', note: 'The specific constraint in the way' },
  { label: 'Intervention', note: 'The work chosen to loosen it' },
  { label: 'Signal', note: 'Evidence the field actually moved' },
  { label: 'Field moves', note: 'Hypothesis updated, continued, or stopped' },
] as const

const PHASES = [
  {
    kicker: 'Diagnose',
    title: 'Name the constraint',
    body: 'Read field velocity. Fields stall on a specific bottleneck, not in general.',
  },
  {
    kicker: 'Intervene',
    title: 'Match the work',
    body: 'Orient, coordinate, resource, build, prove, or enable — whichever loosens that constraint.',
  },
  {
    kicker: 'Observe / Learn',
    title: 'Watch the field',
    body: 'Track whether the intervention changed the underlying field, then update the hypothesis.',
  },
] as const

const TYPE_ORDER = Object.keys(INTERVENTION_TYPES) as InterventionTypeId[]

export default function InterventionMethod() {
  return (
    <section aria-labelledby="intervention-method" className="border-y border-black/10 py-16 md:py-20">
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            A repeatable method
          </p>
          <h2 id="intervention-method" className="font-serif text-[32px] font-normal leading-[1.08] tracking-tight text-black md:text-[40px]">
            Diagnose, intervene, then watch whether the field moved.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-gray-500">
          The same loop sits under every program on this page. Types are tools, not departments.
        </p>
      </div>

      <ol className="intervention-chain mb-14 grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-5">
        {CHAIN.map((step, index) => (
          <li key={step.label} className="intervention-chain-step relative py-4 sm:px-3 sm:py-0">
            <div className="mb-3 flex items-center gap-3 sm:block">
              <span className="intervention-node relative z-[1] inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-black" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <p className="font-serif text-[22px] leading-none tracking-tight text-black">{step.label}</p>
            <p className="mt-2 max-w-[16ch] text-[13px] leading-snug text-gray-500">{step.note}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-10 border-t border-black/10 pt-10 md:grid-cols-3">
        {PHASES.map((phase) => (
          <div key={phase.kicker}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{phase.kicker}</p>
            <p className="mt-2 font-serif text-[22px] leading-tight tracking-tight text-black">{phase.title}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{phase.body}</p>
          </div>
        ))}
      </div>

      <ul className="mt-12 grid list-none grid-cols-2 gap-x-6 gap-y-4 border-t border-black/10 p-0 pt-8 sm:grid-cols-3 lg:grid-cols-6">
        {TYPE_ORDER.map((id) => (
          <li key={id} className="flex items-center gap-2 text-black">
            <InterventionTypeIcon type={id} className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              {INTERVENTION_TYPES[id].title}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
