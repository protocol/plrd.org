import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authors, publications, talks } from '@/lib/content'
import Breadcrumb from '@/components/Breadcrumb'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return authors.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const author = authors.find((a) => a.slug === slug)
  if (!author) return { title: 'Not Found' }
  const description =
    author.role ||
    (author.quote || '').slice(0, 160) ||
    `${author.name} at Protocol Labs R&D`
  const canonical = `/authors/${author.slug}/`
  return {
    title: author.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      url: canonical,
      title: author.name,
      description,
      images: author.avatarPath ? [author.avatarPath] : undefined,
    },
  }
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params
  const author = authors.find((a) => a.slug === slug)
  if (!author) notFound()

  const authorPubs = publications.filter((p) => p.authors.includes(slug))
  const authorTalks = talks.filter((t) => t.authors.includes(slug))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    ...(author.role ? { jobTitle: author.role } : {}),
    worksFor: { '@type': 'Organization', name: 'Protocol Labs R&D' },
    ...(author.avatarPath ? { image: author.avatarPath } : {}),
    ...(Array.isArray(author.social) && author.social.length
      ? { sameAs: author.social.map((s) => s.link).filter(Boolean) }
      : {}),
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb items={[{ label: 'Team', href: '/team/' }, { label: author.name }]} />
      {/* Hero */}
      <div className="relative pt-6 pb-10 mb-10 overflow-hidden">
        <PageGeo />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="w-24 h-24 shrink-0">
            {author.avatarPath ? (
              <img src={author.avatarPath} alt={author.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200" />
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-xl lg:text-[40px] font-semibold leading-[1.15] tracking-tight mb-2">
              {author.name}
            </h1>
            {author.role && <p className="text-gray-600 mb-1">{author.role}</p>}
            {author.groups.length > 0 && (
              <p className="text-sm text-gray-400 mb-4">{author.groups.join(', ')}</p>
            )}
            {/* Social links */}
            {author.social.length > 0 && (
              <div className="flex items-center gap-3">
                {author.social.map((s, i) => s.link && (
                  <a
                    key={i}
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-5 h-5 opacity-40 hover:opacity-100 transition-opacity"
                    title={s.icon}
                  >
                    <img src={`/icons/${s.icon}.svg`} alt={s.icon || ''} className="w-full h-full" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {author.html && (
        <div className="mb-10 pb-10 border-b border-gray-100">
          <div className="page-content text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: author.html }} />
        </div>
      )}

      {/* Interests & Education */}
      {(author.interests.length > 0 || (author.education?.courses && author.education.courses.length > 0)) && (
        <div className="grid md:grid-cols-2 gap-8 mb-10 pb-10 border-b border-gray-100">
          {author.interests.length > 0 && (
            <div>
              <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-4">Interests</h2>
              <ul className="space-y-1.5 list-none m-0 p-0">
                {author.interests.map((interest, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue shrink-0" />
                    {interest}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {author.education?.courses && author.education.courses.length > 0 && (
            <div>
              <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-4">Education</h2>
              <ul className="space-y-2 list-none m-0 p-0">
                {author.education.courses.map((c, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{c.course}</span>
                    {c.institution && <span className="text-gray-500"> - {c.institution}</span>}
                    {c.year && <span className="text-gray-400"> ({c.year})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Publications */}
      {authorPubs.length > 0 && (
        <div className="mb-10 pb-10 border-b border-gray-100">
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Publications</h2>
          <div className="divide-y divide-gray-100">
            {authorPubs.map((p) => (
              <div key={p.slug} className="py-3">
                <Link href={`/publications/${p.slug}`} className="text-sm text-black hover:text-blue transition-colors">
                  {p.title}
                </Link>
                <div className="text-xs text-gray-400 mt-0.5">
                  {p.venue}{p.date && ` · ${new Date(p.date).getFullYear()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Talks */}
      {authorTalks.length > 0 && (
        <div>
          <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-6">Talks</h2>
          <div className="divide-y divide-gray-100">
            {authorTalks.map((t) => (
              <div key={t.slug} className="py-3">
                <Link href={`/talks/${t.slug}`} className="text-sm text-black hover:text-blue transition-colors">
                  {t.title}
                </Link>
                <div className="text-xs text-gray-400 mt-0.5">
                  {t.venue}{t.date && ` · ${new Date(t.date).getFullYear()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PageGeo() {
  return (
    <svg
      className="absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"
      viewBox="0 0 700 500"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="480" cy="130" r="70" stroke="#C3E1FF" strokeWidth="1" />
      <circle cx="560" cy="250" r="50" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="400" cy="260" r="90" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="520" cy="380" r="55" stroke="#C3E1FF" strokeWidth="1" />
      <line x1="480" y1="130" x2="560" y2="250" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="560" y1="250" x2="520" y2="380" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="400" y1="260" x2="480" y2="130" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="400" y1="260" x2="520" y2="380" stroke="#C3E1FF" strokeWidth="0.5" />
      <circle cx="480" cy="130" r="3" fill="#C3E1FF" />
      <circle cx="560" cy="250" r="3" fill="#C3E1FF" />
      <circle cx="400" cy="260" r="3" fill="#C3E1FF" />
      <circle cx="520" cy="380" r="3" fill="#C3E1FF" />
    </svg>
  )
}
