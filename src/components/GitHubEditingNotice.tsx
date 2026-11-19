import Link from 'next/link'
import { GITHUB_EDITING_GUIDE } from '@/lib/cms-retired'

export default function GitHubEditingNotice({ sources, publicPath = '/' }: {
  sources: string[]
  publicPath?: string
}) {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-20">
      <h1 className="text-2xl font-semibold mb-4">Website editing has moved to GitHub</h1>
      <p className="text-base text-gray-700 mb-6">
        This website is read-only. Website login, the CMS, and browser publishing are retired.
        Propose content changes in a pull request to protocol/plrd.org. Approved changes
        go live after review, merge, and deployment—not by saving on this page.
      </p>
      <ul className="space-y-3 mb-6">
        {sources.map(path => (
          <li key={path}><a
            href={`https://github.com/protocol/plrd.org/${/\.[a-z]+$/.test(path) ? 'blob' : 'tree'}/main/${path}`}
            className="text-blue underline"
          >{path}</a></li>
        ))}
      </ul>
      <p className="mb-6"><a href={GITHUB_EDITING_GUIDE} className="text-blue underline">Read the contribution guide</a></p>
      <Link href={publicPath} className="text-blue underline">Back to the public website</Link>
    </div>
  )
}
