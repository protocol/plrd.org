import type { NextConfig } from 'next'
import previewConfig from './src/data/interventions-preview.json'

const nextConfig: NextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    // Defense in depth; Atlas redirects set noindex in middleware because
    // Next's config redirects discard these headers in the production server.
    // The old interventions preview prefix stays noindex because every path
    // under it now redirects to the public methodology page.
    return [{
      source: `${previewConfig.basePath}/:path*`,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    }, {
      source: '/neuro-atlas/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }]
  },
  async redirects() {
    const methodology = '/methodology/'
    return [
      // The methodology page is public. Old cryptic and catalogue URLs redirect
      // there so shared links do not 404. The retired catalogue prefix stays
      // noindex above.
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
      {
        source: previewConfig.basePath,
        destination: methodology,
        permanent: false,
      },
      {
        source: `${previewConfig.basePath}/`,
        destination: methodology,
        permanent: false,
      },
      {
        source: `${previewConfig.basePath}/data`,
        destination: methodology,
        permanent: false,
      },
      {
        source: `${previewConfig.basePath}/data/`,
        destination: methodology,
        permanent: false,
      },
      // Named catalogue slugs only. A wildcard would also match methodology
      // and redirect the kept page onto itself.
      ...[
        'juan-benet-neuropodcast',
        'bci-roadmap',
        'pl-neuro-salon',
        'bci-founders-retreat',
        'connectomics-workshop',
        'ierr-2025',
        'dacc-2025',
        'sovereign-ai',
        'evaluation-commons',
        'broad-listening',
        'ai4pg',
        'ai4cop',
        'evidence-research',
        'compute-alliance',
        'eg-fellowship',
        'connectomics-benchmark',
        'macaque-projectome',
        'discovery-challenge',
        'mouse-connectome',
        'neuroai-commons',
        'virtual-neuro',
        'neuroai-fellows',
      ].flatMap((slug) => ([
        { source: `${previewConfig.basePath}/${slug}`, destination: methodology, permanent: false },
        { source: `${previewConfig.basePath}/${slug}/`, destination: methodology, permanent: false },
      ])),
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
