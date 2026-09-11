"use client";
import Link from "next/link";
import FeedWorkbench from "@/components/lab/FeedWorkbench";

/** The home route is the workbench; this invitation is deliberately only a row. */
export default function Landing() {
  return (
    <>
      <section className="lab-wrap lab-welcome" aria-label="Open Lab invitation">
        <p>Made something that makes science easier?</p>
        <div>
          <Link href="/lab/apps/">Bring a tool <span aria-hidden="true">↗</span></Link>
          <Link href="/lab/bottlenecks/">Work on an idea <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <FeedWorkbench />
    </>
  );
}
