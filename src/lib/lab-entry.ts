import { safeUrl } from "@/lib/lab-client";
import { fields, postTypes } from "@/lib/lab-data";
import type { RecordKind } from "@/lib/lab-types";
export type EntryValues = Record<string, string>;
export type EntryField = {
  key: string;
  label: string;
  type?: "textarea" | "url" | "select";
  required?: boolean;
  max?: number;
  options?: { id: string; label: string }[];
  hint?: string;
};
const field: EntryField = {
  key: "field",
  label: "Field",
  type: "select",
  required: true,
  options: fields,
};
const evidence: EntryField = {
  key: "evidenceUrl",
  label: "Evidence URL",
  type: "url",
  max: 2048,
};
export const entryFields: Record<RecordKind, EntryField[]> = {
  note: [
    {
      key: "text",
      label: "What breakthrough are you working on?",
      type: "textarea",
      required: true,
      max: 2000,
      hint: "A rough question, a useful tool, or something that didn’t work is welcome.",
    },
    {
      key: "postType",
      label: "Kind of work",
      type: "select",
      options: postTypes,
      required: true,
    },
    field,
    evidence,
  ],
  app: [
    { key: "title", label: "App title", required: true, max: 160 },
    { key: "url", label: "App URL", type: "url", required: true, max: 2048 },
    {
      key: "description",
      label: "What does it make possible?",
      type: "textarea",
      required: true,
      max: 1200,
    },
    field,
    {
      key: "githubUrl",
      label: "Source code URL (optional)",
      type: "url",
      max: 2048,
    },
  ],
  contribution: [
    {
      key: "targetUrl",
      label: "Artifact or Atlas entry URL",
      type: "url",
      required: true,
      max: 2048,
    },
    {
      key: "observation",
      label: "What does the evidence show?",
      type: "textarea",
      required: true,
      max: 1200,
      hint: "Describe the claim, correction, or limitation. Separate observation from inference.",
    },
    { ...evidence, required: true },
    field,
  ],
  profile: [
    {
      key: "workingOn",
      label: "Working on",
      type: "textarea",
      required: true,
      max: 1200,
    },
    {
      key: "interests",
      label: "Interests",
      max: 480,
      hint: "Comma-separated. Up to 8 interests, 60 characters each.",
    },
    { key: "lookingFor", label: "Looking for", type: "textarea", max: 1200 },
    {
      key: "githubUrl",
      label: "GitHub URL (optional)",
      type: "url",
      max: 2048,
    },
    {
      key: "scholarUrl",
      label: "Google Scholar URL (optional)",
      type: "url",
      max: 2048,
    },
  ],
  participation: [
    { key: "campaignId", label: "Pilot recipe", required: true, max: 160 },
    { key: "taskId", label: "Task ID", required: true, max: 160 },
    {
      key: "role",
      label: "Role",
      type: "select",
      required: true,
      options: [
        { id: "research", label: "Research" },
        { id: "reproduce", label: "Reproduce" },
        { id: "review", label: "Review" },
      ],
    },
    {
      key: "note",
      label: "Contribution intent or result",
      type: "textarea",
      required: true,
      max: 1200,
    },
    evidence,
  ],
};
export function validateEntry(kind: RecordKind, values: EntryValues) {
  const errors: Record<string, string> = {};
  for (const f of entryFields[kind]) {
    const v = (values[f.key] || "").trim();
    if (f.required && !v) errors[f.key] = "This field is required.";
    else if (f.max && v.length > f.max)
      errors[f.key] = `Keep this under ${f.max} characters.`;
    else if (v && f.type === "url" && !safeUrl(v))
      errors[f.key] = "Use a public HTTPS URL without credentials.";
    else if (f.type === "select" && !f.options?.some((o) => o.id === v))
      errors[f.key] = "Choose an option.";
  }
  if (kind === "profile") {
    const interests = (values.interests || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (interests.length > 8 || interests.some((s) => s.length > 60))
      errors.interests = "Use up to 8 interests, each under 60 characters.";
  }
  return errors;
}
export function entryPayload(
  kind: RecordKind,
  values: EntryValues,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of entryFields[kind]) {
    const value = (values[f.key] || "").trim();
    if (value || f.required) out[f.key] = value;
  }
  if (kind === "profile")
    out.interests = (values.interests || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return out;
}
export const entryTitles: Record<RecordKind, string> = {
  note: "Put a question into the world.",
  app: "Give a useful tool a home.",
  contribution: "Leave the evidence better.",
  profile: "Your corner of the lab.",
  participation: "Make your contribution legible.",
};
export const entryDefaults = (kind: RecordKind): EntryValues =>
  Object.fromEntries(
    entryFields[kind].map((f) => [
      f.key,
      f.type === "select" ? f.options?.[0]?.id || "" : "",
    ]),
  );
