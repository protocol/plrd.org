import type {
  Capabilities,
  LabFeed,
  LabProfile,
  LabRecord,
  RecordKind,
} from "@/lib/lab-types";

export function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname) ||
      url.hostname.endsWith(".local")
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export function createLabClient(fetcher: typeof fetch = fetch) {
  async function request(
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetcher(path, {
        method: body ? "POST" : "GET",
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(
        "The network is unavailable. Your local draft is safe; try again later.",
      );
    }
    let value: Record<string, unknown> = {};
    try {
      const json = await response.json();
      if (json && typeof json === "object" && !Array.isArray(json)) value = json;
    } catch {
      /* HTML/empty response is not success. */
    }
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? "Sign in again before publishing. Your draft is still here."
          : typeof value.error === "string"
            ? value.error
            : "Open Lab services are unavailable. Keep working locally and try again later.",
      );
    return value;
  }
  return {
    async capabilities(): Promise<Capabilities> {
      try {
        const v = await request("/api/lab/capabilities/");
        if (
          typeof v.canSignIn !== "boolean" ||
          typeof v.canPublish !== "boolean" ||
          !["ready", "unconfigured"].includes(String(v.mode))
        )
          throw Error();
        return v as Capabilities;
      } catch {
        return {
          canSignIn: false,
          canPublish: false,
          mode: "unconfigured",
          message:
            "Publishing and sign-in are not available in this environment. Drafts and downloads work without an account.",
        };
      }
    },
    async feed(): Promise<LabFeed> {
      try {
        const v = await request("/api/lab/feed/");
        if (
          !Array.isArray(v.items) ||
          !["live", "empty", "unavailable"].includes(String(v.status))
        )
          throw Error();
        const items = v.items.slice(0, 100).filter(
          (p): p is LabFeed["items"][number] =>
            typeof p?.text === "string" &&
            typeof p?.uri === "string" &&
            typeof p?.author?.did === "string" &&
            typeof p?.author?.handle === "string" &&
            !!safeUrl(p.url) &&
            Number.isFinite(Date.parse(p.createdAt)),
        ).map(p => ({
          uri: p.uri, text: p.text.slice(0, 10000), url: p.url, createdAt: p.createdAt,
          cid: typeof p.cid === "string" ? p.cid : undefined,
          author: { did: p.author.did, handle: p.author.handle,
            displayName: typeof p.author.displayName === "string" ? p.author.displayName : undefined,
          },
        }));
        if (v.status === "live" && !items.length) throw Error("No usable posts returned");
        return {
          items,
          sourceLabel:
            typeof v.sourceLabel === "string"
              ? v.sourceLabel
              : "Public Bluesky posts",
          sourceUrl: typeof v.sourceUrl === "string" ? safeUrl(v.sourceUrl) || undefined : undefined,
          fetchedAt: typeof v.fetchedAt === "string" && Number.isFinite(Date.parse(v.fetchedAt)) ? v.fetchedAt : null,
          status: v.status as LabFeed["status"],
          message: typeof v.message === "string" ? v.message : undefined,
        };
      } catch {
        return {
          items: [],
          sourceLabel: "Public Bluesky posts",
          fetchedAt: null,
          status: "unavailable",
          message:
            "The live source could not be reached. Editorial starters are available below.",
        };
      }
    },
    async records(): Promise<{
      profile: LabProfile | null;
      records: LabRecord[];
    }> {
      const v = await request("/api/lab/records/");
      const profile = v.profile as LabProfile | null;
      const validProfile = !profile || (
        typeof profile.workingOn === "string" && typeof profile.lookingFor === "string" &&
        Array.isArray(profile.interests) && profile.interests.every(i => typeof i === "string") &&
        (!profile.githubUrl || typeof profile.githubUrl === "string") &&
        (!profile.scholarUrl || typeof profile.scholarUrl === "string")
      );
      if (!validProfile || !Array.isArray(v.records) || v.records.some(r => !r || typeof r.uri !== "string" || !r.uri.startsWith("at://") || !["profile", "note", "app", "contribution", "participation"].includes(r.kind) || !r.data || typeof r.data !== "object" || Array.isArray(r.data)))
        throw Error(
          "Your public records could not be read. Local drafts are unchanged.",
        );
      return {
        profile: (v.profile as LabProfile) || null,
        records: v.records as LabRecord[],
      };
    },
    async publish(
      kind: RecordKind,
      data: Record<string, unknown>,
    ): Promise<{ uri: string; cid: string; record: unknown }> {
      const v = await request("/api/lab/records/", { kind, data });
      if (
        typeof v.uri !== "string" ||
        !v.uri.startsWith("at://") ||
        typeof v.cid !== "string" ||
        !v.record
      )
        throw Error(
          "No verified public record receipt was returned. Do not retry before checking your records.",
        );
      return v as { uri: string; cid: string; record: unknown };
    },
    async login(handle: string, returnTo: string): Promise<string> {
      void handle;
      void returnTo;
      // Integration owner replaces this seam with the dedicated browser SDK.
      // Never fall back to the legacy CMS login endpoint.
      throw Error("Open Lab sign-in is unavailable until the browser identity adapter is integrated. Nothing was published.");
    },
  };
}
