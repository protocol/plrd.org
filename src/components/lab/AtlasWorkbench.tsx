"use client";
import { useState } from "react";
import Link from "next/link";
import RecordEditor from "@/components/lab/RecordEditor";
const source = "https://github.com/lksbrssr/neuro-atlas";
const entries = [
  {
    title: "Milestone timeline",
    label: "EVENTS / PROVENANCE",
    description:
      "What actually happened, when it happened, and the evidence behind it. A dated source is more useful than a confident summary.",
    url: source + "/tree/main/data",
    question:
      "Find a milestone whose date, scope, or source needs a closer look.",
  },
  {
    title: "Funding index / Companies",
    label: "CAPITAL / CONTEXT",
    description:
      "Help distinguish a financing event from a valuation, a company from a project, and a reported amount from an estimate.",
    url: source + "/tree/main/data",
    question:
      "Attach the original announcement and preserve what the number measures.",
  },
  {
    title: "Field measurements",
    label: "MEASUREMENT / LIMITS",
    description:
      "Scientific progress is only as legible as its units, denominators, and methods. Make those assumptions inspectable.",
    url: source + "/blob/main/docs/performance-curves.md",
    question:
      "Trace a measurement to its methods and name what it cannot tell us.",
  },
];
export default function AtlasWorkbench() {
  const [target, setTarget] = useState<string | null>(null);
  return (
    <div className="lab-wrap lab-workbench">
      <div className="lab-atlas-intro">
        <div>
          <p className="lab-eyebrow">
            THE ATLAS / A SHARED PICTURE OF THE FRONTIER
          </p>
          <h1>
            A map is only
            <br />
            as good as
            <br />
            <em>its evidence.</em>
          </h1>
          <p>
            The Neuro Atlas connects milestones, companies, capital, and field
            measurements. Help make its sources clearer—one well-supported
            contribution at a time.
          </p>
          <div className="lab-hero-actions">
            <button
              className="lab-button lab-primary"
              onClick={() => setTarget(source)}
            >
              Add evidence +
            </button>
            <a
              className="lab-text-button"
              href={source}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore the public source ↗
            </a>
          </div>
          <p className="lab-smallprint"><a href="https://www.plneuro.xyz/insights/neurotech-frontier-human-flourishing/" target="_blank" rel="noopener noreferrer">Read the public PL Neuro field introduction ↗</a></p>
        </div>
        <div className="lab-atlas-specimen">
          <span className="lab-section-label">
            NEURO ATLAS / AN EVIDENCE CHAIN
          </span>
          <div className="lab-evidence-chain">
            <div>
              <small>01 / THE CLAIM</small>
              <p>What changed?</p>
            </div>
            <span aria-hidden="true">↓</span>
            <div>
              <small>02 / THE SOURCE</small>
              <p>How do we know?</p>
            </div>
            <span aria-hidden="true">↓</span>
            <div>
              <small>03 / THE LIMIT</small>
              <p>What’s still uncertain?</p>
            </div>
          </div>
          <p>No claim without a trail back to something real.</p>
        </div>
      </div>
      <div className="lab-atlas-access">
        <span className="lab-status-dot" />
        <p>
          The Neuro Atlas source repository is public. The hosted Atlas
          currently requires deployment access; this page does not bypass that
          gate or claim to edit its data.
        </p>
        <a
          href="https://neuro-atlas-app.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Hosted Atlas · access required ↗
        </a>
      </div>
      <section className="lab-atlas-entries">
        <div className="lab-section-heading">
          <h2>Pick a thread. Make it stronger.</h2>
          <span className="lab-eyebrow">CONTRIBUTION PATHS</span>
        </div>
        {entries.map((e, i) => (
          <article key={e.title}>
            <span className="lab-atlas-index">0{i + 1}</span>
            <div>
              <p className="lab-eyebrow">{e.label}</p>
              <h3>{e.title}</h3>
              <p>{e.description}</p>
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="lab-text-button"
              >
                Inspect source material ↗
              </a>
            </div>
            <div className="lab-atlas-next">
              <p>{e.question}</p>
              <button
                className="lab-button lab-quiet"
                onClick={() => setTarget(e.url)}
              >
                Contribute evidence +
              </button>
            </div>
          </article>
        ))}
      </section>
      <section className="lab-atlas-protocol">
        <div>
          <p className="lab-eyebrow">HOW A CONTRIBUTION BECOMES USEFUL</p>
          <h2>
            A source, not
            <br />a stamp of approval.
          </h2>
        </div>
        <ol>
          <li>
            <span>1</span>
            <div>
              <h3>Point to the exact artifact.</h3>
              <p>
                Include the entry, file, or commit and the claim you are
                addressing.
              </p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <h3>Add an observation and evidence.</h3>
              <p>
                Draft locally or publish to your own AT Protocol repository.
                Neither action changes the canonical Atlas.
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <h3>Let a person check the work.</h3>
              <p>
                Acceptance and integration are separate steps. Machine output
                alone is not verification.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <div className="lab-contribute-strip">
        <p>Your agent can help trace the sources.</p>
        <Link href="/lab/collaborate/" className="lab-text-button">
          Prepare a source-audit packet ↗
        </Link>
      </div>
      {target && (
        <RecordEditor
          kind="contribution"
          initial={{ targetUrl: target, field: "neurotech" }}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}
