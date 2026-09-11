"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DEMO_MODE_KEY, DEMO_THREADS, demoCounts, demoStorageKey, demoUnread, emptyDemoState, loadDemoMode, loadDemoState, reduceDemoState, resetDemoState, saveDemoMode, saveDemoState, type DemoAction, type DemoCaseId, type DemoContext, type DemoMode, type DemoResult, type DemoState, type DemoStorage } from '@/lib/lab-demo';

export interface DemoCommunityValue {
  mode: DemoMode; isDemo: boolean; ready: boolean; available: boolean; error: string;
  state: DemoState; activeThreadId: string | null; navigationRevision: number; unreadCount: number;
  setMode: (mode: DemoMode) => DemoResult;
  act: (action: DemoAction) => DemoResult;
  resetDemo: (confirmed: boolean) => DemoResult;
  openDiscussion: (threadId: string) => void;
  counts: (caseId?: DemoCaseId, context?: DemoContext) => ReturnType<typeof demoCounts>;
}
const unavailable = (): DemoResult => ({ ok: false, error: 'Mount DemoCommunityProvider to enable local demo interactions.' });
const hiddenCounts = () => ({ people: 0, discussions: 0, messages: 0, points: 0 });
const fallback: DemoCommunityValue = { mode: 'live', isDemo: false, ready: true, available: false, error: '', state: emptyDemoState(), activeThreadId: null, navigationRevision: 0, unreadCount: 0, setMode: unavailable, act: unavailable, resetDemo: unavailable, openDiscussion: () => {}, counts: hiddenCounts };
const DemoContextValue = createContext<DemoCommunityValue | null>(null);
export function useDemoCommunity(): DemoCommunityValue { return useContext(DemoContextValue) || fallback; }
export interface DemoCommunityProviderProps { children: ReactNode; initialMode?: DemoMode; storageScope?: string; storage?: DemoStorage }
/** Nested mounts reuse the parent. A changed opaque scope remounts state, without migrating any data. */
export function DemoCommunityProvider(props: DemoCommunityProviderProps) {
  const existing = useContext(DemoContextValue);
  if (existing) return <>{props.children}</>;
  return <DemoProviderState key={props.storageScope || 'browser'} {...props} />;
}
function DemoProviderState({ children, initialMode = 'demo', storageScope = 'browser', storage }: DemoCommunityProviderProps) {
  const storeRef = useRef<DemoStorage | null>(null);
  const [state, setState] = useState(() => emptyDemoState(storageScope));
  const [mode, setModeState] = useState<DemoMode>('live');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [navigationRevision, setNavigationRevision] = useState(0);
  useEffect(() => {
    try { storeRef.current = storage || window.localStorage; }
    catch { setError('Browser storage is unavailable. Demo changes cannot be saved.'); setReady(true); return; }
    const refresh = () => {
      if (!storeRef.current) return;
      const loaded = loadDemoState(storeRef.current, storageScope);
      const preference = loadDemoMode(storeRef.current, initialMode);
      setState(loaded.state); setModeState(preference.mode); setError(loaded.error || preference.error || ''); setReady(true);
    };
    refresh();
    const readTarget = () => {
      const id = new URLSearchParams(window.location.search).get('discussion');
      setActiveThreadId(DEMO_THREADS.some(t => t.id === id) ? id : null);
    };
    readTarget();
    const sync = (e: StorageEvent) => { if (e.key === null || e.key === DEMO_MODE_KEY || e.key === demoStorageKey(storageScope)) refresh(); };
    window.addEventListener('storage', sync); window.addEventListener('popstate', readTarget);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('popstate', readTarget); };
  }, [initialMode, storage, storageScope]);
  const finish = (result: DemoResult) => { setError(result.error || ''); return result; };
  function setMode(next: DemoMode): DemoResult {
    if (!storeRef.current) return finish(unavailable());
    const result = saveDemoMode(storeRef.current, next);
    // Even a blocked save must allow a visitor to hide examples immediately.
    if (result.ok || next === 'live') setModeState(next);
    return finish(result);
  }
  function act(action: DemoAction): DemoResult {
    if (!ready || mode !== 'demo' || !storeRef.current) return finish({ ok: false, error: 'Switch to the demo community to try this local action.' });
    try {
      const loaded = loadDemoState(storeRef.current, storageScope);
      if (loaded.status !== 'ok') return finish({ ok: false, error: loaded.error });
      const next = reduceDemoState(loaded.state, action);
      const result = saveDemoState(storeRef.current, next);
      if (result.ok) setState(next);
      return finish(result);
    } catch (e) { return finish({ ok: false, error: e instanceof Error ? e.message : 'Demo change was not saved.' }); }
  }
  function resetDemo(confirmed: boolean): DemoResult {
    if (!storeRef.current) return finish(unavailable());
    const result = resetDemoState(storeRef.current, storageScope, confirmed);
    if (result.ok) setState(emptyDemoState(storageScope));
    return finish(result);
  }
  const isDemo = ready && mode === 'demo';
  return <DemoContextValue.Provider value={{ mode, isDemo, ready, available: true, error, state: isDemo ? state : emptyDemoState(storageScope), activeThreadId: isDemo ? activeThreadId : null, navigationRevision, unreadCount: isDemo ? demoUnread(state).length : 0, setMode, act, resetDemo, openDiscussion: id => { if (DEMO_THREADS.some(t => t.id === id)) { setActiveThreadId(id); setNavigationRevision(v => v + 1); } }, counts: (caseId, context) => isDemo ? demoCounts(state, caseId, context) : hiddenCounts() }}>{children}</DemoContextValue.Provider>;
}
