import InterventionModal from '@/components/InterventionModal'
import { interventionBySlug } from '@/lib/interventions'

export default async function InterventionModalIntercept({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = interventionBySlug(slug)
  if (!item) return null
  return <InterventionModal item={item} />
}
