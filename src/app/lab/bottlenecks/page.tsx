import type { Metadata } from 'next';
import LabBottleneckExperience from '@/components/lab/LabBottleneckExperience';
import '@/components/lab/BottleneckWorkbench.css';

export const metadata: Metadata = {
  title: 'Co-create an intervention | Open Lab',
  description: 'Refine a public-source bottleneck, design a bounded intervention, and prepare a local proposal for human review.',
};
export default function BottlenecksPage() {
  return <LabBottleneckExperience />;
}
