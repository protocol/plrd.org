import type { Metadata } from 'next'
import InterventionsIndex from '@/components/InterventionsIndex'

export const metadata: Metadata = {
  title: 'Interventions',
  description:
    'Browse PL R&D interventions across R&D Acceleration, Digital Human Rights, Economies & Governance, AI & Robotics, and Neurotech. Diagnose the bottleneck, intervene, then learn.',
  alternates: { canonical: '/interventions/' },
  openGraph: {
    type: 'website',
    url: '/interventions/',
    title: 'Interventions',
    description:
      'Browse PL R&D interventions across our focus areas and R&D Acceleration. Diagnose the bottleneck, intervene, then learn.',
  },
}

export default function InterventionsPage() {
  return <InterventionsIndex />
}
