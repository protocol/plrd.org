'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { mainNav } from '@/lib/site-config'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function OffCanvasNav({ isOpen, onClose }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 overflow-y-auto bg-white shadow-lg transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Menu</span>
          <button onClick={onClose} aria-label="Close menu" className="text-gray-400 hover:text-black transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="px-6 py-6">
          {mainNav.map((item) => (
            <div key={item.name} className="mb-5">
              <Link
                href={item.url}
                onClick={onClose}
                className={`text-sm ${pathname.startsWith(item.url) ? 'text-black font-medium' : 'text-gray-600 hover:text-black'} transition-colors`}
              >
                {item.name}
              </Link>

              {item.children && (
                <div className="mt-2 ml-3 flex flex-col gap-2 border-l border-gray-100 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.url}
                      onClick={onClose}
                      className={`text-xs ${pathname.startsWith(child.url) ? 'text-black' : 'text-gray-400 hover:text-black'} transition-colors`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            href="/outreach/collaboration/"
            onClick={onClose}
            className="inline-flex rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Collaborate
          </Link>
        </nav>
      </div>
    </>
  )
}
