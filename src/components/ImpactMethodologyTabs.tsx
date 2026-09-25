'use client'

import { Children, isValidElement, useId, useState, type ReactNode } from 'react'
import { navigateImpact, useImpactNavigation } from '@/components/useImpactNavigation'

const TABS = [
  {
    id: 'diagnose',
    label: 'Diagnose',
    blurb: 'Name the binding constraint, then read field velocity.',
  },
  {
    id: 'intervene',
    label: 'Intervene',
    blurb: 'Apply the lever that matches that bottleneck.',
  },
  {
    id: 'learn',
    label: 'Learn',
    blurb: 'Update the diagnosis and run the cycle again.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

const HASH_TO_TAB: Record<string, TabId> = {
  diagnose: 'diagnose',
  observe: 'diagnose',
  'field-velocity': 'diagnose',
  methodology: 'diagnose',
  toolkit: 'diagnose',
  intervene: 'intervene',
  learn: 'learn',
  compound: 'learn',
  'verified-impact': 'learn',
}

function tabFromLocation(): TabId {
  const hash = window.location.hash.replace(/^#/, '').split('/')[0]
  return HASH_TO_TAB[hash] ?? 'diagnose'
}

export default function ImpactMethodologyTabs({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('diagnose')
  const baseId = useId()

  useImpactNavigation(() => setTab(tabFromLocation()))

  const select = (id: TabId) => {
    setTab(id)
    navigateImpact(`#${id}`)
  }

  return (
    <div>
      <div className="sticky top-16 z-30 border-y border-black/10 bg-white/95 backdrop-blur-sm">
        <div
          role="tablist"
          aria-label="Field-building loop"
          data-methodology-tabs=""
          className="mx-auto grid max-w-6xl grid-cols-3 px-2 sm:px-6"
        >
          {TABS.map((item, index) => {
            const selected = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${baseId}-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(item.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                  event.preventDefault()
                  const offset = event.key === 'ArrowRight' ? 1 : -1
                  const next = TABS[(index + offset + TABS.length) % TABS.length]
                  select(next.id)
                  document.getElementById(`${baseId}-tab-${next.id}`)?.focus()
                }}
                className={`min-w-0 border-b-2 px-3 py-4 text-left sm:px-5 sm:py-5 ${
                  selected
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                <div className="text-[11px] font-semibold tracking-[0.16em] text-gray-500">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="mt-2 text-[15px] font-semibold tracking-tight sm:text-[17px]">
                  {item.label}
                </div>
                <p className="mt-1 hidden text-[12px] leading-relaxed text-gray-500 sm:block">
                  {item.blurb}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {Children.map(children, (child) => {
        if (!isValidElement<{ id?: string }>(child)) return child
        const panelTab = TABS.find((item) => item.id === child.props.id)?.id
        if (!panelTab) return child
        const selected = panelTab === tab
        return (
          <div
            key={panelTab}
            role="tabpanel"
            id={`${baseId}-panel-${panelTab}`}
            aria-labelledby={`${baseId}-tab-${panelTab}`}
            hidden={!selected}
            inert={!selected}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}
