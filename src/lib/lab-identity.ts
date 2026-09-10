"use client";
// UI-lane integration seam. Parent replaces this hook with useLabAuth from the
// dedicated browser SDK provider. The legacy CMS session is never a Lab identity.
export type LabIdentity = {
  session: { did: string; handle: string; displayName?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (handle: string, returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
};
export function useLabIdentity(): LabIdentity {
  return {
    session: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: async () => { throw Error("Open Lab sign-in is not configured in this environment."); },
    logout: async () => {},
  };
}
