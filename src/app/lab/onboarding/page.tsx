'use client'
import { useLabAuth } from '@/lib/lab-auth'
import { InterestOnboarding } from '@/components/lab/social/InterestOnboarding'
import { ProfileCompletion } from '@/components/lab/social/ProfileCompletion'

export default function OnboardingPage() {
  // The dedicated Open Lab layout owns authentication. Never nest a second provider.
  const { session, isLoading } = useLabAuth()
  // Never expose a guest editor while an existing authenticated owner is restoring.
  if (isLoading) return <p role="status">Loading your local starting choices…</p>
  const ownerId = session?.did || 'guest'
  return <div className="lab-social-route lab-wrap"><InterestOnboarding ownerId={ownerId} /><div id="profile-completion"><ProfileCompletion ownerId={ownerId} /></div></div>
}
