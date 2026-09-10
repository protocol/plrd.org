'use client'

import { useState, type ReactNode } from 'react'
import { impactUrl, navigateImpact, useImpactNavigation } from '@/components/useImpactNavigation'

export default function ImpactSectionLink({ fragment, children, className }: { fragment: string; children: ReactNode; className?: string }) {
  const [href, setHref] = useState(fragment)
  useImpactNavigation(() => setHref(impactUrl(fragment)))
  return <a href={href} className={className ?? 'hover:underline underline-offset-4'} onClick={event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigateImpact(fragment)
    document.getElementById(fragment.slice(1))?.scrollIntoView({ block: 'start' })
  }}>{children}</a>
}
