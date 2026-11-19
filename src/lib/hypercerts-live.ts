// Live community data for a hypercert, fetched entirely client-side.
// Ported from researchretreat.org (src/lib/atproto/live.ts):
//
// 1. Constellation (constellation.microcosm.blue) — a public ATProto
//    backlink index — tells us which records anywhere on the network
//    link the hypercert's canonical URL (or its at:// claim URI).
// 2. Each linking record is hydrated from its author's own PDS
//    (DID doc → PDS endpoint → com.atproto.repo.getRecord).
// 3. Author profiles come from the public Bluesky AppView.
//
// Read-only here: contributions (evidence + comments) are written on
// researchretreat.org, and this page aggregates the same records.

export const EVIDENCE_COLLECTION = "org.hypercerts.context.attachment";
export const COMMENT_COLLECTION = "org.simocracy.feed.post";
export const LEGACY_COMMENT_COLLECTION = "org.impactindexer.review.comment";

const COMMENT_COLLECTIONS = new Set([
  COMMENT_COLLECTION,
  LEGACY_COMMENT_COLLECTION,
]);

const CONSTELLATION = "https://constellation.microcosm.blue";

export type LiveAuthor = {
  did: string;
  handle: string | null;
  displayName: string | null;
  avatar: string | null;
};

export type LiveComment = {
  uri: string;
  did: string;
  sourceURL?: string;
  text: string;
  createdAt: string;
  author: LiveAuthor;
};

export type LiveEvidence = {
  uri: string;
  did: string;
  sourceURL?: string;
  title: string;
  kind: string;
  description: string;
  links: string[];
  createdAt: string;
  author: LiveAuthor;
};

type LinkRef = { did: string; collection: string; rkey: string };

// ── Constellation ───────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** All (collection, path) pairs that link `target`, per Constellation. */
async function linkPairs(
  target: string,
): Promise<Array<{ collection: string; path: string }>> {
  const json = await fetchJson<{
    links?: Record<string, Record<string, { records: number }>>;
  }>(`${CONSTELLATION}/links/all?target=${encodeURIComponent(target)}`);
  const out: Array<{ collection: string; path: string }> = [];
  for (const [collection, paths] of Object.entries(json?.links ?? {})) {
    for (const [path, meta] of Object.entries(paths)) {
      if (meta.records > 0) out.push({ collection, path });
    }
  }
  return out;
}

async function linkingRecords(
  target: string,
  collection: string,
  path: string,
): Promise<LinkRef[]> {
  const json = await fetchJson<{
    linking_records?: Array<{ did: string; collection: string; rkey: string }>;
  }>(
    `${CONSTELLATION}/links?target=${encodeURIComponent(target)}&collection=${encodeURIComponent(collection)}&path=${encodeURIComponent(path)}`,
  );
  return json?.linking_records ?? [];
}

// ── DID → PDS resolution + record hydration ─────────────────────────

const pdsCache = new Map<string, Promise<string | null>>();

function resolvePds(did: string): Promise<string | null> {
  const cached = pdsCache.get(did);
  if (cached) return cached;
  const p = (async () => {
    let docUrl: string;
    if (did.startsWith("did:plc:")) {
      docUrl = `https://plc.directory/${did}`;
    } else if (did.startsWith("did:web:")) {
      docUrl = `https://${did.slice("did:web:".length).split(":").join("/")}/.well-known/did.json`;
    } else {
      return null;
    }
    const doc = await fetchJson<{
      service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
    }>(docUrl);
    const svc = doc?.service?.find(
      (s) => s.id === "#atproto_pds" || s.type === "AtprotoPersonalDataServer",
    );
    return svc?.serviceEndpoint ?? null;
  })();
  pdsCache.set(did, p);
  return p;
}

async function getRecord(ref: LinkRef): Promise<Record<string, unknown> | null> {
  const pds = await resolvePds(ref.did);
  if (!pds) return null;
  const json = await fetchJson<{ value?: Record<string, unknown> }>(
    `${pds}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(ref.did)}&collection=${encodeURIComponent(ref.collection)}&rkey=${encodeURIComponent(ref.rkey)}`,
  );
  return json?.value ?? null;
}

// ── Profiles ────────────────────────────────────────────────────────

async function getProfiles(dids: string[]): Promise<Map<string, LiveAuthor>> {
  const out = new Map<string, LiveAuthor>();
  const unique = [...new Set(dids)];
  for (const did of unique) {
    out.set(did, { did, handle: null, displayName: null, avatar: null });
  }
  // Batch profile lookups against the public AppView (25 per call).
  for (let i = 0; i < unique.length; i += 25) {
    const batch = unique.slice(i, i + 25);
    const params = batch.map((d) => `actors=${encodeURIComponent(d)}`).join("&");
    const json = await fetchJson<{
      profiles?: Array<{
        did: string;
        handle: string;
        displayName?: string;
        avatar?: string;
      }>;
    }>(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfiles?${params}`);
    for (const p of json?.profiles ?? []) {
      out.set(p.did, {
        did: p.did,
        handle: p.handle ?? null,
        displayName: p.displayName ?? null,
        avatar: p.avatar ?? null,
      });
    }
  }
  return out;
}

// ── Record parsing ──────────────────────────────────────────────────

/** Only expose an explicit current record URL, never an inferred editor URL. */
export function publicSourceURL(value: unknown): string | undefined {
  // URL() repairs malformed authority forms. Reject them rather than returning a
  // raw href that the browser may interpret relative to the current HTTPS page.
  if (typeof value !== "string" || !/^https:\/\/[^/\\\s]/i.test(value) || /[\\\s]/.test(value)) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? value : undefined;
  } catch {
    return undefined;
  }
}

function parseDescription(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const v = value as Record<string, unknown>;
  if (typeof v.value === "string") return v.value;
  if (Array.isArray(v.blocks)) {
    return v.blocks
      .map((b) => {
        const block = (b as { block?: { plaintext?: string } }).block;
        return block?.plaintext ?? "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

function parseEvidence(
  ref: LinkRef,
  value: Record<string, unknown>,
  canonicalUri: string,
): Omit<LiveEvidence, "author"> | null {
  const title = typeof value.title === "string" ? value.title : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  if (!title || !createdAt) return null;
  const links: string[] = [];
  if (Array.isArray(value.content)) {
    for (const item of value.content) {
      const uri = (item as { uri?: string }).uri;
      if (typeof uri === "string" && uri !== canonicalUri) links.push(uri);
    }
  }
  return {
    uri: `at://${ref.did}/${ref.collection}/${ref.rkey}`,
    did: ref.did,
    title,
    kind: typeof value.contentType === "string" ? value.contentType : "evidence",
    description: parseDescription(value.description),
    links,
    sourceURL: publicSourceURL(value.sourceURL),
    createdAt,
  };
}

function parseComment(
  ref: LinkRef,
  value: Record<string, unknown>,
  canonicalUri: string,
): Omit<LiveComment, "author"> | null {
  let text = typeof value.text === "string" ? value.text : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  if (!text || !createdAt) return null;
  // feed.post comments carry the canonical claim URL as an appended,
  // faceted link line — strip it for display here, where the context is
  // already the claim page.
  if (canonicalUri && text.endsWith(canonicalUri)) {
    text = text.slice(0, -canonicalUri.length).trimEnd();
  }
  if (!text) return null;
  return {
    uri: `at://${ref.did}/${ref.collection}/${ref.rkey}`,
    did: ref.did,
    text,
    sourceURL: publicSourceURL(value.sourceURL),
    createdAt,
  };
}

// ── Public API ──────────────────────────────────────────────────────

export type LiveActivity = {
  evidence: LiveEvidence[];
  comments: LiveComment[];
};

/**
 * Fetch all community evidence + comments linking any of the given
 * target URIs (canonical https URL and, when present, the at:// claim).
 */
export async function fetchLiveActivity(targets: string[]): Promise<LiveActivity> {
  const canonical = targets[0] ?? "";
  const refs = new Map<string, LinkRef>();

  await Promise.all(
    targets.map(async (target) => {
      const pairs = (await linkPairs(target)).filter(
        (p) =>
          p.collection === EVIDENCE_COLLECTION ||
          COMMENT_COLLECTIONS.has(p.collection),
      );
      await Promise.all(
        pairs.map(async ({ collection, path }) => {
          for (const rec of await linkingRecords(target, collection, path)) {
            refs.set(`at://${rec.did}/${rec.collection}/${rec.rkey}`, rec);
          }
        }),
      );
    }),
  );

  const refList = [...refs.values()];
  const values = await Promise.all(
    refList.map(async (ref) => ({ ref, value: await getRecord(ref) })),
  );

  const rawEvidence: Array<Omit<LiveEvidence, "author">> = [];
  const rawComments: Array<Omit<LiveComment, "author">> = [];
  for (const { ref, value } of values) {
    if (!value) continue;
    if (ref.collection === EVIDENCE_COLLECTION) {
      const e = parseEvidence(ref, value, canonical);
      if (e) rawEvidence.push(e);
    } else {
      const c = parseComment(ref, value, canonical);
      if (c) rawComments.push(c);
    }
  }

  const profiles = await getProfiles([
    ...rawEvidence.map((e) => e.did),
    ...rawComments.map((c) => c.did),
  ]);
  const author = (did: string): LiveAuthor =>
    profiles.get(did) ?? { did, handle: null, displayName: null, avatar: null };

  const byDateAsc = (a: { createdAt: string }, b: { createdAt: string }) =>
    a.createdAt.localeCompare(b.createdAt);

  return {
    evidence: rawEvidence
      .map((e) => ({ ...e, author: author(e.did) }))
      .sort(byDateAsc),
    comments: rawComments
      .map((c) => ({ ...c, author: author(c.did) }))
      .sort(byDateAsc),
  };
}
