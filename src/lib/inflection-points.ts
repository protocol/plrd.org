// Cross-focus-area inflection points and how we measure them.
//
// Each focus area names a small set of inflection points: specific, observable,
// falsifiable shifts we believe would be catalytic and that have NOT yet happened
// as of 2026. They are hypotheses, not descriptions of the present. We judge our
// work against three questions, mapped to the fields on every point:
//
//   Q1 (cascade)      Did it matter?              The second-order effects it should unlock.
//   Q2 (signal)       Did it happen?              A pre-registered threshold — yes/no + date.
//   Q3 (contribution) Did our work make it happen? PL's inputs -> activities -> outputs on the
//                                                  critical path (the planned-work side of the
//                                                  logic model), traced honestly.
//
// IMPORTANT — these are distinct jobs and are NOT collapsed into one score. A point
// can be reached (Q2) and matter (Q1) with low PL contribution (Q3); that is still a
// win for the field. So we track field progress (Q1 & Q2) on one axis and PL's
// contribution (Q3) on a separate, independent axis.
//
// Source: "Inflection points across PL R&D, and how we will measure them."

/** PL's pre-registered role(s) on the critical path — claims to be evidenced, not a credit score. */
export type PLRole = 'infrastructure' | 'legibility' | 'connection' | 'capital' | 'translation' | 'permission'

/** Canonical display order for role pills, so cards read consistently. */
export const PL_ROLE_ORDER: PLRole[] = ['infrastructure', 'legibility', 'connection', 'capital', 'translation', 'permission']

// Two-axis color system used across the impact dashboard:
//   FIELD = the change in the world (outcomes + impact) — moves with or without us (black)
//   HAND  = our planned work / the PL toolkit — the axis we control with partners (PL blue)
// These resolve to theme-aware CSS variables (see globals.css) so the black
// “field” ink flips to a light tone in dark mode instead of vanishing.
export const FIELD_COLOR = 'var(--impact-field)'
export const HAND_COLOR = 'var(--impact-hand)'
/** Text/ink color to place on a FIELD_COLOR fill (white in light, dark in dark). */
export const FIELD_INK = 'var(--impact-field-ink)'
/** Live-signal accent — the pulsing dot on points with live outputs (green). */
export const LIVE_COLOR = '#22c55e'

/**
 * The one-line contract for reading the whole dashboard. Shared by the
 * "How to read this" overlay (near the cards) and the methodology callout so
 * the framing lives in exactly one place.
 */
export const HOW_TO_READ =
  'We don’t claim credit for outcomes. We name a falsifiable threshold, state what we contributed, and show live signal for and against. Judge us on whether our thresholds prove right and our contributions prove load-bearing.'

/**
 * Q3 contribution, structured along the planned-work side of the logic model.
 * Inputs (resources committed) -> Activities (what we do) -> Outputs (what gets produced).
 * The outcomes and impact these aim at are tracked on the field axis (Q2, Q1).
 */
export type Contribution = {
  inputs: string
  activities: string
  outputs: string
}

/** A concrete example intervention, tagged with the toolkit category it belongs to. */
export type Intervention = {
  /** The named thing we did / built / funded (a team, artifact, standard, convening). */
  label: string
  /** Optional link — a team site, an insights feed, a roadmap. */
  href?: string
  /** The toolkit category this belongs to (drives the tag). */
  role: PLRole
}

/** A pointer to live activity that is contribution evidence (Q3) — NOT a Q2 threshold reading. */
export type LiveEvidence = {
  label: string
  href: string
  note: string
}

// ── Resolution: outcome × mattered ────────────────────────────────────────────
// A single hit/miss cannot express the failure this page exists to catch: a
// marker that resolves true while the field goes nowhere. Outcome (did the
// marker resolve) and mattered (did it move the field) are independent, and
// `mattered` is never derived from `outcome`.
export type Outcome = 'pending' | 'reached' | 'missed' | 'retired'
export type Mattered = 'unknown' | 'too_early' | 'yes' | 'no'

export type InflectionPoint = {
  /** Focus-area slug, matches /areas/<slug>. */
  area: FocusAreaKey
  /** The opportunity space this bet lives in. */
  opportunitySpace: string
  /** The inflection point, stated as a hypothesis. */
  title: string
  /** Q2 — observable threshold that says it happened (not yet true). */
  signal: string
  /** Q1 — why it matters / the cascade to watch. */
  cascade: string
  /** Q3 — PL contribution to trace, as inputs -> activities -> outputs. */
  contribution: Contribution
  /** Q3, summarized as the PL role(s) on the critical path — the instruments we bring. */
  roles: PLRole[]
  /** A few concrete interventions we ran here, each tagged with its category.
   *  Shown on the card + modal in place of bare category pills. */
  interventions?: Intervention[]
  /** Optional live activity / real-world signals — strictly Q3 evidence, never Q2 progress. */
  liveEvidence?: LiveEvidence[]

  // ── Resolution (Task 4). Seeded pending/unknown with null dates until a real
  //    value lands; the nulls are rendered visibly rather than hidden. ──
  outcome?: Outcome
  mattered?: Mattered
  /** REQUIRED when mattered is 'yes' or 'no' (enforced at build time). */
  matteredEvidence?: string
  /** A missed marker where the field accelerated by another path. */
  fieldMovedAnyway?: boolean
  /** REQUIRED when outcome is 'retired' (enforced at build time). */
  retiredReason?: string
  /** ISO date, nullable — null renders as “date not yet set”. */
  predictedBy?: string | null
  /** The condition that would prove us wrong — null renders as “condition not yet set”. */
  falsifiesIf?: string | null
  /** ISO date of the last status review. */
  asOf?: string
}

export type FocusAreaKey =
  | 'digital-human-rights'
  | 'economies-governance'
  | 'ai-robotics'
  | 'neurotech'

export type FocusAreaMeta = {
  key: FocusAreaKey
  label: string
  /** Short legacy code used in the strategy docs. */
  code: string
  href: string
  /** Accent color (hex from the theme) for badges and the field-progress meter. */
  accent: string
  /** True when the focus area's inflection points are deliberately not-yet-defined (not empty). */
  forthcoming?: boolean
}

export const FOCUS_AREAS: FocusAreaMeta[] = [
  { key: 'digital-human-rights', label: 'Digital Human Rights', code: 'FA1', href: '/areas/digital-human-rights/', accent: '#1982F4' },
  { key: 'economies-governance', label: 'Economies & Governance', code: 'FA2', href: '/areas/economies-governance/', accent: '#12bfdf' },
  { key: 'ai-robotics', label: 'AI & Robotics', code: 'FA3', href: '/areas/ai-robotics/', accent: '#3966FE' },
  { key: 'neurotech', label: 'Neurotech', code: 'FA4', href: '/areas/neurotech/', accent: '#E51A66' },
]

// The logic-model chain: planned work (inputs/activities/outputs) → intended
// results (outcomes/impact). Shared by the Measuring-impact section, the three-
// questions explainer, and the per-point detail modal so the vocabulary lives
// in one place.
export const LOGIC_MODEL = [
  { key: 'inputs', label: 'Inputs', body: 'Funding, teams, convenings, standards we commit.' },
  { key: 'activities', label: 'Activities', body: 'Seeding teams, building primitives, setting standards.' },
  { key: 'outputs', label: 'Outputs', body: 'Teams funded, deployments, papers, ventures.' },
  { key: 'outcomes', label: 'Outcomes', body: 'Adoption, capital inflows, new entrants.' },
  { key: 'impact', label: 'Impact', body: 'The lasting shift: an inflection point that holds.' },
] as const
export type LogicStageKey = (typeof LOGIC_MODEL)[number]['key']

/**
 * Team / venture display name -> canonical website. Used to linkify the named
 * examples that appear in contribution copy (activities / outputs) so each
 * mentioned team points to its own site. Keep names exactly as they are written
 * in the copy (minus trailing qualifiers like "(World)").
 */
export const TEAM_LINKS: Record<string, string> = {
  'Funding the Commons': 'https://fundingthecommons.io/',
  'Tools for Humanity': 'https://www.toolsforhumanity.com/',
  'Impossible Cloud': 'https://www.impossiblecloud.com/',
  Hypercerts: 'https://hypercerts.org/',
  GainForest: 'https://gainforest.earth/',
  WeatherXM: 'https://weatherxm.com/',
  Molecule: 'https://www.molecule.xyz/',
  'EQTY Lab': 'https://eqtylab.io/',
  SpruceID: 'https://spruceid.com/',
  Huddle01: 'https://huddle01.com/',
  Spheron: 'https://spheron.network/',
  Filecoin: 'https://filecoin.io/',
  Fluence: 'https://fluence.network/',
  Expanso: 'https://www.expanso.io/',
  libp2p: 'https://libp2p.io/',
  Privy: 'https://privy.io/',
  Fleek: 'https://fleek.co/',
  Glow: 'https://glowlabs.org/',
  Lava: 'https://www.lavanet.xyz/',
  IPFS: 'https://ipfs.io/',
}

export const ROLE_META: Record<PLRole, { label: string; description: string }> = {
  infrastructure: {
    label: 'Infrastructure',
    description: 'The open, neutral rail this runs on did not exist. PL builds and maintains it (libp2p / IPFS / Filecoin lineage).',
  },
  legibility: {
    label: 'Legibility',
    description: 'The field lacked a shared map. PL adds roadmaps, taxonomies, benchmarks, and written artifacts.',
  },
  connection: {
    label: 'Connection',
    description: 'Too few connections blocked progress. PL convenes the people who need to collide: dinners, retreats, residencies, hackathons.',
  },
  capital: {
    label: 'Funding',
    description: 'Pre-commercial work needed patient funding. PL runs grants and prizes and helps peer funders deploy theirs.',
  },
  translation: {
    label: 'Translation',
    description: 'The work was ready to leave the lab. PL helps convert it into ventures, pilots, and deployments.',
  },
  permission: {
    label: 'Policy',
    description: 'The rules did not yet recognize the technology. PL engages standards, policy, and regulatory pathways.',
  },
}

export const INFLECTION_POINTS: InflectionPoint[] = [
  // ── FA1 · Digital Human Rights ───────────────────────────────────────────
  {
    area: 'digital-human-rights',
    opportunitySpace: 'Censorship-Resistant Communication',
    title: 'Communication that cannot be switched off',
    signal:
      'A consumer-scale connectivity provider operates without state licensing or identity gating, and a metadata-resistant messenger crosses tens of millions of users; a population stays connected through a deliberate shutdown.',
    cascade:
      'Censoring speech and assembly becomes impractical, not just illegal; organizing survives adversarial conditions.',
    contribution: {
      inputs: 'The libp2p / IPFS open-source networking stack; funding for resilient-comms and private-messaging teams.',
      activities: 'Maintaining the substrate, funding teams, and contributing to interoperability standards.',
      outputs: 'libp2p / IPFS deployments and the funded comms / messaging teams building on them, such as Fluence and Huddle01.',
    },
    roles: ['infrastructure', 'capital'],
    interventions: [
      { role: 'infrastructure', label: 'libp2p / IPFS networking stack', href: 'https://libp2p.io/' },
      { role: 'capital', label: 'Fluence, Huddle01 (funded comms teams)', href: 'https://fluence.network/' },
      { role: 'capital', label: 'Bluesky', href: 'https://bsky.app/' },
      { role: 'legibility', label: 'Latest Digital Human Rights insights', href: '/insights/?area=digital-human-rights' },
    ],
    liveEvidence: [
      {
        label: 'Wikipedia kept online via IPFS during Turkey’s block',
        href: 'https://observer.com/2017/05/turkey-wikipedia-ipfs/',
        note: 'A content-addressed (IPFS) mirror kept Wikipedia reachable under Turkey’s state block: early evidence that information can route around a shutdown, not the population-scale-through-a-shutdown threshold (Q2).',
      },
      {
        label: 'Bluesky reached 41.41 million users',
        href: 'https://bsky.social/about/blog/01-29-2026-transparency-report-2025',
        note: 'Checked October 2026. Bluesky’s own 2025 transparency report says the network grew from 25.94 million to 41.41 million users, including federated accounts. A large open social network is not a metadata-resistant messenger, and it is not a population staying connected through a deliberate shutdown. The threshold is unmet.',
      },
    ],
  },
  {
    area: 'digital-human-rights',
    opportunitySpace: 'Portable Identity, Credentials & Trust',
    title: 'Personhood without the state in the loop',
    signal:
      'A service at >100M people verifies unique humans for everyday use without a nation-state ID or KYC.',
    cascade:
      'Recognition stops being rented from platforms and states; privacy-preserving personhood becomes safe to build on.',
    contribution: {
      inputs: 'Convening capacity across identity protocols; seed funding for portable-credential initiatives.',
      activities: 'Convening identity-protocol teams and seeding / funding portable-credential work.',
      outputs: 'The identity and credential initiatives PL has seeded or funded, such as Tools for Humanity (World), SpruceID, and Privy.',
    },
    roles: ['connection', 'capital'],
    interventions: [
      { role: 'connection', label: 'Tools for Humanity, SpruceID, Privy (convened + seeded)', href: 'https://spruceid.com/' },
      { role: 'capital', label: 'Seed funding for portable-credential work', href: 'https://privy.io/' },
      { role: 'legibility', label: 'Latest Digital Human Rights insights', href: '/insights/?area=digital-human-rights' },
    ],
    liveEvidence: [
      {
        label: 'World reports nearly 18 million verified humans',
        href: 'https://world.org/blog/announcements/the-new-world-id-and-the-partners-bringing-proof-of-human-to-the-internet',
        note: 'Checked October 2026. World’s own April 2026 figure is nearly 18 million verified humans, with everyday use at Tinder, Zoom, and others. That is well short of a service at more than 100 million people. The threshold is unmet.',
      },
    ],
  },
  {
    area: 'digital-human-rights',
    opportunitySpace: 'Verifiable Public Knowledge & Provenance',
    title: 'Provenance becomes the default for truth',
    signal:
      'Two consecutive frontier-model generations ship attested provenance by default, and a major platform or archive adopts content-addressed provenance as default.',
    cascade:
      'A public record that can prove its own integrity becomes the precondition for trustworthy information in the AI era.',
    contribution: {
      inputs: 'Content addressing (IPFS) as the provenance substrate; funding for provenance and verifiable-compute teams.',
      activities: 'Providing the content-addressing substrate and backing provenance / verifiable-compute teams.',
      outputs: 'Content-addressed provenance tooling and the PL-backed teams building it, such as EQTY Lab.',
    },
    roles: ['infrastructure', 'capital'],
    interventions: [
      { role: 'infrastructure', label: 'Content addressing (IPFS) as the provenance substrate', href: 'https://ipfs.io/' },
      { role: 'capital', label: 'EQTY Lab (verifiable-compute team)', href: 'https://eqtylab.io/' },
      { role: 'legibility', label: 'Latest Digital Human Rights insights', href: '/insights/?area=digital-human-rights' },
    ],
    liveEvidence: [
      {
        label: 'Starling Lab: content-authenticity displays in newsrooms',
        href: 'https://dispatch.starlinglab.org/p/verify-authenticity-displays',
        note: 'Reuters, AP, Rolling Stone and others ship C2PA content credentials backed by content-addressed archives (IPFS / Filecoin): early real-world provenance, not the default-everywhere threshold (Q2).',
      },
      {
        label: 'OpenAI and Google ship provenance checks, not a default',
        href: 'https://openai.com/index/advancing-content-provenance/',
        note: 'Checked October 2026. OpenAI’s May 2026 update adds C2PA and SynthID to supported generated images. Google is rolling Content Credentials checks into Gemini, Search, and Chrome. Neither is two consecutive frontier-model generations shipping attested provenance by default. The threshold is unmet.',
      },
    ],
  },
  {
    area: 'digital-human-rights',
    opportunitySpace: 'Sovereign Infrastructure for AI & Agents',
    title: 'Agents run on open rails',
    signal:
      'A frontier-scale model is trained across independent decentralized hardware, or a meaningful share of agent-to-agent economic activity settles on open permissionless compute / storage / identity.',
    cascade:
      'The rights architecture of the agent economy is set in the open rather than by whoever owns the cluster.',
    contribution: {
      inputs: 'The Filecoin / open-compute portfolio; PL capital and coordination across storage, compute, and identity.',
      activities: 'Building open compute and storage rails and bridging them with identity for agents.',
      outputs: 'Filecoin and the open-compute portfolio (Fluence, Spheron, Expanso, Impossible Cloud, Lava, Fleek), with integrations across storage, compute, and identity.',
    },
    roles: ['infrastructure', 'connection', 'capital'],
    interventions: [
      { role: 'infrastructure', label: 'Filecoin + the open-compute portfolio', href: 'https://filecoin.io/' },
      { role: 'capital', label: 'Fluence, Spheron, Expanso, Fleek', href: 'https://fluence.network/' },
      { role: 'capital', label: 'Prime Intellect', href: 'https://primeintellect.ai/' },
      { role: 'legibility', label: 'Latest Digital Human Rights insights', href: '/insights/?area=digital-human-rights' },
    ],
    liveEvidence: [
      {
        label: 'INTELLECT-2: a 32B model trained across independent compute',
        href: 'https://arxiv.org/abs/2505.07291',
        note: 'Checked October 2026. Prime Intellect trained a 32-billion-parameter reasoning model by reinforcement learning across a permissionless swarm. That is a real decentralized training run. It is not a frontier-scale model trained end to end off a hyperscaler. The threshold is unmet.',
      },
    ],
  },

  // ── FA2 · Economies & Governance ─────────────────────────────────────────
  {
    area: 'economies-governance',
    opportunitySpace: 'Sovereign Digital Public Infrastructure',
    title: 'Programmable government in production',
    signal:
      'At least one sovereign moves >$1B/yr of real public funds through programmable, real-time-auditable rails; 3+ jurisdictions use selective-disclosure credentials for a high-stakes function (election, passport, census).',
    cascade:
      'Digital government crosses from digitization to transformation; a reference deployment others can copy.',
    contribution: {
      inputs: 'Standards and procurement playbooks; convening capacity with sovereigns and builders; funding for DPI primitives.',
      activities: 'Writing standards and playbooks, convening sovereigns with builders, and funding DPI primitives.',
      outputs: 'Published playbooks, convened sovereign–builder cohorts, and funded DPI primitives.',
    },
    roles: ['connection', 'capital', 'permission'],
    interventions: [
      { role: 'permission', label: 'DPI standards & procurement playbooks' },
      { role: 'connection', label: 'Sovereign–builder convenings (Funding the Commons)', href: 'https://fundingthecommons.io/' },
      { role: 'connection', label: 'AI4PG', href: 'https://www.ai4pg.com/' },
      { role: 'legibility', label: 'Latest Economies & Governance insights', href: '/insights/?area=economies-governance' },
    ],
  },
  {
    area: 'economies-governance',
    opportunitySpace: 'Computational Coordination & Governance',
    title: 'A binding decision at scale',
    signal:
      'A city or government makes a consequential, binding decision through a computational mechanism with tens of thousands participating, beating the legacy process on cost, turnout, or trust.',
    cascade:
      'Deliberation tools move from advisory to part of real decision-making infrastructure.',
    contribution: {
      inputs: 'Support for computational-deliberation mechanisms (e.g. Simocracy, broad-listening tools); convening capacity.',
      activities: 'Supporting mechanism teams and convening government teams with tool teams.',
      outputs: 'Simocracy and broad-listening tools, and the government–tool convenings around them.',
    },
    roles: ['connection', 'translation'],
    interventions: [
      { role: 'translation', label: 'Simocracy', href: 'https://simocracy.org/' },
      { role: 'translation', label: 'Broad Listening', href: 'https://www.broadlistening.org/' },
      { role: 'connection', label: 'Government–tool convenings' },
      { role: 'legibility', label: 'Latest Economies & Governance insights', href: '/insights/?area=economies-governance' },
    ],
    liveEvidence: [
      {
        label: 'Simocracy governance simulation: live participation',
        href: '/areas/economies-governance/impact/live-dashboard/',
        note: 'Live activity from a PL-supported mechanism. This is contribution evidence (Q3) from a simulation, not the binding-decision-in-government threshold (Q2).',
      },
      {
        label: 'vTaiwan: crowdsourced lawmaking in Taiwan',
        href: 'https://info.vtaiwan.tw/',
        note: 'Field evidence (Q2): a real government deliberation process run on computational tools. Not PL contribution.',
      },
      {
        label: 'Team Mirai: AI broad-listening in Japanese politics',
        href: 'https://team-mir.ai/',
        note: 'Field evidence (Q2): an elected movement running AI-assisted broad listening at scale. Not PL contribution.',
      },
    ],
  },
  {
    area: 'economies-governance',
    opportunitySpace: 'Programmable Capital Allocation',
    title: 'Public goods become a financeable category',
    signal:
      '>$1B/yr flows through programmable allocation, a mainstream allocator (DFI, pension, sovereign fund) treats it as infrastructure, and a material real-world outcome is documented.',
    cascade:
      'Funding public goods becomes a durable capital market rather than a niche.',
    contribution: {
      inputs: 'Hypercerts (PL origin) and the Gitcoin / Funding-the-Commons lineage; PL evidence and standards work.',
      activities: 'Originating allocation mechanisms, building evidence and standards, and converting work into ventures.',
      outputs: 'Hypercerts, Funding the Commons, and ventures spun out of / funded across this lineage such as Molecule.',
    },
    roles: ['infrastructure', 'capital', 'translation'],
    interventions: [
      { role: 'infrastructure', label: 'Hypercerts (PL origin)', href: 'https://hypercerts.org/' },
      { role: 'translation', label: 'Molecule (venture across this lineage)', href: 'https://www.molecule.xyz/' },
      { role: 'connection', label: 'Funding the Commons', href: 'https://fundingthecommons.io/' },
      { role: 'legibility', label: 'Latest Economies & Governance insights', href: '/insights/?area=economies-governance' },
    ],
  },
  {
    area: 'economies-governance',
    opportunitySpace: 'Verifiable Real-World Infrastructure & Systems',
    title: 'Capital that pays on verified outcomes',
    signal:
      'A $1B+ climate or public-goods fund disburses against independently verified real-world outcomes, faster and cheaper than a legacy audit.',
    cascade:
      'Verification becomes the rail capital runs on; the loop back to better decisions closes.',
    contribution: {
      inputs: 'Funding for MRV / outcome-verification teams (e.g. GainForest, Glow); benchmark and standards convening.',
      activities: 'Backing MRV teams and convening benchmark and standards work for outcome verification.',
      outputs: 'GainForest, Glow, WeatherXM, and the verification benchmarks and standards they inform.',
    },
    roles: ['legibility', 'connection', 'capital'],
    interventions: [
      { role: 'capital', label: 'GainForest, Glow, WeatherXM (MRV teams)', href: 'https://gainforest.earth/' },
      { role: 'capital', label: 'Hypercerts', href: 'https://hypercerts.org/' },
      { role: 'connection', label: 'Verification benchmark & standards convenings' },
      { role: 'legibility', label: 'Latest Economies & Governance insights', href: '/insights/?area=economies-governance' },
    ],
    liveEvidence: [
      {
        label: 'GainForest & Glow: live verification activity',
        href: '/areas/economies-governance/impact/live-dashboard/',
        note: 'Live output from PL-backed MRV teams on this critical path. Contribution evidence (Q3), not the $1B-disbursed-against-verified-outcomes threshold (Q2).',
      },
    ],
  },

  // ── FA4 · Neurotech ──────────────────────────────────────────────────────
  {
    area: 'neurotech',
    opportunitySpace: 'Neural Augmentation (BCI)',
    title: 'The BCI app store',
    signal:
      'A regulator clears a standardized software / API layer for a commercial BCI (with medical guardrails), and the first third-party app launches and is adopted.',
    cascade:
      'BCI value compounds after surgery; a developer ecosystem forms; demand shifts toward elective use.',
    contribution: {
      inputs: 'PL Neuro standards work for a BCI component ecosystem; convening capacity across regulators, device makers, and developers.',
      activities: 'Defining the BCI component-ecosystem standard and convening regulators, makers, and developers.',
      outputs: 'A draft BCI component / API standard and the regulator–maker–developer convenings around it.',
    },
    roles: ['connection', 'permission'],
    interventions: [
      { role: 'permission', label: 'Draft BCI component / API standard' },
      { role: 'connection', label: 'BCI Founders Retreat', href: 'https://www.plneuro.xyz/events/bci-founders-retreat/' },
      { role: 'legibility', label: 'PL Neuro roadmap & insights', href: '/insights/?area=neurotech' },
    ],
  },
  {
    area: 'neurotech',
    opportunitySpace: 'Biologically Inspired Intelligence (NeuroAI)',
    title: 'Neural distillation',
    signal:
      'A major lab matches frontier reasoning by training on human neural data at a fraction of the parameters / energy, or venture funding surges into consumer EEG to harvest cognitive data for AI.',
    cascade:
      'High-fidelity neural data becomes as valuable to AI as text; comp-neuro talent flow reverses.',
    contribution: {
      inputs: 'The PL Neuro talent network bridging AI labs and comp neuro; investment in neural-data infrastructure and norms.',
      activities: 'Bridging AI-lab and comp-neuro talent and building neural-data infrastructure and norms.',
      outputs: 'The PL Neuro talent network and the neural-data infrastructure and norms it seeds.',
    },
    roles: ['infrastructure', 'connection', 'capital'],
    interventions: [
      { role: 'connection', label: 'PL Neuro Salon (scaled neural data × AI)', href: 'https://www.plneuro.xyz/events/neuro-ai-workshop/' },
      { role: 'infrastructure', label: 'Neural-data infrastructure & norms' },
      { role: 'legibility', label: 'PL Neuro roadmap & insights', href: '/insights/?area=neurotech' },
    ],
  },
  {
    area: 'neurotech',
    opportunitySpace: 'Biologically Inspired Intelligence (NeuroAI)',
    title: 'The neuromorphic energy pivot',
    signal:
      'A brain-inspired model matches state-of-the-art performance at 3+ orders of magnitude better energy efficiency, and frontier labs begin acquiring neuromorphic startups.',
    cascade:
      'Neurally derived design becomes foundational to commercial AI; AI is tethered to neuroscience.',
    contribution: {
      inputs: 'Funding for NeuroAI / neuromorphic research and demos; benchmark design defining the efficiency target.',
      activities: 'Funding neuromorphic research and demos and defining the efficiency benchmark.',
      outputs: 'PL-funded NeuroAI demos and the energy-efficiency benchmarks that frame the target.',
    },
    roles: ['legibility', 'capital'],
    interventions: [
      { role: 'capital', label: 'PL-funded NeuroAI / neuromorphic demos' },
      { role: 'legibility', label: 'Energy-efficiency benchmark & PL Neuro roadmap', href: '/insights/?area=neurotech' },
    ],
  },
  {
    area: 'neurotech',
    opportunitySpace: 'Whole Organism Emulation (WBE)',
    title: 'Memory retrieval in simulation',
    signal:
      'A reconstructed mouse connectome simulated in silico reproduces a specific behavior the biological mouse learned before its connectome was harvested.',
    cascade:
      'WBE turns from speculation into a benchmarked engineering discipline; serious policy engagement begins.',
    contribution: {
      inputs: 'PL Neuro benchmark definition; connectomics workshops and throughput targets; engineering capacity for a demo.',
      activities: 'Defining the WBE benchmark, running connectomics workshops, and engineering a reference demo.',
      outputs: 'The WBE benchmark, connectomics throughput targets, and a PL-engineered demo.',
    },
    roles: ['legibility', 'connection'],
    interventions: [
      { role: 'connection', label: 'Connectomics Workshop', href: 'https://www.plneuro.xyz/events/connectomics-workshop/' },
      { role: 'legibility', label: 'WBE benchmark & PL Neuro roadmap', href: '/insights/?area=neurotech' },
    ],
    liveEvidence: [
      {
        label: 'MICrONS: a cubic millimeter of mouse visual cortex',
        href: 'https://www.microns-explorer.org/',
        note: 'Checked October 2026. The public MICrONS reconstruction is a cubic millimeter of mouse visual cortex, with function and connectivity. It is not a whole-mouse connectome, and it has not reproduced a behavior the mouse learned before harvest. The threshold is unmet.',
      },
    ],
  },

  // ── FA3 · AI & Robotics ─────────────────────────────────────────
  {
    area: 'ai-robotics',
    opportunitySpace: 'Open Compute Networks',
    title: 'A frontier model trained off the hyperscalers',
    signal:
      'A frontier-scale model is trained end-to-end across independent, decentralized compute (pooled GPUs, edge capacity, and energy-sited hardware) rather than inside a single hyperscaler cluster.',
    cascade:
      'Compute stops being a bottleneck only a few labs can clear; regions and independents can train at the frontier, and the substrate of AI is set in the open.',
    contribution: {
      inputs: 'The Filecoin / open-compute portfolio; PL capital and coordination across compute, storage, and energy-sited hardware.',
      activities: 'Building open compute and storage rails, funding decentralized-training teams, and coordinating an ecosystem that can pool capacity.',
      outputs: 'The open-compute portfolio (Fluence, Spheron, Expanso) and the decentralized-training teams building on it.',
    },
    roles: ['infrastructure', 'connection', 'capital'],
    interventions: [
      { role: 'infrastructure', label: 'Filecoin + the open-compute portfolio', href: 'https://filecoin.io/' },
      { role: 'capital', label: 'Fluence, Spheron, Expanso (compute teams)', href: 'https://fluence.network/' },
      { role: 'legibility', label: 'Latest AI & Robotics insights', href: '/insights/?area=ai-robotics' },
    ],
    liveEvidence: [
      {
        label: 'INTELLECT-2: a 32B model trained across independent compute',
        href: 'https://arxiv.org/abs/2505.07291',
        note: 'Checked October 2026. A 32-billion-parameter reasoning model trained across a permissionless compute swarm. Useful evidence that training can leave one cluster. Not yet a frontier-scale model trained end to end off the hyperscalers. The threshold is unmet.',
      },
    ],
  },
  {
    area: 'ai-robotics',
    opportunitySpace: 'Agent Coordination Infrastructure',
    title: 'Agents transact on open rails',
    signal:
      'A meaningful share of agent-to-agent economic activity (payments, contracting, task markets) settles on open, permissionless identity and coordination protocols rather than one platform’s closed stack.',
    cascade:
      'The rules of the agent economy (identity, reputation, settlement) are set as neutral public infrastructure instead of owned by whoever ships the dominant platform first.',
    contribution: {
      inputs: 'Open identity and coordination primitives from the PL network; convening capacity across agent-protocol teams.',
      activities: 'Building open identity / coordination rails, convening agent-protocol teams, and funding early coordination-protocol work.',
      outputs: 'Open agent-identity and coordination primitives and the teams building persistent-agent protocols on them.',
    },
    roles: ['infrastructure', 'connection', 'capital'],
    interventions: [
      { role: 'infrastructure', label: 'Open agent-identity & coordination primitives', href: 'https://libp2p.io/' },
      { role: 'connection', label: 'Agent-protocol convenings' },
      { role: 'legibility', label: 'Latest AI & Robotics insights', href: '/insights/?area=ai-robotics' },
    ],
  },
  {
    area: 'ai-robotics',
    opportunitySpace: 'Embodied AI & Robotics Data Networks',
    title: 'A shared real-world robotics data network',
    signal:
      'An open, multi-operator robot fleet generates a continuous, shared stream of real-world interaction data that outside teams can train on, not a single company’s proprietary logs.',
    cascade:
      'The data bottleneck on embodied intelligence breaks; robotics progress compounds across a commons instead of siloing inside whoever owns the largest fleet.',
    contribution: {
      inputs: 'Data-network primitives and incentive design; funding for robotics-data teams; convening across fleet operators.',
      activities: 'Building shared data-network rails, funding robotics-data teams, and convening operators around open data standards.',
      outputs: 'Robotics-data network primitives and the funded teams pooling real-world interaction data.',
    },
    roles: ['infrastructure', 'capital'],
    interventions: [
      { role: 'infrastructure', label: 'Shared robotics-data network primitives' },
      { role: 'capital', label: 'BitRobot', href: 'https://bitrobot.ai/' },
      { role: 'legibility', label: 'Latest AI & Robotics insights', href: '/insights/?area=ai-robotics' },
    ],
  },
  {
    area: 'ai-robotics',
    opportunitySpace: 'Agent-Native Economic Infrastructure',
    title: 'Machine-native money moves at scale',
    signal:
      'Autonomous agents run real, recurring economic activity (paying, contracting, and coordinating machine-to-machine) through primitives built for agents rather than retrofitted human payment rails.',
    cascade:
      'Agent economies gain the financial primitives they need to exist at all; coordination and settlement for machine participants become as reliable as they are for humans.',
    contribution: {
      inputs: 'Agent-payment and coordination primitives; PL capital and network connections to route validated work to deployment.',
      activities: 'Building agent-native payment / coordination primitives, funding early teams, and translating validated work into ventures.',
      outputs: 'Agent-native economic primitives and the teams building machine-to-machine commerce on them.',
    },
    roles: ['infrastructure', 'capital', 'translation'],
    interventions: [
      { role: 'infrastructure', label: 'Agent-native payment & coordination primitives' },
      { role: 'translation', label: 'Routing validated work to ventures & pilots' },
      { role: 'legibility', label: 'Latest AI & Robotics insights', href: '/insights/?area=ai-robotics' },
    ],
  },
]

export function pointsForArea(area: FocusAreaKey | 'all'): InflectionPoint[] {
  if (area === 'all') return INFLECTION_POINTS
  return INFLECTION_POINTS.filter((p) => p.area === area)
}

// ── Resolution helpers ────────────────────────────────────────────────────────
// Every existing marker is seeded pending / unknown with null date and null
// condition (no invented values). Real values, when they land, override here.
export type Resolution = {
  outcome: Outcome
  mattered: Mattered
  matteredEvidence?: string
  fieldMovedAnyway: boolean
  retiredReason?: string
  predictedBy: string | null
  falsifiesIf: string | null
  asOf?: string
}

export function resolutionFor(p: InflectionPoint): Resolution {
  return {
    outcome: p.outcome ?? 'pending',
    mattered: p.mattered ?? 'unknown',
    matteredEvidence: p.matteredEvidence,
    fieldMovedAnyway: p.fieldMovedAnyway ?? false,
    retiredReason: p.retiredReason,
    predictedBy: p.predictedBy ?? null,
    falsifiesIf: p.falsifiesIf ?? null,
    asOf: p.asOf,
  }
}

/** The one place the display label is derived. `mattered` is never inferred. */
export function inflectionLabel(p: InflectionPoint): string {
  const r = resolutionFor(p)
  switch (r.outcome) {
    case 'pending':
      return 'pending'
    case 'retired':
      return 'retired — superseded'
    case 'missed':
      return r.fieldMovedAnyway ? 'missed — field moved another way' : 'missed'
    case 'reached':
      if (r.mattered === 'yes') return 'reached — field moved'
      if (r.mattered === 'no') return 'reached — no lift'
      return 'reached — lift unclear' // too_early | unknown
  }
}

/** Markers the misses affordance surfaces: missed, retired, or reached-without-lift. */
export function isConcerningMarker(p: InflectionPoint): boolean {
  const r = resolutionFor(p)
  return r.outcome === 'missed' || r.outcome === 'retired' || (r.outcome === 'reached' && r.mattered === 'no')
}

/** Stable id for anchoring/linking a marker card. */
export function inflectionSlug(p: InflectionPoint): string {
  return `ip-${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
}

// ── Build-time assertion (Task 4 rules) ───────────────────────────────────────
export function assertInflectionResolution(): void {
  for (const p of INFLECTION_POINTS) {
    if ((p.mattered === 'yes' || p.mattered === 'no') && !p.matteredEvidence) {
      throw new Error(`inflection-points: "${p.title}" has mattered=${p.mattered} but no matteredEvidence`)
    }
    if (p.outcome === 'retired' && !p.retiredReason) {
      throw new Error(`inflection-points: "${p.title}" is retired but has no retiredReason`)
    }
  }
}

assertInflectionResolution()
