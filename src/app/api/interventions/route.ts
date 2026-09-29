import { INTERVENTION_AREA_LABEL, INTERVENTION_TYPES, INTERVENTION_STATUS_LABEL, interventionStatus, publishedInterventions } from '@/lib/interventions'

export const runtime = 'nodejs'
export const revalidate = 60

/** Read-only public catalog; unpublished records never appear. */
export async function GET() {
  const items = publishedInterventions().map((item) => ({
    slug: item.slug,
    href: `https://www.plrd.org/interventions/${item.slug}/`,
    title: item.title,
    area: item.area,
    areaLabel: INTERVENTION_AREA_LABEL[item.area],
    type: item.type,
    typeLabel: INTERVENTION_TYPES[item.type].title,
    support: item.support,
    summary: item.summary,
    bottleneck: item.bottleneck,
    work: item.work,
    evidence: item.evidence,
    timing: item.timing,
    stage: item.stage,
    status: interventionStatus(item),
    statusLabel: INTERVENTION_STATUS_LABEL[interventionStatus(item)],
    sourceKind: item.sourceKind || 'draft',
    resources: item.resources || [],
    resourceLabel: item.resourceLabel,
    sourceNote: item.sourceNote,
    plRole: item.plRole,
  }))
  return Response.json(
    {
      source: 'plrd.org public edition',
      count: items.length,
      items,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      },
    },
  )
}
