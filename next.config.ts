import type { NextConfig } from 'next'
import previewConfig from './src/data/interventions-preview.json'

const nextConfig: NextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    // Defense in depth; Atlas must emit noindex itself for external responses.
    // The old interventions preview prefix stays noindex. Methodology is the
    // public page; the catalogue overview under this prefix is unlisted.
    return [{
      source: `${previewConfig.basePath}/:path*`,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    }, {
      source: '/neuro-atlas/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }]
  },
  async rewrites() {
    const value = process.env.NEURO_ATLAS_ORIGIN ?? 'https://neuro-atlas-app.vercel.app'
    let url: URL
    try {
      url = new URL(value)
    } catch {
      throw new Error('NEURO_ATLAS_ORIGIN must be an HTTPS origin without credentials, path, query or fragment')
    }
    // Compare the original input, not just URL.pathname: URL parsing normalizes
    // dot segments, whitespace and backslashes that must not be accepted here.
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    const localQA = process.env.NEURO_ATLAS_LOCAL_QA === '1'
      && !['VERCEL', 'VERCEL_ENV', 'VERCEL_URL'].some((key) => process.env[key] !== undefined)
    const allowedProtocol = url.protocol === 'https:' || (url.protocol === 'http:' && loopback && localQA)
    if ((value !== url.origin && value !== `${url.origin}/`) || !allowedProtocol || (loopback && !localQA)) {
      throw new Error('NEURO_ATLAS_ORIGIN must be an HTTPS origin without credentials, path, query or fragment; loopback requires NEURO_ATLAS_LOCAL_QA=1 outside Vercel')
    }
    const origin = url.origin
    return [
      { source: '/neuro-atlas', destination: `${origin}/neuro-atlas` },
      { source: '/neuro-atlas/:path*', destination: `${origin}/neuro-atlas/:path*` },
    ]
  },
  async redirects() {
    const methodology = '/methodology/'
    return [
      // The methodology page is public. The old nested methodology URL still
      // redirects there. The catalogue overview and program pages are served
      // again, unlisted and noindex, so they no longer bounce to methodology.
      {
        source: `${previewConfig.basePath}/methodology`,
        destination: methodology,
        permanent: true,
      },
      {
        source: `${previewConfig.basePath}/methodology/`,
        destination: methodology,
        permanent: true,
      },
      // Preserve shared preview links when the approved Neuro article goes live.
      {
        source: '/blog/preview-neurotech-4972678300d0a37a2a1e0b9d1b40e852/',
        destination: '/blog/neurotech-frontier-human-flourishing/',
        permanent: true,
      },
      {
        source: '/blog/preview-neurotech-ea88a298/',
        destination: '/blog/neurotech-frontier-human-flourishing/',
        permanent: true,
      },
      {
        source: '/areas/upgrade-economies-governance/:path*',
        destination: '/areas/economies-governance/:path*',
        permanent: true,
      },
      {
        source: '/areas/upgrade-economies-governance/',
        destination: '/areas/economies-governance/',
        permanent: true,
      },
      // Bare opportunity-space list paths -> the area page's on-page anchor.
      // These must come before the wildcard redirects below so the empty
      // path segment resolves to the anchor rather than the area root.
      {
        source: '/areas/economies-governance/opportunity-spaces/',
        destination: '/areas/economies-governance/#opportunity-spaces',
        permanent: true,
      },
      {
        source: '/areas/ai-robotics/opportunity-spaces/',
        destination: '/areas/ai-robotics/#opportunity-spaces',
        permanent: true,
      },
      {
        source: '/areas/digital-human-rights/opportunity-spaces/',
        destination: '/areas/digital-human-rights/#opportunity-spaces',
        permanent: true,
      },
      {
        source: '/areas/neurotech/opportunity-spaces/',
        destination: '/areas/neurotech/#opportunity-spaces',
        permanent: true,
      },
      // The Sovereign AI sheets have no index of their own: the program's shelf
      // on the FA2 page is it, and /sovereign-ai/ is its short link. The sheets
      // lived under /briefs/ until 22 October 2026 and under /programs/ for a
      // day after, and PDFs went out with /briefs/ links, so every old address
      // lands on its sheet. Trailing slashes are not added for us, so both
      // spellings are listed.
      ...[
        '/sovereign-ai',
        '/sovereign-ai/',
        ...['sovereign-ai', 'programs', 'briefs'].flatMap((dir) => [
          `/areas/economies-governance/${dir}`,
          `/areas/economies-governance/${dir}/`,
        ]),
      ].map((source) => ({ source, destination: '/areas/economies-governance/#sovereign-ai', permanent: false })),
      ...['programs', 'briefs'].flatMap((dir) => [
        { source: `/areas/economies-governance/${dir}/:slug`, destination: '/areas/economies-governance/sovereign-ai/:slug/', permanent: true },
        { source: `/areas/economies-governance/${dir}/:slug/`, destination: '/areas/economies-governance/sovereign-ai/:slug/', permanent: true },
        { source: `/${dir}/:file`, destination: '/sovereign-ai/:file', permanent: true },
        { source: `/images/fa2/${dir}/:file`, destination: '/images/fa2/sovereign-ai/:file', permanent: true },
      ]),
      // Old individual opportunity-space URLs -> new shortened paths.
      // Covers both the detail page and its /edit subpath for every area.
      {
        source: '/areas/:area/opportunity-spaces/:slug*',
        destination: '/areas/:area/:slug*',
        permanent: true,
      },
      {
        source: '/research/:path*',
        destination: '/insights/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
