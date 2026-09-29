import { interventionArt } from '@/lib/intervention-art'

/** Text and status remain outside the image; decorative art adds no duplicate link name. */
export default function InterventionCover({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const art = interventionArt(slug)
  if (!art) return null
  return (
    <img
      src={compact ? art.thumbnail : art.src}
      srcSet={compact ? undefined : `${art.thumbnail} 320w, ${art.src} 960w`}
      sizes={compact ? undefined : '(max-width: 639px) calc(100vw - 48px), (max-width: 1023px) 90vw, 720px'}
      width={compact ? 320 : 960}
      height={compact ? 180 : 540}
      alt=""
      loading="lazy"
      decoding="async"
      className={compact
        ? 'aspect-video w-[72px] shrink-0 self-start bg-[#f5f0df] object-cover'
        : 'aspect-video w-full shrink-0 border-b border-black/10 bg-[#f5f0df] object-cover'}
      data-intervention-cover={slug}
    />
  )
}
