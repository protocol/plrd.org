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
import ResearchMap from "@/components/lab/ResearchMap";
import ArtifactBrief from "@/components/lab/ArtifactBrief";
import { useLabFilters } from "@/components/lab/useLabFilters";
import { DemoCommunityPanel } from "@/components/lab/demo";
const client = createLabClient();
export default function FeedWorkbench() {
  const f = useLabFilters();
  const { isAuthenticated, session, isLoading } = useLabIdentity();
  const [compose, setCompose] = useState(false);
  const [evidence, setEvidence] = useState<Artifact | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState("starters");
  const [map, setMap] = useState(false);
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
    try {
      const result = loadDraft(
        localStorage,
        "promising",
        session?.did || "guest",
      );
      if (Array.isArray(result.data?.ids))
        setSaved(
          result.data.ids.filter((id): id is string => typeof id === "string"),
        );
      else setSaved([]);
    } catch {}
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
    const next = saved.includes(id)
      ? saved.filter((s) => s !== id)
      : [...saved, id];
    setSaved(next);
    try {
      const r = saveDraft(localStorage, "promising", session?.did || "guest", {
        ids: next,
      });
      setNotice(
        r.ok
          ? "Interest saved only in this browser — not a scientific endorsement."
          : "Browser storage is unavailable. This interest will not survive a reload.",
      );
    } catch {
      setNotice(
        "Browser storage is unavailable. This interest will not survive a reload.",
      );
    }
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
    <div className="lab-wrap lab-workbench">
      <div className="lab-workbench-heading">
        <div>
          <p className="lab-eyebrow">THE LAB / WORK IN PROGRESS</p>
          <h1>Work in the open.</h1>
          <p>Good questions belong here before they have good answers.</p>
        </div>
        <div className="lab-segment" aria-label="Workbench view">
          <button aria-pressed={!map} onClick={() => setMap(false)}>
            Stream
          </button>
          <button aria-pressed={map} onClick={() => setMap(true)}>
            Research map
          </button>
        </div>
      </div>
      <DemoCommunityPanel className="lab-community-supplement" context="feed" caseId="reproducibility" title="Around the shared bottleneck" showPeople />
      {map ? (
        <>
          <ResearchMap />
          <p className="lab-smallprint">
            The map connects editorial starter artifacts by research field. It
            is not a map of followers or verified breakthroughs.
          </p>
        </>
      ) : (
        <div className="lab-feed-grid">
          <aside className="lab-filter-rail">
            <p className="lab-section-label">KIND OF WORK</p>
            <button
              className={f.type === "all" ? "active" : ""}
              onClick={() => f.setType("all")}
            >
              All work <span>↗</span>
            </button>
            {postTypes.map((t) => (
              <button
                key={t.id}
                className={f.type === t.id ? "active" : ""}
                aria-pressed={f.type === t.id}
                onClick={() => f.setType(t.id)}
              >
                {t.label}
              </button>
            ))}
            <label className="lab-field lab-field-filter">
              Field
              <select
                value={f.field}
                onChange={(e) => f.setField(e.target.value)}
              >
                <option value="all">All fields</option>
                {fields.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="lab-smallprint">
              Filters apply to labeled Open Lab records and editorial starters.
              Bluesky posts are not assigned scientific categories.
            </p>
          </aside>
          <section className="lab-stream" aria-label="Scientific work">
            <button
              className="lab-composer-prompt"
              onClick={() => setCompose(true)}
            >
              <span className="lab-section-label">
                A QUESTION IS A BEGINNING
              </span>
              <strong>
                What breakthrough
                <br />
                are you working on?
              </strong>
              <span>
                A rough question, a useful tool, or something that didn’t work.
              </span>
              <b>
                Start a draft <span>↗</span>
              </b>
            </button>
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
                    <ArtifactBrief artifact={a} />
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
          <aside className="lab-margin-note">
            <span className="lab-margin-symbol">↗</span>
            <p className="lab-eyebrow">LEAVE A TRAIL</p>
            <h3>Someone else should be able to pick up where you stop.</h3>
            <p>Share a source. Explain a method. Name the uncertainty.</p>
            <p>“Promising” saves interest locally. It is not peer review.</p>
            <Link href="/lab/collaborate/">Take a bounded task →</Link>
            <div className="lab-notebook-rule" />
            <p className="lab-smallprint">
              An early research commons, not an already populated network. The
              starting points are editorial; your contributions are yours.
            </p>
          </aside>
        </div>
      )}
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
