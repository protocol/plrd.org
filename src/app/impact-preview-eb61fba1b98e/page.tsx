import type { Metadata } from 'next'
import styles from './page.module.css'
import Breadcrumb from '@/components/Breadcrumb'
import ImpactDashboardV2 from '@/components/ImpactDashboardV2'
import ImpactSectionLink from '@/components/ImpactSectionLink'
import { HypercertsShowcase } from '@/components/hypercerts/HypercertsShowcase'
import { fetchResearchRetreatHypercerts } from '@/lib/hypercerts'
import { fetchLiveOutputs } from '@/lib/field-velocity-live'
import { isFocusAreaKey, loadFieldVelocity } from '@/lib/field-velocity-data'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Impact',
  description:
    'How PL R&D builds frontier fields: diagnose constraints, intervene, observe field velocity, compound progress, and learn.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const operatingModel = [
  ['01', 'Diagnose', 'Find the binding constraint.'],
  ['02', 'Intervene', 'Apply the right field-building lever.'],
  ['03', 'Observe', 'Look for evidence the field is moving.'],
  ['04', 'Compound', 'Help progress become self-sustaining.'],
  ['05', 'Learn', 'Update the diagnosis and repeat.'],
] as const

const interventions = [
  {
    title: 'Orient',
    subtitle: 'Make the field legible.',
    failure: 'The opportunity, landscape or bottleneck is not yet clear.',
    actions:
      'Field maps · technology trees · Frontier Opportunity memos · benchmarks · taxonomies · roadmaps · research theses · investment theses',
    evidence:
      'Credible actors change what they understand or do; hidden bottlenecks become visible and begin receiving attention or resources.',
  },
  {
    title: 'Coordinate',
    subtitle: 'Assemble the actors required to move it.',
    failure:
      'The right people and institutions exist, but they are fragmented, disconnected or working at cross-purposes.',
    actions:
      'Decision-grade convenings · scientific advisory boards · funder cohorts · working groups · coalitions · fellowships · institutional partnerships',
    evidence:
      'Repeat collaboration, new projects, coordinated capital, agreements or standards, and shorter time from introduction to collaboration.',
  },
  {
    title: 'Resource',
    subtitle: 'Put resources behind the bottlenecks.',
    failure:
      'Promising work exists, but lacks the right capital, talent, compute, data or institutional support.',
    actions:
      'Philanthropy · grants · prizes · fellowships · compute · data · institutional budgets · public funding · procurement · venture and growth capital',
    evidence:
      'Additional capital enters the field, funding moves faster, follow-on resources appear, and projects graduate toward the capital they need next.',
  },
  {
    title: 'Build',
    subtitle: 'Create the shared capacity the field is missing.',
    failure:
      'A missing technical capability, piece of infrastructure or institution is blocking progress for many actors at once.',
    actions:
      'Protocols · open-source tooling · shared datasets · research infrastructure · standards · FROs · nonprofits · institutes · permanent coalitions',
    evidence:
      'Real users and dependencies, lower cost or time for downstream actors, new research enabled, and infrastructure that can persist without PL R&D.',
  },
  {
    title: 'Prove',
    subtitle: 'Move promising ideas into the world.',
    failure:
      'Something promising exists, but lacks credible evidence outside the lab.',
    actions:
      'Pilots · prototype programmes · sandboxes · demonstrations · reference implementations · deployment partnerships · sovereign pilots',
    evidence:
      'Pilot → adoption, procurement, follow-on deployment, improved cost or performance, and better evidence about what actually works.',
  },
  {
    title: 'Enable',
    subtitle: 'Change the environment around what works.',
    failure:
      'The capability exists, but rules, standards, incentives, legitimacy or institutional structures prevent it from spreading.',
    actions:
      'Standards · regulatory playbooks · procurement routes · experimentation rights · interoperability rules · assurance frameworks · evaluation frameworks · governance models',
    evidence:
      'Standards adopted, procurement enabled, barriers removed, and third parties increasingly able to deploy or replicate what works.',
  },
] as const

const velocitySignals = [
  [
    'Capability',
    'Can the field do more?',
    'What can the field do today that it could not do a year ago?',
  ],
  [
    'Constraints',
    'Are bottlenecks loosening?',
    'Is the thing preventing progress becoming easier to overcome?',
  ],
  [
    'Transition speed',
    'Is work moving faster?',
    'Is the path from possibility to real-world use getting shorter?',
  ],
  [
    'Commitment',
    'Are serious actors leaning in?',
    'Are credible actors making increasingly costly and persistent commitments?',
  ],
  [
    'Adoption',
    'Is useful work reaching the world?',
    'Is what works becoming used?',
  ],
  [
    'Durability',
    'Can the field increasingly move without us?',
    'Is the capacity for progress becoming embedded in the field itself?',
  ],
] as const

const measurementInstruments = [
  [
    'Performance curves',
    'How cost, quality, capability or scale changes over time.',
  ],
  [
    'Latency compression',
    'Whether meaningful stages of progress are happening faster.',
  ],
  [
    'Idea vintage',
    'How quickly the intellectual frontier is turning over.',
  ],
  [
    'Revealed commitments',
    'Where people actually put careers, capital, teams and institutional resources.',
  ],
  [
    'Markets',
    'Changing expectations about future capabilities or events where credible markets exist.',
  ],
  [
    'Direct capability measures',
    'Benchmarks or demonstrations showing that something previously impossible is now possible.',
  ],
  [
    'Adoption measures',
    'Pilots, deployments, procurement, usage, standards uptake and independent replication.',
  ],
] as const

const constraints = [
  'Knowledge',
  'Capability',
  'Coordination',
  'Talent',
  'Capital',
  'Infrastructure',
  'Validation',
  'Demand',
  'Policy / legitimacy',
  'Institutional capacity',
] as const

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[] }>
}) {
  const [liveOutputs, fieldVelocity, certs, query] = await Promise.all([
    fetchLiveOutputs(),
    loadFieldVelocity(),
    fetchResearchRetreatHypercerts(),
    searchParams,
  ])

  const area = query?.area

  const initialArea =
    typeof area === 'string' && isFocusAreaKey(area)
      ? area
      : 'digital-human-rights'

  const {
    recordsByArea,
    measurementSeriesByArea,
    marketSignals,
    ideaVintageExamples,
  } = fieldVelocity

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <Breadcrumb items={[{ label: 'Impact' }]} />

        <section className="pb-16 pt-10 lg:pb-20 lg:pt-14">
          <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Our impact methodology
          </div>

          <h1 className="max-w-4xl text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] text-black sm:text-[56px] lg:text-[72px]">
            How we build fields.
          </h1>

          <p className="mt-7 max-w-3xl text-[19px] leading-[1.65] text-gray-600">
            PL R&amp;D works on frontier fields where the opportunity is large,
            but progress is constrained. We map the field, identify what is
            holding it back, and intervene where we believe we can unlock the
            most movement. Then we watch what changes.
          </p>

          <p className="mt-4 max-w-3xl text-[19px] leading-[1.65] text-gray-600">
            Fields are complex systems, with many actors. We make our hypotheses
            explicit, document and measure our interventions, and look for
            evidence that the constraints we targeted are beginning to loosen.
          </p>

          {/* OPERATING MODEL */}
          <div className="mt-10 grid overflow-hidden rounded-2xl border border-black/10 bg-white lg:grid-cols-5">
            {operatingModel.map(([number, title, description], index) => (
              <div
                key={title}
                className={`relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 p-5 lg:block lg:min-h-[150px] lg:p-6 ${
                  index < operatingModel.length - 1
                    ? 'border-b border-black/10 lg:border-b-0 lg:border-r'
                    : ''
                }`}
              >
                <div className="row-span-2 pt-1 text-[11px] font-semibold tracking-[0.16em] text-gray-500 lg:pt-0">
                  {number}
                </div>

                <div className="text-[17px] font-semibold tracking-tight text-black lg:mt-7">
                  {title}
                </div>

                <p className="col-start-2 mt-1 text-[13px] leading-relaxed text-gray-500 lg:mt-2">
                  {description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-gray-500">
            Our goal is to help frontier fields become increasingly capable of
            generating and sustaining progress themselves.
          </p>
        </section>
      </div>

      {/* DIAGNOSE */}
      <section
        id="diagnose"
        className="scroll-mt-24 border-y border-gray-200 bg-gray-50"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-20">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              01 · Diagnose
            </div>

            <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
              What is rate-limiting the field?
            </h2>
          </div>

          <div>
            <p className="text-[18px] leading-[1.65] text-gray-600">
              Before choosing an intervention, identify what is actually
              preventing progress. The useful question is:
            </p>

            <blockquote className={`${styles.diagnosisQuote} border-l-2 border-black pl-6 text-[24px] font-medium leading-snug tracking-tight text-black`}>
              What is the most important thing preventing this field from moving
              faster now?
            </blockquote>

            <p className="text-[15px] leading-relaxed text-gray-500">
              A binding constraint might be technical, financial, institutional
              or social. The intervention should follow the diagnosis.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {constraints.map((constraint) => (
                <span
                  key={constraint}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600"
                >
                  {constraint}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTERVENE */}
      <section
        id="intervene"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 lg:py-20"
      >
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            02 · Intervene
          </div>

          <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
            Six repeatable ways to unblock a field.
          </h2>

          <p className="mt-5 text-[17px] leading-[1.65] text-gray-600">
            These are not categories of activity. They are the levers by which
            we try to change conditions in a field.
          </p>
        </div>

        <div className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
          {interventions.map((intervention, index) => (
            <details key={intervention.title} className="group">
              <summary className="grid cursor-pointer list-none grid-cols-[42px_1fr_auto] items-center gap-4 py-5 marker:hidden sm:grid-cols-[60px_0.7fr_1.3fr_auto] sm:py-6">
                <span className="text-[12px] font-medium tabular-nums text-gray-500">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="text-[18px] font-semibold tracking-tight text-black">
                  {intervention.title}
                </span>

                <span className="hidden text-[14px] text-gray-500 sm:block">
                  {intervention.subtitle}
                </span>

                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="grid gap-7 pb-7 pl-[58px] sm:grid-cols-3 sm:pl-[76px]">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Failure addressed
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                    {intervention.failure}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    What we do
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                    {intervention.actions}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    What we look for
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                    {intervention.evidence}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Cross-cutting layer
          </div>

          <div className="mt-3 text-[22px] font-semibold tracking-tight text-black">
            Narrative · Culture · Talent
          </div>

          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-gray-600">
            These forces cut horizontally across all six interventions.
            Narrative and culture shape what people notice, believe is possible
            and choose to join. Talent moves through the entire system:
            discovering a field, joining networks, receiving resources, building
            infrastructure, running pilots and creating institutions.
          </p>
        </div>
      </section>

      {/* OBSERVE / LIVE DASHBOARD */}
      <section
        id="observe"
        className="scroll-mt-24 border-y border-gray-200 bg-gray-100"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <div className="mb-10 max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              03 · Observe
            </div>

            <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
              Is the field actually moving?
            </h2>

            <p className="mt-5 text-[17px] leading-[1.65] text-gray-600">
              A field can appear busy without making meaningful progress. We
              call the rate of meaningful change{' '}
              <strong className="font-semibold text-black">
                Field Velocity
              </strong>
              .
            </p>

            <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
              Pick a focus area below. The live view reads that field&apos;s
              velocity through the instruments that apply to it and the
              inflection points we are tracking.
            </p>
          </div>

          <ImpactDashboardV2
            key={initialArea}
            initialArea={initialArea}
            liveOutputs={liveOutputs}
            marketSignals={marketSignals}
            recordsByArea={recordsByArea}
            measurementSeriesByArea={measurementSeriesByArea}
            ideaVintageExamples={ideaVintageExamples}
          />
        </div>
      </section>

      {/* FIELD VELOCITY FRAMEWORK */}
      <section
        id="field-velocity"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 lg:py-20"
      >
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Field Velocity
            </div>

            <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
              Six signals of meaningful movement.
            </h2>

            <p className="mt-5 text-[15px] leading-relaxed text-gray-500">
              Field Velocity is not a single score. We look for multiple signals
              that, taken together, tell us where a field is accelerating, what
              is still holding it back, and whether that constraint is becoming
              less binding.
            </p>
          </div>

          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {velocitySignals.map(([title, question, core], index) => (
              <div
                key={title}
                className="grid gap-3 py-5 sm:grid-cols-[38px_0.7fr_1.3fr] sm:gap-5"
              >
                <span className="text-[11px] font-medium tabular-nums text-gray-500">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div>
                  <div className="text-[15px] font-semibold text-black">
                    {title}
                  </div>
                  <div className="mt-1 text-[12px] text-gray-500">
                    {question}
                  </div>
                </div>

                <p className="text-[13px] leading-relaxed text-gray-600">
                  {core}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* MEASUREMENT */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Measurement instruments
            </div>

            <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-black">
              Signals are not instruments.
            </h3>

            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              The dimensions above describe{' '}
              <strong className="font-semibold text-black">
                what we want to understand
              </strong>
              . The instruments describe{' '}
              <strong className="font-semibold text-black">
                how we measure it
              </strong>
              . Different fields use different combinations.
            </p>
          </div>

          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {measurementInstruments.map(([title, description]) => (
              <div key={title} className="bg-white p-5">
                <div className="text-[14px] font-semibold text-black">
                  {title}
                </div>

                <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* INFLECTION POINTS */}
        <div className="mt-16 rounded-2xl bg-black p-7 text-white sm:p-9">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Inflection points
          </div>

          <h3 className="mt-3 max-w-2xl text-[28px] font-semibold leading-tight tracking-[-0.02em]">
            What would convince us the field has changed?
          </h3>

          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-white/65">
            Velocity describes movement. Inflection points describe meaningful
            changes in state. For each Frontier Opportunity, we define
            observable, dated and falsifiable shifts and track the current
            constraint, expected horizon, live signals, relevant interventions
            and status.
          </p>

          <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-medium text-white/70">
            {[
              'Current constraint',
              'Inflection point',
              'Expected horizon',
              'Live signals',
              'Relevant interventions',
              'Status',
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 px-3 py-1.5"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* COMPOUND */}
      <section
        id="compound"
        className="scroll-mt-24 border-y border-gray-200 bg-gray-50"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-20">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              04 · Compound
            </div>

            <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
              Can progress become self-sustaining?
            </h2>
          </div>

          <div>
            <p className="text-[17px] leading-[1.65] text-gray-600">
              A successful intervention should do more than produce an isolated
              outcome. Over time, we want capabilities, institutions,
              infrastructure, talent, capital and relationships created in a
              field to make subsequent progress easier.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2 text-[14px] font-semibold text-black">
              {[
                'new capability',
                'new actors',
                'new resources',
                'new deployments',
                'stronger field',
              ].map((item, index, all) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="rounded-full border border-gray-300 bg-white px-3 py-2">
                    {item}
                  </span>

                  {index < all.length - 1 && (
                    <span className="text-gray-500">→</span>
                  )}
                </span>
              ))}
            </div>

            <blockquote className="mt-9 border-l-2 border-black pl-6 text-[22px] font-medium leading-snug tracking-tight text-black">
              Is the field becoming increasingly capable of generating,
              coordinating, funding, deploying and sustaining progress itself?
            </blockquote>
          </div>
        </div>
      </section>

      {/* LEARN */}
      <section
        id="learn"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 lg:py-20"
      >
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              05 · Learn
            </div>

            <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
              Every intervention is a hypothesis.
            </h2>
          </div>

          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="space-y-5 text-[16px] leading-relaxed text-gray-700">
                <p>
                  <strong className="font-semibold text-black">
                    We believe
                  </strong>{' '}
                  [constraint] is holding back [field].
                </p>

                <p>
                  <strong className="font-semibold text-black">
                    We are applying
                  </strong>{' '}
                  [intervention] because we expect [observable change].
                </p>

                <p>
                  <strong className="font-semibold text-black">
                    We will use
                  </strong>{' '}
                  [evidence] to test whether that happened.
                </p>
              </div>
            </div>

            <p className="mt-6 text-[15px] leading-relaxed text-gray-600">
              Then we revisit it. Did the constraint loosen? Did the expected
              change happen? Did another bottleneck become more important? Was
              our original diagnosis wrong? What should we do next?
            </p>

            <div className="mt-7 overflow-x-auto rounded-xl bg-gray-50 px-5 py-4 text-[12px] font-medium text-gray-600">
              constraint → intervention → expected change → observed evidence →
              updated diagnosis
            </div>

            <p className="mt-5 text-[14px] leading-relaxed text-gray-500">
              The aim is not to prove ourselves right. It is to get better at
              building fields.
            </p>
          </div>
        </div>
      </section>

      {/* VERIFIED IMPACT */}
      <section
        id="verified-impact"
        className="scroll-mt-24 border-t border-gray-200 bg-gray-50"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Verified Impact + Hypercerts
              </div>

              <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
                Documenting our hand.
              </h2>
            </div>

            <div>
              <p className="text-[17px] leading-[1.65] text-gray-600">
                Field Velocity describes{' '}
                <strong className="font-semibold text-black">
                  what is happening in the field
                </strong>
                . Verified Impact documents{' '}
                <strong className="font-semibold text-black">
                  what PL R&amp;D actually did
                </strong>
                .
              </p>

              <p className="mt-4 text-[14px] leading-relaxed text-gray-500">
                Hypercerts, programme records, outputs and supporting evidence
                make our contribution legible and inspectable without pretending
                that field-level outcomes can be cleanly attributed to PL R&amp;D.
              </p>

              <a
                href="/areas/economies-governance/impact/hypercerts/"
                className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-blue hover:underline"
              >
                See all impact claims
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {certs.length > 0 && (
            <div className="mt-12">
              <HypercertsShowcase certs={certs} />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <ImpactSectionLink
          fragment="#diagnose"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 transition-colors hover:text-black"
        >
          Back to the methodology
          <span aria-hidden="true">↑</span>
        </ImpactSectionLink>
      </div>
    </div>
  )
}
