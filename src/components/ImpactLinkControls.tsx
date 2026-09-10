'use client'

import { useState } from 'react'

/** A real URL for new-tab/copy-address gestures; ordinary clicks keep the
 * already-open dialog in place without creating another history entry. */
export default function ImpactLinkControls({ hash, chart = false }: { hash: string; chart?: boolean }) {
  const [copyStatus, setCopyStatus] = useState('Copy link')
  const directUrl = new URL(hash, window.location.href).href
  return <div className="chart-share-controls">
    <a data-impact-direct data-chart-direct={chart || undefined} href={directUrl} onClick={event => {
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault()
    }}>Direct link ↗</a>
    <button type="button" data-impact-copy data-chart-copy={chart || undefined} onClick={async () => {
      try {
        await window.navigator.clipboard.writeText(directUrl)
        setCopyStatus('Copied')
      } catch { setCopyStatus('Copy failed — use Direct link') }
    }}>{copyStatus}</button>
    <span className="sr-only" role="status">{copyStatus === 'Copy link' ? '' : copyStatus}</span>
  </div>
}
