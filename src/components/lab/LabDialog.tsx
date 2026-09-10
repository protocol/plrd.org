"use client";
import { useEffect, useId, useRef } from "react";
export default function LabDialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const closing = useRef(onClose);
  closing.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`lab-dialog ${wide ? "lab-dialog-wide" : ""}`}
      aria-labelledby={id}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const dialog = e.currentTarget;
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter(el => {
          const style = window.getComputedStyle(el);
          return !el.closest("[hidden]") && style.display !== "none" && style.visibility !== "hidden";
        });
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { e.preventDefault(); return; }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        closing.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            closing.current();
        }
      }}
    >
      <div className="lab-dialog-head">
        <p className="lab-eyebrow">OPEN LAB / WORK IN PROGRESS</p>
        <button
          type="button"
          className="lab-icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
}
