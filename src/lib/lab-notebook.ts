import { assertLabDid, listLabRecords, type LabRecordView } from "@/lib/lab-protocol";
import { LAB_COLLECTIONS, type LabKind } from "@/lib/lab-oauth-config";
import type { LabDataMap } from "@/lib/lab-validation";
export async function loadLabNotebook(did: string, list = listLabRecords) {
  assertLabDid(did);
  const limit = 30;
  const pages = await Promise.all((Object.keys(LAB_COLLECTIONS) as LabKind[]).map(kind => list(did, kind, { limit })));
  const records: LabRecordView[] = [];
  const cursors: Partial<Record<LabKind, string>> = {};
  for (const page of pages) {
    if (page.authorDid !== did || page.records.some(r => r.authorDid !== did || r.kind !== page.kind)) throw Error("Notebook identity mismatch. Local drafts are unchanged.");
    records.push(...page.records);
    if (page.cursor) cursors[page.kind] = page.cursor;
  }
  const profileRecord = records.find(r => r.kind === "profile") ?? null;
  return { profile: profileRecord ? profileRecord.data as LabDataMap['profile'] : null, profileRecord, records, limit, cursors, hasMore: Object.keys(cursors).length > 0 };
}
export type LabNotebook = Awaited<ReturnType<typeof loadLabNotebook>>;
export const labInspectorHref = (uri: string) => `/lab/record/?uri=${encodeURIComponent(uri)}`;
