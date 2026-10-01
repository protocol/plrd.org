import { NextResponse } from 'next/server'
import { ABOUT_CONTENT_URL } from '@/lib/about'

// Retire only About's CMS endpoint. Other page records keep their existing API.
// Keep the historical PDS record intact; never present it as the live page copy.
export function GET() {
  return NextResponse.json({
    error: 'About content is maintained in the repository. Please propose changes in a pull request.',
    readOnly: true,
    contentUrl: ABOUT_CONTENT_URL,
  }, { status: 410 })
}

export const PUT = GET
