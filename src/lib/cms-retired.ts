import { NextResponse } from 'next/server'

export const GITHUB_EDITING_GUIDE = 'https://github.com/protocol/plrd.org/blob/main/CONTRIBUTING.md'

/** Tombstone only: no request, cookie, credential, or remote client is needed. */
export function cmsRetiredResponse(contentUrl = GITHUB_EDITING_GUIDE) {
  return NextResponse.json({
    error: 'Website login, editing, publishing, and deletion have been retired. Propose website content changes in a GitHub pull request. Manage external community records at their originating service.',
    readOnly: true,
    contentUrl,
  }, { status: 410, headers: { 'Cache-Control': 'no-store' } })
}
