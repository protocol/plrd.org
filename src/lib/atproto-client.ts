import { AtpAgent } from '@atproto/api'
import { PUBLIC_CONTENT_DID, PAGE_COLLECTION } from './lexicons'
import type { PageRecord } from './lexicons'

/**
 * Public Bluesky API agent (for resolving handles and profiles)
 */
const publicAgent = new AtpAgent({ service: 'https://public.api.bsky.app' })

/**
 * Cache for PDS URLs
 */
const pdsCache = new Map<string, string>()

/**
 * Resolve a DID to its PDS URL via plc.directory
 */
export async function resolvePds(did: string): Promise<string | null> {
  const cached = pdsCache.get(did)
  if (cached) return cached

  try {
    const response = await fetch(`https://plc.directory/${did}`)
    if (!response.ok) return null

    const doc = await response.json()
    const pdsService = doc.service?.find(
      (s: { id: string; type: string; serviceEndpoint: string }) =>
        s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer'
    )

    if (!pdsService?.serviceEndpoint) return null

    const pdsUrl = pdsService.serviceEndpoint
    pdsCache.set(did, pdsUrl)
    return pdsUrl
  } catch {
    return null
  }
}

/**
 * Create an AtpAgent for a specific PDS
 */
export function getPdsAgent(pdsUrl: string): AtpAgent {
  return new AtpAgent({ service: pdsUrl })
}

/**
 * Resolve a handle to a DID using the public API
 */
export async function resolveHandle(handle: string): Promise<string | null> {
  try {
    const normalizedHandle = handle.includes('.') ? handle : `${handle}.bsky.social`
    const response = await publicAgent.resolveHandle({ handle: normalizedHandle })
    return response.data.did
  } catch {
    return null
  }
}

/**
 * Get profile data from the public API
 */
export async function getPublicProfile(actor: string) {
  try {
    const response = await publicAgent.getProfile({ actor })
    return response.data
  } catch {
    return null
  }
}

/**
 * Fetch a single page record from the public content PDS.
 */
export async function getPageRecord(rkey: string): Promise<PageRecord | null> {
  try {
    const pdsUrl = await resolvePds(PUBLIC_CONTENT_DID)
    if (!pdsUrl) return null
    const pdsAgent = getPdsAgent(pdsUrl)
    const response = await pdsAgent.com.atproto.repo.getRecord({
      repo: PUBLIC_CONTENT_DID,
      collection: PAGE_COLLECTION,
      rkey,
    })
    return response.data.value as PageRecord
  } catch {
    return null
  }
}

/**
 * Fetch all page records from the public content PDS.
 */
export async function getAllPageRecords(): Promise<{ rkey: string; record: PageRecord }[]> {
  try {
    const pdsUrl = await resolvePds(PUBLIC_CONTENT_DID)
    if (!pdsUrl) return []
    const pdsAgent = getPdsAgent(pdsUrl)
    const response = await pdsAgent.com.atproto.repo.listRecords({
      repo: PUBLIC_CONTENT_DID,
      collection: PAGE_COLLECTION,
      limit: 100,
    })
    return response.data.records.map((r) => ({
      rkey: r.uri.split("/").pop()!,
      record: r.value as PageRecord,
    }))
  } catch {
    return []
  }
}
