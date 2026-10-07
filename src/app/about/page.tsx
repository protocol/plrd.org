import type { Metadata } from 'next'
import Link from 'next/link'
import AuthorCard from '@/components/AuthorCard'
import Breadcrumb from '@/components/Breadcrumb'
import MarkdownContent from '@/components/MarkdownContent'
import { AreaIcon, type AreaIconType } from '@/components/AreaIcons'
import { FOCUS_AREA_DESCRIPTIONS } from '@/lib/focus-area-descriptions'
import { aboutContent } from '@/lib/about'

const FOCUS_CARD_ICONS: Record<string, AreaIconType> = {
  'digital-human-rights': 'shield',
  'economies-governance': 'hexagon',
  'ai-robotics': 'neural',
  neurotech: 'brain',
}

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  const { hero, history, collaborations: collabs, future, quoteJuan, quoteWill } = aboutContent

  return (
    <div>
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Breadcrumb items={[{ label: 'About' }]} />
        <div className="relative pt-4 pb-16 lg:pt-8 lg:pb-20 overflow-hidden">
          {/* Background image - rotated hexagon clip */}
          <div 
            className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[480px] md:h-[480px] lg:w-[580px] lg:h-[580px] pointer-events-none select-none"
            aria-hidden="true"
          >
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <defs>
                <clipPath id="aboutHexClip">
                  <polygon 
                    points="200,40 330,110 330,290 200,360 70,290 70,110" 
                  >
                    <animateTransform 
                      attributeName="transform" 
                      type="rotate" 
                      from="45 200 200" 
                      to="405 200 200" 
                      dur="60s" 
                      repeatCount="indefinite"
                    />
                  </polygon>
                </clipPath>
                <mask id="aboutHexFade">
                  <radialGradient id="aboutFadeGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="50%" stopColor="white" />
                    <stop offset="100%" stopColor="black" />
                  </radialGradient>
                  <circle cx="200" cy="200" r="200" fill="url(#aboutFadeGrad)" />
                </mask>
              </defs>
              <image 
                href="/images/banners/about-banner.webp" 
                x="0" y="0" 
                width="400" height="400" 
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#aboutHexClip)"
                mask="url(#aboutHexFade)"
                opacity="0.55"
              />
            </svg>
          </div>

          <h1 className="relative z-10 font-normal text-[28px] md:text-[40px] lg:text-[48px] leading-[1.1] tracking-tight mb-6 max-w-xl">
            {hero.title}
          </h1>
          <MarkdownContent
            content={hero.body}
            className="relative z-10 text-gray-600 text-lg md:text-xl lg:text-[22px] leading-relaxed max-w-2xl mb-6"
          />
          <div className="relative z-10 flex flex-wrap gap-4">
            <Link 
              href="/areas/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-medium"
            >
              Focus areas
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link 
              href="/authors/"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full hover:border-blue hover:text-blue transition-colors font-medium"
            >
              Meet the team
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Focus Areas */}
      <div className="bg-gray-100 py-16 lg:py-20 mb-28">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-semibold text-xl lg:text-2xl mb-10">Our Four Focus Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FocusCard
              slug="digital-human-rights"
              title="Digital Human Rights"
              description={FOCUS_AREA_DESCRIPTIONS['digital-human-rights']}
            />
            <FocusCard
              slug="economies-governance"
              title="Economies & Governance"
              description={FOCUS_AREA_DESCRIPTIONS['economies-governance']}
            />
            <FocusCard
              slug="ai-robotics"
              title="AI & Robotics"
              description={FOCUS_AREA_DESCRIPTIONS['ai-robotics']}
            />
            <FocusCard
              slug="neurotech"
              title="Neurotechnology"
              description={FOCUS_AREA_DESCRIPTIONS.neurotech}
            />
          </div>
        </div>
      </div>

      {/* History */}
      <Section label="OUR HISTORY" title={history.title}>
        <MarkdownContent
          content={history.body}
          className="page-content lg:columns-2 lg:gap-14 text-base text-gray-700 leading-relaxed"
        />
      </Section>

      {/* Collaborations */}
      <Section label="COLLABORATIONS AND SUPPORT" title={collabs.title}>
        <MarkdownContent
          content={collabs.body}
          className="page-content text-base text-gray-700 leading-relaxed lg:columns-2 lg:gap-14"
        />
      </Section>

      {/* Quote */}
      <div className="bg-gray-100 py-8 lg:py-10 mb-16 lg:mb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              {/* Large quotation mark */}
              <svg 
                className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mb-4" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
              </svg>
              <MarkdownContent
                content={quoteJuan.body}
                className="text-lg lg:text-xl text-gray-800 leading-relaxed [&_p]:mb-0"
              />
            </div>
            <div className="md:pl-6 md:border-l md:border-gray-100">
              <AuthorCard slug="juan-benet" variant="quote" />
            </div>
          </div>
        </div>
      </div>

      {/* The Future */}
      <Section label="THE FUTURE" title={future.title}>
        <MarkdownContent
          content={future.body}
          className="page-content lg:columns-2 lg:gap-14 text-base text-gray-700 leading-relaxed"
        />
      </Section>

      {/* Will Scott quote */}
      <div className="bg-gray-100 py-8 lg:py-10 mb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              {/* Large quotation mark */}
              <svg 
                className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mb-4" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
              </svg>
              <MarkdownContent
                content={quoteWill.body}
                className="text-lg lg:text-xl text-gray-800 leading-relaxed [&_p]:mb-0"
              />
            </div>
            <div className="md:pl-6 md:border-l md:border-gray-100">
              <AuthorCard slug="will-scott" variant="quote" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 mb-28">
      <p className="text-blue text-sm tracking-wide mb-3">{label}</p>
      <h2 className="font-semibold text-xl lg:text-2xl leading-relaxed mb-8 max-w-3xl">{title}</h2>
      {children}
    </div>
  )
}

function FocusCard({ slug, title, description }: { slug: string; title: string; description: string }) {
  const iconType = FOCUS_CARD_ICONS[slug] || 'shield'

  return (
    <Link href={`/areas/${slug}/`} className="group block bg-white border border-gray-300 p-8 hover:border-blue hover:shadow-sm transition-all">
      <div className="flex items-start gap-5">
        <AreaIcon type={iconType} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg mb-3 group-hover:text-blue transition-colors">{title}</h3>
          <p className="text-base text-gray-700">{description}</p>
        </div>
      </div>
    </Link>
  )
}
