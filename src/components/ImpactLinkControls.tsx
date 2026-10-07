'use client'

import { useState } from 'react'

/** One Share control copies the current pop-out URL. Clipboard failure
 * shows a selectable URL instead of a second Direct-link control. */
export default function ImpactLinkControls({ hash, chart = false }: { hash: string; chart?: boolean }) {
  const [copyStatus, setCopyStatus] = useState('Share')
  const [fallback, setFallback] = useState('')
  const shareUrl = new URL(hash, window.location.href).href
  return <div className="chart-share-controls">
    <button type="button" data-impact-copy data-chart-copy={chart || undefined} onClick={async () => {
      try {
        await window.navigator.clipboard.writeText(shareUrl)
        setCopyStatus('Copied')
        setFallback('')
      } catch {
        setCopyStatus('Copy failed — select the URL')
        setFallback(shareUrl)
      }
    }}>{copyStatus}</button>
    {fallback ? <code data-share-url>{fallback}</code> : null}
    <span className="sr-only" role="status">{copyStatus === 'Share' ? '' : copyStatus}</span>
  </div>
}
