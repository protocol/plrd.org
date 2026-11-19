"use client"

// Community layer for a hypercert detail page, ported from
// researchretreat.org. Community evidence
// (org.hypercerts.context.attachment) and comments
// (org.simocracy.feed.post / org.impactindexer.review.comment) written
// by ATProto users to their own PDSs are discovered client-side via
// the Constellation backlink index (src/lib/hypercerts-live.ts).
// Contributions and record management happen at their originating service.
// This page only aggregates public records; it cannot authenticate or delete.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Hypercert } from "@/data/hypercerts"
import {
  fetchLiveActivity,
  publicSourceURL,
  type LiveActivity,
  type LiveAuthor,
} from "@/lib/hypercerts-live"

// ── Live activity hook ──────────────────────────────────────────────

const EMPTY: LiveActivity = { evidence: [], comments: [] }

/** Network state for a cert via Constellation backlink discovery. */
export function useLiveActivity(cert: Hypercert) {
  const [network, setNetwork] = useState<LiveActivity>(EMPTY)
  const [loading, setLoading] = useState(true)
  const certRef = useRef(cert)
  certRef.current = cert

  const refresh = useCallback(async () => {
    const c = certRef.current
    const targets = [c.subjectUri, ...(c.claim ? [c.claim.uri] : [])]
    try {
      setNetwork(await fetchLiveActivity(targets))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void refresh()
  }, [refresh])

  return useMemo(() => ({ data: network, loading }), [network, loading])
}

// ── Shared bits ─────────────────────────────────────────────────────

export function SourceRecordLink({ sourceURL }: { sourceURL?: string }) {
  const url = publicSourceURL(sourceURL)
  if (!url) return null
  return <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">Manage at source ↗</a>
}

export function authorLabel(author: LiveAuthor): string {
  return (
    author.displayName ||
    (author.handle ? `@${author.handle}` : null) ||
    `${author.did.slice(0, 24)}…`
  )
}

export function Avatar({
  author,
  size = 24,
}: {
  author: LiveAuthor
  size?: number
}) {
  if (author.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.avatar}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-blue/10 font-semibold uppercase text-blue"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.round(size * 0.38)),
      }}
    >
      {(author.handle ?? author.did.replace("did:plc:", "")).slice(0, 2)}
    </span>
  )
}

// ── Contributor profiles ────────────────────────────────────────────

export type ActorProfile = {
  actor: string
  did: string | null
  handle: string | null
  displayName: string | null
  avatar: string | null
}

const PROFILE_LINK_RE = /^https:\/\/bsky\.app\/profile\/([^/?#]+)\/?$/

/** Actor (handle or DID) from a bsky.app profile URL, or null. */
export function profileLinkActor(url: string): string | null {
  const m = url.match(PROFILE_LINK_RE)
  return m ? m[1] : null
}

const actorProfileCache = new Map<string, ActorProfile>()

/**
 * Resolve bsky.app profile links to avatars + names via the public
 * AppView, so evidence entries can show the people behind the work.
 */
export function useActorProfiles(actors: string[]): Map<string, ActorProfile> {
  const key = actors.join(",")
  const [profiles, setProfiles] = useState<Map<string, ActorProfile>>(
    () => new Map(),
  )

  useEffect(() => {
    if (!key) return
    const wanted = key.split(",").filter(Boolean)
    const missing = wanted.filter((a) => !actorProfileCache.has(a))
    let cancelled = false

    const publish = () => {
      if (cancelled) return
      setProfiles(
        new Map(
          wanted
            .filter((a) => actorProfileCache.has(a))
            .map((a) => [a, actorProfileCache.get(a)!]),
        ),
      )
    }

    if (missing.length === 0) {
      publish()
      return
    }

    const params = missing.map((a) => `actors=${encodeURIComponent(a)}`).join("&")
    fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfiles?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (json: {
          profiles?: Array<{
            did: string
            handle: string
            displayName?: string
            avatar?: string
          }>
        } | null) => {
          for (const actor of missing) {
            const p = json?.profiles?.find(
              (x) => x.handle === actor || x.did === actor,
            )
            actorProfileCache.set(actor, {
              actor,
              did: p?.did ?? null,
              handle: p?.handle ?? (actor.includes(".") ? actor : null),
              displayName: p?.displayName ?? null,
              avatar: p?.avatar ?? null,
            })
          }
          publish()
        },
      )
      .catch(() => publish())

    return () => {
      cancelled = true
    }
  }, [key])

  return profiles
}

// ── Comments (read-only) ────────────────────────────────────────────

export function CommentsSection({
  cert,
  activity,
  loading,
}: {
  cert: Hypercert
  activity: LiveActivity
  loading: boolean
}) {
  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[clamp(20px,2.4vw,30px)] leading-tight tracking-tight text-black">
          Comments
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {loading ? "loading…" : `${activity.comments.length} on the network`}
        </span>
      </div>

      {activity.comments.length === 0 && !loading && (
        <p className="mb-6 text-[13.5px] leading-relaxed text-gray-500">
          No comments yet. Each comment is an{" "}
          <code className="text-[0.85em]">org.simocracy.feed.post</code> record
          in its author&apos;s own PDS that links this claim.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {activity.comments.map((c) => (
          <article
            key={c.uri}
            className="rounded-2xl border border-gray-200 bg-gray-100 p-4"
          >
            <div className="flex items-center gap-2">
              <Avatar author={c.author} />
              <span className="text-[13px] font-semibold text-black">
                {authorLabel(c.author)}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-gray-600">
              {c.text}
            </p>
            <p className="mt-2 text-[12px]"><SourceRecordLink sourceURL={c.sourceURL} /></p>
          </article>
        ))}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-gray-500">
        This website is read-only. Manage existing comments and evidence at the service where you created them.
        {" "}
        Want to join the conversation? Sign in with ATProto on{" "}
        <a
          href={`https://www.researchretreat.org/impact/#${cert.rkey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue hover:underline"
        >
          researchretreat.org
        </a>{" "}
        to post comments and evidence — they&apos;ll show up here too.
      </p>
    </div>
  )
}
