"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLabIdentity } from "@/lib/lab-identity";
import { useLab } from "@/components/lab/LabShell";
import { listDrafts, loadDraft } from "@/lib/lab-drafts";
import { createLabClient, safeUrl } from "@/lib/lab-client";
import { artifacts } from "@/lib/lab-data";
import type { LabProfile, LabRecord, RecordKind } from "@/lib/lab-types";
import type { EntryValues } from "@/lib/lab-entry";
import RecordEditor from "@/components/lab/RecordEditor";

export default function ProfileWorkbench() {
  const { session, isAuthenticated, logout } = useLabIdentity();
  const { openLogin } = useLab();
  const [editor, setEditor] = useState<RecordKind | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [drafts, setDrafts] = useState<
    { slot: string; kind: string; savedAt?: string; data: Record<string, unknown> }[]
  >([]);
  const [profile, setProfile] = useState<LabProfile | null>(null);
  const [records, setRecords] = useState<LabRecord[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [publicStatus, setPublicStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setProfile(null);
    setRecords([]);
    setSaved([]);
    setPublicStatus(isAuthenticated ? "loading" : "idle");
    const owner = session?.did || "guest";
    let result: ReturnType<typeof listDrafts> = [];
    try {
      result = listDrafts(localStorage, owner);
      const interests = loadDraft(localStorage, "promising", owner);
      setSaved(
        Array.isArray(interests.data?.ids)
          ? (interests.data.ids as string[])
          : [],
      );
    } catch {
      setError(
        "Local storage is unavailable. Download any new drafts before leaving.",
      );
    }
    setDrafts(result);
    if (isAuthenticated)
      createLabClient()
        .records()
        .then((v) => {
          if (!active) return;
          setProfile(v.profile);
          setRecords(v.records);
          setPublicStatus("ready");
        })
        .catch((e) => { if (active) { setError(e.message); setPublicStatus("error"); } });
    else {
      setProfile(null);
      setRecords([]);
    }
    return () => { active = false; };
  }, [session?.did, isAuthenticated, revision]);
  const localProfile = drafts.find((d) => d.kind === "profile")?.data;
  const visible = localProfile || profile;
  const profileValues: EntryValues = profile
    ? {
        workingOn: profile.workingOn,
        interests: profile.interests?.join(", ") || "",
        lookingFor: profile.lookingFor,
        githubUrl: profile.githubUrl || "",
        scholarUrl: profile.scholarUrl || "",
      }
    : {};
  return (
    <div className="lab-wrap lab-workbench">
      <div className="lab-workbench-heading">
        <div>
          <p className="lab-eyebrow">MY BENCH / ROOM FOR THE UNFINISHED</p>
          <h1>
            Your work.
            <br />
            <em>Your way in.</em>
          </h1>
          <p>
            A place to keep drafts, return to a promising idea, and tell people
            what you’re figuring out.
          </p>
        </div>
        {!isAuthenticated && (
          <button className="lab-button" onClick={openLogin}>
            Bring your identity ↗
          </button>
        )}
      </div>
      <div className="lab-profile-grid">
        <section className="lab-profile-card">
          <div className="lab-profile-monogram" aria-hidden="true">
            {session?.displayName?.[0] || session?.handle?.[0] || "↗"}
          </div>
          <span className="lab-eyebrow">
            {isAuthenticated
              ? "YOUR AT PROTOCOL IDENTITY"
              : "LOCAL BENCH / NOT A PUBLIC PROFILE"}
          </span>
          <h2>
            {session?.displayName ||
              session?.handle ||
              "Make yourself at home."}
          </h2>
          {session?.handle && <p>@{session.handle}</p>}
          {session?.did && (
            <div className="lab-identity">
              <small>Permanent identity (DID). Your handle can change.</small>
              <code>{session.did}</code>
            </div>
          )}
          <div className="lab-profile-description">
            <h3>Working on</h3>
            <p>
              {visible?.workingOn
                ? String(visible.workingOn)
                : "What question keeps bringing you back? A few sentences can help the right person find a way in."}
            </p>
            {visible && !!visible.lookingFor && (
              <>
                <h3>Looking for</h3>
                <p>{String(visible.lookingFor)}</p>
              </>
            )}
            {visible && !!visible.interests && (
              <div className="lab-profile-interests">
                {(Array.isArray(visible.interests)
                  ? visible.interests
                  : String(visible.interests).split(",")
                )
                  .filter(Boolean)
                  .map((s, i) => (
                    <span key={i}>{String(s)}</span>
                  ))}
              </div>
            )}
            {["githubUrl", "scholarUrl"].map((key) => {
              const url = visible?.[key as keyof typeof visible];
              return typeof url === "string" && safeUrl(url) ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lab-text-button"
                >
                  {key === "githubUrl" ? "GitHub" : "Google Scholar"} ↗
                </a>
              ) : null;
            })}
          </div>
          <button
            className="lab-button lab-quiet"
            onClick={() => setEditor("profile")}
          >
            {visible ? "Edit profile draft" : "Create profile draft"} →
          </button>
          <p className="lab-smallprint">
            {localProfile
              ? "Showing your local draft. Not published or synced."
              : "Work links are self-supplied links, not OAuth connections or verified ownership."}
          </p>
          {isAuthenticated && (
            <button
              className="lab-text-button"
              onClick={async () => {
                try { await logout(); setRevision((n) => n + 1); }
                catch { setError("Sign-out failed. Your session may still be active; try again."); }
              }}
            >
              Sign out
            </button>
          )}
        </section>
        <div className="lab-bench-content">
          {error && (
            <p className="lab-error" role="alert">
              {error}
            </p>
          )}
          <section>
            <div className="lab-section-heading">
              <h2>Still in your notebook.</h2>
              <span className="lab-eyebrow">LOCAL DRAFTS</span>
            </div>
            <p className="lab-smallprint">
              Saved in this browser, not synced. Signing in never publishes a
              draft automatically.
            </p>
            {drafts.length ? (
              <div className="lab-draft-list">
                {drafts.map((d) => (
                  <button key={d.slot} onClick={() => { setDraftId(d.slot); setEditor(d.kind as RecordKind); }}>
                    <span className="lab-eyebrow">{d.kind}</span>
                    <strong>
                      {String(
                        d.data.text ||
                          d.data.title ||
                          d.data.workingOn ||
                          d.data.observation ||
                          d.data.note ||
                          "An unfinished draft",
                      ).slice(0, 110)}
                    </strong>
                    <small>
                      {d.savedAt
                        ? new Date(d.savedAt).toLocaleString("en-US")
                        : "Saved locally"}{" "}
                      <span>Continue →</span>
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="lab-empty">
                <h3>Blank pages are an invitation.</h3>
                <p>
                  Start a question, save a tool, or add a source. You can do the
                  useful part before signing in.
                </p>
                <button
                  className="lab-text-button"
                  onClick={() => setEditor("note")}
                >
                  Start a question →
                </button>
              </div>
            )}
          </section>
          <section>
            <div className="lab-section-heading">
              <h2>Worth coming back to.</h2>
              <span className="lab-eyebrow">PROMISING / LOCAL INTEREST</span>
            </div>
            {saved.length ? (
              <div className="lab-saved-list">
                {artifacts
                  .filter((a) => saved.includes(a.id))
                  .map((a) => (
                    <a
                      href={a.url}
                      key={a.id}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{a.title}</span>
                      <small>{a.source} ↗</small>
                    </a>
                  ))}
              </div>
            ) : (
              <p className="lab-smallprint">
                Mark something “Promising” in{" "}
                <Link href="/lab/feed/">the lab</Link>. It stays here as local
                interest—not a scientific endorsement.
              </p>
            )}
          </section>
          <section>
            <div className="lab-section-heading">
              <h2>Out in the world.</h2>
              <span className="lab-eyebrow">PUBLIC RECORDS</span>
            </div>
            {publicStatus === "loading" ? <p role="status" className="lab-smallprint">Reading your public records…</p> : publicStatus === "error" ? <p className="lab-smallprint">Public records could not be read. Local drafts are unchanged.</p> : records.length ? (
              records.map((r) => (
                <div className="lab-public-record" key={r.uri}>
                  <strong>{r.kind}</strong>
                  <code>{r.uri}</code>
                </div>
              ))
            ) : (
              <p className="lab-smallprint">
                {isAuthenticated
                  ? "No public records were returned. Local drafts have not been published."
                  : "Sign in to read the public records in your own repository."}
              </p>
            )}
          </section>
        </div>
      </div>
      {editor && (
        <RecordEditor
          kind={editor}
          draftId={draftId}
          initial={editor === "profile" && !localProfile ? profileValues : {}}
          onSaved={() => setRevision((n) => n + 1)}
          onClose={() => {
            setEditor(null);
            setDraftId(undefined);
            setRevision((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
