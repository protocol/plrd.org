export const siteConfig = {
  title: 'PL R&D',
  description: 'Driving Breakthroughs in Computing to Push Humanity Forward.',
  baseUrl: 'https://www.plrd.org',
  author: 'PL R&D',
  locale: 'en_US',
  twitterUser: '@protocollabs_rd',
  avatar: '/images/pl_research_card.png',
  logo: '/images/pl_research_logo.svg',
  githubUrl: 'https://github.com/protocol/plrd.org',
  copyright: '© Protocol Labs, Inc. Except as noted, content licensed CC-BY 3.0.',
}

export type NavItem = {
  name: string
  url: string
  children?: NavItem[]
}

export const mainNav: NavItem[] = [
  {
    name: 'About us',
    url: '#',
    children: [
      { name: 'About us', url: '/about/' },
      { name: 'Protocol Labs', url: 'https://protocol.ai' },
    ],
  },
  {
    name: 'Focus Areas',
    url: '/areas/',
    children: [
      { name: 'Digital Human Rights', url: '/areas/digital-human-rights/' },
      { name: 'Economies & Governance', url: '/areas/economies-governance/' },
      { name: 'AI & Robotics', url: '/areas/ai-robotics/' },
      { name: 'Neurotech', url: '/areas/neurotech/' },
    ],
  },
  { name: 'Insights', url: '/insights/' },
  { name: 'Team', url: '/authors/' },
]

export const footerNav: NavItem[] = [
  { name: 'About', url: '/about/' },
  { name: 'Team', url: '/authors/' },
  { name: 'Insights', url: '/insights/' },
]
