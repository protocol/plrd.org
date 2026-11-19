import type { Metadata } from 'next'
import GitHubEditingNotice from '@/components/GitHubEditingNotice'

export const metadata: Metadata = {
  title: 'Edit through GitHub',
  robots: { index: false, follow: false },
}

// An explicit path is required: the neighboring [slug] opportunity route
// otherwise shadows /areas/[slug]/edit and treats "edit" as an opportunity.
export default function RetiredAreaEditorPage() {
  return <GitHubEditingNotice
    sources={['content/areas/digital-human-rights/_index.md', 'src/lib/focus-area-descriptions.ts', 'src/app/areas/[slug]/page.tsx']}
    publicPath="/areas/digital-human-rights/"
  />
}
