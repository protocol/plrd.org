/** Visibility metadata retained by every shared content mapper. */
export function contentVisibility(data) {
  const flags = ['unlisted', 'draft', 'preview', 'noindex', 'unaffiliated', 'private', 'hidden']
  const deniedFlag = flags.some(key => data[key] != null && data[key] !== false)
  const robots = Array.isArray(data.robots) ? data.robots.join(', ') : data.robots
  const noindex = typeof robots === 'string' ? /\b(noindex|none)\b/i.test(robots)
    : robots && (robots.index === false || robots.googleBot?.index === false)
  const statusDenied = ['status', 'visibility'].some(key => data[key] != null && !['public', 'published', 'listed'].includes(data[key]))
  const dates = [data.date, data.publishDate, data.publish_date, data.publishedAt, data.publishAt].filter(value => value != null && value !== '')
  const parsed = dates.map(value => new Date(value).getTime())
  return {
    version: 1,
    denied: Boolean(deniedFlag || noindex || statusDenied || data.published === false || data.listed === false || data.public === false || parsed.some(value => !Number.isFinite(value))),
    notBefore: parsed.length && parsed.every(Number.isFinite) ? new Date(Math.max(...parsed)).toISOString() : null,
  }
}
