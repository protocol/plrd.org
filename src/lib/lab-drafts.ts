type ReadStore = Pick<Storage, "getItem">;
type WriteStore = Pick<Storage, "setItem">;
export function draftSlot(kind: string, context: Record<string, string> = {}) {
  const target = kind === "contribution" ? context.targetUrl : kind === "participation" ? [context.campaignId, context.taskId, context.role].filter(Boolean).join("|") : "";
  return target ? `${kind}:${encodeURIComponent(target)}` : kind;
}
export function listDrafts(storage: Storage, owner: string) {
  const prefix = draftKey("", owner);
  const rows: { slot: string; kind: string; savedAt?: string; data: Record<string, unknown> }[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const slot = key.slice(prefix.length);
    const kind = slot.split(":")[0];
    if (!["profile", "note", "app", "contribution", "participation"].includes(kind)) continue;
    const draft = loadDraft(storage, slot, owner);
    if (draft.data) rows.push({ slot, kind, savedAt: draft.savedAt, data: draft.data });
  }
  return rows.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
}
export const draftKey = (kind: string, owner: string) =>
  `plrd:open-lab:v1:${encodeURIComponent(owner)}:${kind}`;
export function saveDraft(
  storage: WriteStore,
  kind: string,
  owner: string,
  data: Record<string, unknown>,
) {
  try {
    storage.setItem(
      draftKey(kind, owner),
      JSON.stringify({ version: 1, data, savedAt: new Date().toISOString() }),
    );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
export function loadDraft(
  storage: ReadStore,
  kind: string,
  owner: string,
): {
  data: Record<string, unknown> | null;
  status: "saved" | "empty" | "corrupt" | "blocked";
  savedAt?: string;
} {
  try {
    const raw = storage.getItem(draftKey(kind, owner));
    if (!raw) return { data: null, status: "empty" };
    try {
      const value = JSON.parse(raw);
      if (
        value.version !== 1 ||
        !value.data ||
        typeof value.data !== "object" ||
        Array.isArray(value.data)
      )
        return { data: null, status: "corrupt" };
      return { data: value.data, status: "saved", savedAt: value.savedAt };
    } catch {
      return { data: null, status: "corrupt" };
    }
  } catch {
    return { data: null, status: "blocked" };
  }
}
