"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLabIdentity } from "@/lib/lab-identity";
import {
  artifacts,
  fields,
  postTypes,
  filterArtifacts,
  fieldLabel,
  starterDisclosure,
} from "@/lib/lab-data";
import { createLabClient, safeUrl } from "@/lib/lab-client";
import { loadDraft, saveDraft } from "@/lib/lab-drafts";
import { labInspectorHref, type LabNotebook } from "@/lib/lab-notebook";
import type { LabRecordView } from "@/lib/lab-protocol";
import type { Artifact, LabFeed } from "@/lib/lab-types";
import RecordEditor from "@/components/lab/RecordEditor";
import styles from "@/components/lab/feed/feed.module.css";
import ArtifactBrief from "@/components/lab/ArtifactBrief";
import { useLabFilters } from "@/components/lab/useLabFilters";

const client = createLabClient();
export default function PublicFeedSources() {
  const f = useLabFilters();
  const { isAuthenticated, session, isLoading } = useLabIdentity();
  const [compose, setCompose] = useState(false);
  const [evidence, setEvidence] = useState<Artifact | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState("starters");
  const [live, setLive] = useState<LabFeed | null>(null);
  const [records, setRecords] = useState<LabRecordView[]>([]);
  const [notebook, setNotebook] = useState<LabNotebook | null>(null);
  const [recordError, setRecordError] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    client.feed().then(setLive);
  }, []);
  useEffect(() => {
    setSaved([]);
    try {
      const result = loadDraft(
        localStorage,
        "promising",
        session?.did || "guest",
      );
      if (result.status === 'corrupt' || result.status === 'blocked' || (result.data && !Array.isArray(result.data.ids))) setNotice('Your saved source interests are unreadable and preserved. They were not overwritten.');
      if (Array.isArray(result.data?.ids))
        setSaved(
          result.data.ids.filter((id): id is string => typeof id === "string"),
        );
      else setSaved([]);
    } catch { setNotice('Browser storage is unavailable. Source interests were not changed.'); }
  }, [session?.did]);
  useEffect(() => {
    let active = true;
    setRecords([]);
    setNotebook(null);
    setRecordError("");
    setRecordsLoading(isAuthenticated && !isLoading);
    if (isAuthenticated && session?.did && !isLoading)
      client
        .records(session.did)
        .then((v) => { if (active) { setRecords(v.records); setNotebook(v); } })
        .catch((e) => { if (active) setRecordError(e.message); })
        .finally(() => { if (active) setRecordsLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, session?.did, isLoading, revision]);
  function interest(id: string) {
    if (isLoading) { setNotice('Wait for this identity to finish restoring.'); return; }
    try {
      const owner = session?.did || 'guest', current = loadDraft(localStorage, 'promising', owner);
      if (current.status === 'corrupt' || current.status === 'blocked' || (current.data && (!Array.isArray(current.data.ids) || !current.data.ids.every(v => typeof v === 'string')))) {
        setNotice('Your saved source interests are unreadable and preserved. They were not overwritten.'); return;
      }
      const ids = (current.data?.ids || []) as string[], next = ids.includes(id) ? ids.filter(v => v !== id) : [...ids, id];
      const result = saveDraft(localStorage, 'promising', owner, { ...current.data, ids: next });
      const confirmed = result.ok && JSON.stringify(loadDraft(localStorage, 'promising', owner).data?.ids) === JSON.stringify(next);
      if (confirmed) setSaved(next);
      setNotice(confirmed ? 'Personal source interest saved in this browser, separate from demo activity. Not an endorsement.' : 'Browser storage did not confirm the save. Your previous selection is unchanged.');
    } catch { setNotice('Browser storage is unavailable. Your previous selection is unchanged.'); }
  }
  const filtered = filterArtifacts(artifacts, f);
  const posts = (live?.items || []).filter((p) =>
    p.text.toLowerCase().includes(f.query.toLowerCase()),
  );
  const own = records.filter((r): r is LabRecordView<"note"> => r.kind === "note").filter(
    (r) =>
      String(r.data?.text || "")
        .toLowerCase()
        .includes(f.query.toLowerCase()) &&
      (f.field === "all" || r.data.field === f.field) &&
      (f.type === "all" || r.data.postType === f.type),
  );
  return (
    <div className={styles.publicSources}>
          <section className="lab-stream" aria-label="Scientific work">
            <button className="lab-button" onClick={() => setCompose(true)}>Made something that makes science easier? Start a draft →</button>
            <div className={styles.actions}><label>Kind <select aria-label="Source kind" value={f.type} onChange={e => f.setType(e.target.value)}><option value="all">All kinds</option>{postTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label><label>Discipline <select aria-label="Source discipline" value={f.field} onChange={e => f.setField(e.target.value)}><option value="all">All fields</option>{fields.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label></div>
            <div className="lab-stream-tools">
              <label className="lab-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  aria-label="Search scientific work"
                  placeholder="Find a question, tool, or idea…"
                  value={f.query}
                  onChange={(e) => f.setQuery(e.target.value)}
                />
              </label>
              <div className="lab-source-tabs">
                <button
                  aria-pressed={source === "starters"}
                  onClick={() => setSource("starters")}
                >
                  Editorial starters
                </button>
                <button
                  aria-pressed={source === "bluesky"}
                  onClick={() => setSource("bluesky")}
                >
                  From Bluesky
                </button>
                <button
                  aria-pressed={source === "mine"}
                  onClick={() => setSource("mine")}
                >
                  Your records
                </button>
              </div>
            </div>
            <p className="lab-smallprint">
              {source === "starters"
                ? starterDisclosure
                : source === "bluesky"
                  ? live?.sourceLabel || "Loading public source…"
                  : "Your authenticated public records. Drafts stay on your bench."}
            </p>
            {notice && (
              <p className="lab-inline-status" role="status">
                {notice}
              </p>
            )}
            {source === "starters" && (
              <>
                <p className="lab-result-count" aria-live="polite">
                  {filtered.length} starting points
                </p>
                {filtered.map((a) => (
                  <article className="lab-feed-entry" key={a.id}>
                    <div className="lab-entry-meta">
                      <span>
                        {postTypes.find((t) => t.id === a.type)?.label}
                      </span>
                      <span>{fieldLabel(a.field)}</span>
                    </div>
                    <h2>
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        {a.title} <span>↗</span>
                      </a>
                    </h2>
                    <p>{a.description}</p>
                    <p className="lab-entry-question">{a.prompt}</p>
                    <details><summary>Contribution brief</summary><ArtifactBrief artifact={a} /></details>
                    <div className="lab-entry-source">{a.source}</div>
                    <div className="lab-entry-actions">
                      <button
                        aria-pressed={saved.includes(a.id)}
                        onClick={() => interest(a.id)}
                      >
                        {saved.includes(a.id)
                          ? "✦ Promising · saved"
                          : "✧ Promising"}
                      </button>
                      <button onClick={() => setEvidence(a)}>
                        Add evidence +
                      </button>
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        Source ↗
                      </a>
                    </div>
                  </article>
                ))}
                {!filtered.length && (
                  <div className="lab-empty">
                    <h2>That space is still open.</h2>
                    <p>
                      No editorial starters match these filters. A useful
                      negative result or a call for help can be the start of
                      something.
                    </p>
                    <button className="lab-button lab-quiet" onClick={f.reset}>
                      Clear filters
                    </button>
                    <button
                      className="lab-text-button"
                      onClick={() => setCompose(true)}
                    >
                      Write the first draft →
                    </button>
                  </div>
                )}
              </>
            )}
            {source === "bluesky" && (
              <>
                <div className="lab-live-status">
                  <span
                    className={
                      live?.status === "live"
                        ? "lab-blue-dot"
                        : "lab-status-dot"
                    }
                  />
                  <span>
                    {live
                      ? live.status === "live"
                        ? "Public source connected"
                        : live.status === "empty"
                          ? "No posts returned"
                          : "Live source unavailable"
                      : "Checking public source…"}
                  </span>
                  <button
                    className="lab-text-button"
                    disabled={refreshing}
                    onClick={async () => {
                      setRefreshing(true);
                      setLive(await client.feed());
                      setRefreshing(false);
                    }}
                  >
                    {refreshing ? "Checking…" : "Retry source ↻"}
                  </button>
                </div>
                {live?.fetchedAt && (
                  <p className="lab-smallprint">
                    Fetched {new Date(live.fetchedAt).toLocaleString("en-US")}
                  </p>
                )}
                {live?.sourceUrl && <a href={live.sourceUrl} className="lab-text-button" target="_blank" rel="noopener noreferrer">Open the source feed on Bluesky ↗</a>}
                {(f.field !== "all" || f.type !== "all") && (
                  <p className="lab-notice">
                    Field and kind filters do not classify Bluesky posts. Text
                    search still applies.
                  </p>
                )}
                {posts.map((p) => (
                  <article className="lab-feed-entry" key={p.uri}>
                    <div className="lab-entry-meta">
                      {p.author.displayName || p.author.handle} · @
                      {p.author.handle}
                    </div>
                    <p className="lab-live-text">{p.text}</p>
                    <div className="lab-entry-source">
                      <time dateTime={p.createdAt}>
                        {new Date(p.createdAt).toLocaleString("en-US")}
                      </time>
                    </div>
                    <a
                      href={safeUrl(p.url) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lab-text-button"
                    >
                      Open original on Bluesky ↗
                    </a>
                  </article>
                ))}
                {!posts.length && (
                  <div className="lab-empty">
                    <h2>
                      {live?.status === "unavailable"
                        ? "A quiet window, not a pretend feed."
                        : "Nothing here yet."}
                    </h2>
                    <p>
                      {live?.message ||
                        "No public posts matched. Explore the editorial collection or start a local draft."}
                    </p>
                    <button
                      className="lab-text-button"
                      onClick={() => setSource("starters")}
                    >
                      Explore editorial starters →
                    </button>
                  </div>
                )}
              </>
            )}
            {source === "mine" && (
              <>
                {notebook && <p className="lab-smallprint">Showing up to {notebook.limit} per collection{notebook.hasMore ? " / more exist" : " / no further pages reported"}. Current-PDS HTTPS read, not a repository-signature proof or peer review. Only matching notes appear here; all returned kinds are on your bench.</p>}
                {isLoading ? <p role="status">Restoring your identity…</p> : !isAuthenticated ? (
                  <div className="lab-empty">
                    <h2>Your public work goes here.</h2>
                    <p>
                      Sign in to read your records. You can start a draft before
                      creating an account.
                    </p>
                    <Link href="/lab/profile/" className="lab-button lab-quiet">
                      Go to my bench →
                    </Link>
                  </div>
                ) : recordsLoading ? <p role="status" className="lab-smallprint">Reading your public records…</p> : recordError ? (
                  <p className="lab-error" role="alert">
                    {recordError}
                  </p>
                ) : own.length ? (
                  own.map((r) => (
                    <article className="lab-feed-entry" key={r.uri}>
                      <span className="lab-eyebrow">YOUR PUBLIC RECORD</span>
                      <p>{String(r.data.text || "")}</p>
                      <a href={labInspectorHref(r.uri)}>Inspect exact public note ↗</a>
                      <code className="lab-receipt">{r.uri}</code>
                      <small>CID: {r.cid} · Current PDS: {r.pds}</small>
                    </article>
                  ))
                ) : (
                  <div className="lab-empty">
                    <h2>A clean notebook.</h2>
                    <p>
                      No matching public notes were returned. Your local drafts
                      have not been published.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
      {compose && !isLoading && (
        <RecordEditor kind="note" onSaved={() => setRevision(n => n + 1)} onClose={() => setCompose(false)} />
      )}{" "}
      {evidence && !isLoading && (
        <RecordEditor
          kind="contribution"
          initial={{ targetUrl: evidence.url, field: evidence.field }}
          onClose={() => setEvidence(null)}
        />
      )}
    </div>
  );
}
