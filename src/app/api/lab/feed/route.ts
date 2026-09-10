import { loadLabPublicFeed } from '@/lib/lab-public-feed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Read-only, public, source-attributed discovery. No user-selected upstream. */
export async function GET() {
  const body = await loadLabPublicFeed()
  const unavailable = body.status === 'unavailable'
  return Response.json(body, {
    status: unavailable ? 503 : 200,
    headers: {
      'Cache-Control': unavailable ? 'no-store' : 'public, max-age=30, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
