"use client";
import { useEffect, useMemo, useState } from "react";
import {
  buildWorkPacket,
  buildPairedWorkPackets,
  auditTask,
  campaigns,
  downloadText,
  packetMarkdown,
} from "@/lib/lab-packets";
import { loadDraft, saveDraft } from "@/lib/lab-drafts";
import RecordEditor from "@/components/lab/RecordEditor";
export default function CollaborateWorkbench({ evidenceWorkbench }: { evidenceWorkbench?: React.ReactNode }) {
  const [campaign, setCampaign] = useState("reference-audit");
  const [role, setRole] = useState("research");
  const [budget, setBudget] = useState("30");
  const [format, setFormat] = useState("json");
  const [message, setMessage] = useState("");
  const [publish, setPublish] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const p = loadDraft(localStorage, "work-packet", "guest");
      if (p.data) {
        if (campaigns.some((c) => c.id === p.data?.campaign))
          setCampaign(String(p.data.campaign));
        if (["research", "reproduce", "review"].includes(String(p.data.role)) && !(p.data.campaign === "reference-audit" && p.data.role === "reproduce"))
          setRole(String(p.data.role));
        if (typeof p.data.budget === "string") setBudget(p.data.budget);
      }
    } catch { setMessage("Browser storage is unavailable; download your packet before leaving."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      const r = saveDraft(localStorage, "work-packet", "guest", {
        campaign,
        role,
        budget,
      });
      if (!r.ok)
        setMessage(
          "Browser storage is unavailable; download your packet before leaving.",
        );
    } catch { setMessage("Browser storage is unavailable; download your packet before leaving."); }
  }, [campaign, role, budget, ready]);
  const selected = campaigns.find((c) => c.id === campaign)!;
  const packet = useMemo(() => {
    try {
      return buildWorkPacket(campaign, role, Number(budget));
    } catch {
      return null;
    }
  }, [campaign, role, budget]);
  const preview = packet
    ? format === "json"
      ? JSON.stringify(packet, null, 2)
      : packetMarkdown(packet)
    : "";
  function download() {
    if (!packet) {
      setMessage("Set a local time budget between 5 and 240 minutes.");
      return;
    }
    downloadText(
      `${packet.taskId}.${format === "json" ? "json" : "md"}`,
      preview,
      format === "json" ? "application/json" : "text/markdown",
    );
    setMessage(
      "Work packet prepared for download. No agent was launched and no money was spent.",
    );
  }
  return (
    <div className="lab-wrap lab-workbench">
      <div className="lab-collab-intro">
        <div>
          <p className="lab-eyebrow">
            COLLABORATE / CURIOSITY AT A DIFFERENT SCALE
          </p>
          <h1>
            Bring your agent.
            <br />
            <em>Keep your keys.</em>
          </h1>
        </div>
        <div>
          <p>
            A useful agent run starts with a good task, not a bigger swarm. Take
            a bounded piece of research into your own environment. Bring back
            evidence a human can check.
          </p>
          <span className="lab-pilot-label">
            PROPOSED PILOT RECIPES · NOT STAFFED CAMPAIGNS
          </span>
        </div>
      </div>
      <div className="lab-packet-workbench">
        <section className="lab-packet-setup">
          <div className="lab-step">
            <span>01</span>
            <h2>Choose a next move.</h2>
          </div>
          <div
            className="lab-campaign-options"
            role="group"
            aria-label="Pilot recipe"
          >
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCampaign(c.id);
                  if (c.id === "reference-audit" && role === "reproduce") setRole("research");
                  setMessage("");
                }}
                aria-pressed={campaign === c.id}
              >
                <small>
                  {c.id === "reference-audit"
                    ? "SOURCE AUDIT"
                    : "REPRODUCIBILITY"}
                </small>
                <strong>{c.title}</strong>
                <p>{c.description}</p>
                <span>
                  {campaign === c.id ? "Selected ●" : "Choose this recipe →"}
                </span>
              </button>
            ))}
          </div>
          <div className="lab-step">
            <span>02</span>
            <h2>Make the scope yours.</h2>
          </div>
          <div className="lab-form-grid">
            <label className="lab-field">
              Your role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="research">Research · trace the sources</option>
                {campaign !== "reference-audit" && <option value="reproduce">Reproduce · run the method</option>}
                <option value="review">Review · check the evidence</option>
              </select>
            </label>
            <label className="lab-field">
              Local time budget (minutes)
              <input
                type="number"
                min="5"
                max="240"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                aria-invalid={!packet}
              />
              <small>
                A hint for your environment, not an enforced spending cap.
              </small>
            </label>
          </div>
          <div className="lab-packet-boundary">
            <h3>Nothing runs behind this button.</h3>
            <p>
              Download the instructions and use tools you control. Keep keys and
              subscriptions in your own environment. Tokens are not
              interchangeable between providers.
            </p>
            <p>
              No remote execution. No payment. No implied permission to run
              untrusted code.
            </p>
          </div>
        </section>
        <section
          className="lab-packet-preview"
          aria-label="Work packet preview"
        >
          <div className="lab-packet-top">
            <div>
              <p className="lab-eyebrow">03 / YOUR TAKEAWAY</p>
              <h2>A small, inspectable job.</h2>
            </div>
            <div className="lab-segment">
              <button
                onClick={() => setFormat("json")}
                aria-pressed={format === "json"}
              >
                JSON
              </button>
              <button
                onClick={() => setFormat("markdown")}
                aria-pressed={format === "markdown"}
              >
                Markdown
              </button>
            </div>
          </div>
          <div className="lab-packet-id">
            {selected.taskId} <span>LOCAL / NOT DISPATCHED</span>
          </div>
          {packet ? (
            <pre tabIndex={0} aria-label="Generated work packet">
              {preview}
            </pre>
          ) : (
            <div className="lab-empty">
              <p>
                Set a time budget between 5 and 240 minutes to prepare the
                packet.
              </p>
            </div>
          )}
          <div className="lab-packet-download">
            <button className="lab-button lab-paper-button" onClick={download}>
              Download work packet ↓
            </button>
            <button
              className="lab-text-button"
              onClick={async () => {
                if (!packet) {
                  setMessage("Set a valid time budget first.");
                  return;
                }
                try {
                  await navigator.clipboard.writeText(preview);
                  setMessage("Packet copied. No agent was dispatched.");
                } catch {
                  setMessage(
                    "Clipboard access is unavailable. Use Download work packet instead.",
                  );
                }
              }}
            >
              Copy packet
            </button>
          </div>
          {message && (
            <p role="status" className="lab-packet-message">
              {message}
            </p>
          )}
        </section>
      </div>
      <section className="lab-paired-audit" aria-label="Paired source audit">
        <p className="lab-eyebrow">ONE CLAIM / TWO SEPARATE READS</p>
        <h2>What does a complete brain map establish?</h2>
        <dl className="lab-work-brief">
          <dt>What exists</dt><dd>A public NIH account of the FlyWire reconstruction and the linked primary study.</dd>
          <dt>Specific opening</dt><dd>Trace the size claim, then distinguish a structural map from evidence about brain function. This is an editorial exercise, not a request from the study authors.</dd>
          <dt>Inspect or try</dt><dd><a href={auditTask.sourceUrl} target="_blank" rel="noopener noreferrer">Read the exact NIH source ↗</a> and <a href={auditTask.primarySourceUrl} target="_blank" rel="noopener noreferrer">inspect the primary study ↗</a>.</dd>
          <dt>Useful contribution</dt><dd>A verbatim excerpt, exact location, support judgment, and limitation from each reader. These are unreserved tasks, not claims on work.</dd>
        </dl>
        <blockquote>{auditTask.claim}</blockquote>
        <div className="lab-form-actions">
          {(["research", "review"] as const).map((pairedRole, i) => <button key={pairedRole} className="lab-button lab-quiet" disabled={!Number.isInteger(Number(budget)) || Number(budget) < 5 || Number(budget) > 240} onClick={() => {
            const p = buildPairedWorkPackets(Number(budget))[i];
            downloadText(`${p.taskId}-${pairedRole}.${format === "json" ? "json" : "md"}`, format === "json" ? JSON.stringify(p, null, 2) : packetMarkdown(p), format === "json" ? "application/json" : "text/markdown");
            setMessage(`${pairedRole === "research" ? "Researcher" : "Reviewer"} packet prepared. Same claim and source; no agent launched.`);
          }}>Download {pairedRole === "research" ? "researcher" : "reviewer"} packet ↓</button>)}
        </div>
        <p className="lab-smallprint">Uses the time hint and JSON/Markdown format above. Ask the reviewer to read the source before seeing the research return. Agreement is not scientific validation.</p>
      </section>
      {/* Parent installs LabEvidenceWorkbench here; no second import/comparison protocol. */}
      <div id="evidence-return">{evidenceWorkbench || <p className="lab-smallprint">Keep the completed returnTemplate from each packet as JSON. Side-by-side import and human resolution are pending integration in this preview; neither a download nor a public intent means the Atlas has accepted evidence.</p>}</div>
      <section className="lab-collab-return">
        <span className="lab-margin-symbol">↳</span>
        <div>
          <p className="lab-eyebrow">THE IMPORTANT PART IS WHAT COMES BACK</p>
          <h2>A result another person can use.</h2>
          <p>
            Report your method, the original source, what happened, and what
            remains uncertain. A failed attempt is useful when someone can learn
            from it.
          </p>
        </div>
        <button
          className="lab-button lab-quiet"
          onClick={() => setPublish(true)}
        >
          Draft an intent or result +
        </button>
      </section>
      {publish && (
        <RecordEditor
          kind="participation"
          initial={{ campaignId: campaign, taskId: selected.taskId, role }}
          onClose={() => setPublish(false)}
        />
      )}
    </div>
  );
}
