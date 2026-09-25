import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import {
  INTERVENTION_AREA_HREF,
  INTERVENTION_AREA_LABEL,
  INTERVENTION_STAGE_LABEL,
  INTERVENTION_TYPES,
  catalogHref,
  interventionBySlug,
  publishedInterventions,
} from '@/lib/interventions'

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

  const support = item.support.map((id) => INTERVENTION_TYPES[id].title).join(' · ')

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Interventions', href: '/interventions/' },
          { label: item.title },
        ]}
      />
      <article className="pt-8 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
          {INTERVENTION_AREA_LABEL[item.area]} · Draft-source example
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
            {INTERVENTION_STAGE_LABEL[item.stage]}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
            {INTERVENTION_TYPES[item.type].title}
          </span>
        </div>
        <h1 className="text-2xl lg:text-[40px] font-semibold leading-[1.1] tracking-tight mb-5">
          {item.title}
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">{item.summary}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2">The bottleneck</h2>
            <p className="text-base text-gray-600 leading-relaxed">{item.bottleneck}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">The proposed work</h2>
            <p className="text-base text-gray-600 leading-relaxed">{item.work}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">PL R&amp;D&rsquo;s proposed role</h2>
            <p className="text-base text-gray-600 leading-relaxed">{item.plRole}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">What we would examine</h2>
            <p className="text-base text-gray-600 leading-relaxed">{item.evidence}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">How to get involved</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              Production pages should offer a reviewed, program-specific route to contribute expertise,
              partner, or discuss funding. No intake or outreach is connected here.
            </p>
          </section>
        </div>

        <dl className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-2">
          <div>
            <dt className="inline text-gray-400">Supporting types: </dt>
            <dd className="inline">{support || 'None listed'}</dd>
          </div>
          <div>
            <dt className="inline text-gray-400">Public timing: </dt>
            <dd className="inline">{item.timing}</dd>
          </div>
          <div>
            <dt className="inline text-gray-400">Classification: </dt>
            <dd className="inline">{item.typeNote}</dd>
          </div>
        </dl>

        <p className="mt-6 text-xs text-gray-400 leading-relaxed">
          This is a proposed public edition from internal planning drafts, not a verified active
          commitment. Funding figures and private source links are withheld until a designated publisher
          reviews them.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href={INTERVENTION_AREA_HREF[item.area]} className="text-blue hover:underline">
            {INTERVENTION_AREA_LABEL[item.area]} →
          </Link>
          <Link href={catalogHref(item.area)} className="text-blue hover:underline">
            All {INTERVENTION_AREA_LABEL[item.area]} interventions →
          </Link>
          <Link href="/interventions/methodology/" className="text-blue hover:underline">
            Methodology →
          </Link>
        </div>
      </article>
    </div>
  )
}
