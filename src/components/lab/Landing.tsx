"use client";
import Link from "next/link";
import { useState } from "react";

import { DemoCommunityPanel } from "@/components/lab/demo";
import ResearchMap from "@/components/lab/ResearchMap";
import RecordEditor from "@/components/lab/RecordEditor";
import { artifacts, starterDisclosure } from "@/lib/lab-data";
export default function Landing() {

  const [compose, setCompose] = useState(false);
  return (
    <>
      <section className="lab-hero lab-wrap">
        <div className="lab-hero-copy">
          <p className="lab-eyebrow">
            <span className="lab-blue-dot" /> A NEW KIND OF RESEARCH COMMONS
          </p>
          <h1>
            Find a bottleneck.<br />
            <em>Build together.</em>
          </h1>
          <p className="lab-hero-deck">
            What’s holding progress back? Refine the problem together, design a
            thoughtful intervention, and test whether it helps.
          </p>
          <div className="lab-hero-actions">
            <Link href="/lab/bottlenecks/" className="lab-button lab-primary">
              Find a place to contribute <span>↗</span>
            </Link>
            <Link className="lab-text-button" href="/lab/apps/#signal-sandbox">
              Try an experiment. Keep the result. →
            </Link>
          </div>
          <div className="lab-hero-note">
            <span>
              OPEN QUESTIONS.
              <br />
              OPEN TO EVERYONE.
            </span>
            <p>
              Computing, coordination, intelligence, and the brain. You don’t
              need to be part of Protocol Labs to take part.
            </p>
          </div>
        </div>
        <div className="lab-hero-map">
          <ResearchMap />
        </div>
      </section>
      <div className="lab-wrap"><DemoCommunityPanel className="lab-community-supplement" context="landing" caseId="reproducibility" title="A failed test. A better question. A next step." showPeople /></div>
      <div className="lab-frontier-strip lab-wrap">
        <span>THINGS WORTH FIGURING OUT</span>
        <Link href="/lab/feed/?field=digital-human-rights">Human freedom</Link>
        <Link href="/lab/feed/?field=economies-governance">
          Better coordination
        </Link>
        <Link href="/lab/feed/?field=ai-robotics">Machine intelligence</Link>
        <Link href="/lab/feed/?field=neurotech">The brain</Link>
      </div>
      <section className="lab-wrap lab-home-work">
        <div className="lab-home-work-intro">
          <p className="lab-eyebrow">01 / START SOMEWHERE REAL</p>
          <h2>
            Less broadcasting.
            <br />
            More building on
            <br />
            <em>each other.</em>
          </h2>
          <p>
            Follow a question to its source. Bring a missing reference. Make a
            small piece of the answer.
          </p>
          <button className="lab-text-button" onClick={() => setCompose(true)}>
            Share your unfinished work ↗
          </button>
        </div>
        <div className="lab-source-notes">
          <p className="lab-smallprint">{starterDisclosure}</p>
          {[artifacts[0], artifacts[7]].map((a, i) => (
            <article className="lab-source-note" key={a.id}>
              <div className="lab-note-number">0{i + 1}</div>
              <div>
                <p className="lab-eyebrow">{a.source}</p>
                <h3>{a.title}</h3>
                <p>{a.prompt}</p>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lab-text-button"
                >
                  Open the starting point ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="lab-wrap lab-home-tools">
        <div>
          <p className="lab-eyebrow">02 / IDEAS YOU CAN TOUCH</p>
          <h2>
            A tool can be
            <br />a contribution.
          </h2>
          <p>
            Not just things to read. Things to run, inspect, and make your own.
          </p>
          <Link className="lab-text-button" href="/lab/apps/">
            Find your next instrument ↗
          </Link>
        </div>
        <Link href="/lab/apps/#signal-sandbox" className="lab-signal-teaser">
          <div className="lab-section-label">
            BUILT-IN EXPERIMENT / NO SETUP
          </div>
          <div className="lab-teaser-wave" aria-hidden="true">
            ∿∿∿∿∿∿
          </div>
          <div>
            <h3>
              What gets lost
              <br />
              between the samples?
            </h3>
            <span>Play with a signal →</span>
          </div>
          <small>
            A synthetic signal sandbox. Change the assumptions. See the
            consequences.
          </small>
        </Link>
        <div className="lab-tool-index">
          {artifacts
            .filter((a) => a.app)
            .slice(0, 3)
            .map((a) => (
              <Link key={a.id} href={`/lab/apps/?q=${a.id}`}>
                <span>{a.title}</span>
                <small>{a.topic}</small>
                <b aria-hidden="true">↗</b>
              </Link>
            ))}
        </div>
      </section>
      <section className="lab-agent-invitation">
        <div className="lab-wrap">
          <div>
            <p className="lab-eyebrow">
              03 / HUMAN CURIOSITY, MACHINE CAPACITY
            </p>
            <h2>
              Bring your agent.
              <br />
              <em>Keep your keys.</em>
            </h2>
          </div>
          <div>
            <p>
              Give your agent a bounded piece of real research. Take a source
              packet, choose a role, and bring back evidence someone can check.
            </p>
            <Link
              href="/lab/collaborate/"
              className="lab-button lab-paper-button"
            >
              Choose a pilot recipe ↗
            </Link>
            <small>
              No pooled tokens. No background spending. No pretend swarms.
            </small>
          </div>
        </div>
      </section>
      {compose && (
        <RecordEditor kind="note" onClose={() => setCompose(false)} />
      )}
    </>
  );
}
