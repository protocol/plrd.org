export type LabField =
  | "digital-human-rights"
  | "economies-governance"
  | "ai-robotics"
  | "neurotech"
  | "cross-field";
export type PostType = "question" | "finding" | "tool" | "help" | "negative";
export type RecordKind =
  | "profile"
  | "note"
  | "app"
  | "contribution"
  | "participation";
export type LabProfile = {
  workingOn: string;
  interests: string[];
  lookingFor: string;
  githubUrl?: string;
  scholarUrl?: string;
};
export type LabRecord = {
  uri: string;
  cid?: string;
  kind: RecordKind;
  data: Record<string, unknown>;
  createdAt?: string;
};
export type Capabilities = {
  canSignIn: boolean;
  canPublish: boolean;
  mode: "ready" | "unconfigured";
  message?: string;
};
export type LivePost = {
  uri: string;
  cid?: string;
  text: string;
  author: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  createdAt: string;
  url: string;
};
export type LabFeed = {
  items: LivePost[];
  sourceLabel: string;
  sourceUrl?: string;
  fetchedAt: string | null;
  status: "live" | "empty" | "unavailable";
  message?: string;
};
export type Artifact = {
  id: string;
  title: string;
  description: string;
  url: string;
  field: LabField;
  type: PostType;
  topic: string;
  source: string;
  prompt: string;
  codeUrl?: string;
  demoUrl?: string;
  license?: string;
  app?: boolean;
};
