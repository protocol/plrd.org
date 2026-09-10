import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    // Public identity DTO only. Session also contains private OAuth material.
    const identity = Object.fromEntries(
      (['did', 'handle', 'displayName', 'avatar'] as const)
        .filter(key => typeof session[key] === 'string')
        .map(key => [key, session[key]])
    )
    return NextResponse.json(identity, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({}, { status: 500, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
