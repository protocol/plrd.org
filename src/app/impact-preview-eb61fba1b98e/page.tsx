import type { Metadata } from 'next'
import styles from './page.module.css'
import Breadcrumb from '@/components/Breadcrumb'
import ImpactDashboardV2 from '@/components/ImpactDashboardV2'
import ImpactSectionLink from '@/components/ImpactSectionLink'
import ImpactMethodologyTabs from '@/components/ImpactMethodologyTabs'
import { HypercertsShowcase } from '@/components/hypercerts/HypercertsShowcase'
import { fetchResearchRetreatHypercerts } from '@/lib/hypercerts'
import { fetchLiveOutputs } from '@/lib/field-velocity-live'
import { isFocusAreaKey, loadFieldVelocity } from '@/lib/field-velocity-data'
import { VELOCITY_SIGNALS } from '@/lib/velocity-signals'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Impact',
  description:
    'How PL R&D builds frontier fields: diagnose the bottleneck, intervene, and learn by reading field velocity.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const bottlenecks = [
  ['Knowledge', 'The opportunity, landscape or problem is still illegible.'],
  ['Capability', 'The science or technology cannot yet do what is required.'],
  ['Coordination', 'The right actors exist, but they are fragmented.'],
  ['Talent', 'Too few capable people are working on the problem.'],
  ['Capital', 'The right capital is missing, or available at the wrong stage.'],
  ['Infrastructure', 'A shared capability is missing and blocking many actors at once.'],
  ['Validation', 'Something promising exists, but has not been proven in the world.'],
  ['Demand', 'The capability exists, but there is no clear route to adoption.'],
  ['Policy / legitimacy', 'Rules, standards, incentives or trust prevent deployment.'],
  ['Institutional capacity', 'No durable organization can carry the work forward.'],
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
      'Pilots · prototype programs · sandboxes · demonstrations · reference implementations · deployment partnerships · sovereign pilots',
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

const learnCategories = [
  [
    'Constraint',
    'Did the bottleneck we named actually loosen?',
    'The diagnosis is only useful if the targeted constraint starts to give.',
  ],
  [
    'Field velocity',
    'Did the field move in the way we expected?',
    'Read the same velocity signals we used to diagnose: capability, constraints, speed, commitment, adoption, durability.',
  ],
  [
    'Substitution',
    'Did another bottleneck become more important?',
    'A loosened constraint often reveals the next rate-limiter. That is a new diagnosis, not a failure.',
  ],
  [
    'Diagnosis',
    'Was the original diagnosis wrong?',
    'A miss updates the model. Inflection points are dated, falsifiable markers — not pass-or-fail targets.',
  ],
  [
    'Compounding',
    'Is the field becoming more able to move without us?',
    'Successful field building should eventually make the field less dependent on the field builder.',
  ],
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
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <Breadcrumb items={[{ label: 'Impact' }]} />

        <section className="pb-12 pt-10 lg:pb-16 lg:pt-14">
          <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Our impact methodology
          </div>

          <h1 className="max-w-4xl text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] text-black sm:text-[56px] lg:text-[72px]">
            How we build fields.
          </h1>

          <p className="mt-7 max-w-3xl text-[19px] leading-[1.65] text-gray-600">
            PL R&amp;D works on frontier fields where the opportunity is large,
            but progress is constrained. We map the field, name the bottleneck,
            and intervene where we believe we can unlock the most movement.
          </p>

          <p className="mt-4 max-w-3xl text-[19px] leading-[1.65] text-gray-600">
            The loop is three steps:{' '}
            <strong className="font-semibold text-black">Diagnose</strong>,{' '}
            <strong className="font-semibold text-black">Intervene</strong>,{' '}
            <strong className="font-semibold text-black">Learn</strong>. Reading
            field velocity is how we diagnose — and how we diagnose again.
            Compounding is not a separate step; it is what Learn is for.
          </p>
        </section>
      </div>

      <ImpactMethodologyTabs>
        <section id="diagnose" className="scroll-mt-24">
          <div
            id="field-velocity"
            className="scroll-mt-24 border-y border-gray-200 bg-gray-100"
          >
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
              <div id="observe" className="scroll-mt-24" />
              <div id="observed-velocity" className="scroll-mt-24" />
              <div className="mb-10 max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Field velocity
                </div>

                <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
                  <ImpactSectionLink fragment="#field-velocity">
                    Six ways to read field velocity.
                  </ImpactSectionLink>
                </h2>

                <p className="mt-5 text-[17px] leading-[1.65] text-gray-600">
                  A field can appear busy without making meaningful progress. We
                  call the rate of meaningful change{' '}
                  <strong className="font-semibold text-black">
                    field velocity
                  </strong>
                  . Diagnose and observe are the same motion: read whether the
                  constraint is loosening, then diagnose again.
                </p>

                <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
                  Field velocity is not a single score. Each signal is what we
                  want to understand; the instruments nested under it are how we
                  measure it. Different fields use different combinations. Pick a
                  focus area to read the live charts that apply to it.
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
                mode="charts"
                orientation="vertical"
                signals={VELOCITY_SIGNALS}
              />
            </div>
          </div>

          <div
            className={`${styles.downArrow} border-b border-gray-200 bg-white`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 5v14m0 0-5-5m5 5 5-5"
              />
            </svg>
          </div>

          <div id="methodology" className="border-b border-gray-200 bg-gray-50">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Bottlenecks
              </div>

              <h2 className="mt-4 max-w-3xl text-[28px] font-semibold leading-tight tracking-[-0.025em] text-black sm:text-[32px]">
                <ImpactSectionLink fragment="#methodology">
                  Identify the bottlenecks.
                </ImpactSectionLink>
              </h2>

              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-gray-500">
                After reading the field, name what is actually rate-limiting it
                now — not which bottleneck would be interesting to work on. The
                intervention follows that diagnosis.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-2" data-bottlenecks="">
                {bottlenecks.map(([title, description]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-black/10 bg-white px-5 py-6 sm:px-6 sm:py-8"
                  >
                    <div className="text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] text-black sm:text-[32px]">
                      {title}
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                      {description}
                    </p>
                  </div>
                ))}
              </div>

              <p
                className={`${styles.diagnosisQuote} max-w-3xl text-[15px] leading-relaxed text-gray-500`}
              >
                Binding question, after the blockers:{' '}
                <span className="font-medium text-black">
                  which of these is preventing this field from moving faster
                  now?
                </span>
              </p>
            </div>
          </div>
        </section>

        <section id="intervene" className="scroll-mt-24">
          <div id="toolkit" className="scroll-mt-24" />
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Intervention categories
              </div>

              <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
                Six repeatable ways to unblock a field.
              </h2>

              <p className="mt-5 text-[17px] leading-[1.65] text-gray-600">
                These are not categories of activity. They are the levers by which
                we try to change conditions in a field. The lever should follow
                the bottleneck.
              </p>
            </div>

            <div className={`${styles.cultureLayer} mt-10`}>
              <div className={styles.cultureRail}>
                <span>Culture</span>
                <span className={styles.cultureRailCopy}>
                  Horizontal layer · not a seventh lever
                </span>
              </div>

              <div className="divide-y divide-gray-200 border-y border-gray-200">
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
            </div>

            <p className="mt-6 max-w-3xl text-[14px] leading-relaxed text-gray-500">
              Culture is the spanning condition, not a seventh category. It
              shapes what people notice, believe is possible, and choose to
              join — across Orient, Coordinate, Resource, Build, Prove and
              Enable. Narrative and talent run through the same layer:
              discovering a field, joining networks, receiving resources,
              building infrastructure, running pilots and creating institutions.
            </p>
          </div>

          <div
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
                    <ImpactSectionLink fragment="#verified-impact">
                      Documenting our hand.
                    </ImpactSectionLink>
                  </h2>
                </div>

                <div>
                  <p className="text-[17px] leading-[1.65] text-gray-600">
                    Field velocity describes{' '}
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
                    Hypercerts, program records, outputs and supporting
                    evidence make our contribution legible and inspectable
                    without pretending that field-level outcomes can be cleanly
                    attributed to PL R&amp;D.
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
          </div>
        </section>

        <section id="learn" className="scroll-mt-24">
          <div id="compound" className="scroll-mt-24" />
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Learn categories
              </div>

              <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
                Every intervention is a hypothesis.
              </h2>

              <p className="mt-5 text-[17px] leading-[1.65] text-gray-600">
                After we intervene, we diagnose again. The aim is not to prove
                ourselves right. It is to get better at building fields — and,
                over time, to leave behind a field that can generate, fund,
                coordinate and sustain progress itself.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {learnCategories.map(([title, question, detail]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-black/10 bg-white px-5 py-6 sm:px-6"
                >
                  <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    {title}
                  </div>
                  <div className="mt-3 text-[20px] font-semibold leading-snug tracking-tight text-black">
                    {question}
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                    {detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
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
                  [field velocity] to test whether that happened.
                </p>
              </div>

              <div className="mt-7 overflow-x-auto text-[12px] font-medium text-gray-500">
                bottleneck → intervention → expected change → field velocity →
                updated diagnosis
              </div>
            </div>

            <div className="mt-16 rounded-2xl bg-black p-7 text-white sm:p-9">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Inflection points
              </div>

              <h3 className="mt-3 max-w-2xl text-[28px] font-semibold leading-tight tracking-[-0.02em]">
                What would convince us the field has changed?
              </h3>

              <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-white/65">
                Velocity describes movement. Inflection points describe
                meaningful changes in state. For each Frontier Opportunity, we
                define observable, dated and falsifiable shifts and track the
                current constraint, expected horizon, live signals, relevant
                interventions and status.
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
          </div>

          <div className="border-t border-gray-200 bg-gray-50">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
              <ImpactDashboardV2
                key={`${initialArea}-learn`}
                initialArea={initialArea}
                liveOutputs={liveOutputs}
                marketSignals={marketSignals}
                recordsByArea={recordsByArea}
                measurementSeriesByArea={measurementSeriesByArea}
                ideaVintageExamples={ideaVintageExamples}
                mode="inflections"
                orientation="vertical"
              />
            </div>
          </div>
        </section>
      </ImpactMethodologyTabs>

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
