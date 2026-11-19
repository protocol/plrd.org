import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  try {
    const session = await getSession()
    // Deliberate allowlist: never serialize the encrypted cookie's OAuth state.
    return NextResponse.json({
      did: session.did ?? null,
      handle: session.handle ?? null,
      loggedIn: Boolean(session.did),
    }, { headers })
  } catch {
    console.error('Failed to get session')
    return NextResponse.json({}, { status: 500, headers })
  }
}
