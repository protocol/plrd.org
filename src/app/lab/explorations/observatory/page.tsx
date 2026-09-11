import type { Metadata } from 'next'
import Observatory from '@/components/lab/explorations/Observatory'

export const metadata: Metadata = {
  title: 'Explore the tech tree — Open Lab',
  description: 'Explore science through the OpenAlex research-literature hierarchy: searchable domains, fields, subfields, and topics, with source attribution and PL R&D context.',
  robots: { index: false, follow: false },
}

export default function ObservatoryPage() { return <Observatory /> }
