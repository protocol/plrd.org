import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { talks } from '@/lib/content'
import { siteConfig } from '@/lib/site-config'
import AuthorCard from '@/components/AuthorCard'
import Breadcrumb from '@/components/Breadcrumb'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return talks.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const talk = talks.find((t) => t.slug === slug)
  if (!talk) return { title: 'Not Found' }
  const description = (talk.abstract || '').slice(0, 160)
  const canonical = `/talks/${talk.slug}/`
  const youtubeId = extractYoutubeId(talk.html || '')
  // hqdefault is available even for videos without a max-resolution upload.
  // Social crawlers cannot run an image's client-side error fallback.
  const image = youtubeId
    ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
    : siteConfig.avatar
  return {
    title: talk.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: talk.title,
      description,
      publishedTime: talk.date || undefined,
      authors: talk.authors,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitterUser,
      title: talk.title,
      description,
      images: [image],
    },
  }
}

function extractYoutubeId(html: string): string | null {
  const match = html.match(/\{\{[<&].*?youtube\s+([a-zA-Z0-9_-]+)\s*[>&].*?\}\}/)
  return match ? match[1] : null
}

function extractSpotifyEpisodeId(html: string): string | null {
  const match = html.match(/\{\{[<&].*?spotify\s+(?:episode\/)?([a-zA-Z0-9]+)\s*[>&].*?\}\}/)
  return match ? match[1] : null
}

export default async function TalkPage({ params }: Props) {
  const { slug } = await params
  const talk = talks.find((t) => t.slug === slug)
  if (!talk) notFound()

  const youtubeId = talk.html ? extractYoutubeId(talk.html) : null
  const spotifyEpisodeId = talk.html ? extractSpotifyEpisodeId(talk.html) : null

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Talks', href: '/talks/' }, { label: talk.title }]} />
      <div className="mb-2 text-sm text-gray-500 mt-6">
        {talk.venue}
        {talk.venue_location && <> &middot; {talk.venue_location}</>}
        {talk.date && <> &middot; {new Date(talk.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</>}
      </div>
      <h1 className="text-lg md:text-larger mb-4 leading-tight font-semibold">{talk.title}</h1>
      {talk.authors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {talk.authors.map((authorSlug) => (
            <AuthorCard key={authorSlug} slug={authorSlug} />
          ))}
        </div>
      )}
      {talk.abstract && <p className="text-gray-700 leading-relaxed mb-6">{talk.abstract}</p>}
      {youtubeId && (
        <div className="mb-6 rounded-lg overflow-hidden border border-gray-100">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={talk.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
      {spotifyEpisodeId && (
        <div className="mb-6 rounded-lg overflow-hidden">
          <iframe
            className="w-full"
            style={{ borderRadius: '12px' }}
            src={`https://open.spotify.com/embed/episode/${spotifyEpisodeId}`}
            height={352}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={talk.title}
          />
        </div>
      )}
      {talk.venue_url && (
        <a href={talk.venue_url} className="text-blue hover:underline text-sm mt-4 inline-block">Venue website</a>
      )}
    </div>
  )
}
