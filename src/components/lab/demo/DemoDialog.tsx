"use client";
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/components/lab/demo/demo.module.css';
export function DemoDialog({ title, children, onClose, corner = false }: { title: string; children: ReactNode; onClose: () => void; corner?: boolean }) {
  const id = useId(); const box = useRef<HTMLDivElement>(null); const overlay = useRef<HTMLDivElement>(null); const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const siblings = Array.from(document.body.children).filter(e => e !== overlay.current).map(e => ({ e, inert: e.hasAttribute('inert') }));
    siblings.forEach(({ e }) => e.setAttribute('inert', ''));
    const focusable = () => Array.from(box.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea, input, select, [tabindex="0"]') || []);
    focusable()[0]?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key === 'Tab') {
        const elements = focusable(); const first = elements[0]; const last = elements.at(-1);
        if (!elements.length) { event.preventDefault(); box.current?.focus(); return; }
        if (event.shiftKey && (document.activeElement === first || !box.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !box.current?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('keydown', key, true); siblings.forEach(({ e, inert }) => { if (!inert) e.removeAttribute('inert'); }); if (previous?.isConnected) previous.focus(); };
  }, []);
  if (typeof document === 'undefined') return null;
  return createPortal(<div ref={overlay} className={`${styles.root} ${styles.overlay} ${corner ? styles.corner : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={box} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}><header className={styles.row}><h2 id={id}>{title}</h2><button className={styles.button} aria-label="Close dialog" onClick={onClose}>Close ×</button></header>{children}</div></div>, document.body);
}
