import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { readableMarkdown } from './readable-markdown.mjs'
import { contentVisibility } from './content-visibility.mjs'

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content')
const OUT_DIR = path.join(ROOT, 'src', 'data', 'generated')
const PUBLIC_DIR = path.join(ROOT, 'public')

const processor = remark().use(remarkHtml, { sanitize: false })

function renderMd(md) {
  if (!md || !md.trim()) return ''
  return processor.processSync(md).toString()
}

function publicBody(item, collection) {
  const visibility = contentVisibility(item)
  if (visibility.denied || (visibility.notBefore && Date.parse(visibility.notBefore) > Date.now()) || item.external_url) return ''
  return readableMarkdown(renderMd(item.content), `https://www.plrd.org/${collection}/${item.slug}/`)
}

function readDir(dir) {
  const fullPath = path.join(CONTENT_DIR, dir)
  if (!fs.existsSync(fullPath)) return []
  const entries = fs.readdirSync(fullPath, { withFileTypes: true })
  const items = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const candidates = [
        path.join(fullPath, entry.name, 'index.md'),
        path.join(fullPath, entry.name, '_index.md'),
      ]
      const filePath = candidates.find((f) => fs.existsSync(f))
      if (filePath) {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(raw)
        items.push({ ...data, slug: entry.name, content: content.trim() })
      }
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_index')) {
      const raw = fs.readFileSync(path.join(fullPath, entry.name), 'utf-8')
      const { data, content } = matter(raw)
      const slug = entry.name.replace(/\.md$/, '')
      items.push({ ...data, slug, content: content.trim() })
    }
  }
  return items
}

function readSectionIndex(dir) {
  const indexPath = path.join(CONTENT_DIR, dir, '_index.md')
  if (!fs.existsSync(indexPath)) return null
  const raw = fs.readFileSync(indexPath, 'utf-8')
  const { data, content } = matter(raw)
  return { ...data, content: content.trim() }
}

// Publications
function buildPublications() {
  const items = readDir('publications')
    .filter((p) => !p.unaffiliated)
    .map((p) => ({
      slug: p.slug,
      visibility: contentVisibility(p),
      title: p.title || '',
      date: p.date || '',
      authors: p.authors || [],
      venue: p.venue || '',
      doi: p.doi || '',
      publication_types: p.publication_types || [],
      areas: p.areas || [],
      abstract: p.abstract || '',
      url_pdf: p.url_pdf || '',
      url_source: p.url_source || '',
      html: renderMd(p.content),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return items
}

// Authors
function buildAuthors() {
  const items = readDir('authors').map((a) => {
    const avatarDir = path.join(PUBLIC_DIR, 'images', 'authors', a.slug)
    let avatarPath = null
    if (fs.existsSync(avatarDir)) {
      const files = fs.readdirSync(avatarDir)
      const avatar = files.find((f) => f.startsWith('avatar'))
      if (avatar) avatarPath = `/images/authors/${a.slug}/${avatar}`
    }
    return {
      slug: a.slug,
      visibility: contentVisibility(a),
      name: a.name || '',
      role: a.role || '',
      groups: a.groups || [],
      user_groups: a.user_groups || [],
      interests: a.interests || [],
      quote: a.quote || '',
      social: a.social || [],
      education: a.education || null,
      avatarPath,
      html: renderMd(a.content),
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
  return items
}

// Talks
function buildTalks() {
  const items = readDir('talks').map((t) => ({
    slug: t.slug,
    visibility: contentVisibility(t),
    title: t.title || '',
    date: t.date || '',
    venue: t.venue || '',
    venue_url: t.venue_url || '',
    venue_location: t.venue_location || '',
    authors: t.authors || [],
    areas: t.areas || [],
    abstract: t.abstract || '',
    html: renderMd(t.content),
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return items
}

// Tutorials (top-level only)
function buildTutorials() {
  const items = readDir('tutorials').map((t) => ({
    slug: t.slug,
    visibility: contentVisibility(t),
    title: t.title || '',
    date: t.date || '',
    summary: t.summary || '',
    markdown: publicBody(t, 'tutorials'),
    html: renderMd(t.content),
  }))
  return items
}

// Outreach
function buildOutreach() {
  const items = readDir('outreach').map((o) => ({
    slug: o.slug,
    title: o.title || '',
    weight: o.weight || 0,
    linkText: o.linkText || '',
    linkUrl: o.linkUrl || '',
    html: renderMd(o.content),
  })).sort((a, b) => (a.weight || 0) - (b.weight || 0))
  return items
}

// Blog posts
// Pull the first plausible image URL out of an HTML or markdown blob.
// Priority: og:image → twitter:image → first <img src="..."> (or data-src)
// → first markdown ![](url). Returns '' if nothing found. The optional
// baseUrl resolves relative paths (e.g. /images/foo.png on protocol.ai).
function extractFirstImage(html, baseUrl) {
  if (!html) return ''

  const resolve = (src) => {
    if (!src) return ''
    if (!baseUrl) return src
    try {
      return new URL(src, baseUrl).toString()
    } catch {
      return src
    }
  }

  // og:image (both attribute orders)
  const og =
    html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  if (og) return resolve(og[1])

  // twitter:image
  const tw =
    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
  if (tw) return resolve(tw[1])

  // <img src="..."> / <img data-src="..."> — skip empty + obvious placeholders
  const imgs = [...html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi)]
  for (const m of imgs) {
    const src = m[1]
    if (!src) continue
    // Protocol.ai lazy-loaded <img> placeholders we should ignore.
    if (/\/default\.png(?:$|\?)/i.test(src)) continue
    return resolve(src)
  }

  // markdown ![alt](url) — only consider URLs that look like images
  const md = html.match(/!\[[^\]]*\]\(([^)\s]+)/)
  if (md) return resolve(md[1])

  return ''
}

async function fetchCoverImage(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      console.warn(`  ⚠ Cover fetch ${res.status} for ${url}`)
      return ''
    }
    const html = await res.text()
    return extractFirstImage(html, url)
  } catch (err) {
    console.warn(`  ⚠ Cover fetch failed for ${url}: ${err.message}`)
    return ''
  }
}

// Load previous blog.json as a cheap cache so we don't re-hit the network
// for every external_url on every build. Vercel runs the build script
// fresh each deploy, but the committed blog.json still primes the cache.
function loadBlogCoverCache() {
  const prev = path.join(OUT_DIR, 'blog.json')
  if (!fs.existsSync(prev)) return {}
  try {
    const arr = JSON.parse(fs.readFileSync(prev, 'utf-8'))
    const map = {}
    for (const p of arr) {
      if (p && p.external_url && p.coverImage) {
        map[p.external_url] = p.coverImage
      }
    }
    return map
  } catch {
    return {}
  }
}

async function buildBlog() {
  const raw = readDir('blog')
  const cache = loadBlogCoverCache()
  // Set BLOG_REFRESH_COVERS=1 to force re-fetching every external page.
  const refresh = process.env.BLOG_REFRESH_COVERS === '1'

  const out = []
  for (const b of raw) {
    // 1. Author-supplied override wins (frontmatter `cover_image: ...`).
    // 2. First image embedded in the markdown body.
    // 3. og:image of the external_url (cached across builds).
    let coverImage = b.cover_image || extractFirstImage(b.content)
    if (!coverImage && b.external_url) {
      if (!refresh && cache[b.external_url]) {
        coverImage = cache[b.external_url]
      } else {
        coverImage = await fetchCoverImage(b.external_url)
      }
    }

    out.push({
      slug: b.slug,
      visibility: contentVisibility(b),
      title: b.title || '',
      date: b.date || '',
      summary: b.summary || '',
      description: b.description || '',
      authors: b.authors || [],
      areas: b.areas || [],
      external_url: b.external_url || '',
      coverImage,
      html: renderMd(b.content),
      markdown: publicBody(b, 'blog'),
      unlisted: b.unlisted === true,
    })
  }

  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Dependency Graph
function buildDependencyGraph() {
  const dir = path.join(CONTENT_DIR, 'areas', 'economies-governance', 'dependency-graph')
  if (!fs.existsSync(dir)) return {}

  const result = {}
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'))

  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
    const { data } = matter(raw)

    const tooltips = {}

    // IP-level tooltip
    if (data.tooltip) {
      tooltips[data.id] = data.tooltip
    }

    // Helper: strip tooltip from a node and collect it
    function stripTooltip(node) {
      if (!node) return node
      const { tooltip, ...rest } = node
      if (tooltip) tooltips[node.id] = tooltip
      return rest
    }

    const config = {
      id: data.id,
      label: data.label || '',
      sub: data.sub || '',
      color: data.color || '',
      num: data.num || '',
      bottlenecks: (data.bottlenecks || []).map(stripTooltip),
      gates: (data.gates || []).map(stripTooltip),
      strands: (data.strands || []).map(stripTooltip),
      interventions: (data.interventions || []).map(stripTooltip),
      feedbackLoops: data.feedbackLoops || [],
    }

    result[slug] = { config, tooltips }
  }

  return result
}

// Areas
function buildAreas() {
  const items = readDir('areas').map((a) => ({
    slug: a.slug,
    visibility: contentVisibility(a),
    title: a.title || '',
    date: a.date || '',
    summary: a.summary || '',
    leads: a.leads || [],
    advisors: a.advisors || [],
    html: renderMd(a.content),
  }))
  return items
}

// Section indexes
function buildSections() {
  const sections = {}
  for (const dir of ['research', 'contact', 'outreach']) {
    const idx = readSectionIndex(dir)
    if (idx) {
      sections[dir] = { title: idx.title || '', html: renderMd(idx.content) }
    }
  }
  return sections
}

// Feed XML
function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildFeed(publications, talks, blog) {
  const baseUrl = 'https://www.plrd.org'
  const items = [
    ...publications.slice(0, 20).map((p) => ({
      title: p.title,
      link: `${baseUrl}/publications/${p.slug}/`,
      date: p.date,
      description: (p.abstract || '').slice(0, 300),
    })),
    ...talks.slice(0, 10).map((t) => ({
      title: t.title,
      link: `${baseUrl}/talks/${t.slug}/`,
      date: t.date,
      description: (t.abstract || '').slice(0, 300),
    })),
    // Blog posts: external stubs (e.g. protocol.ai imports) link to their
    // original URL; native posts link to /blog/<slug>/ on plresearch.org.
    ...blog.filter((b) => !b.unlisted).slice(0, 20).map((b) => ({
      title: b.title,
      link: b.external_url || `${baseUrl}/blog/${b.slug}/`,
      date: b.date,
      description: (b.summary || '').slice(0, 300),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50)

  const rssItems = items.map((item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <pubDate>${item.date ? new Date(item.date).toUTCString() : ''}</pubDate>
      <description><![CDATA[${item.description}]]></description>
    </item>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml('Protocol Labs R&D')}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml('Driving Breakthroughs in Computing to Push Humanity Forward.')}</description>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`
}

// Search index
function buildSearchIndex(publications, talks, authors, blog, tutorials, areas) {
  const items = [
    // Publications
    ...publications.map((p) => ({
      title: p.title,
      summary: (p.abstract || '').slice(0, 500),
      date: p.date,
      type: 'publication',
      relpermalink: `/publications/${p.slug}/`,
    })),
    // Talks
    ...talks.map((t) => ({
      title: t.title,
      summary: (t.abstract || '').slice(0, 500),
      date: t.date,
      type: 'talk',
      relpermalink: `/talks/${t.slug}/`,
    })),
    // Authors
    ...authors.map((a) => ({
      title: a.name,
      summary: [a.role, ...(a.interests || [])].filter(Boolean).join(' · '),
      date: '',
      type: 'author',
      relpermalink: `/authors/${a.slug}/`,
    })),
    // Blog posts (unlisted/preview posts stay out of search)
    ...blog.filter((b) => !b.unlisted).map((b) => ({
      title: b.title,
      summary: (b.summary || '').slice(0, 500),
      date: b.date,
      type: 'blog',
      relpermalink: `/blog/${b.slug}/`,
    })),
    // Tutorials
    ...tutorials.map((t) => ({
      title: t.title,
      summary: (t.summary || '').slice(0, 500),
      date: t.date,
      type: 'tutorial',
      relpermalink: `/tutorials/${t.slug}/`,
    })),
    // Focus areas (from markdown)
    ...areas.map((a) => ({
      title: a.title,
      summary: (a.summary || '').slice(0, 500),
      date: '',
      type: 'area',
      relpermalink: `/areas/${a.slug}/`,
    })),
    // Static site pages
    { title: 'About', summary: 'About Protocol Labs Research & Development', date: '', type: 'page', relpermalink: '/about/' },
    { title: 'Team', summary: 'Meet the Protocol Labs R&D team', date: '', type: 'page', relpermalink: '/authors/' },
    { title: 'Publications', summary: 'Research papers and academic publications', date: '', type: 'page', relpermalink: '/publications/' },
    { title: 'Talks', summary: 'Conference talks and presentations', date: '', type: 'page', relpermalink: '/talks/' },
    { title: 'Tutorials', summary: 'Learning resources and technical tutorials', date: '', type: 'page', relpermalink: '/tutorials/' },
    { title: 'Blog', summary: 'Latest news and updates from PL R&D', date: '', type: 'page', relpermalink: '/blog/' },
    { title: 'Collaborate', summary: 'Work with Protocol Labs R&D on research', date: '', type: 'page', relpermalink: '/outreach/collaboration/' },
    { title: 'Focus Areas', summary: 'Research focus areas driving breakthroughs in computing', date: '', type: 'page', relpermalink: '/areas/' },
    // FA2 sub-pages
    { title: 'Economies & Governance', summary: 'Building crypto-native economic and governance infrastructure', date: '', type: 'area', relpermalink: '/areas/economies-governance/' },
    { title: 'Opportunity Spaces', summary: 'Convergence zones for systemic change in economies and governance', date: '', type: 'page', relpermalink: '/areas/economies-governance/#opportunity-spaces' },
    { title: 'FA2 Subareas', summary: 'Nine interconnected subfields for economies and governance', date: '', type: 'page', relpermalink: '/areas/economies-governance/subareas/' },
    { title: 'Impact Dashboard', summary: 'Ecosystem impact metrics across villages and funding', date: '', type: 'page', relpermalink: '/areas/economies-governance/impact/' },
    { title: 'Project Explorer', summary: '242+ teams building decentralized coordination and public goods', date: '', type: 'page', relpermalink: '/areas/economies-governance/projects/' },
    { title: 'Dependency Graph', summary: 'Strategic dependency trees across 4 inflection points', date: '', type: 'page', relpermalink: '/areas/economies-governance/dependency-graph/' },
  ]
  return items
}

// Main
console.log('Building content...')

const publications = buildPublications()
const authors = buildAuthors()
const talks = buildTalks()
const tutorials = buildTutorials()
const outreach = buildOutreach()
const blog = await buildBlog()
const areas = buildAreas()
const sections = buildSections()
const depGraph = buildDependencyGraph()

fs.mkdirSync(OUT_DIR, { recursive: true })

fs.writeFileSync(path.join(OUT_DIR, 'publications.json'), JSON.stringify(publications, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'authors.json'), JSON.stringify(authors, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'talks.json'), JSON.stringify(talks, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'tutorials.json'), JSON.stringify(tutorials, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'outreach.json'), JSON.stringify(outreach, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'blog.json'), JSON.stringify(blog, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'areas.json'), JSON.stringify(areas, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'sections.json'), JSON.stringify(sections, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'dependency-graph.json'), JSON.stringify(depGraph, null, 2))

// Static files
fs.writeFileSync(path.join(PUBLIC_DIR, 'feed.xml'), buildFeed(publications, talks, blog))
fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(buildSearchIndex(publications, talks, authors, blog, tutorials, areas), null, 2))

console.log(`  ${publications.length} publications`)
console.log(`  ${authors.length} authors`)
console.log(`  ${talks.length} talks`)
console.log(`  ${tutorials.length} tutorials`)
console.log(`  ${outreach.length} outreach`)
console.log(`  ${blog.length} blog posts`)
console.log(`  ${areas.length} areas`)
console.log(`  ${Object.keys(depGraph).length} dependency graphs`)
console.log('Done.')
