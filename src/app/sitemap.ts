import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'
import {
  publications,
  authors,
  talks,
  tutorials,
  blogPosts,
  areas,
} from '@/lib/content'

const BASE = siteConfig.baseUrl

/** Build an absolute, trailing-slash URL (site uses trailingSlash: true). */
function url(path: string): string {
  const clean = `/${path}/`.replace(/\/+/g, '/')
  return `${BASE}${clean}`
}

/** Parse a content date into a Date, or undefined when missing/invalid. */
function lastMod(date?: string): Date | undefined {
  if (!date) return undefined
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url(''), changeFrequency: 'weekly', priority: 1 },
    { url: url('about'), changeFrequency: 'monthly', priority: 0.7 },
    { url: url('areas'), changeFrequency: 'monthly', priority: 0.8 },
    { url: url('insights'), changeFrequency: 'weekly', priority: 0.8 },
    { url: url('authors'), changeFrequency: 'weekly', priority: 0.7 },
    { url: url('publications'), changeFrequency: 'weekly', priority: 0.8 },
    { url: url('talks'), changeFrequency: 'weekly', priority: 0.7 },
    { url: url('tutorials'), changeFrequency: 'monthly', priority: 0.6 },
    { url: url('blog'), changeFrequency: 'weekly', priority: 0.7 },
  ]

  const areaRoutes: MetadataRoute.Sitemap = areas.map((a) => ({
    url: url(`areas/${a.slug}`),
    lastModified: lastMod(a.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const publicationRoutes: MetadataRoute.Sitemap = publications.map((p) => ({
    url: url(`publications/${p.slug}`),
    lastModified: lastMod(p.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  const talkRoutes: MetadataRoute.Sitemap = talks.map((t) => ({
    url: url(`talks/${t.slug}`),
    lastModified: lastMod(t.date),
    changeFrequency: 'yearly',
    priority: 0.5,
  }))

  const authorRoutes: MetadataRoute.Sitemap = authors.map((a) => ({
    url: url(`authors/${a.slug}`),
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  const tutorialRoutes: MetadataRoute.Sitemap = tutorials.map((t) => ({
    url: url(`tutorials/${t.slug}`),
    lastModified: lastMod(t.date),
    changeFrequency: 'yearly',
    priority: 0.5,
  }))

  // Only native blog posts get a detail page worth indexing; external stubs
  // link straight out to their canonical home (e.g. protocol.ai).
  const blogRoutes: MetadataRoute.Sitemap = blogPosts
    .filter((b) => b.slug && !b.external_url && !b.unlisted)
    .map((b) => ({
      url: url(`blog/${b.slug}`),
      lastModified: lastMod(b.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  return [
    ...staticRoutes,
    ...areaRoutes,
    ...publicationRoutes,
    ...talkRoutes,
    ...authorRoutes,
    ...tutorialRoutes,
    ...blogRoutes,
  ]
}
