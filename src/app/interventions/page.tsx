import type { Metadata } from 'next'
import InterventionsIndex from '@/components/InterventionsIndex'
import { INTERVENTION_AREA_ORDER, type InterventionAreaSlug } from '@/lib/interventions'

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

function parseAreas(raw: string | string[] | undefined): InterventionAreaSlug[] {
  const values = Array.isArray(raw) ? raw : raw ? raw.split(',') : []
  return values.filter((value): value is InterventionAreaSlug =>
    INTERVENTION_AREA_ORDER.includes(value as InterventionAreaSlug),
  )
}

export default async function InterventionsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[]; type?: string | string[] }>
}) {
  const query = await searchParams
  const initialAreas = parseAreas(query.area)
  const initialType = typeof query.type === 'string' ? query.type : undefined

  return <InterventionsIndex initialAreas={initialAreas} initialType={initialType} />
}
