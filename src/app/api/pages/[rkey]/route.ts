import { NextRequest, NextResponse } from "next/server"
import { AtpAgent } from "@atproto/api"
import { revalidateTag } from "next/cache"
import { fetchPage } from "@/lib/indexer"
import { aboutCmsRetiredResponse } from "@/lib/about-cms"
import { getSession } from "@/lib/session"
import { ADMIN_DID, ADMIN_DIDS, PAGE_COLLECTION } from "@/lib/lexicons"
import { env } from "@/lib/env"
import { diffFields, writeEditEvent } from "@/lib/audit"
import type { PageRecord } from "@/lib/lexicons"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ rkey: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { rkey } = await params
  // Next decodes dynamic parameters, including percent-encoded About paths.
  if (rkey === "about") return aboutCmsRetiredResponse()
  try {
    const record = await fetchPage(rkey)
    if (!record) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }
    return NextResponse.json({ rkey, record })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 })
  }
}

/**
 * Get an agent authenticated as plresearch.org via app password.
 * This is needed because page records live on plresearch.org's repo,
 * but the admin user may be logged in as a different DID (e.g. daviddao.org).
 */
async function getPlresearchAgent(): Promise<AtpAgent> {
  const handle = env.ATPROTO_HANDLE
  const password = env.ATPROTO_PASSWORD
  if (!handle || !password) {
    throw new Error("ATPROTO_HANDLE and ATPROTO_PASSWORD must be set")
  }
  const agent = new AtpAgent({ service: "https://bsky.social" })
  await agent.login({ identifier: handle, password })
  return agent
}

export async function PUT(req: NextRequest, { params }: Props) {
  const { rkey } = await params
  // Next decodes dynamic parameters, including percent-encoded About paths.
  if (rkey === "about") return aboutCmsRetiredResponse()
  const session = await getSession()

  // Auth check — user must be logged in
  if (!session.did) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Admin check — only admin DIDs can edit pages
  if (!ADMIN_DIDS.includes(session.did)) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
  }

  try {
    const body: PageRecord = await req.json()

    // Validate required fields
    if (!body.pageId || !body.sections || !Array.isArray(body.sections)) {
      return NextResponse.json({ error: "Invalid page record" }, { status: 400 })
    }

    // Snapshot the prior record so we can compute which fields changed.
    const prior = await fetchPage(rkey).catch(() => null)

    const nextRecord = {
      $type: PAGE_COLLECTION,
      pageId: body.pageId,
      iconType: body.iconType,
      leads: body.leads,
      advisors: body.advisors,
      sections: body.sections,
      updatedAt: new Date().toISOString(),
    }

    // Authenticate as plresearch.org to write to its repo
    const agent = await getPlresearchAgent()

    // Write to plresearch.org's repo using putRecord
    const response = await agent.com.atproto.repo.putRecord({
      repo: ADMIN_DID,
      collection: PAGE_COLLECTION,
      rkey,
      record: nextRecord,
    })

    // Bust the ISR cache so pages reflect the update immediately
    revalidateTag("indexer")

    // Fire-and-forget audit log to the editor's own PDS.
    await writeEditEvent({
      targetUri: response.data.uri,
      targetCid: response.data.cid,
      collection: PAGE_COLLECTION,
      changedFields: diffFields(prior as Record<string, unknown> | null, nextRecord),
    })

    return NextResponse.json({ uri: response.data.uri, cid: response.data.cid })
  } catch (error) {
    console.error("Failed to update page:", error)
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 })
  }
}
