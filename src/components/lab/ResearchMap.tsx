"use client";
import { useEffect, useState } from "react";
import {
  artifacts,
  fields,
  fieldLabel,
  relatedArtifacts,
} from "@/lib/lab-data";
import RecordEditor from "@/components/lab/RecordEditor";
import ArtifactBrief from "@/components/lab/ArtifactBrief";
const positions: Record<string, [number, number]> = {
  connectome: [405, 76],
  neuromatch: [552, 171],
  allen: [367, 233],
  marimo: [164, 296],
  jupyterlite: [62, 200],
  cadcad: [495, 366],
  ipfs: [116, 79],
  cognition: [257, 389],
};
const centers: Record<string, [number, number]> = {
  neurotech: [477, 111],
  "cross-field": [130, 238],
  "economies-governance": [492, 295],
  "digital-human-rights": [207, 128],
  "ai-robotics": [302, 317],
};
export default function ResearchMap({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [selected, setSelected] = useState("connectome");
  const [list, setList] = useState(false);
  const [contribute, setContribute] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("node");
    if (artifacts.some((a) => a.id === id)) setSelected(id!);
    if (window.matchMedia("(max-width:600px)").matches) setList(true);
  }, []);
  function select(id: string) {
    setSelected(id);
    const u = new URL(window.location.href);
    u.searchParams.set("node", id);
    window.history.replaceState(null, "", u.pathname + u.search + u.hash);
  }
  const artifact = artifacts.find((a) => a.id === selected)!;
  const related = relatedArtifacts(selected);
  return (
    <section
      className={`lab-map ${compact ? "lab-map-compact" : ""}`}
      aria-label="Research map"
    >
      <div className="lab-map-heading">
        <div>
          <span className="lab-map-kicker">A MAP OF POSSIBILITIES</span>
          <p>Follow the work.</p>
        </div>
        <button
          className="lab-map-toggle"
          onClick={() => setList(!list)}
          aria-pressed={list}
        >
          {list ? "Map view ⤢" : "List view ☷"}
        </button>
      </div>
      <div className="lab-map-legend">
        <span>
          <i />
          Artifact
        </span>
        <span>
          <i className="lab-ring" />
          Shared field
        </span>
        <span>Editorial connections, not endorsements</span>
      </div>
      {list ? (
        <div
          className="lab-map-list"
          role="group"
          aria-label="Select an artifact"
        >
          {artifacts.map((a) => (
            <button
              key={a.id}
              aria-pressed={selected === a.id}
              onClick={() => select(a.id)}
            >
              <span>{a.title}</span>
              <small>{fieldLabel(a.field)} ↗</small>
            </button>
          ))}
        </div>
      ) : (
        <svg
          className="lab-map-svg"
          viewBox="0 0 640 445"
          aria-label="Artifacts connected by research field"
        >
          <defs>
            <pattern
              id="lab-grid"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".7" fill="#b9c3c9" opacity=".2" />
            </pattern>
          </defs>
          <rect width="640" height="445" fill="url(#lab-grid)" />
          {artifacts.map((a) => {
            const [x, y] = positions[a.id];
            const [cx, cy] = centers[a.field];
            return (
              <path
                key={a.id}
                d={`M ${cx} ${cy} Q ${cx} ${y} ${x} ${y}`}
                fill="none"
                stroke={selected === a.id ? "#77b7ff" : "#465259"}
                strokeWidth={selected === a.id ? 1.6 : 1}
              />
            );
          })}
          {fields.map((f) => {
            const [x, y] = centers[f.id];
            return (
              <g key={f.id}>
                <circle cx={x} cy={y} r="5" fill="#151d21" stroke="#8b999f" />
                <text
                  x={x}
                  y={y - 18}
                  textAnchor="middle"
                  className="lab-map-field"
                >
                  {f.short.toUpperCase()}
                </text>
              </g>
            );
          })}
          {artifacts.map((a, i) => {
            const [x, y] = positions[a.id];
            const active = selected === a.id;
            return (
              <g
                key={a.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${a.title}`}
                aria-pressed={active}
                onClick={() => select(a.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(a.id);
                  }
                  if (
                    [
                      "ArrowRight",
                      "ArrowDown",
                      "ArrowLeft",
                      "ArrowUp",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      artifacts[
                        (i +
                          (["ArrowRight", "ArrowDown"].includes(e.key)
                            ? 1
                            : artifacts.length - 1)) %
                          artifacts.length
                      ];
                    select(next.id);
                    document
                      .querySelector<SVGGElement>(
                        `[data-map-node="${next.id}"]`,
                      )
                      ?.focus();
                  }
                }}
                data-map-node={a.id}
                className="lab-map-node"
              >
                <rect
                  x={x - 25}
                  y={y - 25}
                  width="50"
                  height="50"
                  fill="transparent"
                />
                {active && (
                  <circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill="none"
                    stroke="#7dbafd"
                    opacity=".6"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={active ? 7 : 4.5}
                  fill={active ? "#77b7ff" : "#e3e8e5"}
                />
                <text x={x} y={y + 35} textAnchor="middle">
                  {a.id === "connectome"
                    ? "Human connectome"
                    : a.id === "cognition"
                      ? "Cognitive dark matter"
                      : a.id === "ipfs"
                        ? "Content addressing"
                        : a.id === "neuromatch"
                          ? "Neuromatch"
                          : a.title}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <div className="lab-map-inspector" aria-live="polite">
        <div className="lab-map-selected">
          <span className="lab-map-kicker">
            SELECTED / {fieldLabel(artifact.field)}
          </span>
          <h3>{artifact.title}</h3>
          <p>{artifact.description}</p>
          <p className="lab-map-opening">Editorial opening: {artifact.prompt}</p>
        </div>
        <div className="lab-map-inspector-actions">
          <a href={artifact.url} target="_blank" rel="noopener noreferrer">
            Read source ↗
          </a>
          <button onClick={() => setContribute(true)}>Add evidence +</button>
        </div>
        <small>
          {artifact.source}
          {related.length > 0
            ? ` · Related by ${artifact.topic.toLowerCase()}`
            : ""}
        </small>
        <ArtifactBrief key={artifact.id} artifact={artifact} />
      </div>
      {contribute && (
        <RecordEditor
          kind="contribution"
          initial={{ targetUrl: artifact.url, field: artifact.field }}
          onClose={() => setContribute(false)}
        />
      )}
    </section>
  );
}
