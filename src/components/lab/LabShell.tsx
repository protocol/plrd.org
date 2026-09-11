"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLabIdentity } from "@/lib/lab-identity";
import { createLabClient } from "@/lib/lab-client";
import type { Capabilities } from "@/lib/lab-types";
import LabDialog from "@/components/lab/LabDialog";
import LabOnboardingGate from "@/components/lab/social/LabOnboardingGate";
import { DemoCommunityProvider, DemoNotifications, useDemoCommunity } from "@/components/lab/demo";
import { LabActionInbox } from "@/components/lab/social/LabActionInbox";
import "@/components/lab/lab-composition.css";
import "@/components/lab/lab-app-shell.css";
const client = createLabClient();
const WELCOME_KEY = "open-lab:welcome:v2";
let welcomeSeenWithoutStorage = false;
function savedAppearance(): "light" | "dark" | null {
  try {
    const value = localStorage.getItem("theme");
    if (value === "light" || value === "dark") return value;
  } catch { /* An unavailable preference is automatic, not an unreadable app. */ }
  return null;
}
const LabContext = createContext<{
  capabilities: Capabilities;
  openLogin: () => void;
}>({
  capabilities: { canSignIn: false, canPublish: false, mode: "unconfigured" },
  openLogin: () => {},
});
export const useLab = () => useContext(LabContext);
const navigation = [
  ["/lab/", "Catch up", "M4 5h16M4 12h10M4 19h16"],
  ["/lab/bottlenecks/", "Work on ideas", "M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0l-1 1v2H9v-2z"],
  ["/lab/apps/", "Find tools", "M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3M8 3h8M7 15h10"],
  ["/lab/explorations/observatory/", "Explore the tech tree", "M12 3v6M5 16v-5h14v5M3 16h4v5H3zm14 0h4v5h-4zM10 3h4v4h-4z"],
  ["/lab/collaborate/", "Contribute", "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6"],
  ["/lab/people/", "Find people", "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M15 3a4 4 0 0 1 0 8m7 10v-2a4 4 0 0 0-3-3.9M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0"],
  ["/lab/profile/", "My bench", "M3 10h18v5H3zm2 5v6m14-6v6M8 10V5h8v5"],
];
function Icon({ path }: { path: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>;
}
export default function LabShell({ children }: { children: React.ReactNode }) {
  const {session} = useLabIdentity();
  return <DemoCommunityProvider initialMode="demo" storageScope={session?.did || "browser"}><LabChrome>{children}</LabChrome></DemoCommunityProvider>;
}
function LabChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, session, isLoading, error } = useLabIdentity();
  const demo = useDemoCommunity();
  const [loginOpen, setLoginOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [dark, setDark] = useState(false);
  const appearance = useRef<"light" | "dark" | null>(null);
  useLayoutEffect(() => {
    // Client entry from marketing must settle before paint, just like the root
    // boot script on a direct /lab/ load. Never save this implicit light default.
    const sync = () => {
      appearance.current = savedAppearance();
      const next = appearance.current === "dark";
      document.documentElement.classList.toggle("dark", next);
      setDark(next);
    };
    const storage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== "theme") return;
      try { if (event.storageArea && event.storageArea !== localStorage) return; } catch { return; }
      sync();
    };
    sync();
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("storage", storage);
      // Read the current OS, not the class captured on entry (which may itself
      // be the direct-load light default). Explicit button choices survive even
      // if storage rejected the write; they are retained for this shell lifetime.
      let next = appearance.current === "dark";
      if (appearance.current === null) {
        try { next = window.matchMedia("(prefers-color-scheme: dark)").matches; } catch {}
      }
      document.documentElement.classList.toggle("dark", next);
    };
  }, []);
  const [capabilitiesReady, setCapabilitiesReady] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities>({
    canSignIn: false, canPublish: false, mode: "unconfigured", message: "Checking sign-in availability…",
  });
  useEffect(() => {
    let active = true;
    client.capabilities().then((c) => { if (active) { setCapabilities(c); setCapabilitiesReady(true); } });
    return () => { active = false; };
  }, []);
  useEffect(() => { setNavigationOpen(false); }, [pathname]);
  useEffect(() => {
    if (isLoading || !capabilitiesReady || /\/(?:oauth|return)(?:\/|$)/.test(pathname)) return;
    const callback = new URLSearchParams(window.location.hash.slice(1));
    if (callback.has("code") || callback.has("state") || callback.has("error")) return;
    let seen = welcomeSeenWithoutStorage;
    try {
      seen = sessionStorage.getItem(WELCOME_KEY) === "seen";
      sessionStorage.setItem(WELCOME_KEY, "seen");
    } catch { welcomeSeenWithoutStorage = true; }
    if (!seen && !isAuthenticated) setLoginOpen(true);
    if (isAuthenticated) setLoginOpen(false);
  }, [isLoading, isAuthenticated, capabilitiesReady, pathname]);
  useEffect(() => {
    if (!navigationOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setNavigationOpen(false); menuRef.current?.focus(); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [navigationOpen]);
  function theme() {
    const next = !document.documentElement.classList.contains("dark");
    appearance.current = next ? "dark" : "light";
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }
  const route = pathname.replace(/\/?$/, "/");
  const activeRoute = route === "/lab/feed/" ? "/lab/" : route;
  const name = session?.displayName || session?.handle || "My bench";
  return (
    <LabContext.Provider value={{ capabilities, openLogin: () => setLoginOpen(true) }}>
      <div className="open-lab lab-composed lab-app-shell">
        <a className="lab-skip" href="#lab-main">Skip to content</a>
        <aside id="lab-sidebar" className="lab-sidebar" data-open={navigationOpen} aria-label="Lab navigation">
          <Link href="/lab/" className="lab-brand" aria-label="Open Lab home">
            <img src="/images/pl_logo_mark.svg" alt="" />
            <span>Open Lab<small>BY PL R&amp;D</small></span>
          </Link>
          <nav aria-label="Open Lab">
            {navigation.map(([url, label, icon]) => <Link key={url} href={url} aria-current={activeRoute === url ? "page" : undefined} onClick={() => setNavigationOpen(false)}><Icon path={icon} /><span>{label}</span></Link>)}
          </nav>
          <div className="lab-sidebar-footer">
            <Link href="/lab/atlas/" aria-current={activeRoute === "/lab/atlas/" ? "page" : undefined}>Improve the Atlas <span aria-hidden="true">→</span></Link>
            <Link href="/lab/efforts/" aria-current={activeRoute === "/lab/efforts/" ? "page" : undefined}>Efforts experiment <span aria-hidden="true">→</span></Link>
            <button type="button" onClick={theme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}><Icon path={dark ? "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0" : "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11"} />{dark ? "Light appearance" : "Dark appearance"}</button>
            <Link href="/about/">About PL R&amp;D <span aria-hidden="true">↗</span></Link>
          </div>
        </aside>
        <header className="lab-header">
          <div className="lab-header-inner">
            <button ref={menuRef} className="lab-icon-button lab-nav-toggle" type="button" aria-label="Toggle navigation" aria-controls="lab-sidebar" aria-expanded={navigationOpen} onClick={() => setNavigationOpen(v => !v)}><Icon path="M4 6h16M4 12h16M4 18h16" /></button>
            <form action="/lab/feed/" method="get" role="search" className="lab-global-search">
              <Icon path="m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0" />
              <input type="search" name="q" aria-label="Search work" placeholder="Search feed ideas, tools, and requests" />
              <button type="submit" aria-label="Search"><span aria-hidden="true">↵</span></button>
            </form>
            <button className="lab-scope-control" data-lab-scope-control type="button" aria-label={`Demo ${demo.isDemo ? "on: example activity" : "off: real and local work"}. Change scope`} aria-haspopup="dialog" aria-expanded={demoOpen} disabled={!demo.ready} onClick={() => { setNavigationOpen(false); setDemoOpen(true); }}>
              <span className="lab-scope-dot" aria-hidden="true" data-on={demo.isDemo} />Demo <span>{demo.ready ? (demo.isDemo ? "on" : "off") : "…"}</span><span aria-hidden="true">⌃</span>
            </button>
            <div className="lab-header-actions">
              {!demo.ready || (!demo.isDemo && isLoading) ? <button className="lab-icon-button" aria-label="Notifications loading" disabled><Icon path="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></button> : demo.isDemo ? <DemoNotifications /> : <LabActionInbox ownerId={session?.did || "guest"} />}
              {isAuthenticated ? (
                <Link className="lab-account" href="/lab/profile/" aria-label={`My bench — ${name}`}>
                  <span className="lab-account-avatar" aria-hidden="true">{session?.avatar ? <img src={session.avatar} alt="" /> : name.slice(0, 1).toUpperCase()}</span><span className="lab-account-name">{name}</span>
                </Link>
              ) : (
                <>
                  <button className="lab-account" type="button" aria-label="Sign in to Open Lab" onClick={() => setLoginOpen(true)} disabled={isLoading}>
                    <span className="lab-account-avatar" aria-hidden="true"><Icon path="M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" /></span><span className="lab-account-name">{isLoading ? "Connecting…" : "Sign in"}</span>
                  </button>
                  <Link className="lab-account" href="/lab/profile/" aria-label="My bench">
                    <span className="lab-account-avatar" aria-hidden="true"><Icon path="M3 10h18v5H3zm2 5v6m14-6v6M8 10V5h8v5" /></span><span className="lab-account-name">My bench</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main id="lab-main" className="lab-main" tabIndex={-1}>
          {error && !(capabilities.mode === "unconfigured" && error === capabilities.message) && <div className="lab-wrap"><p className="lab-error" role="alert">{error}</p></div>}
          {children}
        </main>
        {demoOpen && <LabDialog title="Demo mode" onClose={() => setDemoOpen(false)}>
          <div className="lab-demo-disclosure">
            <p>Explore with example people and activity. Demo replies, follows, and effort points are local to this browser; no messages are sent.</p>
            <p>These stories are not scientific evidence or real community activity. Linked source material keeps its own provenance.</p>
            <div className="lab-demo-modes" role="group" aria-label="Community preview mode">
              <button className="lab-button lab-quiet" aria-pressed={demo.isDemo} onClick={() => demo.setMode("demo")}>Show demo community</button>
              <button className="lab-button lab-quiet" aria-pressed={!demo.isDemo} onClick={() => demo.setMode("live")}>Show real / empty view</button>
            </div>
            <p className="lab-smallprint">Demo off hides the examples. It does not connect a backend or publish anything. Your real identity and drafts stay separate.</p>
            {demo.error && <p className="lab-error" role="alert">{demo.error}</p>}
            <Link className="lab-text-button" href="/lab/demo/" onClick={() => setDemoOpen(false)}>Explore demo stories →</Link>
          </div>
        </LabDialog>}
        {!isLoading && isAuthenticated && <LabOnboardingGate />}
        {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} capabilities={capabilities} />}
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
    } finally {
      setBusy(false);
    }
  }
  return (
    <LabDialog title="Make room for your curiosity." variant="centered" onClose={onClose}>
      <p className="lab-dialog-intro">
        Join Open Lab with your Bluesky account to build your bench and find
        people working on the questions you care about.
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
          <div className="lab-notice">
            <p>Sign-in is unavailable on this preview. Browse freely, try tools, and keep drafts locally.</p>
            {capabilities.message && <details className="lab-connection-details"><summary>Connection details</summary><p>{capabilities.message}</p></details>}
          </div>
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
            Continue browsing
          </button>
          <button type="submit" className="lab-button" disabled={busy || !capabilities.canSignIn}>
            {busy ? "Opening your provider…" : capabilities.canSignIn ? "Continue with Bluesky ↗" : "Sign-in unavailable"}
          </button>
        </div>
        <p className="lab-smallprint">No AT Protocol account yet? <a href="https://bsky.app/" target="_blank" rel="noopener noreferrer">Open Bluesky and choose Create account ↗</a>. This opens a separate tab; come back to your local draft when you have a handle.</p>
      </form>
    </LabDialog>
  );
}
