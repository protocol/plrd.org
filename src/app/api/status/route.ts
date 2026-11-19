import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Anonymous compatibility only. Website sessions no longer exist; deliberately
// do not inspect cookies or restore identities from retired sessions.
export async function GET() {
  return NextResponse.json({ did: null, handle: null, loggedIn: false }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
