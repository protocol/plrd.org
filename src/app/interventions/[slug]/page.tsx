import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import InterventionModal from '@/components/InterventionModal'
import InterventionsIndex from '@/components/InterventionsIndex'
import { interventionBySlug, publishedInterventions } from '@/lib/interventions'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return publishedInterventions().map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = interventionBySlug(slug)
  if (!item) return { title: 'Not Found' }
  const canonical = `/interventions/${item.slug}/`
  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: item.title,
      description: item.summary,
    },
  }
}

export default async function InterventionDetailPage({ params }: Props) {
  const { slug } = await params
  const item = interventionBySlug(slug)
  if (!item) notFound()

  return (
    <>
      <InterventionsIndex />
      <InterventionModal item={item} />
    </>
  )
}
