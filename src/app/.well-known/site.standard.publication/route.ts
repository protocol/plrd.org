import { NextResponse } from "next/server"
import { REPO_PUBLICATION_URI } from "@/lib/indexer"

export const dynamic = "force-dynamic"

export async function GET() {
  // Preserve the published identity; configuration no longer changes website content.
  return new NextResponse(REPO_PUBLICATION_URI, {
    headers: { "Content-Type": "text/plain" },
  })
}
