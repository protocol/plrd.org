import type { Metadata } from 'next'
import EditPageButton from '@/components/EditPageButton'
import { fetchPage, getSection } from '@/lib/indexer'
import AuthorsTabs from './AuthorsTabs'
import TeamOpenings from '@/components/TeamOpenings'

export const metadata: Metadata = { title: 'Team' }

const FALLBACK_HERO_TITLE = 'Our team'
const FALLBACK_HERO_SUBTITLE =
  "We've come together from academia, startups, and the public sector, united by a belief that the hardest problems in computing and human flourishing deserve serious, long-horizon research."
const FALLBACK_LEADERSHIP_BLURB = 'R&D Lead · Operations · Focus Area Leads'
const FALLBACK_ADVISORS_BLURB =
  'Leading scientists, engineers, and entrepreneurs advising Protocol Labs on neurotechnology, NeuroAI, and brain-computer interfaces.'

export default async function AuthorsPage() {
  const page = await fetchPage('authors')
  const hero = getSection(page, 'hero')
  const leadership = getSection(page, 'leadership-blurb')
  const advisors = getSection(page, 'advisors-blurb')

  const heroTitle = hero?.title || FALLBACK_HERO_TITLE
  const heroSubtitle = hero?.subtitle || FALLBACK_HERO_SUBTITLE
  const leadershipBlurb = leadership?.body || FALLBACK_LEADERSHIP_BLURB
  const advisorsBlurb = advisors?.body || FALLBACK_ADVISORS_BLURB

  return (
    <>
      <AuthorsTabs
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        leadershipBlurb={leadershipBlurb}
        advisorsBlurb={advisorsBlurb}
      />
      <TeamOpenings />
      <EditPageButton rkey="authors" />
    </>
  )
}
