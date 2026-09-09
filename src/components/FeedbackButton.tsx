'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/lib/site-config'

type SelectionContext = {
  text: string
  heading?: string
}

const MAX_SELECTED_TEXT = 1400
const MAX_TITLE_TEXT = 110

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function getElementForNode(node: Node | null) {
  if (!node) return null
  return node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement
}

function findNearestHeading(element: Element | null) {
  if (!element) return ''

  const headings = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))

  for (const heading of headings.reverse()) {
    if (heading === element || heading.contains(element)) {
      return normalizeWhitespace(heading.textContent || '')
    }

    if (heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) {
      return normalizeWhitespace(heading.textContent || '')
    }
  }

  return ''
}

function getHashHeading() {
  if (!window.location.hash) return ''

  const id = decodeURIComponent(window.location.hash.slice(1))
  const target = document.getElementById(id)
  return normalizeWhitespace(target?.textContent || id.replace(/[-_]/g, ' '))
}

function getSelectionContext(): SelectionContext {
  const selection = window.getSelection()
  const text = normalizeWhitespace(selection?.toString() || '')

  if (!selection || selection.rangeCount === 0 || !text) {
    return { text: '' }
  }

  const range = selection.getRangeAt(0)
  const element = getElementForNode(range.startContainer)
  const heading = findNearestHeading(element) || getHashHeading()

  return {
    text: truncate(text, MAX_SELECTED_TEXT),
    heading: heading ? truncate(heading, 160) : undefined,
  }
}

function buildIssueUrl(selection: SelectionContext) {
  const url = new URL(window.location.href)
  const path = `${url.pathname}${url.search}${url.hash}` || '/'
  const pageTitle = normalizeWhitespace(document.title.replace(/\s*\|\s*PL R&D\s*$/, '')) || 'PL R&D'
  const section = selection.heading || getHashHeading()
  const pageTag = `page:${path}`
  const contentTag = selection.text
    ? `selection:${truncate(selection.text, 72)}`
    : section
      ? `section:${truncate(section, 72)}`
      : 'content:general'

  const title = truncate(`Feedback on ${path === '/' ? 'home page' : path}`, MAX_TITLE_TEXT)
  const referencedContent = selection.text
    ? [
      section ? `Section/heading: ${section}` : undefined,
      '',
      `> ${selection.text}`,
    ].filter(Boolean).join('\n')
    : '_No text was selected. To tag exact content next time, highlight text before clicking “Give feedback.”_'

  const body = [
    '## Feedback',
    '<!-- Tell us what should change, what is confusing, or what is broken. -->',
    '',
    '## Page context',
    `- Page title: ${pageTitle}`,
    `- URL: ${url.toString()}`,
    `- Tags: \`${pageTag}\` \`${contentTag}\``,
    '',
    '## Referenced content',
    referencedContent,
  ].join('\n')

  const params = new URLSearchParams({ title, body })
  return `${siteConfig.githubUrl}/issues/new?${params.toString()}`
}

export default function FeedbackButton() {
  const pathname = usePathname()
  const [hasSelection, setHasSelection] = useState(false)
  const latestSelection = useRef<SelectionContext>({ text: '' })

  const updateSelection = useCallback(() => {
    const nextSelection = getSelectionContext()
    latestSelection.current = nextSelection
    setHasSelection(Boolean(nextSelection.text))
  }, [])

  useEffect(() => {
    latestSelection.current = { text: '' }
    setHasSelection(false)
  }, [pathname])

  useEffect(() => {
    document.addEventListener('selectionchange', updateSelection)
    window.addEventListener('hashchange', updateSelection)

    return () => {
      document.removeEventListener('selectionchange', updateSelection)
      window.removeEventListener('hashchange', updateSelection)
    }
  }, [updateSelection])

  function openFeedbackIssue() {
    const currentSelection = getSelectionContext()
    const selection = currentSelection.text ? currentSelection : latestSelection.current
    const issueUrl = buildIssueUrl(selection)
    window.open(issueUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onPointerDown={(event) => {
        // Keep highlighted page text selected long enough to include it in the issue body.
        event.preventDefault()
        updateSelection()
      }}
      onClick={openFeedbackIssue}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-4 py-2 text-sm font-semibold text-black shadow-lg backdrop-blur-sm transition-colors hover:border-blue hover:text-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 print:hidden"
      aria-label={hasSelection ? 'Give feedback about the selected content' : 'Give feedback about this page'}
      title={hasSelection ? 'Create a GitHub issue with this page and selected text attached' : 'Create a GitHub issue for this page'}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 8.25h9m-9 3.5h6M21 11.5a8.38 8.38 0 0 1-.9 3.79 8.5 8.5 0 0 1-7.6 4.71 8.38 8.38 0 0 1-3.79-.9L3 21l1.9-5.71a8.38 8.38 0 0 1-.9-3.79 8.5 8.5 0 0 1 17 0Z" />
      </svg>
      Give feedback
    </button>
  )
}
