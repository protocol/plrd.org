import Link from 'next/link'
import OpenLabLaunchLink from '@/components/OpenLabLaunchLink'
import EditPageButton from '@/components/EditPageButton'
import { PageEditHistoryByline } from '@/components/EditHistoryByline'
import { publications, talks, listedBlogPosts as blogPosts } from '@/lib/content'
import MarkdownContent from '@/components/MarkdownContent'
import { fetchPage, getSection } from "@/lib/indexer"
import { FOCUS_AREA_DESCRIPTIONS } from '@/lib/focus-area-descriptions'

/** Focus-area hero illustrations floating above each card (replaces the hex cloud). */
const FOCUS_AREA_IMAGES: Record<string, string> = {
  'digital-human-rights': '/images/focus-areas/digital-human-rights.png',
  'economies-governance': '/images/focus-areas/economies-governance.png',
  'ai-robotics': '/images/focus-areas/ai-robotics.png',
  neurotech: '/images/focus-areas/neurotech.png',
}
import RDPipeline from "@/components/RDPipeline"
import InsightCarousel from "@/components/InsightCarousel"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

type UpdateItem = {
  title: string
  date: string
  type: string
  permalink: string
  slug: string
  areas: string[]
  coverImage?: string
}

/**
 * Extract YouTube video ID from Hugo shortcode in HTML.
 * Handles both raw `{{< youtube ID >}}` and HTML-encoded `{{&#x3C; youtube ID >}}`
 */
function extractYouTubeId(html: string): string | null {
  // Match patterns like {{< youtube VIDEO_ID >}} or {{&#x3C; youtube VIDEO_ID >}}
  const patterns = [
    /\{\{<\s*youtube\s+([a-zA-Z0-9_-]+)\s*>\}\}/,
    /\{\{&#x3C;\s*youtube\s+([a-zA-Z0-9_-]+)\s*>\}\}/,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Generate YouTube thumbnail URL from video ID.
 * Uses maxresdefault for best quality, falls back to hqdefault.
 */
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

function getLatestUpdates(count: number): UpdateItem[] {
  const pubs = publications.map((p) => ({
    title: p.title || p.slug,
    date: p.date || '',
    type: 'Publication',
    permalink: `/publications/${p.slug}`,
    slug: p.slug,
    areas: p.areas || [],
    coverImage: '/images/publication-cover.png',
  }))

  const talkItems = talks.map((t) => {
    const youtubeId = extractYouTubeId(t.html || '')
    const isPodcast = /podcast/i.test(`${t.venue ?? ''} ${t.venue_location ?? ''}`)
    return {
      title: t.title || t.slug,
      date: t.date || '',
      type: 'Talks & Podcasts',
      permalink: `/talks/${t.slug}`,
      slug: t.slug,
      areas: (t.areas || []).filter(Boolean) as string[],
      // Podcasts rarely have a YouTube thumbnail — fall back to the studio-mic image.
      coverImage: youtubeId
        ? getYouTubeThumbnail(youtubeId)
        : isPodcast
          ? '/images/podcast.webp'
          : undefined,
    }
  })

  const blogItems = blogPosts.map((b) => ({
    title: b.title || b.slug,
    date: b.date || '',
    type: 'Blog',
    permalink: b.external_url || `/blog/${b.slug}/`,
    slug: b.slug,
    areas: [],
    coverImage: b.coverImage || '',
  }))

  return [...pubs, ...talkItems, ...blogItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count)
}


export default async function HomePage() {
  const updates = getLatestUpdates(8)

  const page = await fetchPage("landing")
  const hero = getSection(page, "hero")
  const approach = getSection(page, "approach")
  const dhr = getSection(page, "approach-dhr")
  const eg = getSection(page, "approach-eg")
  const ai = getSection(page, "approach-ai")
  const neuro = getSection(page, "approach-neuro")
  const team = getSection(page, "team")

  return (
    <>
    <div className="max-w-6xl mx-auto px-6">
      <div className="pt-6 empty:hidden">
        <PageEditHistoryByline rkey="landing" />
      </div>

      {/* ── Hero ── */}
      <div className="relative pt-16 pb-8 md:pt-20 md:pb-10 lg:pt-24 lg:pb-12 overflow-visible">
        {/* Hero image - positioned absolutely to sit "under" the headline */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px] sm:w-[360px] md:w-[450px] lg:w-[520px] xl:w-[560px] pointer-events-none select-none"
          style={{ zIndex: 0 }}
        >
          <img
            src="/images/hero.webp"
            alt="Glass cube containing colorful neural structures"
            className="w-full h-auto dark:hidden"
          />
          <img
            src="/images/hero-dark.webp"
            alt="Glass cube containing colorful neural structures"
            className="w-full h-auto hidden dark:block"
          />
        </div>

        <div className="relative z-10 max-md:-mx-3 max-md:rounded-2xl max-md:bg-white/70 max-md:px-3 max-md:py-4 max-md:backdrop-blur-[2px] max-md:dark:bg-neutral-900/60">
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-6 font-medium">
            Protocol Labs Research &amp; Development
          </p>
          <h1 className="font-serif text-[36px] md:text-[48px] lg:text-[52px] font-normal leading-[1.06] tracking-tight mb-6 max-w-md md:max-w-lg lg:max-w-xl">
            Driving R&amp;D breakthroughs to push humanity forward.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mb-8">
            We de-risk frontier ideas in computing and help them cross from open research to deployment, expanding human freedom, coordination, intelligence, and cognition
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-semibold text-[15px]"
            >
              About us
              <span>→</span>
            </Link>
            <a
              href="#focus-areas"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-[15px]"
            >
              Focus areas
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

    </div>

    <OpenLabLaunchLink href="/lab/" className="block border-y border-black/10 dark:border-white/15 bg-gray-100 hover:bg-blue/10 transition-colors"><div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap gap-4 items-center justify-between"><div><span className="text-[12px] uppercase tracking-[.16em] text-blue mr-4">Introducing Open Lab</span><span className="font-serif text-[24px]">Made something that makes science easier?</span></div><span className="text-[15px] font-semibold">Explore the lab →</span></div></OpenLabLaunchLink>

    {/* ── Focus Areas (full-bleed gray) ── */}
    <div id="focus-areas" className="bg-gray-100 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6 pb-20 lg:pb-28 pt-16 lg:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-10 lg:mb-14">
          <h2 className="text-[28px] md:text-[36px] font-normal leading-[1.1] tracking-tight">
            {approach?.title || "Use-inspired research across four frontiers"}
          </h2>
          <MarkdownContent
            content="Our work is concentrated in areas where computing systems will shape human freedom, institutional capacity, machine intelligence, and the future of cognition itself."
            className="text-base text-gray-600 leading-relaxed lg:-mt-[3px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:auto-rows-fr gap-6 lg:gap-8">
          <FocusAreaCard
            href="/areas/digital-human-rights"
            slug="digital-human-rights"
            title={dhr?.title || "Digital Human Rights"}
            body={FOCUS_AREA_DESCRIPTIONS['digital-human-rights']}
          />
          <FocusAreaCard
            href="/areas/economies-governance"
            slug="economies-governance"
            title={eg?.title || "Economies & Governance"}
            body={FOCUS_AREA_DESCRIPTIONS['economies-governance']}
          />
          <FocusAreaCard
            href="/areas/ai-robotics"
            slug="ai-robotics"
            title={ai?.title || "AI & Robotics"}
            body={FOCUS_AREA_DESCRIPTIONS['ai-robotics']}
            imgClassName="h-[73px]"
          />
          <FocusAreaCard
            href="/areas/neurotech"
            slug="neurotech"
            title={neuro?.title || "Neurotechnology"}
            body={FOCUS_AREA_DESCRIPTIONS.neurotech}
          />
        </div>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-6">
      {/* ── R&D Pipeline ── */}
      <div className="pb-16 lg:pb-20 border-t border-gray-200 pt-16 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-6 lg:mb-8">
          <h2 className="text-[28px] md:text-[36px] font-normal leading-[1.1] tracking-tight">
            PL R&amp;D helps promising research cross the innovation chasm
          </h2>
          <p className="text-base text-gray-600 leading-relaxed lg:-mt-[3px]">
            Our R&amp;D pipeline accelerates frontier ideas from early research into production systems that scale globally. We help researchers, builders, funders, and institutions coordinate around the technical primitives, open infrastructure, and deployment pathways that make new fields real.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <RDPipeline />
        </div>
      </div>

      {/* ── Latest Insights ── */}
      <div className="pb-12 lg:pb-14 pt-14 lg:pt-16">
        <div className="flex items-baseline justify-between mb-7">
          <div>
            <p className="text-sm text-blue font-medium mb-1">News &amp; Insights</p>
            <h2 className="text-[28px] md:text-[36px] font-normal leading-[1.1] tracking-tight">
              Latest from PL R&amp;D
            </h2>
          </div>
          <Link
            href="/insights/"
            className="text-sm text-blue font-semibold hover:underline transition-colors hidden sm:inline-flex items-center gap-1"
          >
            View all News &amp; Insights →
          </Link>
        </div>
        <InsightCarousel items={updates} />
      </div>

      {/* ── Team ── */}
      <div className="pb-12 lg:pb-14 border-t border-gray-200 pt-10 lg:pt-12">
        <h2 className="text-[13px] text-gray-500 uppercase tracking-[0.12em] font-bold mb-4">Team</h2>
        <MarkdownContent
          content={team?.body || "A fully remote team distributed across the globe, working with talented and intellectually curious people who share a passion for improving technology for humanity."}
          className="text-lg text-gray-700 leading-relaxed max-w-2xl mb-6"
        />
        <Link
          href="/authors"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold text-sm"
        >
          Meet the team
          <span>→</span>
        </Link>
      </div>
      <EditPageButton rkey="landing" />
    </div>
    </>
  )
}

function FocusAreaCard({
  href,
  slug,
  title,
  body,
  imgClassName = "h-[104px]",
  imageColClass = "w-[32%] sm:w-[34%]",
}: {
  href: string
  slug: string
  title: string
  body: string
  imgClassName?: string
  imageColClass?: string
}) {
  const image = FOCUS_AREA_IMAGES[slug]

  return (
    <Link
      href={href}
      className="group flex h-full items-stretch bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      {/* Content on the left. */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
        <h3 className="text-xl font-serif font-normal tracking-tight mb-3">{title}</h3>
        <MarkdownContent
          content={body}
          className="text-[15px] text-gray-600 leading-relaxed [&_p]:mb-0"
        />
      </div>

      {/* Vertical divider. */}
      <div aria-hidden="true" className="my-6 w-px self-stretch bg-gray-200" />

      {/* Illustration fully contained (not cropped) on the right. */}
      <div className={`flex-shrink-0 ${imageColClass} flex items-center justify-center p-4 sm:p-5`}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            /* Fixed height + w-auto so every illustration renders at the same
               vertical height regardless of its aspect ratio. */
            className={`mx-auto ${imgClassName} w-auto max-w-full object-contain [filter:drop-shadow(0_10px_18px_rgba(15,17,21,0.12))] transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
          />
        )}
      </div>
    </Link>
  )
}
