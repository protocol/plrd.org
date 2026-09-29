import type { Metadata } from 'next'
import styles from './page.module.css'
import { INTERVENTION_GLYPHS, ItemGlyph, type ItemIcon } from './InterveneIcons'
import Breadcrumb from '@/components/Breadcrumb'
import ImpactDashboardV2 from '@/components/ImpactDashboardV2'
import ImpactSectionLink from '@/components/ImpactSectionLink'
import ImpactMethodologyTabs from '@/components/ImpactMethodologyTabs'
import { fetchLiveOutputs } from '@/lib/field-velocity-live'
import { isFocusAreaKey, loadFieldVelocity } from '@/lib/field-velocity-data'

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
    actions: [
      { icon: 'map', label: 'Field maps' },
      { icon: 'stack', label: 'Technology trees' },
      { icon: 'doc', label: 'Frontier Opportunity memos' },
      { icon: 'check', label: 'Benchmarks' },
      { icon: 'box', label: 'Taxonomies' },
      { icon: 'flag', label: 'Roadmaps' },
      { icon: 'doc', label: 'Research theses' },
      { icon: 'money', label: 'Investment theses' },
    ] as { icon: ItemIcon; label: string }[],
    evidence:
      'Credible actors change what they understand or do; hidden bottlenecks become visible and begin receiving attention or resources.',
  },
  {
    title: 'Coordinate',
    subtitle: 'Assemble the actors required to move it.',
    failure:
      'The right people and institutions exist, but they are fragmented, disconnected or working at cross-purposes.',
    actions: [
      { icon: 'people', label: 'Decision-grade convenings' },
      { icon: 'doc', label: 'Scientific advisory boards' },
      { icon: 'money', label: 'Funder cohorts' },
      { icon: 'people', label: 'Working groups' },
      { icon: 'box', label: 'Coalitions' },
      { icon: 'arrow', label: 'Fellowships' },
      { icon: 'shield', label: 'Institutional partnerships' },
    ] as { icon: ItemIcon; label: string }[],
    evidence:
      'Repeat collaboration, new projects, coordinated capital, agreements or standards, and shorter time from introduction to collaboration.',
  },
  {
    title: 'Resource',
    subtitle: 'Put resources behind the bottlenecks.',
    failure:
      'Promising work exists, but lacks the right capital, talent, compute, data or institutional support.',
    actions: [
      { icon: 'money', label: 'Philanthropy' },
      { icon: 'money', label: 'Grants' },
      { icon: 'trophy', label: 'Prizes' },
      { icon: 'arrow', label: 'Fellowships' },
      { icon: 'chip', label: 'Compute' },
      { icon: 'stack', label: 'Data' },
      { icon: 'box', label: 'Institutional budgets' },
      { icon: 'flag', label: 'Public funding' },
      { icon: 'check', label: 'Procurement' },
      { icon: 'arrow', label: 'Venture and growth capital' },
    ] as { icon: ItemIcon; label: string }[],
    evidence:
      'Additional capital enters the field, funding moves faster, follow-on resources appear, and projects graduate toward the capital they need next.',
  },
  {
    title: 'Build',
    subtitle: 'Create the shared capacity the field is missing.',
    failure:
      'A missing technical capability, piece of infrastructure or institution is blocking progress for many actors at once.',
    actions: [
      { icon: 'box', label: 'Protocols' },
      { icon: 'box', label: 'Open-source tooling' },
      { icon: 'stack', label: 'Shared datasets' },
      { icon: 'chip', label: 'Research infrastructure' },
      { icon: 'check', label: 'Standards' },
      { icon: 'shield', label: 'FROs' },
      { icon: 'box', label: 'Nonprofits' },
      { icon: 'shield', label: 'Institutes' },
      { icon: 'arrow', label: 'Permanent coalitions' },
    ] as { icon: ItemIcon; label: string }[],
    evidence:
      'Real users and dependencies, lower cost or time for downstream actors, new research enabled, and infrastructure that can persist without PL R&D.',
  },
  {
    title: 'Prove',
    subtitle: 'Move promising ideas into the world.',
    failure:
      'Something promising exists, but lacks credible evidence outside the lab.',
    actions: [
      { icon: 'arrow', label: 'Pilots' },
      { icon: 'box', label: 'Prototype programs' },
      { icon: 'shield', label: 'Sandboxes' },
      { icon: 'trophy', label: 'Demonstrations' },
      { icon: 'check', label: 'Reference implementations' },
      { icon: 'people', label: 'Deployment partnerships' },
      { icon: 'flag', label: 'Sovereign pilots' },
    ] as { icon: ItemIcon; label: string }[],
    evidence:
      'Pilot → adoption, procurement, follow-on deployment, improved cost or performance, and better evidence about what actually works.',
  },
  {
    title: 'Enable',
    subtitle: 'Change the environment around what works.',
    failure:
      'The capability exists, but rules, standards, incentives, legitimacy or institutional structures prevent it from spreading.',
    actions: [
      { icon: 'check', label: 'Standards' },
      { icon: 'doc', label: 'Regulatory playbooks' },
      { icon: 'check', label: 'Procurement routes' },
      { icon: 'arrow', label: 'Experimentation rights' },
      { icon: 'box', label: 'Interoperability rules' },
      { icon: 'shield', label: 'Assurance frameworks' },
      { icon: 'check', label: 'Evaluation frameworks' },
      { icon: 'people', label: 'Governance models' },
    ] as { icon: ItemIcon; label: string }[],
    evidence:
      'Standards adopted, procurement enabled, barriers removed, and third parties increasingly able to deploy or replicate what works.',
  },
] as const

// The spanning conditions that run through every lever, shown as banners under
// the six levers rather than as a seventh category.
const spanningLayers = [
  {
    title: 'Culture',
    body: 'The spanning condition, not a seventh category. It shapes what people notice, believe is possible, and choose to join — across all six levers.',
  },
  {
    title: 'Narrative',
    body: 'The stories that make a field worth joining: how the opportunity is told, and who can picture themselves in it.',
  },
  {
    title: 'Talent',
    body: 'The people who carry a field — discovering it, joining networks, receiving resources, building infrastructure, running pilots, creating institutions.',
  },
]

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[] }>
}) {
  const [liveOutputs, fieldVelocity, query] = await Promise.all([
    fetchLiveOutputs(),
    loadFieldVelocity(),
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

          <h1 className="max-w-4xl text-[32px] font-semibold leading-[1.02] tracking-[-0.035em] text-black md:text-[44px]">
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
            <strong className="font-semibold text-black">Learn</strong>. Diagnose
            names the bottleneck. Learn reads field velocity, then checks the
            inflection points against what we did.
          </p>
        </section>
      </div>

      <ImpactMethodologyTabs>
        <section id="diagnose" className="scroll-mt-24">
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
                Name what is actually rate-limiting the field now — not which
                bottleneck would be interesting to work on. The intervention
                follows that diagnosis.
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

            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {interventions.map((intervention, index) => {
                const Glyph = INTERVENTION_GLYPHS[intervention.title as keyof typeof INTERVENTION_GLYPHS]
                return (
                <details key={intervention.title} className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[42px_1fr_auto] items-center gap-4 py-5 marker:hidden sm:grid-cols-[60px_auto_0.7fr_1.3fr_auto] sm:py-6">
                    <span className="text-[12px] font-medium tabular-nums text-gray-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500">
                      <Glyph className="h-4 w-4" />
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

                  <div className="grid gap-7 pb-7 pl-[42px] sm:grid-cols-3 sm:pl-[96px]">
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        {intervention.actions.map((action) => (
                          <span
                            key={action.label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-2 pr-3 text-[12px] font-medium text-gray-600"
                          >
                            <ItemGlyph icon={action.icon} className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {action.label}
                          </span>
                        ))}
                      </div>
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
                )
              })}
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-16">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Across every lever
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {spanningLayers.map((layer) => (
                <div
                  key={layer.title}
                  className="rounded-2xl border border-black/10 bg-gray-50 px-5 py-6 sm:px-6 sm:py-7"
                >
                  <div className="text-[18px] font-semibold tracking-tight text-black">
                    {layer.title}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
                    {layer.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="learn" className="scroll-mt-24">
          <div id="compound" className="scroll-mt-24" />
          <div
            id="field-velocity"
            className="scroll-mt-24 border-b border-gray-200 bg-gray-100"
          >
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
              <div id="observe" className="scroll-mt-24" />
              <div id="observed-velocity" className="scroll-mt-24" />
              <div className="mb-8 max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Field velocity
                </div>

                <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-black">
                  <ImpactSectionLink fragment="#field-velocity">
                    Field velocity.
                  </ImpactSectionLink>
                </h2>

                <p className="mt-5 text-[17px] leading-[1.65] text-gray-600">
                  Pick a focus area. The summary reads that field&rsquo;s
                  velocity across the instruments that apply to it. The
                  inflection points below are the markers we track.
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
                mode="all"
                orientation="horizontal"
              />
            </div>
          </div>
        </section>
      </ImpactMethodologyTabs>
    </div>
  )
}
