// Public interventions catalog.
// Source of truth for plrd.org pages, FA sections, and the read-only JSON endpoint.
// These records are a reviewed public edition, not Console operational documents.
// Draft-source examples from FA2/FA4 planning docs (read 2026-09-25). All are proposed.

export type InterventionAreaSlug =
  | 'digital-human-rights'
  | 'economies-governance'
  | 'ai-robotics'
  | 'neurotech'

export type InterventionTypeId =
  | 'orient'
  | 'coordinate'
  | 'resource'
  | 'build'
  | 'prove'
  | 'enable'

export type InterventionStage = 'proposed' | 'active' | 'completed'

export type PublicIntervention = {
  slug: string
  title: string
  area: InterventionAreaSlug
  type: InterventionTypeId
  support: InterventionTypeId[]
  summary: string
  bottleneck: string
  work: string
  evidence: string
  timing: string
  stage: InterventionStage
  typeNote: string
  plRole: string
  published: boolean
}

export const INTERVENTION_AREA_ORDER: InterventionAreaSlug[] = [
  'digital-human-rights',
  'economies-governance',
  'ai-robotics',
  'neurotech',
]

export const INTERVENTION_AREA_LABEL: Record<InterventionAreaSlug, string> = {
  'digital-human-rights': 'Digital Human Rights',
  'economies-governance': 'Economies & Governance',
  'ai-robotics': 'AI & Robotics',
  neurotech: 'Neurotech',
}

export const INTERVENTION_AREA_HREF: Record<InterventionAreaSlug, string> = {
  'digital-human-rights': '/areas/digital-human-rights/',
  'economies-governance': '/areas/economies-governance/',
  'ai-robotics': '/areas/ai-robotics/',
  neurotech: '/areas/neurotech/',
}

export const INTERVENTION_TYPES: Record<InterventionTypeId, { title: string; summary: string }> = {
  orient: {
    title: 'Orient',
    summary: 'Make bottlenecks and opportunities legible through maps, roadmaps, and benchmarks.',
  },
  coordinate: {
    title: 'Coordinate',
    summary: 'Bring the right people into sustained work around a shared problem.',
  },
  resource: {
    title: 'Resource',
    summary: 'Provide catalytic grants, prizes, fellowships, or other resources.',
  },
  build: {
    title: 'Build',
    summary: 'Create missing shared tools, datasets, and infrastructure.',
  },
  prove: {
    title: 'Prove',
    summary: 'Test whether an approach works through credible, inspectable evidence.',
  },
  enable: {
    title: 'Enable',
    summary: 'Help useful work reach adoption through capability, standards, and deployment support.',
  },
}

export const INTERVENTION_STAGE_LABEL: Record<InterventionStage, string> = {
  proposed: 'Proposed',
  active: 'Active',
  completed: 'Completed',
}

export const INTERVENTION_METHOD_STEPS = [
  { n: '01', title: 'Map the field', body: 'Identify opportunity spaces and the changes that would make new capabilities possible.' },
  { n: '02', title: 'Name the bottleneck', body: 'Make the constraint explicit. Check what others are already doing and where PL can add something.' },
  { n: '03', title: 'Intervene', body: 'Resource a bounded piece of work with a delivery plan and observable evidence.' },
  { n: '04', title: 'Examine and adapt', body: 'Read the evidence, update the hypothesis, and continue, change course, or stop.' },
] as const

/** All catalog records, including unpublished ones. Pages must use publishedInterventions(). */
export const INTERVENTION_PROGRAMS: PublicIntervention[] = [
  {
    slug: "sovereign-ai",
    title: "Sovereign AI acceleration program",
    area: "economies-governance",
    type: "build",
    support: ['coordinate', 'prove', 'enable'],
    summary: "Help national institutions turn open models into useful, locally maintained AI capability.",
    bottleneck: "Open models alone do not solve local-language performance, accountable deployment, or maintenance.",
    work: "Five evaluated country packages combining national AI infrastructure, local teams, a bounded public application, and independent evaluation.",
    evidence: "Five qualified agreements, then supervised testing and evidence-backed decisions about continued use.",
    timing: "24 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL R&D would coordinate the shared program and institutional partnerships. Academic and engineering partners would deliver specialist work; local institutions would own operation.",
    published: true,
  },
  {
    slug: "evaluation-commons",
    title: "Public AI evaluation commons",
    area: "economies-governance",
    type: "orient",
    support: ['build'],
    summary: "Give public institutions credible evidence for AI adoption decisions.",
    bottleneck: "Existing benchmarks may not cover the languages, real tasks, and operating costs institutions face.",
    work: "Academic partnerships, relevant test datasets, shared evaluation software, and independent review.",
    evidence: "Documented use in at least two institutional model-selection or deployment decisions.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL would commission the gap assessment, assemble academic partnerships, and support a host for shared evaluation resources.",
    published: true,
  },
  {
    slug: "broad-listening",
    title: "Broad Listening & Simocracy deployment program",
    area: "economies-governance",
    type: "enable",
    support: ['build', 'prove'],
    summary: "Make participatory decision tools easier to adopt, evaluate, and maintain.",
    bottleneck: "Useful tools still require repeatable implementation, local capability, and safeguards.",
    work: "Localization, onboarding, hosting, training, and independent evaluation with institutional partners.",
    evidence: "Three completed consequential decision cycles; repeat use and local operation assessed separately.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL would organize adoption partnerships and fund shared improvements with the tool teams. Local partners would lead facilitation and implementation.",
    published: true,
  },
  {
    slug: "ai4pg",
    title: "AI4PG research convenings & funder collaboration",
    area: "economies-governance",
    type: "coordinate",
    support: ['orient', 'resource'],
    summary: "Turn public-goods research conversations into sustained collaborations.",
    bottleneck: "Convenings need preparation and follow-through to become collaborative work.",
    work: "Four research convenings, problem briefs, working sessions, and a sustained program team.",
    evidence: "Six research briefs and two or three collaborations with documented external support.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL would work with academic organizers on convenings and fund a program team for preparation and follow-through.",
    published: true,
  },
  {
    slug: "ai4cop",
    title: "AI4COP international collaboration program",
    area: "economies-governance",
    type: "coordinate",
    support: ['build', 'prove', 'enable'],
    summary: "Develop shared research and evaluated AI tools for environmental institutions.",
    bottleneck: "Shared practitioner needs and additional work must be distinguished from activity already funded.",
    work: "Practitioner convenings, multilingual evidence tools, training, and controlled institutional deployment.",
    evidence: "Three to five collaborations and at least two independently evaluated workflows.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL would help existing collaborators agree and resource a shared program. Specialist partners would own domain expertise and delivery.",
    published: true,
  },
  {
    slug: "evidence-research",
    title: "Evidence, evaluation & outcomes research program",
    area: "economies-governance",
    type: "orient",
    support: ['prove', 'build'],
    summary: "Make credible evaluation more useful and affordable.",
    bottleneck: "Provenance alone does not establish causal impact; the research agenda still needs narrowing.",
    work: "Commission a focused agenda and selected studies, followed by prospective testing in real settings.",
    evidence: "Tested methods and reuse by at least one external evaluation or funding team.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL would commission an initial research agenda, then fund selected studies and prospective testing where justified.",
    published: true,
  },
  {
    slug: "compute-alliance",
    title: "Sovereign compute & infrastructure alliance",
    area: "economies-governance",
    type: "coordinate",
    support: ['resource', 'enable'],
    summary: "Turn country requirements into usable compute access and technical capability.",
    bottleneck: "Headline compute credits do not establish usable access, sustainable cost, or operating capacity.",
    work: "Requirements assessment, access comparisons, coalition agreements, and a limited shared-access demonstration.",
    evidence: "Usable agreements and measured cost, reliability, access delays, and utilization.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL would organize the coalition and resource shared work. Qualified computing operators and specialist advisers would handle diligence and operation.",
    published: true,
  },
  {
    slug: "eg-fellowship",
    title: "Economies & Governance Fellowship",
    area: "economies-governance",
    type: "coordinate",
    support: ['enable', 'resource'],
    summary: "Help a senior cross-institutional cohort advance shared missions.",
    bottleneck: "The draft has plausible participant profiles, not yet a confirmed cohort or host demand.",
    work: "A twelve-month cohort within an eighteen-month program, with an assembly, remote intensives, and four to six missions.",
    evidence: "Two or three collaborations reaching a funded project, authorized pilot, or institutional commitment.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Source classification",
    plRole: "PL would provide a professional secretariat, technical connections, and mission-development support.",
    published: true,
  },
  {
    slug: "connectomics-benchmark",
    title: "Connectomics Benchmark + Prize Program",
    area: "neurotech",
    type: "orient",
    support: ['resource', 'build'],
    summary: "Make connectome reconstruction a measurable, competitive AI problem.",
    bottleneck: "Proofreading and reconstruction lack an operationally maintained benchmark, blinded evaluation set, and cost curve.",
    work: "Blinded datasets, reproducible evaluation, a maintained leaderboard, and a recurring Connectome Challenge.",
    evidence: "Measure accuracy, compute cost, and human labor; the draft targets serious outside participation and order-of-magnitude improvement.",
    timing: "18 months",
    stage: "proposed",
    typeNote: "Suggested classification · needs FA review",
    plRole: "PL’s role is to be confirmed. The source proposes a field-level program but does not establish PL’s specific delivery responsibility.",
    published: true,
  },
  {
    slug: "macaque-projectome",
    title: "Macaque Ground-Truth Projectome",
    area: "neurotech",
    type: "build",
    support: ['prove'],
    summary: "Create a primate reference dataset that tests long-range tracing.",
    bottleneck: "Large-brain optical connectomics needs ground truth for reliable axon tracing and reconstruction.",
    work: "Map roughly 100,000 sparsely labeled neurons and release an open reference dataset.",
    evidence: "Validated neurons, quantified tracing failure modes, and scientific use of the reference data.",
    timing: "18–24 months",
    stage: "proposed",
    typeNote: "Suggested classification · needs FA review",
    plRole: "PL’s role is to be confirmed. The source proposes a field-level program but does not establish PL’s specific delivery responsibility.",
    published: true,
  },
  {
    slug: "discovery-challenge",
    title: "“AlphaFold for Systems Neuroscience” Challenge",
    area: "neurotech",
    type: "prove",
    support: ['resource', 'orient'],
    summary: "Test whether neural simulation can predict a new biological result.",
    bottleneck: "Reproducing known phenomena is not the same as making experimentally confirmed discoveries.",
    work: "A bounded simulation-to-experiment challenge with blinded predictions and prospective biological tests.",
    evidence: "At least one blinded prediction subsequently confirmed experimentally, plus outside benchmark adoption.",
    timing: "9–18 months",
    stage: "proposed",
    typeNote: "Suggested classification · needs FA review",
    plRole: "PL’s role is to be confirmed. The source proposes a field-level program but does not establish PL’s specific delivery responsibility.",
    published: true,
  },
  {
    slug: "mouse-connectome",
    title: "Mouse Connectome Acceleration Program",
    area: "neurotech",
    type: "coordinate",
    support: ['orient', 'resource', 'prove'],
    summary: "Make a large-scale connectome program technically and financially credible.",
    bottleneck: "A production-scale effort needs a costed architecture, retired research risks, operating ownership, and resources.",
    work: "Reference architecture, bottom-up schedule, R&D risk retirement, data standards, and partnership development.",
    evidence: "A credible three-year execution plan, named operational owner, and documented resource commitments.",
    timing: "6–12 month preparation",
    stage: "proposed",
    typeNote: "Suggested classification · needs FA review",
    plRole: "PL’s role is to be confirmed. The source proposes a field-level program but does not establish PL’s specific delivery responsibility.",
    published: true,
  },
  {
    slug: "neuroai-commons",
    title: "NeuroAI Benchmark Commons",
    area: "neurotech",
    type: "orient",
    support: ['build', 'enable'],
    summary: "Give AI researchers well-defined neuroscience problems they can work on.",
    bottleneck: "Researchers need accessible tasks, datasets, and baselines before they can contribute effectively.",
    work: "GPU-native benchmarks spanning neural prediction, reconstruction, perturbation, and generalization.",
    evidence: "First two or three benchmarks within six months, with a broader commons within twelve.",
    timing: "6–12 months",
    stage: "proposed",
    typeNote: "Suggested classification · needs FA review",
    plRole: "PL’s role is to be confirmed. The source proposes a field-level program but does not establish PL’s specific delivery responsibility.",
    published: true,
  },
  {
    slug: "virtual-neuro",
    title: "Virtual-Neuro FRO / Consortium",
    area: "neurotech",
    type: "build",
    support: ['coordinate'],
    summary: "Build shared simulation infrastructure after a discovery target is proven.",
    bottleneck: "Infrastructure should follow evidence that simulations can support biological discovery.",
    work: "A shared simulation stack, interoperable models, perturbation interfaces, and experimental validation.",
    evidence: "Stage II: the draft conditions launch on success of the systems-neuroscience discovery challenge.",
    timing: "Launch decision in 6–12 months; 3–5 year program",
    stage: "proposed",
    typeNote: "Suggested classification · needs FA review",
    plRole: "PL’s role is to be confirmed. The source proposes a field-level program but does not establish PL’s specific delivery responsibility.",
    published: true,
  },
  {
    slug: "neuroai-fellows",
    title: "NeuroAI Fellows Program",
    area: "neurotech",
    type: "enable",
    support: ['coordinate', 'resource'],
    summary: "Supply persistent operational ownership and an AI-native talent pipeline.",
    bottleneck: "Benchmarks, challenges, and shared projects need people who can sustain the work.",
    work: "Embedded fellows, benchmark operations, workshops, capital formation, and technical communication.",
    evidence: "The draft proposes 10–20 embedded fellows; public success criteria need refinement.",
    timing: "Immediate start proposed",
    stage: "proposed",
    typeNote: "Suggested classification · needs FA review",
    plRole: "PL’s role is to be confirmed. The source proposes a field-level program but does not establish PL’s specific delivery responsibility.",
    published: true,
  }
]

export function publishedInterventions(): PublicIntervention[] {
  return INTERVENTION_PROGRAMS.filter((item) => item.published)
}

export function interventionsForArea(area: InterventionAreaSlug): PublicIntervention[] {
  return publishedInterventions().filter((item) => item.area === area)
}

export function interventionBySlug(slug: string): PublicIntervention | undefined {
  return publishedInterventions().find((item) => item.slug === slug)
}

export function publicInterventionHref(slug: string): string {
  return `/interventions/${slug}/`
}

export function catalogHref(area?: InterventionAreaSlug | "all"): string {
  if (!area || area === 'all') return '/interventions/'
  return `/interventions/?area=${encodeURIComponent(area)}`
}

