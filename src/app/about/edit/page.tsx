import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ABOUT_CONTENT_URL } from '@/lib/about'

export const metadata: Metadata = {
  title: 'Edit About',
  robots: { index: false, follow: false },
}

export default function AboutEditPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb items={[{ label: 'About', href: '/about/' }, { label: 'Edit' }]} />
      <h1 className="text-xl font-semibold mt-8 mb-4">About is edited through pull requests</h1>
      <p className="text-base text-gray-700 max-w-2xl mb-6">
        This page now uses content stored in the website repository, not the ATProto CMS.
        Propose a pull request to update the copy; approved changes go live after merge and deployment.
      </p>
      <a href={ABOUT_CONTENT_URL} className="text-blue underline">Open About content on GitHub</a>
      <p className="mt-6"><Link href="/about/" className="text-blue underline">Back to About</Link></p>
    </div>
  )
}
