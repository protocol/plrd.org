import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { blogPosts } from '@/lib/content'
import { siteConfig } from '@/lib/site-config'
import { formatDate } from '@/lib/format'
import AuthorCard from '@/components/AuthorCard'
import Breadcrumb from '@/components/Breadcrumb'
import Fa2LiveDashboardEmbed from '@/components/Fa2LiveDashboardEmbed'

type Props = { params: Promise<{ slug: string }> }

// Marker a post can drop into its body to pull the live FA2 impact dashboard
// inline at that exact spot. The build passes raw HTML through untouched, so
// the empty div survives and we split on it here.
const FA2_DASHBOARD_MARKER = '<div id="fa2-live-dashboard"></div>'

// Refresh embedded live data on the same 60s window as the standalone
// dashboard page. Harmless for static posts (they just re-render).
export const revalidate = 60

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return { title: 'Not Found' }
  // External stubs live on their original home — point search engines there.
  const canonical = post.external_url || `/blog/${post.slug}/`
  const metaDescription = post.description || post.summary
  return {
    title: post.title,
    description: metaDescription,
    alternates: { canonical },
    // Unlisted/preview posts render but must stay out of every index.
    robots: post.unlisted
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : undefined,
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.title,
      description: metaDescription,
      publishedTime: post.date || undefined,
      authors: post.authors,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    // Override inherited site copy/image on X as well as Open Graph.
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitterUser,
      title: post.title,
      description: metaDescription,
      images: [post.coverImage || siteConfig.avatar],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) notFound()

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      {post.unlisted && <PreviewBanner />}
      <Breadcrumb items={[{ label: 'Blog', href: '/blog/' }, { label: post.title }]} />
      <div className="mt-6 mb-2 text-sm text-gray-500">
        {formatDate(post.date)}
      </div>
      <h1 className="text-lg md:text-[32px] mb-6 leading-tight font-semibold max-w-3xl">
        {post.title}
      </h1>
      {post.authors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.authors.map((authorSlug) => (
            <AuthorCard key={authorSlug} slug={authorSlug} />
          ))}
        </div>
      )}
      {post.html && renderBody(post.html)}
    </div>
  )
}

// Sticky bar shown only on unlisted/preview posts, making it obvious the page
// is a private preview and not a published, discoverable post.
function PreviewBanner() {
  return (
    <div className="sticky top-0 z-50 -mx-6 mb-6 flex items-center justify-center gap-2 border-b border-amber-300 bg-amber-100 px-6 py-2 text-sm font-medium text-amber-900">
      <span aria-hidden="true">🔒</span>
      <span>Preview only — unlisted draft, not publicly linked. Please don’t share.</span>
    </div>
  )
}

// Render the post body, splicing the live dashboard in at the marker if present.
function renderBody(html: string) {
  const cls =
    'page-content text-base text-gray-700 leading-relaxed max-w-3xl'
  if (!html.includes(FA2_DASHBOARD_MARKER)) {
    return <div className={cls} dangerouslySetInnerHTML={{ __html: html }} />
  }
  const [before, after] = html.split(FA2_DASHBOARD_MARKER)
  return (
    <div className={cls}>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      {/* Themed collapsibles, each collapsed by default. */}
      <Fa2LiveDashboardEmbed />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </div>
  )
}
