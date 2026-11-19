import type { Metadata } from 'next'
import GitHubEditingNotice from '@/components/GitHubEditingNotice'

export const metadata: Metadata = {
  title: 'Edit through GitHub',
  robots: { index: false, follow: false },
}

export default function RetiredEditorPage() {
  return <GitHubEditingNotice sources={['content/blog']} publicPath="/blog/" />
}
