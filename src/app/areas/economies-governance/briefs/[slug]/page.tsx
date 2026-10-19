import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import Partnership from '@/components/briefs/Partnership'
import ThreePropositions from '@/components/briefs/ThreePropositions'
import { BriefFoot, BriefHero } from '@/components/briefs/parts'
import { briefHref, briefs, plain } from '@/lib/briefs'
import { siteConfig } from '@/lib/site-config'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return briefs.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brief = briefs.find((b) => b.slug === slug)
  if (!brief) return { title: 'Not Found' }
  // The printed title: "Why sovereign AI: Better public institutions, on your own terms".
  const title = `${brief.title}: ${brief.subtitle}`
  const description = plain(brief.summary)
  const canonical = briefHref(brief.slug)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'article', url: canonical, title, description, images: [brief.image] },
    twitter: { card: 'summary_large_image', site: siteConfig.twitterUser, title, description, images: [brief.image] },
  }
}

/**
 * An FA2 brief's web edition. The printed A4 version comes from the same JSON
 * (`npm run build-briefs`); this page keeps the paper's order and adds what
 * paper cannot: a link behind every source, and links between the briefs.
 */
export default async function BriefPage({ params }: Props) {
  const { slug } = await params
  const brief = briefs.find((b) => b.slug === slug)
  if (!brief) notFound()

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Focus Areas', href: '/areas/' },
          { label: 'Economies & Governance', href: '/areas/economies-governance/' },
          { label: brief.label },
        ]}
      />
      <BriefHero brief={brief} />
      {brief.layout === 'three-propositions' ? <ThreePropositions brief={brief} /> : <Partnership brief={brief} />}
      <BriefFoot brief={brief} />
    </div>
  )
}
