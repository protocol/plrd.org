import type { Metadata } from 'next'
import GitHubEditingNotice from '@/components/GitHubEditingNotice'

export const metadata: Metadata = {
  title: 'Edit through GitHub',
  robots: { index: false, follow: false },
}

// This legacy link was advertised by the old CMS, even though no editor page
// existed at this exact path. Keep it useful without restoring an editor.
export default function RetiredAreasEditorPage() {
  return <GitHubEditingNotice sources={['src/data/site-content/pages.json', 'content/areas']} publicPath="/areas/" />
}
