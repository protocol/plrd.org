import type { Metadata } from 'next'
import { Newsreader } from 'next/font/google'
import { siteConfig } from '@/lib/site-config'
import { AuthProvider } from '@/lib/atproto'
import SiteShell from '@/components/SiteShell'
import GoatCounter from '@/components/GoatCounter'
import CookieConsent from '@/components/CookieConsent'
import { GoogleAnalytics } from '@next/third-parties/google'
import { COOKIE_CONSENT_ENABLED } from '@/lib/cookie-consent'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.baseUrl),
  alternates: {
    // No site-wide canonical: a root-level canonical to '/' is inherited by
    // every page that doesn't set its own, which points all subpages at the
    // homepage and deindexes them. Each page declares its own canonical; the
    // homepage sets canonical: '/' in src/app/page.tsx.
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  verification: {
    google: 'XG_TWMgF2o6dAIwddnRHH3bXN6ewPoC6Savtyb_cltU',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    locale: siteConfig.locale,
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [{ url: siteConfig.avatar, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitterUser,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.avatar],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Protocol Labs R&D',
    alternateName: siteConfig.title,
    url: siteConfig.baseUrl,
    logo: `${siteConfig.baseUrl}${siteConfig.logo}`,
    description: siteConfig.description,
    sameAs: [
      'https://protocol.ai',
      'https://bsky.app/profile/plrd.org',
      siteConfig.githubUrl,
    ],
  }

  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.title,
    url: siteConfig.baseUrl,
    description: siteConfig.description,
  }

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Apply theme before paint to avoid a flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${newsreader.variable} font-body min-w-[320px] text-base text-black leading-normal antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
        <GoatCounter />
        {process.env.NEXT_PUBLIC_GA_ID &&
          (COOKIE_CONSENT_ENABLED ? (
            <CookieConsent gaId={process.env.NEXT_PUBLIC_GA_ID} />
          ) : (
            // Banner disabled: load analytics directly.
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          ))}
      </body>
    </html>
  )
}
