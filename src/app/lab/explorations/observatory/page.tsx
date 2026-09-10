import type { Metadata } from 'next'
import Observatory from '@/components/lab/explorations/Observatory'

export const metadata: Metadata = {
  title: 'Observatory — Open Lab exploration',
  description: 'Inspect source-linked editorial questions across the scientific computing frontier. A work-map alternative entrance to Open Lab.',
  robots: { index: false, follow: false },
}

export default function ObservatoryPage() { return <Observatory /> }
