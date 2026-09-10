"use client";
import { useEffect, useRef, useState } from "react";
import { useLabIdentity } from "@/lib/lab-identity";
import { useLab } from "@/components/lab/LabShell";
import LabDialog from "@/components/lab/LabDialog";
import { createLabClient } from "@/lib/lab-client";
import { draftSlot, loadDraft, saveDraft } from "@/lib/lab-drafts";
import {
  entryDefaults,
  entryFields,
  entryPayload,
  entryTitles,
  validateEntry,
  type EntryValues,
} from "@/lib/lab-entry";
import { downloadText } from "@/lib/lab-packets";
import type { RecordKind } from "@/lib/lab-types";
type EditorProps = {
  kind: RecordKind;
  initial?: EntryValues;
  draftId?: string;
  onClose: () => void;
  onSaved?: () => void;
};
export default function RecordEditor(props: EditorProps) {
  const { session } = useLabIdentity();
  return <EditorForm key={`${session?.did || "guest"}:${props.draftId || draftSlot(props.kind, props.initial)}`} {...props} />;
}
function EditorForm({
  kind,
  initial = {},
  draftId,
  onClose,
  onSaved,
}: EditorProps) {
  const { session, isAuthenticated } = useLabIdentity();
  const { capabilities, openLogin } = useLab();
  const owner = session?.did || "guest";
  const slot = draftId || draftSlot(kind, initial);
  const [values, setValues] = useState<EntryValues>({
    ...entryDefaults(kind),
    ...initial,
  });
  const [ready, setReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [guest, setGuest] = useState<EntryValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  const previewRef = useRef<HTMLElement>(null);
  useEffect(() => { if (preview) previewRef.current?.focus(); }, [preview]);
  useEffect(() => {
    let result: ReturnType<typeof loadDraft>;
    try {
      result = loadDraft(localStorage, slot, owner);
    } catch {
      result = { data: null, status: "blocked" };
    }
    if (result.data) {
      const strings = Object.fromEntries(
        Object.entries(result.data).filter(([, v]) => typeof v === "string"),
      ) as EntryValues;
      setValues({ ...entryDefaults(kind), ...initial, ...strings });
      setDraftStatus("Draft recovered from this browser.");
    } else
      setDraftStatus(
        result.status === "corrupt"
          ? "An older draft could not be read. Export important work before leaving."
          : result.status === "blocked"
            ? "Browser storage is blocked. Download your draft before leaving."
            : "Your draft stays in this browser.",
      );
    if (owner !== "guest") {
      try {
        const g = loadDraft(localStorage, slot, "guest");
        if (g.data) setGuest(g.data as EntryValues);
      } catch {}
    }
    setReady(true);
    // Initial values are the explicit artifact context at the time this editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, owner, slot]);
  function update(key: string, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    setPreview(false);
    setConsent(false);
    setReceipt("");
    if (ready) {
      try {
        const r = saveDraft(localStorage, slot, owner, next);
        setDraftStatus(
          r.ok
            ? "Draft saved in this browser."
            : "Storage is full or blocked. Download your draft before leaving.",
        );
      } catch {
        setDraftStatus(
          "Storage is blocked. Download your draft before leaving.",
        );
      }
    }
  }
  function review(e: React.FormEvent) {
    e.preventDefault();
    const next = validateEntry(kind, values);
    setErrors(next);
    setMessage("");
    if (Object.keys(next).length) {
      setPreview(false);
      setTimeout(
        () =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        0,
      );
      return;
    }
    try {
      const saved = saveDraft(localStorage, slot, owner, values);
      setDraftStatus(saved.ok ? "Draft saved in this browser." : "Storage is blocked or full. Download before signing in or leaving.");
    } catch { setDraftStatus("Storage is blocked. Download before signing in or leaving."); }
    setPreview(true);
  }
  const payload = entryPayload(kind, values);
  function download() {
    downloadText(
      `open-lab-${kind}-draft.json`,
      JSON.stringify(
        { status: "local-draft-not-published", kind, data: payload },
        null,
        2,
      ),
    );
    setMessage("Draft download prepared. This has not been published.");
  }
  async function publish() {
    if (
      !consent ||
      !preview ||
      !isAuthenticated ||
      !capabilities.canPublish ||
      busy
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const r = await createLabClient().publish(kind, payload);
      setReceipt(r.uri);
      setMessage(
        "Public AT Protocol record saved and read back. It is not automatically featured, peer reviewed, or accepted into an Atlas.",
      );
      onSaved?.();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Publishing failed. Your draft is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <LabDialog title={entryTitles[kind]} onClose={onClose} wide>
      <div className="lab-editor-meta">
        <span className="lab-status-dot" />{" "}
        <span role="status">{draftStatus}</span>
      </div>
      {guest && (
        <div className="lab-notice">
          There is also a draft from before you signed in.{" "}
          <button
            type="button"
            className="lab-text-button"
            disabled={busy}
            onClick={() => {
              const next = { ...entryDefaults(kind), ...guest };
              setValues(next);
              setPreview(false);
              setConsent(false);
              setReceipt("");
              setErrors({});
              setMessage("");
              try {
                saveDraft(localStorage, slot, owner, next);
              } catch {}
              setGuest(null);
              setDraftStatus(
                "Pre-sign-in draft recovered. Review before publishing.",
              );
            }}
          >
            Recover that draft
          </button>
        </div>
      )}
      <form onSubmit={review} noValidate>
        <div className="lab-form-grid">
          {entryFields[kind].map((f) => (
            <label
              className={`lab-field ${f.type === "textarea" ? "lab-field-wide" : ""}`}
              key={f.key}
              htmlFor={`entry-${f.key}`}
            >
              {f.label}
              {f.required && <span className="lab-required">Required</span>}
              {f.type === "textarea" ? (
                <textarea
                  id={`entry-${f.key}`}
                  name={f.key}
                  disabled={busy}
                  rows={f.key === "text" ? 5 : 3}
                  value={values[f.key] || ""}
                  maxLength={f.max}
                  onChange={(e) => update(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                  aria-describedby={
                    errors[f.key] ? `error-${f.key}` : undefined
                  }
                />
              ) : f.type === "select" ? (
                <select
                  id={`entry-${f.key}`}
                  name={f.key}
                  disabled={busy}
                  value={values[f.key] || ""}
                  onChange={(e) => update(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                >
                  {f.options?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`entry-${f.key}`}
                  name={f.key}
                  disabled={busy}
                  type={f.type === "url" ? "url" : "text"}
                  value={values[f.key] || ""}
                  maxLength={f.max}
                  onChange={(e) => update(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                  aria-describedby={
                    errors[f.key] ? `error-${f.key}` : undefined
                  }
                />
              )}{" "}
              {f.hint && <small>{f.hint}</small>}
              {errors[f.key] && (
                <small className="lab-error" id={`error-${f.key}`}>
                  {errors[f.key]}
                </small>
              )}
            </label>
          ))}
        </div>
        {kind === "contribution" && (
          <p className="lab-notice">
            This creates a contribution record, not an edit to the source Atlas.
            Acceptance needs human review.
          </p>
        )}
        {kind === "app" && (
          <p className="lab-smallprint">
            A submission is a public record, not an endorsement or automatic
            listing. No app code is executed here.
          </p>
        )}
        {preview && (
          <section ref={previewRef} tabIndex={-1} className="lab-record-preview" aria-label="Draft preview and public publication decision">
            <div className="lab-section-label">
              REVIEW YOUR {kind.toUpperCase()} RECORD
            </div>
            <pre>{JSON.stringify(payload, null, 2)}</pre>
            <p className="lab-smallprint">
              Public records may be copied and indexed by others. Do not include
              sensitive, personal, or unpublished material.
              Your record is not automatically listed in the shared feed, featured,
              peer reviewed, or accepted into an Atlas. Publishing is separate from discovery and human acceptance.
            </p>
            {isAuthenticated ? (
              <label className="lab-checkbox">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={busy || !!receipt}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                I have reviewed this and want to publish it publicly as{" "}
                {session?.handle}.
              </label>
            ) : (
              <p className="lab-smallprint">
                Sign in when you are ready. Your draft will still be here.
              </p>
            )}
          </section>
        )}
        {message && (
          <p
            className={receipt ? "lab-notice" : "lab-status-message"}
            role="status"
          >
            {message}
          </p>
        )}
        {receipt && (
          <p className="lab-receipt">
            <strong>Record receipt</strong>
            <code>{receipt}</code>
            <button
              type="button"
              className="lab-text-button"
              onClick={() =>
                downloadText(
                  "open-lab-receipt.json",
                  JSON.stringify(
                    { uri: receipt, kind, data: payload },
                    null,
                    2,
                  ),
                )
              }
            >
              Download receipt ↓
            </button>
          </p>
        )}
        <div className="lab-form-actions">
          <button
            type="button"
            className="lab-button lab-quiet"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="lab-button lab-quiet"
            onClick={download}
          >
            Download draft ↓
          </button>
          {!preview ? (
            <button type="submit" className="lab-button">
              Review draft →
            </button>
          ) : !isAuthenticated ? (
            <button type="button" className="lab-button" onClick={openLogin}>
              Sign in to publish
            </button>
          ) : (
            <button
              type="button"
              className="lab-button"
              disabled={
                !consent || !capabilities.canPublish || busy || !!receipt
              }
              onClick={publish}
            >
              {busy ? "Publishing…" : "Publish public record ↗"}
            </button>
          )}
        </div>
        {preview && isAuthenticated && !capabilities.canPublish && (
          <p className="lab-notice">
            {capabilities.message ||
              "Publishing is unavailable in this environment. Download or keep your draft."}
          </p>
        )}
      </form>
    </LabDialog>
  );
}
