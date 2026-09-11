'use client'

import { useState } from 'react'

export default function AiStarterPrompt({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState('')
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setStatus('Copied.')
    } catch {
      setStatus('Select the prompt text and copy it manually.')
    }
  }
  return <div className="border border-gray-200 rounded-sm p-5 sm:p-6">
    <p className="text-sm leading-relaxed select-text break-words">{prompt}</p>
    <div className="flex flex-wrap items-center gap-3 mt-5">
      <button type="button" onClick={copy} className="rounded-full px-5 py-2 bg-blue text-white text-sm hover:bg-blue/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue">Copy prompt</button>
      <span role="status" className="text-sm text-gray-500">{status}</span>
    </div>
  </div>
}
