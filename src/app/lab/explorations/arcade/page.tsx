import type { Metadata } from 'next'
import ScienceArcade from '@/components/lab/explorations/ScienceArcade'

export const metadata: Metadata = {
  title: 'Science Arcade — Open Lab exploration',
  description: 'An alternative tools-first entrance to Open Lab. Try a deterministic cellular automaton and download a reproducible print.',
  robots: { index: false, follow: false },
}

export default function ArcadePage() { return <ScienceArcade /> }
