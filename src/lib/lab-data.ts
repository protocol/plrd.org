import type { Artifact, LabField, PostType } from "@/lib/lab-types";
export const fields: { id: LabField; label: string; short: string }[] = [
  {
    id: "digital-human-rights",
    label: "Digital Human Rights",
    short: "Open systems",
  },
  {
    id: "economies-governance",
    label: "Economies & Governance",
    short: "Coordination",
  },
  { id: "ai-robotics", label: "AI & Robotics", short: "Intelligence" },
  { id: "neurotech", label: "Neurotech", short: "Neuroscience" },
  { id: "cross-field", label: "Cross-field", short: "Scientific tools" },
];
export const postTypes: { id: PostType; label: string }[] = [
  { id: "question", label: "Question" },
  { id: "finding", label: "Finding" },
  { id: "tool", label: "Tool" },
  { id: "help", label: "Needs help" },
  { id: "negative", label: "Negative result" },
];
// Editorial descriptions of public sources, not posts by these projects or membership claims.
export const artifacts: Artifact[] = [
  {
    id: "connectome",
    title: "Reading the brain, connection by connection",
    description:
      "A public research perspective on what it would take to obtain a complete human connectome at synaptic resolution.",
    url: "https://www.plneuro.xyz/insights/how-to-obtain-a-complete-human-connectome-at-synaptic-resolution-within-the-next-decade/",
    field: "neurotech",
    type: "question",
    topic: "Neural maps",
    source: "PL Neuro · research perspective",
    prompt:
      "Which measurement bottleneck could a small, reproducible experiment help resolve?",
  },
  {
    id: "marimo",
    title: "marimo",
    description:
      "Reactive Python notebooks that keep code and outputs in sync. Turn an experiment into a reproducible, interactive app.",
    url: "https://marimo.io/",
    field: "cross-field",
    type: "tool",
    topic: "Reproducible computing",
    source: "marimo · official project",
    prompt:
      "Turn one of your analysis notebooks into an experiment someone else can rerun.",
    codeUrl: "https://github.com/marimo-team/marimo",
    app: true,
  },
  {
    id: "neuromatch",
    title: "Neuromatch computational neuroscience",
    description:
      "Open course materials for learning the models and methods of computational neuroscience, with executable tutorials.",
    url: "https://compneuro.neuromatch.io/",
    field: "neurotech",
    type: "tool",
    topic: "Neural maps",
    source: "Neuromatch · course materials",
    prompt:
      "Reproduce a tutorial result and explain which modeling assumption matters most.",
    codeUrl: "https://github.com/NeuromatchAcademy/course-content",
    app: true,
  },
  {
    id: "jupyterlite",
    title: "JupyterLite",
    description:
      "An actual notebook environment in your browser. Explore Python without first setting up a server.",
    url: "https://jupyterlite.readthedocs.io/en/stable/",
    demoUrl:
      "https://jupyterlite.readthedocs.io/en/stable/_static/lab/index.html",
    field: "cross-field",
    type: "tool",
    topic: "Reproducible computing",
    source: "Project Jupyter · documentation",
    prompt:
      "Package a small public dataset with a notebook that runs from a clean browser.",
    codeUrl: "https://github.com/jupyterlite/jupyterlite",
    app: true,
  },
  {
    id: "cadcad",
    title: "cadCAD",
    description:
      "Model complex systems and compare the consequences of different policies before deploying them in the real world.",
    url: "https://cadcad.org/",
    field: "economies-governance",
    type: "tool",
    topic: "Mechanism design",
    source: "cadCAD · official project",
    prompt:
      "What behavior changes your model’s conclusion? Publish the sensitivity analysis.",
    codeUrl: "https://github.com/cadCAD-org/cadCAD",
    app: true,
  },
  {
    id: "allen",
    title: "Allen Brain Map",
    description:
      "An open doorway into brain cell types, connectivity datasets, visualization tools, and research protocols.",
    url: "https://brain-map.org/",
    field: "neurotech",
    type: "tool",
    topic: "Neural maps",
    source: "Allen Institute · open resources",
    prompt:
      "Connect one published claim to its dataset, method, and reproducible analysis.",
    app: true,
  },
  {
    id: "ipfs",
    title: "Content addressing for scientific artifacts",
    description:
      "IPFS documentation explains how content identifiers can make a specific dataset or result unambiguous and verifiable.",
    url: "https://docs.ipfs.tech/concepts/content-addressing/",
    field: "digital-human-rights",
    type: "finding",
    topic: "Verifiable artifacts",
    source: "IPFS · technical documentation",
    prompt:
      "Could someone verify that they reran exactly the same source data?",
  },
  {
    id: "cognition",
    title: "Cognitive dark matter: measuring what AI misses",
    description:
      "A PL Neuro perspective on the gaps between current AI evaluation and the capabilities of biological intelligence.",
    url: "https://www.plneuro.xyz/insights/cognitive-dark-matter-measuring-what-ai-misses/",
    field: "ai-robotics",
    type: "question",
    topic: "Intelligence benchmarks",
    source: "PL Neuro · published perspective",
    prompt:
      "Propose a bounded test that distinguishes a meaningful capability from a shortcut.",
  },
];
export function filterArtifacts(
  items: Artifact[],
  {
    query = "",
    field = "all",
    type = "all",
  }: { query?: string; field?: string; type?: string },
) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(
    (a) =>
      (field === "all" || a.field === field) &&
      (type === "all" || a.type === type) &&
      terms.every((term) =>
        `${a.title} ${a.description} ${a.topic} ${a.source}`
          .toLowerCase()
          .includes(term),
      ),
  );
}
export function relatedArtifacts(id: string) {
  const a = artifacts.find((a) => a.id === id);
  return a
    ? artifacts.filter(
        (b) => b.id !== a.id && (b.topic === a.topic || b.field === a.field),
      )
    : [];
}
export const fieldLabel = (id: string) =>
  fields.find((f) => f.id === id)?.label || "Cross-field";
export const starterDisclosure =
  "Editorial starter collection — featured projects have not joined Open Lab.";
