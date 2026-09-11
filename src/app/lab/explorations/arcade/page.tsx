import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Science apps — Open Lab',
  description: 'Inspect source-linked app listings, then launch tools on their own sites.',
  robots: { index: false, follow: false },
}

// Keep old entry links working without mounting the retired embedded experiment.
export default function ArcadePage() { redirect('/lab/apps/') }
