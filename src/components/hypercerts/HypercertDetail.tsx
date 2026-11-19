"use client"

// Project-page detail for a hypercert, ported from researchretreat.org:
// a photo hero (shared-layout morph from the card), claim meta, funding
// economics, and an evidence timeline that merges the retreat's own
// curated entries with live community evidence pulled from the ATProto
// network via Constellation. Restyled to the plrd.org design system.

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type {
  EvidenceEntry,
  EvidenceKind,
  Hypercert,
  RoiAttribution,
} from "@/data/hypercerts"
import FundingCheckout, { FundEffortButton, type MorphFrom } from "@/components/FundingFlow"
import {
  Avatar,
  CommentsSection,
  SourceRecordLink,
  authorLabel,
  profileLinkActor,
  useActorProfiles,
  useLiveActivity,
} from "@/components/hypercerts/HypercertCommunity"
import type { LiveEvidence } from "@/lib/hypercerts-live"
import { ProgressiveBlur } from "@/components/hypercerts/HypercertCard"

const KIND_LABEL: Record<EvidenceKind, string> = {
  milestone: "Milestone",
  session: "Working session",
  publication: "Publication",
  artifact: "Artifact",
  release: "Release",
  other: "Other",
}

const KIND_GLYPH: Record<EvidenceKind, string> = {
  milestone: "◆",
  session: "▚",
  publication: "❑",
  artifact: "◈",
  release: "⤴",
  other: "◌",
}

function kindLabel(kind: string): string {
  return KIND_LABEL[kind as EvidenceKind] ?? kind
}

function kindGlyph(kind: string): string {
  return KIND_GLYPH[kind as EvidenceKind] ?? "◈"
}

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.12 + i * 0.05,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
}

const eyebrow = "text-[10px] font-semibold uppercase tracking-[0.16em]"

function EvidenceRow({ entry, index }: { entry: EvidenceEntry; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <motion.article
      custom={index + 2}
      variants={fade}
      initial="hidden"
      animate="show"
      className="relative border-l border-gray-200 pl-6"
    >
      <span
        aria-hidden
        className="absolute -left-[6.5px] top-1 grid h-3 w-3 place-items-center rounded-full bg-blue text-[7px] text-white"
      >
        {kindGlyph(entry.kind)}
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="block w-full cursor-pointer pb-6 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${eyebrow} text-blue`}>{kindLabel(entry.kind)}</span>
          {entry.badge && (
            <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue">
              {entry.badge}
            </span>
          )}
          <span className={`${eyebrow} text-gray-500`}>{entry.dateLabel}</span>
          {entry.influence && <InfluenceChip influence={entry.influence} />}
        </div>
        <h4 className="mt-1.5 font-serif text-[18px] leading-snug tracking-tight text-black">
          {entry.title}
        </h4>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden"
        >
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-gray-600">
            {entry.description}
          </p>
        </motion.div>
      </button>
    </motion.article>
  )
}

/**
 * Estimated Shapley influence of an evidence entry: its share of the
 * documented social return, with the RoI resized to what this entry
 * actually carries (share × total) rather than the raw outcome value.
 */
function InfluenceChip({
  influence,
}: {
  influence: { share: number; amountUsd: number }
}) {
  const pct = influence.share >= 0.1
    ? Math.round(influence.share * 100)
    : (influence.share * 100).toFixed(1)
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-blue/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue"
      title={`Estimated Shapley influence on the documented social return: ${pct}% ≈ ${fmtUsd(influence.amountUsd)}`}
    >
      <span
        aria-hidden
        className="h-1.5 rounded-full bg-blue"
        style={{ width: 4 + Math.round(influence.share * 40) }}
      />
      {pct}% · ≈{fmtUsd(influence.amountUsd)}
    </span>
  )
}

function LiveEvidenceRow({
  entry,
  influence,
}: {
  entry: LiveEvidence
  /** Estimated Shapley influence matched from the cert's liveInfluence. */
  influence?: { share: number; amountUsd: number }
}) {
  const [open, setOpen] = useState(false)
  const date = new Date(entry.createdAt)
  const dateLabel = Number.isNaN(date.getTime())
    ? entry.createdAt
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })

  // Profile links render as contributor avatar chips; the rest stay
  // plain links.
  const contributorActors = entry.links
    .map(profileLinkActor)
    .filter((a): a is string => a !== null)
  const plainLinks = entry.links.filter((l) => profileLinkActor(l) === null)
  const contributorProfiles = useActorProfiles(contributorActors)

  return (
    <article className="relative border-l border-gray-200 pl-6">
      <span
        aria-hidden
        className="absolute -left-[6.5px] top-1 grid h-3 w-3 place-items-center rounded-full border border-blue bg-white text-[7px] text-blue"
      >
        {kindGlyph(entry.kind)}
      </span>

      <div className="pb-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="block w-full cursor-pointer text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${eyebrow} text-blue`}>{kindLabel(entry.kind)}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 py-0.5 pl-1 pr-2 text-[10px] font-semibold tracking-wide text-blue">
              <Avatar author={entry.author} size={16} />
              community · {authorLabel(entry.author)}
            </span>
            <span className={`${eyebrow} text-gray-500`}>{dateLabel}</span>
            {influence && <InfluenceChip influence={influence} />}
          </div>
          <h4 className="mt-1.5 font-serif text-[18px] leading-snug tracking-tight text-black">
            {entry.title}
          </h4>
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden"
        >
          {entry.description && (
            <p className="mt-2 max-w-xl whitespace-pre-wrap text-[14px] leading-relaxed text-gray-600">
              {entry.description}
            </p>
          )}
          {contributorActors.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {contributorActors.map((actor) => {
                const p = contributorProfiles.get(actor)
                const label = p?.displayName || p?.handle || actor
                return (
                  <a
                    key={actor}
                    href={`https://bsky.app/profile/${actor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 py-1 pl-1 pr-2.5 text-[12px] text-black transition hover:border-blue/40"
                  >
                    <Avatar
                      author={{
                        did: p?.did ?? actor,
                        handle: p?.handle ?? actor,
                        displayName: p?.displayName ?? null,
                        avatar: p?.avatar ?? null,
                      }}
                      size={20}
                    />
                    {label}
                  </a>
                )
              })}
            </div>
          )}
          {plainLinks.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {plainLinks.map((l) => (
                <a
                  key={l}
                  href={l}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-[12px] text-blue hover:underline"
                >
                  {l} ↗
                </a>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-4">
            <a
              href={`https://pdsls.dev/${entry.uri}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${eyebrow} text-gray-400 transition hover:text-blue`}
            >
              View ATProto record ↗
            </a>
            <SourceRecordLink sourceURL={entry.sourceURL} />
          </div>
        </motion.div>
      </div>
    </article>
  )
}

// ── Social RoI attribution (Shapley decomposition) ─────────────────

const RETREAT_COLORS = ["#1982F4", "#3966FE", "#3158A5", "#839BC9", "#C3E1FF"]
const COMMUNITY_COLORS = ["#0d9488", "#14b8a6", "#5eead4", "#99f6e4"]

function attributionColor(items: RoiAttribution[], index: number): string {
  const item = items[index]
  const palette = item.group === "retreat" ? RETREAT_COLORS : COMMUNITY_COLORS
  const nth = items.slice(0, index).filter((a) => a.group === item.group).length
  return palette[nth % palette.length]
}

function fmtUsd(n: number): string {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}k`
}

function SocialRoiAttribution({ items }: { items: RoiAttribution[] }) {
  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`${eyebrow} text-gray-500`}>
          Where the social return comes from
        </p>
        <p className={`${eyebrow} text-gray-400`}>Shapley attribution · est.</p>
      </div>

      {/* Stacked share bar — segments grow in, staggered */}
      <div className="mt-3 flex h-7 w-full overflow-hidden rounded-full">
        {items.map((a, i) => (
          <motion.div
            key={a.label}
            className="group/seg relative h-full cursor-default"
            style={{ background: attributionColor(items, i) }}
            title={`${a.label} — ${(a.share * 100).toFixed(1)}% · ≈${fmtUsd(a.amountUsd)}`}
            initial={{ width: 0 }}
            animate={{ width: `${a.share * 100}%` }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="absolute inset-0 opacity-0 transition-opacity group-hover/seg:opacity-100" style={{ background: "rgba(255,255,255,0.25)" }} />
          </motion.div>
        ))}
      </div>

      {/* Group brackets */}
      <div className="mt-2 flex text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        {(["retreat", "community"] as const).map((g) => {
          const total = items.filter((a) => a.group === g).reduce((s, a) => s + a.share, 0)
          return (
            <span key={g} className="truncate pr-2" style={{ width: `${total * 100}%` }}>
              {total < 0.18
                ? `${Math.round(total * 100)}%`
                : `${g === "retreat" ? "Retreat chain" : "Community outcomes"} · ${Math.round(total * 100)}%`}
            </span>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {items.map((a, i) => (
          <div key={a.label} className="flex items-center gap-2 text-[12.5px]">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: attributionColor(items, i) }}
            />
            <span className="min-w-0 flex-1 truncate text-gray-600">{a.label}</span>
            <span className="shrink-0 font-semibold text-black">
              {(a.share * 100).toFixed(1)}%
            </span>
            <span className="w-12 shrink-0 text-right text-gray-500">
              {fmtUsd(a.amountUsd)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 max-w-2xl text-[11.5px] leading-relaxed text-gray-400">
        Exact Shapley decomposition over a counterfactual model with
        outcome-specific causal channels: every documented outcome is
        causally downstream of the retreat — the 22 works are the thinking
        pieces the GG24 forum drew on, and the IERR artifact plus the Berlin
        redesign workshop that followed Iceland pushed the Hypercerts v2
        deploy. Execution entries are discounted because documentation is
        not causation and some work predates the retreat. Shares sum to the
        documented social return.
      </p>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={`${eyebrow} text-gray-500`}>{label}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-black">{children}</p>
    </div>
  )
}

type TimelineItem =
  | { date: string; type: "static"; entry: EvidenceEntry }
  | { date: string; type: "live"; entry: LiveEvidence }

export function HypercertDetail({
  cert,
  certs,
  showFunding = false,
  onClose,
  variant = "page",
}: {
  cert: Hypercert
  /** Full set of hypercerts, so the funding checkout can offer
   *  individual selection + pre-curated collections. Falls back to [cert]. */
  certs?: Hypercert[]
  /** Show the "Fund this effort" flow. Only enabled on the Impact preview —
   *  the live hypercerts page keeps the read-only detail. */
  showFunding?: boolean
  onClose: () => void
  /** "page" = full-bleed takeover (default); "modal" = contained pop-out with
   *  a dimmed backdrop so the rest of the page stays visible around it. */
  variant?: "page" | "modal"
}) {
  const isModal = variant === "modal"
  const { data: activity, loading } = useLiveActivity(cert)
  const [funding, setFunding] = useState(false)
  // Rect of the hero card at click time, so the funding checkout can fly a
  // clone of it down into its contact-sheet card slot.
  const [morphFrom, setMorphFrom] = useState<MorphFrom | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const openFunding = () => {
    const el = heroRef.current
    if (el) {
      const r = el.getBoundingClientRect()
      setMorphFrom({ top: r.top, left: r.left, width: r.width, height: r.height, image: cert.image })
    }
    setFunding(true)
  }
  const closeFunding = () => {
    setFunding(false)
    setMorphFrom(null)
  }

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  const liveInfluenceFor = (title: string) =>
    cert.liveInfluence?.find((m) =>
      title.toLowerCase().includes(m.match.toLowerCase()),
    )

  const timeline: TimelineItem[] = [
    ...cert.evidence.map((entry) => ({
      date: entry.date,
      type: "static" as const,
      entry,
    })),
    ...activity.evidence.map((entry) => ({
      date: entry.createdAt.slice(0, 10),
      type: "live" as const,
      entry,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <motion.div
      className={
        isModal
          ? "fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-6 lg:p-10"
          : "fixed inset-0 z-[60] overflow-y-auto bg-white"
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={isModal ? onClose : undefined}
    >
      <motion.div
        className={
          isModal
            ? "relative my-4 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl px-6 pb-16 pt-6 lg:px-10"
            : "mx-auto max-w-5xl px-6 pb-24 pt-6 lg:px-10"
        }
        onClick={isModal ? (e) => e.stopPropagation() : undefined}
        {...(isModal
          ? {
              // Zoom the whole panel in as one unit so the white frame and the
              // photo arrive together (elegant), instead of the box popping in.
              initial: { opacity: 0, scale: 0.92 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.96 },
              transition: { type: "spring" as const, stiffness: 240, damping: 24 },
              style: { transformOrigin: "center" },
            }
          : {})}
      >
        {/* Back */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.15 } }}
          exit={{ opacity: 0 }}
          className={
            isModal
              ? "absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-6"
              : "mb-5 flex flex-wrap items-center justify-between gap-3"
          }
        >
          <button
            type="button"
            onClick={onClose}
            className={`${eyebrow} inline-flex cursor-pointer items-center gap-2 transition ${
              isModal ? "text-white/85 hover:text-white" : "text-gray-600 hover:text-blue"
            }`}
          >
            <span aria-hidden>{isModal ? "✕" : "←"}</span> {isModal ? "Close" : "Back to hypercerts"}
          </button>
          <div className="flex items-center gap-4">
            {showFunding && <FundEffortButton onClick={openFunding} />}
            {cert.claim && (
              <a
                href={`https://pdsls.dev/${cert.claim.uri}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${eyebrow} transition ${
                  isModal ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-blue"
                }`}
              >
                View claim record ↗
              </a>
            )}
          </div>
        </motion.div>

        {/* Fund-this-effort checkout (GoFundMe-style: individual efforts or a
            pre-curated collection, then choose an amount). The hero card flies
            down into its contact-sheet slot as the checkout opens. */}
        <AnimatePresence>
          {showFunding && funding && (
            <FundingCheckout
              certs={certs ?? [cert]}
              initialRkey={cert.rkey}
              morphFrom={morphFrom}
              onClose={closeFunding}
            />
          )}
        </AnimatePresence>

        {/* Hero (shared-layout morph from the card photo) */}
        <motion.div
          ref={heroRef}
          // In the contained modal the whole panel zooms as a unit, so the hero
          // does NOT cross-morph (a transform on this ancestor would fight the
          // shared-layout projection). The full-bleed page keeps the morph.
          layoutId={isModal ? undefined : `cert-media-${cert.rkey}`}
          layoutDependency={cert.rkey}
          // In the modal the photo bleeds to the panel edges (full-width hero,
          // no frame); on the page it keeps its rounded card shape.
          className={`hypercert-on-photo relative overflow-hidden ${
            isModal ? "-mx-6 -mt-6 lg:-mx-10" : ""
          }`}
          style={{ borderRadius: isModal ? 0 : 26, aspectRatio: "16 / 9" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cert.image}
            alt={cert.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Top scrim so the overlaid Close / Fund controls stay legible. */}
          {isModal && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent"
            />
          )}
          {/* Progressive blur — same treatment as the card, so the
              shared-layout morph feels continuous. */}
          <ProgressiveBlur
            variant="hero"
            tint="linear-gradient(to bottom, transparent 0%, rgba(19,19,22,0.12) 45%, rgba(19,19,22,0.38) 78%, rgba(19,19,22,0.55) 100%)"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md">
                <span
                  aria-hidden
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ background: "#1982F4" }}
                />
                Hypercert · {cert.dateLabel}
              </span>
              {cert.status === "upcoming" && (
                <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md">
                  In planning
                </span>
              )}
              {cert.creator && (
                <a
                  href={`https://bsky.app/profile/${cert.creator.handle ?? cert.creator.did}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 py-1 pl-1 pr-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md transition hover:border-white/50"
                >
                  {cert.creator.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cert.creator.avatar}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover ring-1 ring-white/40"
                    />
                  ) : (
                    <span aria-hidden className="block h-4 w-4 rounded-full bg-white/30" />
                  )}
                  Claimed by {cert.creator.handle ?? `${cert.creator.did.slice(0, 16)}…`}
                </a>
              )}
            </div>
            <h1 className="mt-3 max-w-2xl font-serif text-[clamp(24px,3.4vw,40px)] leading-[1.06] tracking-tight text-white">
              {cert.title}
            </h1>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {cert.location}
            </p>
          </div>
        </motion.div>

        {/* Body */}
        <motion.div
          custom={0}
          variants={fade}
          initial="hidden"
          animate="show"
          className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div>
            <p className="text-[15.5px] leading-relaxed text-gray-600">
              {cert.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[...cert.workScope, ...cert.impactScope].map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-gray-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-blue"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 border-t border-gray-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <Meta label="Record">
              <span className="break-all font-mono text-[11px]">{cert.collection}</span>
            </Meta>
            <Meta label="Timeframe">
              <span className="font-mono text-[12px]">
                {cert.startDate} → {cert.endDate}
              </span>
            </Meta>
            <Meta label="Claimed by">
              {cert.creator ? (
                <a
                  href={`https://bsky.app/profile/${cert.creator.handle ?? cert.creator.did}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue hover:underline"
                >
                  {cert.creator.avatar && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cert.creator.avatar}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  )}
                  @{cert.creator.handle ?? cert.creator.did.slice(0, 16)}
                </a>
              ) : (
                <span className="text-gray-600">plrd.org</span>
              )}
            </Meta>
            <Meta label="Rights">{cert.rights}</Meta>
            <Meta label="Retreat">
              <a
                href={cert.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:underline"
              >
                See event →
              </a>
            </Meta>
            <div className="col-span-2">
              <Meta label="Contributors">
                <span className="text-gray-600">
                  {cert.contributors.map((c) => c.name).join(" · ")}
                </span>
              </Meta>
            </div>
          </div>
        </motion.div>

        {/* Funding economics */}
        {cert.funding && (
          <motion.div
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-10 rounded-2xl border border-gray-200 bg-gray-100 p-6 lg:p-8"
          >
            <p className={`${eyebrow} text-blue`}>Social return on investment</p>
            <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
              <div>
                <p className="font-serif text-[clamp(34px,4.5vw,52px)] leading-none tracking-tight text-black">
                  {cert.funding.roiLabel}
                </p>
                <p className={`${eyebrow} mt-1.5 text-gray-500`}>Social RoI to date</p>
              </div>
              <div>
                <p className="font-serif text-[clamp(34px,4.5vw,52px)] leading-none tracking-tight text-black">
                  {cert.funding.costLabel}
                </p>
                <p className={`${eyebrow} mt-1.5 text-gray-500`}>USD invested</p>
              </div>
              <p className="max-w-md flex-1 basis-64 text-[13.5px] leading-relaxed text-gray-600">
                {cert.funding.roiNote}
              </p>
            </div>
            {cert.funding.attribution && (
              <SocialRoiAttribution items={cert.funding.attribution} />
            )}
          </motion.div>
        )}

        {/* Evidence timeline */}
        <motion.div
          custom={2}
          variants={fade}
          initial="hidden"
          animate="show"
          className="mt-14"
        >
          <div className="mb-6 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-[clamp(20px,2.4vw,30px)] leading-tight tracking-tight text-black">
              Evidence <span className="italic text-blue">timeline</span>
            </h2>
            <span className={`${eyebrow} text-gray-500`}>
              {timeline.length} entries
              {loading ? " · syncing…" : ""}
            </span>
          </div>
          <div className="flex flex-col">
            {timeline.map((item, i) =>
              item.type === "static" ? (
                <EvidenceRow
                  key={`s-${item.entry.date}-${item.entry.title}`}
                  entry={item.entry}
                  index={i}
                />
              ) : (
                <LiveEvidenceRow
                  key={item.entry.uri}
                  entry={item.entry}
                  influence={liveInfluenceFor(item.entry.title)}
                />
              ),
            )}
          </div>

          {/* Provenance: what on this timeline is an actual ATProto record */}
          <p className="mt-6 max-w-2xl text-[12px] leading-relaxed text-gray-400">
            The{" "}
            <code className="text-[0.9em]">org.hypercerts.claim.activity</code>{" "}
            record for this retreat is published on the ATProto network
            {cert.published ? " and served from the hypercerts indexer" : ""}.
            Entries labeled{" "}
            <span className="text-[0.9em] font-semibold uppercase tracking-wide text-blue">
              community
            </span>{" "}
            are{" "}
            <code className="text-[0.9em]">org.hypercerts.context.attachment</code>{" "}
            records living on their authors&apos; own PDSs, discovered through
            the Constellation backlink index. Curated entries come from the
            retreat organizers.
          </p>
        </motion.div>

        {/* Comments */}
        <motion.div
          custom={3}
          variants={fade}
          initial="hidden"
          animate="show"
          className="mt-14 border-t border-gray-200 pt-10"
        >
          <CommentsSection
            cert={cert}
            activity={activity}
            loading={loading}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
