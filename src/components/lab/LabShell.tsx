"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { useLabIdentity } from "@/lib/lab-identity";
import { createLabClient } from "@/lib/lab-client";
import type { Capabilities } from "@/lib/lab-types";
import LabDialog from "@/components/lab/LabDialog";
import { DemoCommunityProvider, DemoModeBanner, DemoNotifications, useDemoCommunity } from "@/components/lab/demo";
import { LabActionInbox } from "@/components/lab/social/LabActionInbox";
import "@/components/lab/lab-composition.css";
const client = createLabClient();
const LabContext = createContext<{
  capabilities: Capabilities;
  openLogin: () => void;
}>({
  capabilities: { canSignIn: false, canPublish: false, mode: "unconfigured" },
  openLogin: () => {},
});
export const useLab = () => useContext(LabContext);
const navigation = [
  ["/lab/bottlenecks/", "Bottlenecks"],
  ["/lab/feed/", "Community"],
  ["/lab/apps/", "Apps"],
  ["/lab/atlas/", "Atlas"],
  ["/lab/collaborate/", "Collaborate"],
  ["/lab/profile/", "My bench"],
];
export default function LabShell({ children }: { children: React.ReactNode }) {
  return <DemoCommunityProvider initialMode="demo"><LabChrome>{children}</LabChrome></DemoCommunityProvider>;
}
function LabChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, session, isLoading, error } = useLabIdentity();
  const demo = useDemoCommunity();
  const [loginOpen, setLoginOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities>({
    canSignIn: false,
    canPublish: false,
    mode: "unconfigured",
    message: "Checking sign-in availability…",
  });
  useEffect(() => {
    let active = true;
    client.capabilities().then((c) => {
      if (active) setCapabilities(c);
    });
    setDark(document.documentElement.classList.contains("dark"));
    return () => {
      active = false;
    };
  }, []);
  function theme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <LabContext.Provider
      value={{ capabilities, openLogin: () => setLoginOpen(true) }}
    >
      <div className="open-lab lab-composed">
        <a className="lab-skip" href="#lab-main">
          Skip to content
        </a>
        <header className="lab-header">
          <div className="lab-header-inner">
            <Link href="/lab/" className="lab-brand" aria-label="Open Lab home">
              <img src="/images/pl_logo_mark.svg" alt="" />
              <span>
                Open Lab<small>BY PL R&amp;D</small>
              </span>
            </Link>
            <nav aria-label="Open Lab">
              {navigation.map(([url, label]) => (
                <Link
                  key={url}
                  href={url}
                  aria-current={
                    pathname.replace(/\/?$/, "/") === url ? "page" : undefined
                  }
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="lab-header-actions">
              <button
                className="lab-icon-button lab-theme"
                type="button"
                onClick={theme}
                aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
              >
                {dark ? "☼" : "◐"}
              </button>
              {isLoading ? <span className="lab-smallprint" role="status">Restoring identity…</span> : isAuthenticated ? (
                <Link className="lab-button lab-small" href="/lab/profile/">
                  {session?.handle || "Your bench"}
                </Link>
              ) : (
                <button
                  className="lab-button lab-small"
                  onClick={() => setLoginOpen(true)}
                >
                  Join with Bluesky <span aria-hidden="true">↗</span>
                </button>
              )}
              {demo.ready && (demo.isDemo ? <DemoNotifications /> : !isLoading ? <LabActionInbox ownerId={session?.did || "guest"} /> : null)}
            </div>
          </div>
        </header>
        <main id="lab-main" className="lab-main">
          <div className="lab-wrap lab-composition-banner"><DemoModeBanner /></div>
          {error && !(capabilities.mode === "unconfigured" && error === capabilities.message) && <div className="lab-wrap"><p className="lab-error" role="alert">{error}</p></div>}
          {children}
        </main>
        <footer className="lab-footer">
          <Link href="/lab/" className="lab-footer-name">
            Open Lab <span>Science is a work in progress.</span>
          </Link>
          <div>
            <Link href="/lab/onboarding/">Starting choices</Link>
            <Link href="/lab/efforts/">Efforts experiment</Link>
            <Link href="/lab/demo/">Demo stories</Link>
            <Link href="/about/">About PL R&amp;D ↗</Link>
            <a
              href="https://atproto.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built for AT Protocol ↗
            </a>
          </div>
          <p>Browse freely. Draft locally. Publish deliberately.</p>
        </footer>
        {loginOpen && (
          <LoginDialog
            onClose={() => setLoginOpen(false)}
            capabilities={capabilities}
          />
        )}
      </div>
    </LabContext.Provider>
  );
}
function LoginDialog({
  onClose,
  capabilities,
}: {
  onClose: () => void;
  capabilities: Capabilities;
}) {
  const { login } = useLabIdentity();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!capabilities.canSignIn) {
      setError(capabilities.message || "Sign-in is unavailable here.");
      return;
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(handle.trim())) {
      setError("Enter your full handle, such as name.bsky.social.");
      return;
    }
    setBusy(true);
    try {
      await login(handle.trim(), window.location.pathname + window.location.search + window.location.hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setBusy(false);
    }
  }
  return (
    <LabDialog title="A lab without another password." onClose={onClose}>
      <p className="lab-dialog-intro">
        Use your existing Bluesky or AT Protocol identity. Your identity is
        yours; public contributions live in your account’s repository.
      </p>
      <form onSubmit={submit} noValidate>
        <label className="lab-field">
          Your handle
          <input
            autoFocus
            name="handle"
            autoComplete="username"
            placeholder="you.bsky.social"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <p className="lab-smallprint">
          We never ask for your password here. Continue to your identity
          provider to authorize access. Signing in does not publish your drafts.
        </p>
        {!capabilities.canSignIn && (
          <p className="lab-notice">{capabilities.message}</p>
        )}
        {error && (
          <p className="lab-error" role="alert">
            {error}
          </p>
        )}
        <div className="lab-form-actions">
          <button
            type="button"
            className="lab-button lab-quiet"
            onClick={onClose}
          >
            Keep exploring
          </button>
          <button type="submit" className="lab-button" disabled={busy}>
            {busy ? "Opening your provider…" : "Continue with my identity ↗"}
          </button>
        </div>
        <p className="lab-smallprint">No AT Protocol account yet? <a href="https://bsky.app/" target="_blank" rel="noopener noreferrer">Open Bluesky and choose Create account ↗</a>. This opens a separate tab; come back to your local draft when you have a handle.</p>
      </form>
    </LabDialog>
  );
}
