'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'
import OffCanvasNav from './OffCanvasNav'
import FeedbackButton from './FeedbackButton'

// Routes that render full-screen (no footer, no bottom padding)
const FULLSCREEN_PATTERNS = [
  /^\/areas\/economies-governance\/dependency-graph\/[^/]+\/?$/,
]

// Routes that end on a colored full-bleed section and manage their own bottom
// spacing, so the default white pb-12 gap before the footer would show as an
// out-of-place white bar.
const NO_BOTTOM_PAD_PATTERNS = [
  /^\/impact-preview-[^/]+\/?$/,
]

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = usePathname()
  const isFullscreen = FULLSCREEN_PATTERNS.some(p => p.test(pathname))
  const noBottomPad = NO_BOTTOM_PAD_PATTERNS.some(p => p.test(pathname))

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isFullscreen])

  return (
    <>
      <SiteHeader onMenuClick={() => setNavOpen(true)} />
      <OffCanvasNav isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <div className={isFullscreen ? 'w-full' : noBottomPad ? 'w-full' : 'w-full pb-12'}>
        {children}
      </div>

      {!isFullscreen && <SiteFooter />}
      <FeedbackButton />
    </>
  )
}
