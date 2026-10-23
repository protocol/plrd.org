import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import Explainer from '@/components/sovereign-ai/Explainer'
import Partnership from '@/components/sovereign-ai/Partnership'
import Summary from '@/components/sovereign-ai/Summary'
import ThreePropositions from '@/components/sovereign-ai/ThreePropositions'
import { SheetFoot, SheetHero } from '@/components/sovereign-ai/parts'
import { plain, programHref, sheetHref, sheets, type Sheet } from '@/lib/sovereign-ai'
import { siteConfig } from '@/lib/site-config'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return sheets.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sheet = sheets.find((s) => s.slug === slug)
  if (!sheet) return { title: 'Not Found' }
  // The printed title: "Why sovereign AI: Better public institutions, on your own terms".
  const title = `${sheet.title}: ${sheet.subtitle}`
  const description = plain(sheet.summary)
  const canonical = sheetHref(sheet.slug)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'article', url: canonical, title, description, images: [sheet.image] },
    twitter: { card: 'summary_large_image', site: siteConfig.twitterUser, title, description, images: [sheet.image] },
  }
}

/**
 * A Sovereign AI sheet's web edition. The printed A4 sheet comes from the same
 * JSON (`npm run build-sheets`); this page keeps the paper's order and adds
 * what paper cannot: a link behind every source, and links between the sheets.
 */
export default async function SheetPage({ params }: Props) {
  const { slug } = await params
  const sheet = sheets.find((s) => s.slug === slug)
  if (!sheet) notFound()

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Focus Areas', href: '/areas/' },
          { label: 'Economies & Governance', href: '/areas/economies-governance/' },
          { label: 'Sovereign AI', href: programHref },
          { label: sheet.label },
        ]}
      />
      <SheetHero sheet={sheet} />
      <Layout sheet={sheet} />
      <SheetFoot sheet={sheet} />
    </div>
  )
}

/** The body of the sheet, in the shape its layout names. */
function Layout({ sheet }: { sheet: Sheet }) {
  switch (sheet.layout) {
    case 'three-propositions':
      return <ThreePropositions sheet={sheet} />
    case 'explainer':
      return <Explainer sheet={sheet} />
    case 'partnership':
      return <Partnership sheet={sheet} />
    case 'summary':
      return <Summary sheet={sheet} />
  }
}
