export function buildInterventionSearchItems(src, publishedSources) {
  const items = []
  const re = /slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?summary:\s*"([^"]+)"[\s\S]*?published:\s*(true|false)/g
  let match
  while ((match = re.exec(src))) {
    if (match[4] !== 'true') continue
    items.push({
      title: match[2],
      summary: match[3],
      date: '',
      type: 'page',
      relpermalink: `/interventions/${match[1]}/`,
    })
  }
  items.push(...publishedSources.filter((item) => item.published).map((item) => ({
    title: item.title,
    summary: item.summary,
    date: '',
    type: 'page',
    relpermalink: `/interventions/${item.slug}/`,
  })))
  return items
}

