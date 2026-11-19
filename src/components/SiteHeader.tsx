'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { mainNav } from '@/lib/site-config'
import { useAuth } from '@/lib/atproto'
import SearchBar from '@/components/SearchBar'
import NavItem from '@/components/NavItem'
import ThemeToggle from '@/components/ThemeToggle'

type Props = {
  onMenuClick: () => void
}

export default function SiteHeader({ onMenuClick }: Props) {
  const pathname = usePathname()
  const { isAuthenticated, session } = useAuth()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  function handleDropdownEnter(name: string) {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    setActiveDropdown(name)
  }

  function handleDropdownLeave() {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setActiveDropdown(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdowns on navigation
  useEffect(() => {
    setActiveDropdown(null)
  }, [pathname])

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/images/pl_logo_mark.svg" className="h-11 transition-transform group-hover:scale-105" alt="Protocol Labs" />
            <span className="font-semibold text-black">
              PL <span className="font-normal text-gray-500">R&D</span>
            </span>
          </Link>

          {/* Desktop: nav + search + CTA, right-aligned */}
          <div className="hidden lg:flex items-center gap-1">
            <div className="flex items-center gap-1">
              {mainNav.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  isActive={activeDropdown === item.name}
                  onMouseEnter={() => item.children ? handleDropdownEnter(item.name) : setActiveDropdown(null)}
                  onMouseLeave={handleDropdownLeave}
                />
              ))}
            </div>

            <div className="flex items-center gap-4 ml-4">
              <SearchBar variant="desktop" />

              <ThemeToggle />

              {isAuthenticated && session ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                >
                  {session.avatar ? (
                    <img
                      src={session.avatar}
                      alt={session.handle}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet text-white flex items-center justify-center text-xs font-medium">
                      {(session.displayName || session.handle).charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              ) : (
                <Link
                  href="/outreach/collaboration/"
                  className="bg-black text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  Collaborate
                </Link>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <SearchBar variant="mobile" />
            <button
              onClick={onMenuClick}
              aria-label="Menu"
              className="p-2 text-gray-500 hover:text-black rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
