import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import Explainer from '@/components/programs/Explainer'
import Partnership from '@/components/programs/Partnership'
import Summary from '@/components/programs/Summary'
import ThreePropositions from '@/components/programs/ThreePropositions'
import { ProgramFoot, ProgramHero } from '@/components/programs/parts'
import { plain, programHref, programs, type Program } from '@/lib/programs'
import { siteConfig } from '@/lib/site-config'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return programs.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const program = programs.find((p) => p.slug === slug)
  if (!program) return { title: 'Not Found' }
  // The printed title: "Why sovereign AI: Better public institutions, on your own terms".
  const title = `${program.title}: ${program.subtitle}`
  const description = plain(program.summary)
  const canonical = programHref(program.slug)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'article', url: canonical, title, description, images: [program.image] },
    twitter: { card: 'summary_large_image', site: siteConfig.twitterUser, title, description, images: [program.image] },
  }
}

/**
 * An FA2 program's web edition. The printed A4 sheet comes from the same JSON
 * (`npm run build-programs`); this page keeps the paper's order and adds what
 * paper cannot: a link behind every source, and links between the sheets.
 */
export default async function ProgramPage({ params }: Props) {
  const { slug } = await params
  const program = programs.find((p) => p.slug === slug)
  if (!program) notFound()

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Focus Areas', href: '/areas/' },
          { label: 'Economies & Governance', href: '/areas/economies-governance/' },
          { label: program.label },
        ]}
      />
      <ProgramHero program={program} />
      <Layout program={program} />
      <ProgramFoot program={program} />
    </div>
  )
}

/** The body of the sheet, in the shape its layout names. */
function Layout({ program }: { program: Program }) {
  switch (program.layout) {
    case 'three-propositions':
      return <ThreePropositions program={program} />
    case 'explainer':
      return <Explainer program={program} />
    case 'partnership':
      return <Partnership program={program} />
    case 'summary':
      return <Summary program={program} />
  }
}
