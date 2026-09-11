import type { Artifact } from "@/lib/lab-types";
const useful: Record<string, string> = {
  marimo: "A notebook that reruns from a clean environment, with public inputs, dependency versions, and one explained result.",
  neuromatch: "A pinned tutorial and notebook, environment versions, expected versus observed output, and one modeling limitation.",
  jupyterlite: "A browser-runnable notebook, a small public dataset, and instructions that work without a local Python install.",
  cadcad: "A model, parameter sweep, and comparison showing which assumption changes a policy conclusion. Label simulated outcomes.",
  allen: "The exact dataset and version, measurement units, source method, and an analysis someone can rerun.",
  connectome: "One precisely scoped measurement bottleneck, a linked primary source, and a testable experiment with a clear success criterion.",
  cognition: "A proposed benchmark with observable outcomes, a baseline, and the shortcut it is meant to rule out.",
  ipfs: "A content identifier, exact source data, and steps for checking artifact identity—not a claim of scientific validity.",
};
export default function ArtifactBrief({ artifact, expanded = false }: { artifact: Artifact; expanded?: boolean }) {
  return <details className="lab-artifact-brief" open={expanded || undefined}>
    <summary>A useful next contribution</summary>
    <p className="lab-smallprint">Editorial opening—not a request or endorsement from the featured project.</p>
    <dl className="lab-work-brief">
      <dt>What exists</dt><dd>{artifact.description}</dd>
      <dt>Specific opening</dt><dd>{artifact.prompt}</dd>
      <dt>Inspect or try</dt><dd><a href={artifact.demoUrl || artifact.url} target="_blank" rel="noopener noreferrer">{artifact.title} ↗</a></dd>
      <dt>Useful contribution</dt><dd>{useful[artifact.id]}</dd>
    </dl>
  </details>;
}
