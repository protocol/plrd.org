import type { InstrumentId } from '@/lib/velocity-instruments'

export type VelocitySignalInstrument = {
  title: string
  description: string
  id?: InstrumentId
}

export type VelocitySignal = {
  title: string
  question: string
  core: string
  instruments: VelocitySignalInstrument[]
}

export const VELOCITY_SIGNALS: VelocitySignal[] = [
  {
    title: 'Capability',
    question: 'Can the field do more?',
    core: 'What can the field do today that it could not do a year ago?',
    instruments: [
      { id: 'performance_curves', title: 'Performance curves', description: 'How cost, quality, capability or scale changes over time.' },
      { title: 'Direct capability measures', description: 'Benchmarks or demonstrations that something previously impossible is now possible.' },
    ],
  },
  {
    title: 'Constraints',
    question: 'Are bottlenecks loosening?',
    core: 'Is the thing preventing progress becoming easier to overcome? We track cost, time lost, actors affected, severity, and whether alternatives now exist.',
    instruments: [],
  },
  {
    title: 'Transition speed',
    question: 'Is work moving faster?',
    core: 'Is the path from possibility to real-world use getting shorter?',
    instruments: [
      { id: 'latency_compression', title: 'Latency compression', description: 'Whether meaningful stages of progress are happening faster.' },
      { id: 'idea_vintage', title: 'Idea vintage', description: 'How quickly the intellectual frontier is turning over.' },
    ],
  },
  {
    title: 'Commitment',
    question: 'Are serious actors leaning in?',
    core: 'Are credible actors making increasingly costly and persistent commitments?',
    instruments: [
      { id: 'revealed_commitments', title: 'Revealed commitments', description: 'Where people actually put careers, capital, teams and institutional resources.' },
      { id: 'markets', title: 'Markets', description: 'Changing expectations about future capabilities or events where credible markets exist.' },
    ],
  },
  {
    title: 'Adoption',
    question: 'Is useful work reaching the world?',
    core: 'Is what works becoming used?',
    instruments: [
      { title: 'Adoption measures', description: 'Pilots, deployments, procurement, usage, standards uptake and independent replication.' },
    ],
  },
  {
    title: 'Durability',
    question: 'Can the field increasingly move without us?',
    core: 'Is the capacity for progress becoming embedded in the field itself? Independent funding, durable organizations, maintained infrastructure and follow-on institutions.',
    instruments: [],
  },
]
