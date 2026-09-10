import type { Metadata } from 'next';
import EffortBacking from '@/components/lab/EffortBacking';
import '@/components/lab/EffortBacking.css';

export const metadata: Metadata = {
  title: 'Support useful work · Open Lab',
  description: 'An optional, local points allocation experiment. Explore editorial work proposals, add local evidence and export your portfolio. No money or global vote.',
  alternates: { canonical: '/lab/efforts/' },
};

export default function Page() {
  return <EffortBacking />;
}
