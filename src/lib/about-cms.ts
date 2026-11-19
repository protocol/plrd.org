import { NextResponse } from 'next/server'
import { ABOUT_CONTENT_URL } from '@/lib/about'

export function aboutCmsRetiredResponse() {
  return NextResponse.json({
    error: 'About content is maintained in the repository. Please propose changes in a pull request.',
    readOnly: true,
    contentUrl: ABOUT_CONTENT_URL,
  }, { status: 410 })
}
