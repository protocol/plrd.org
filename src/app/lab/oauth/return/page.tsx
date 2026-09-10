'use client'

import { LabAuthProvider, useLabAuth } from '@/lib/lab-auth'
function ReturnStatus() {
  const { isLoading, error, isAuthenticated } = useLabAuth()
  return <main className="mx-auto max-w-2xl px-6 py-24">
    <h1 className="font-serif text-3xl">Return to Open Lab</h1>
    <p role={error ? 'alert' : 'status'} className="mt-6">
      {isLoading ? 'Completing account authorization…' : error ?? (isAuthenticated ? 'Account authorization is complete. Return to your draft to review it.' : 'No account authorization was completed. You can still explore the lab.')}
    </p>
    <p className="mt-4">Nothing is published automatically. Your draft stays on this browser until you explicitly confirm a public record.</p>
    <a href="/lab/" className="mt-6 inline-block text-blue underline">Back to Open Lab</a>
  </main>
}
export default function LabOAuthReturnPage() {
  // The provider shares the Lab runtime and also permits isolated callback rendering.
  return <LabAuthProvider><ReturnStatus /></LabAuthProvider>
}
