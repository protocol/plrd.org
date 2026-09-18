type AreaWebsiteLink = {
  label: string
  href: string
}

const AREA_WEBSITE_LINKS: Record<string, AreaWebsiteLink> = {
  neurotech: { label: 'Website', href: 'https://www.plneuro.xyz/' },
}

export function getAreaWebsiteLink(areaSlug: string) {
  return AREA_WEBSITE_LINKS[areaSlug]
}

type AreaHeroActionsProps = {
  areaSlug: string
  showOpportunitySpaces: boolean
  opportunityHref: string
  className?: string
}

export default function AreaHeroActions({
  areaSlug,
  showOpportunitySpaces,
  opportunityHref,
  className = 'relative z-10 flex flex-wrap gap-4 mb-10',
}: AreaHeroActionsProps) {
  const areaWebsite = getAreaWebsiteLink(areaSlug)

  if (!showOpportunitySpaces && !areaWebsite) return null

  return (
    <div className={className}>
      {showOpportunitySpaces && (
        <a
          href={opportunityHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-full hover:bg-blue/90 transition-colors font-medium"
        >
          Opportunity Spaces
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-6-6m6 6l6-6" />
          </svg>
        </a>
      )}
      {areaWebsite && (
        <a
          href={areaWebsite.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-blue text-blue rounded-full hover:bg-blue/5 transition-colors font-medium"
        >
          {areaWebsite.label}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H18m0 0v4.5M18 6l-7 7m-4.5 5H15a3 3 0 0 0 3-3v-1.5M6 18V9a3 3 0 0 1 3-3h1.5" />
          </svg>
        </a>
      )}
      {areaSlug === 'neurotech' && (
        <a
          href="/neuro-atlas/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-blue rounded-full hover:bg-blue/5 transition-colors font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
        >
          Neuro Atlas <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  )
}
