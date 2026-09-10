'use client'
import { LabAuthProvider, useLabAuth } from '@/lib/lab-auth'
import { InterestOnboarding } from '@/components/lab/social/InterestOnboarding'
import { ProfileCompletion } from '@/components/lab/social/ProfileCompletion'

export default function OnboardingPage() {
  // The base tree has no LabShell yet. The provider reuses its browser runtime
  // when mounted inside the integrated Open Lab layout as well.
  return <LabAuthProvider><OnboardingContent /></LabAuthProvider>
}
function OnboardingContent() {
  const { session, isLoading } = useLabAuth()
  // Never expose a guest editor while an existing authenticated owner is restoring.
  if (isLoading) return <p role="status">Loading your local starting choices…</p>
  const ownerId = session?.did || 'guest'
  return <div className="open-lab lab-social-route"><InterestOnboarding ownerId={ownerId} /><div id="profile-completion"><ProfileCompletion ownerId={ownerId} /></div></div>
}
