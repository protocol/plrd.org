export const FOCUS_AREA_DESCRIPTIONS = {
  'digital-human-rights': 'Building open, verifiable, censorship-resistant infrastructure for human freedom & agency in the digital age.',
  'economies-governance': 'Building programmable infrastructure for more efficient, equitable coordination at global scale.',
  'ai-robotics': 'Building open compute, coordination, data, and economic rails for autonomous agents and embodied AI.',
  neurotech: 'Accelerating brain-computer interfaces (BCI), whole-organism emulation (WOE), & NeuroAI to expand human cognition.',
} as const

export type FocusAreaSlug = keyof typeof FOCUS_AREA_DESCRIPTIONS
