export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function externalSourceLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    // Preserve historical publisher labels while identifying PL Neuro cross-posts.
    return hostname === 'plneuro.xyz' ? hostname : 'protocol.ai'
  } catch {
    return ''
  }
}

export function stripFaPrefix(title: string): string {
  return title.replace(/^FA\d+:\s*/, '')
}

export function slugToName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
