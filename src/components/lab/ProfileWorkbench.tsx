"use client";
import Link from "next/link";
import FollowingBench from "@/components/lab/feed/FollowingBench";
import InventionBench from "@/components/lab/feed/InventionBench";
import { useLabSocial, LAB_SOCIAL_CHANGED } from "@/components/lab/social/useLabSocial";
import styles from "@/components/lab/feed/feed.module.css";
import { useEffect, useRef, useState } from "react";
import { useLabIdentity } from "@/lib/lab-identity";
import { useLab } from "@/components/lab/LabShell";
import { listDrafts, loadDraft } from "@/lib/lab-drafts";
import { createLabClient, safeUrl } from "@/lib/lab-client";
import { artifacts } from "@/lib/lab-data";
import { labInspectorHref, type LabNotebook } from "@/lib/lab-notebook";
import type { LabRecordView } from "@/lib/lab-protocol";
import type { LabProfile, RecordKind } from "@/lib/lab-types";
import type { EntryValues } from "@/lib/lab-entry";
import { deleteLabRecord, LabPermissionError, LabWriteVerificationError } from "@/lib/lab-records";
import LabDialog from "@/components/lab/LabDialog";
import RecordEditor from "@/components/lab/RecordEditor";

export default function ProfileWorkbench() {
  const { session, isLoading } = useLabIdentity();
  if (isLoading) return <p className="lab-wrap" role="status">Restoring your identity before opening your bench…</p>;
  return <Bench key={session?.did || "guest"} />;
}
function Bench() {
  const { session, oauthSession, isAuthenticated, isLoading, logout, authorizeWrite } = useLabIdentity();
  const { openLogin, capabilities } = useLab();
  const social = useLabSocial(session?.did || "guest");
  const [editor, setEditor] = useState<RecordKind | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [drafts, setDrafts] = useState<
    { slot: string; kind: string; savedAt?: string; data: Record<string, unknown> }[]
  >([]);
  const [profile, setProfile] = useState<LabProfile | null>(null);
  const [records, setRecords] = useState<LabRecordView[]>([]);
  const [notebook, setNotebook] = useState<LabNotebook | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [publicStatus, setPublicStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [revision, setRevision] = useState(0);
  useEffect(() => { const refresh = () => setRevision(n => n + 1); window.addEventListener(LAB_SOCIAL_CHANGED, refresh); return () => window.removeEventListener(LAB_SOCIAL_CHANGED, refresh); }, []);
  const [deleting, setDeleting] = useState<LabRecordView | null>(null);
  const [deleteConsent, setDeleteConsent] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deletePermission, setDeletePermission] = useState(false);
  const [deleteUnknown, setDeleteUnknown] = useState("");
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  function chooseDelete(record: LabRecordView) {
    setDeleting(record); setDeleteConsent(false); setDeletePermission(false); setDeleteUnknown(""); setError("");
  }
  async function confirmDelete() {
    if (!deleting || !deleteConsent || deleteBusy || deleteUnknown || isLoading || !capabilities.canPublish || !oauthSession || oauthSession.sub !== session?.did || deleting.authorDid !== session.did) return;
    setDeleteBusy(true);
    try {
      await deleteLabRecord(oauthSession, deleting.uri, { public: true, experimental: true, did: session.did, action: "delete", expectedCid: deleting.cid });
      if (!active.current) return;
      setDeleting(null); setRevision(n => n + 1);
      setDeleteUnknown("");
      setDeletionReceipt(`Current PDS returned exact RecordNotFound for ${deleting.uri}. Copies may persist elsewhere.`);
    } catch (e) {
      if (!active.current) return;
      setDeleteConsent(false);
      if (e instanceof LabPermissionError) setDeletePermission(true);
      if (e instanceof LabWriteVerificationError) setDeleteUnknown(e.uri);
      setError(e instanceof Error ? e.message : "Deletion failed. Your local content is unchanged.");
    } finally { if (active.current) setDeleteBusy(false); }
  }
  async function authorizeDelete() {
    if (!deleting || deleteBusy || isLoading || !capabilities.canPublish) return;
    setDeleteConsent(false); setDeleteBusy(true);
    try {
      await authorizeWrite(deleting.kind, "delete", "/lab/profile/");
      if (active.current) { setDeleting(null); setDeletePermission(false); }
    } catch (e) { if (active.current) setError(e instanceof Error ? e.message : "Authorization failed. Nothing was deleted."); }
    finally { if (active.current) setDeleteBusy(false); }
  }
  const [deletionReceipt, setDeletionReceipt] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    setProfile(null);
    setRecords([]);
    setNotebook(null);
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
        .records(session?.did)
        .then((v) => {
          if (!active) return;
          setNotebook(v);
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
        linkedinUrl: profile.linkedinUrl || "",
      }
    : {};
  return (
    <div className={`lab-wrap lab-workbench ${styles.profileRoot}`}>
      <div className="lab-workbench-heading">
        <div>
          <p className="lab-eyebrow">MY BENCH / ROOM FOR THE UNFINISHED</p>
          <h1>My bench</h1>
          <p>
            Keep a build, take a bounded test, and bring back what happened.
          </p>
        </div>
        {!isAuthenticated && (
          <button className="lab-button" onClick={openLogin}>
            Bring your identity ↗
          </button>
        )}
      </div>
      <aside className="lab-composition-prompt"><h2>Give someone a useful way to help.</h2><p>Choose interests and a contribution style. Optional LinkedIn, Scholar, or GitHub links give context—not verified credentials, expertise scores, or access requirements.</p><Link href="/lab/onboarding/#profile-completion">Complete your profile and starting choices →</Link><p className="lab-smallprint">These choices share your local profile draft. Publishing still requires a separate review and explicit consent here.</p></aside>
      <div className="lab-profile-grid">
        <section className="lab-profile-card">
          {session?.avatar && safeUrl(session.avatar) && <img className={styles.identityAvatar} src={session.avatar} alt="Imported account avatar" />}
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
          {social.meta.localDisplayName && <p className="lab-smallprint">Local display name: {social.meta.localDisplayName}. Your imported account identity above is unchanged.</p>}
          {session?.did && <p><a href={`https://bsky.app/profile/${encodeURIComponent(session.did)}`} target="_blank" rel="noopener noreferrer">Open actual Bluesky profile ↗</a></p>}
          {session?.handle && !session.handle.startsWith("did:") && <p>@{session.handle}</p>}
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
            {["githubUrl", "scholarUrl", "linkedinUrl"].map((key) => {
              const url = visible?.[key as keyof typeof visible];
              return typeof url === "string" && safeUrl(url) ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lab-text-button"
                >
                  {key === "githubUrl" ? "GitHub" : key === "linkedinUrl" ? "LinkedIn" : "Google Scholar"} ↗
                </a>
              ) : null;
            })}
          </div>
          <button
            className="lab-button lab-quiet"
            onClick={() => { setDraftId(undefined); setEditor("profile"); }}
          >
            {visible ? "Edit profile draft" : "Create profile draft"} →
          </button>
          <p className="lab-smallprint">
            {localProfile
              ? "Showing your local draft. Not published or synced."
              : "Work links are self-supplied links, not OAuth connections or verified ownership."}
          </p>
          {session?.did && <p><a href={labInspectorHref(`at://${session.did}/org.plresearch.lab.profile/self`)}>Inspect public profile ↗</a></p>}
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
          <InventionBench />
          <FollowingBench />
          {social.error && <p className="lab-error" role="alert">{social.error}</p>}
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
            {deletionReceipt && <p role="status">{deletionReceipt}</p>}
            {notebook && <p className="lab-smallprint">Showing up to {notebook.limit} per collection{notebook.hasMore ? " / more exist" : " / no further pages reported"}. Read directly from your current PDS over HTTPS, not a cryptographic repository-signature proof or peer review.</p>}
            {publicStatus === "loading" ? <p role="status" className="lab-smallprint">Reading your public records…</p> : publicStatus === "error" ? <p className="lab-smallprint">Public records could not be read. Local drafts are unchanged.</p> : records.length ? (
              records.map((r) => (
                <div className="lab-public-record" key={r.uri}>
                  <strong>{r.kind}</strong>
                  <a href={labInspectorHref(r.uri)}>Inspect public {r.kind} ↗</a>
                  <code>{r.uri}</code>
                  <small>CID: <code>{r.cid}</code> · Current PDS: {r.pds}</small>
                  <button className="lab-text-button" disabled={deleteBusy || isLoading || !capabilities.canPublish || r.authorDid !== session?.did} onClick={() => chooseDelete(r)}>Delete this record…</button>
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
      {deleting && <LabDialog title="Delete one exact public record?" onClose={() => { if (!deleteBusy) setDeleting(null); }}>
        <p>Only this record in your own repository will be deleted. Copies may persist in other services. Local drafts will not be deleted.</p>
        <p><a href={labInspectorHref(deleting.uri)}>Inspect exact public record</a></p>
        <p>URI: <code>{deleting.uri}</code><br />Reviewed CID: <code>{deleting.cid}</code></p>
        <pre>{JSON.stringify(deleting.data, null, 2)}</pre>
        <label className="lab-checkbox"><input type="checkbox" checked={deleteConsent} disabled={deleteBusy || !!deleteUnknown} onChange={e => setDeleteConsent(e.target.checked)} />I reviewed this exact URI and CID and authorize deletion as {session?.did}. I understand public copies and experimental schemas.</label>
        {error && <p role="alert">{error}</p>}
        {deleteUnknown && <p role="alert">Unknown deletion outcome. <a href={labInspectorHref(deleteUnknown)}>Inspect this exact record before retrying</a>.</p>}
        {deletePermission && <button className="lab-button" disabled={deleteBusy || isLoading || !capabilities.canPublish} onClick={authorizeDelete}>Authorize deletion (then review again)</button>}
        <button className="lab-button" disabled={!deleteConsent || deleteBusy || isLoading || !capabilities.canPublish || !!deleteUnknown} onClick={confirmDelete}>Confirm exact deletion</button>
        <button className="lab-button lab-quiet" disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</button>
      </LabDialog>}
      {editor && (
        <RecordEditor
          kind={editor}
          draftId={draftId}
          reviewedProfile={notebook?.profileRecord}
          profileReadReady={publicStatus === "ready"}
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
