import type { Metadata } from 'next'
import GitHubEditingNotice from '@/components/GitHubEditingNotice'

export const metadata: Metadata = {
  title: 'Edit through GitHub',
  robots: { index: false, follow: false },
}

const areaSources: Record<string, string> = {
  'ai-robotics': 'content/areas/ai-robotics/_index.md',
  'digital-human-rights': 'content/areas/digital-human-rights/_index.md',
  'neurotech': 'content/areas/neurotech/_index.md',
}

export default async function RetiredAreaEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const path = areaSources[slug]
  return <GitHubEditingNotice
    sources={path ? [path, 'src/app/areas/[slug]/page.tsx'] : ['content/areas']}
    publicPath={path ? `/areas/${slug}/` : '/areas/'}
  />
}
