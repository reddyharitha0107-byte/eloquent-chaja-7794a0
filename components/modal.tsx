"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({ title, eyebrow, children, close, wide = false }: { title: string; eyebrow?: string; children: ReactNode; close: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const elements = dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), input, select, a[href], [tabindex='0']");
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [close]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <div className={`modal ${wide ? "modal-wide" : ""}`} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}
