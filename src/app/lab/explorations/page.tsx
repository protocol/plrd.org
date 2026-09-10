import type { Metadata } from 'next'
import ExplorationComparison from '@/components/lab/explorations/ExplorationComparison'

export const metadata: Metadata = {
  title: 'Three ways into Open Lab',
  description: 'Compare Open Lab’s foundation, a working science-tools entrance, and an editorial frontier map.',
  robots: { index: false, follow: false },
}

export default function ExplorationsPage() { return <ExplorationComparison /> }
