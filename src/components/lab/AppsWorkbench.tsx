"use client";
import { useState } from "react";
import {
  artifacts,
  fields,
  filterArtifacts,
  fieldLabel,
  starterDisclosure,
} from "@/lib/lab-data";
import RecordEditor from "@/components/lab/RecordEditor";
import SignalSandbox from "@/components/lab/SignalSandbox";
import ArtifactBrief from "@/components/lab/ArtifactBrief";
import { useLabFilters } from "@/components/lab/useLabFilters";
export default function AppsWorkbench() {
  const [submit, setSubmit] = useState(false);
  const f = useLabFilters();
  const apps = filterArtifacts(
    artifacts.filter((a) => a.app),
    f,
  );
  return (
    <div className="lab-wrap lab-workbench">
      <div className="lab-workbench-heading">
        <div>
          <p className="lab-eyebrow">SCIENCE APPS / THE INSTRUMENT SHELF</p>
          <h1>
            Less setup.
            <br />
            <em>More discovery.</em>
          </h1>
          <p>
            Useful tools for curious people. Open a notebook, inspect a model,
            or give your own tool a home.
          </p>
        </div>
        <button className="lab-button" onClick={() => setSubmit(true)}>
          Submit an app +
        </button>
      </div>
      <SignalSandbox />
      <section className="lab-app-catalog">
        <div className="lab-section-heading">
          <div>
            <p className="lab-eyebrow">THE EDITORIAL SHELF</p>
            <h2>Borrow a better instrument.</h2>
          </div>
          <p className="lab-smallprint">{starterDisclosure}</p>
        </div>
        <div className="lab-catalog-controls">
          <label className="lab-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search science apps"
              placeholder="Search tools and capabilities…"
              value={f.query}
              onChange={(e) => f.setQuery(e.target.value)}
            />
          </label>
          <label className="lab-field lab-field-filter">
            Field
            <select
              aria-label="Filter apps by field"
              value={f.field}
              onChange={(e) => f.setField(e.target.value)}
            >
              <option value="all">All fields</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <span className="lab-result-count" aria-live="polite">
            {apps.length} tools
          </span>
        </div>
        <div className="lab-app-grid">
          {apps.map((a, i) => (
            <article key={a.id} className="lab-app-card">
              <div className="lab-app-card-top">
                <span className="lab-app-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{fieldLabel(a.field)}</span>
              </div>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <ArtifactBrief artifact={a} expanded={a.id === "marimo"} />
              <div className="lab-app-status">
                <span>
                  {a.codeUrl ? "Source available" : "Resource portal"}
                </span>
                <span>{a.license || "Check source terms"}</span>
              </div>
              <div className="lab-app-links">
                <a
                  className="lab-button lab-quiet"
                  href={a.demoUrl || a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {a.demoUrl ? "Launch notebook" : "Open project"} ↗
                </a>
                {a.codeUrl && (
                  <a href={a.codeUrl} target="_blank" rel="noopener noreferrer">
                    Code ↗
                  </a>
                )}
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  Source ↗
                </a>
              </div>
              <small>{a.source} · Opens an external site</small>
            </article>
          ))}
        </div>
        {!apps.length && (
          <div className="lab-empty">
            <h3>No tools match that search.</h3>
            <p>
              The starter shelf is intentionally small. Try a different field or
              add a useful tool.
            </p>
            <button className="lab-button lab-quiet" onClick={f.reset}>
              Clear filters
            </button>
          </div>
        )}
      </section>
      <div className="lab-contribute-strip">
        <p>Made something that makes science easier?</p>
        <button className="lab-text-button" onClick={() => setSubmit(true)}>
          Put it on the bench ↗
        </button>
      </div>
      {submit && <RecordEditor kind="app" onClose={() => setSubmit(false)} />}
    </div>
  );
}
