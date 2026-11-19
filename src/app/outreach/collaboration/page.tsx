import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import MarkdownContent from '@/components/MarkdownContent'
import { fetchPage, getSection } from '@/lib/indexer'

export const metadata: Metadata = {
  title: 'Collaborate',
  description: 'Partner with PL R&D to advance the frontiers of computing and build infrastructure for humanity.',
}

const HERO_TITLE_FALLBACK = 'Collaborate With Us'
const HERO_BODY_FALLBACK =
  "We believe in open collaboration. Whether you're a researcher, developer, institution, or visionary builder, there are many ways to work together on problems that matter."

const SECTION_TITLE_FALLBACK =
  'PL R&D collaborates with researchers, builders, funders, institutions, policymakers, founders, and domain experts.'

// Mirrors the About page's "Collaborations and Support" section. Used as a
// fallback if the CMS section can't be fetched, and to guarantee the pathways
// always render on this dedicated page.
const COLLAB_TYPES_FALLBACK: { title: string; body: string }[] = [
  {
    title: 'Co-fund a program',
    body: 'We partner with foundations, philanthropists, public agencies, companies, and research funders on grant calls, prizes, fellowships, convenings, field maps, standards efforts, and pilot programs.',
  },
  {
    title: 'Build with us',
    body: 'We support builders and technical teams on open-source tools, protocols, datasets, reference architectures, prototypes, and infrastructure projects aligned with one of our focus areas.',
  },
  {
    title: 'Pioneer research',
    body: 'We help researchers define open questions, produce field maps, develop technical roadmaps, evaluate emerging systems, and turn frontier ideas into shared knowledge.',
  },
  {
    title: 'Join a convening or working group',
    body: 'We host experts, policymakers, funders, and operators for focused discussions on bottlenecks, opportunity spaces, and deployment pathways.',
  },
  {
    title: 'Advise a focus area',
    body: 'Our field-level Science Advisory Boards bring together domain experts to shape strategy, review opportunity spaces, identify promising teams, and connect PL R&D with important work happening across the field.',
  },
  {
    title: 'Explore deployment partnerships',
    body: 'We work closely with institutions, governments, nonprofits, and companies to explore pilots, standards, public-good infrastructure, and real-world applications for emerging technologies to accelerate field understanding & progress.',
  },
]

/** Parse the About page's "collaborations" markdown (**Title:** body blocks) into cards. */
function parseCollabTypes(md?: string | null): { title: string; body: string }[] {
  if (!md) return []
  const items: { title: string; body: string }[] = []
  const re = /\*\*(.+?):?\*\*\s*([\s\S]*?)(?=\n\s*\n\s*\*\*|\s*$)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    const title = m[1].replace(/:$/, '').trim()
    const body = m[2].replace(/\s+/g, ' ').trim()
    if (title && body) items.push({ title, body })
  }
  return items
}

export default async function CollaborationPage() {
  const [page, aboutPage] = await Promise.all([fetchPage('collaborate'), fetchPage('about')])
  const heroSection = getSection(page, 'hero')
  const collabs = getSection(aboutPage, 'collaborations')

  const heroTitle = heroSection?.title || HERO_TITLE_FALLBACK
  const heroBody = heroSection?.subtitle || HERO_BODY_FALLBACK
  const sectionTitle = collabs?.title || SECTION_TITLE_FALLBACK

  const parsed = parseCollabTypes(collabs?.body)
  const collabTypes = parsed.length > 0 ? parsed : COLLAB_TYPES_FALLBACK

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'Collaborate' }]} />

      {/* Hero */}
      <div className="relative pt-6 pb-10 mb-14 overflow-hidden">
        <CollabGeo />
        <h1 className="relative z-10 text-xl lg:text-[40px] font-semibold leading-[1.15] tracking-tight mb-4 max-w-lg">
          {heroTitle}
        </h1>
        <MarkdownContent content={heroBody} className="relative z-10 text-gray-600 leading-relaxed max-w-xl" />
      </div>

      {/* Ways to collaborate — the pathways from the About page's Collaborations & Support */}
      <div className="mb-14">
        <p className="text-blue text-sm tracking-wide mb-3">COLLABORATIONS AND SUPPORT</p>
        <h2 className="font-semibold text-xl lg:text-2xl leading-relaxed mb-8 max-w-3xl">{sectionTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {collabTypes.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
              <p className="text-[15px] text-gray-600 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA: get in touch + follow on X */}
      <div className="border-t border-gray-200 pt-10">
        <p className="text-sm text-gray-500 mb-4">Ready to start a conversation?</p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:research@protocol.ai"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-semibold text-sm"
          >
            Contact us
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </a>
          <a
            href="https://x.com/protocollabs_rd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-800 rounded-full hover:border-black hover:text-black transition-colors font-semibold text-sm"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow us on X
          </a>
        </div>
      </div>
    </div>
  )
}

function CollabGeo() {
  return (
    <svg
      className="absolute top-2 right-0 w-[300px] h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.4] pointer-events-none select-none"
      viewBox="0 0 700 500"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="400" cy="180" r="60" stroke="#C3E1FF" strokeWidth="1" />
      <circle cx="560" cy="180" r="60" stroke="#C3E1FF" strokeWidth="1" />
      <circle cx="480" cy="280" r="50" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="380" cy="360" r="40" stroke="#C3E1FF" strokeWidth="0.75" />
      <circle cx="580" cy="360" r="40" stroke="#C3E1FF" strokeWidth="0.75" />
      <line x1="400" y1="180" x2="560" y2="180" stroke="#C3E1FF" strokeWidth="0.75" />
      <line x1="400" y1="240" x2="480" y2="230" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="560" y1="240" x2="480" y2="230" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="330" x2="380" y2="360" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="480" y1="330" x2="580" y2="360" stroke="#C3E1FF" strokeWidth="0.5" />
      <line x1="380" y1="360" x2="580" y2="360" stroke="#C3E1FF" strokeWidth="0.5" strokeDasharray="4 4" />
      <circle cx="400" cy="180" r="4" fill="#C3E1FF" />
      <circle cx="560" cy="180" r="4" fill="#C3E1FF" />
      <circle cx="480" cy="280" r="3" fill="#C3E1FF" />
      <circle cx="380" cy="360" r="3" fill="#C3E1FF" />
      <circle cx="580" cy="360" r="3" fill="#C3E1FF" />
    </svg>
  )
}
