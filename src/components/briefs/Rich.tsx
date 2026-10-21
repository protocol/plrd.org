import { Fragment } from 'react'
import Link from 'next/link'

const LINK = /(\[[^\]]+\]\([^)\s]+\))/g
const PARTS = /^\[([^\]]+)\]\(([^)\s]+)\)$/

/**
 * Brief prose with its [label](href) links made real: a site path stays on
 * the site, anything else opens in a new tab. The print build reads the same
 * syntax (scripts/build-briefs.mjs).
 */
export default function Rich({
  text,
  linkClassName = 'text-blue hover:text-black transition-colors no-underline',
}: {
  text: string
  linkClassName?: string
}) {
  return (
    <>
      {text.split(LINK).map((part, i) => {
        const link = part.match(PARTS)
        if (!link) return <Fragment key={i}>{part}</Fragment>
        const [, label, href] = link
        return href.startsWith('/') ? (
          <Link key={i} href={href} className={linkClassName}>
            {label}
          </Link>
        ) : (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
            {label}
          </a>
        )
      })}
    </>
  )
}
