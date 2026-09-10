"use client";
import { useLabAuth } from "@/lib/lab-auth";
export type LabIdentity = ReturnType<typeof useLabAuth>;
// Dedicated browser SDK identity only. CMS/admin cookies are never consulted.
export function useLabIdentity(): LabIdentity { return useLabAuth(); }
