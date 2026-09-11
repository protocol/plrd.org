import type { Metadata } from 'next';
import { DemoCommunityProvider, DemoCommunityExperience } from '@/components/lab/demo';
export const metadata: Metadata = { title: 'Demo community — Open Lab', description: 'A clearly fictional community exploring shared scientific bottlenecks. Try local-only discussions and interest signals.', robots: { index: false, follow: false } };
export default function DemoCommunityPage() {
  return <DemoCommunityProvider><DemoCommunityExperience showBanner={false} showNotifications={false} /></DemoCommunityProvider>;
}
