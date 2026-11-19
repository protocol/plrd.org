'use client'

import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import styles from '@/app/impact-preview-eb61fba1b98e/page.module.css'
import { navigateImpact, useImpactNavigation } from '@/components/useImpactNavigation'
import { FIELD_LOOP_STEPS } from '@/lib/interventions'

const TABS = FIELD_LOOP_STEPS.map((step) => ({
  id: step.label.toLowerCase() as 'diagnose' | 'intervene' | 'learn',
  label: step.label,
  blurb: step.blurb,
}))

type TabId = (typeof TABS)[number]['id']

const HASH_TO_TAB: Record<string, TabId> = {
  diagnose: 'diagnose',
  methodology: 'diagnose',
  toolkit: 'intervene',
  intervene: 'intervene',
  observe: 'learn',
  fv: 'learn',
  'field-velocity': 'learn',
  'observed-velocity': 'learn',
  'verified-impact': 'learn',
  learn: 'learn',
  compound: 'learn',
  inflection: 'learn',
  'inflection-points': 'learn',
}

function tabFromLocation(): TabId {
  const hash = window.location.hash.replace(/^#/, '').split('/')[0]
  return HASH_TO_TAB[hash] ?? 'diagnose'
}

export default function ImpactMethodologyTabs({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('diagnose')
  const [pinned, setPinned] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const baseId = useId()

  useImpactNavigation(() => setTab(tabFromLocation()))

  // The loop menu is the same on every tab, so it should pin only after the
  // shared intro ("How we build fields") has scrolled past the site header.
  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const headerOffset = () => {
      const header = document.querySelector('header')
      return header ? Math.ceil(header.getBoundingClientRect().height) : 64
    }

    const update = () => {
      setPinned(anchor.getBoundingClientRect().top <= headerOffset() + 1)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const select = (id: TabId) => {
    setTab(id)
    navigateImpact(`#${id}`)
  }

  return (
    <div>
      <div ref={anchorRef} className={styles.methodologyTabsAnchor} />
      <div className={`${styles.methodologyTabs} ${pinned ? styles.methodologyTabsPinned : ''}`}>
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
      <div className={styles.methodologyTabsSpacer} aria-hidden="true" />

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
