import type { Metadata } from 'next'
import InterventionsIndex from '@/components/InterventionsIndex'

export const metadata: Metadata = {
  title: 'Interventions',
  description:
    'Browse PL R&D interventions across Digital Human Rights, Economies & Governance, AI & Robotics, and Neurotech. Diagnose the bottleneck, intervene, then learn.',
  alternates: { canonical: '/interventions/' },
  openGraph: {
    type: 'website',
    url: '/interventions/',
    title: 'Interventions',
    description:
      'Browse PL R&D interventions across four focus areas. Diagnose the bottleneck, intervene, then learn.',
  },
}

export default function InterventionsPage() {
  return <InterventionsIndex />
}
