"use client";
import { useEffect, useMemo, useRef } from "react";
import { chunkPolicy } from "@/lib/rag";

export default function PolicyViewer({ open, onClose, text, focusRef }) {
  const boxRef = useRef(null);
  const chunks = useMemo(() => (open ? chunkPolicy(text || "") : []), [open, text]);

  useEffect(() => {
    if (!open || !focusRef || !boxRef.current) return;
    const el = boxRef.current.querySelector(`[data-ref="${CSS.escape(focusRef)}"]`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.classList.add("hl");
    }
  }, [open, focusRef, chunks]);

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", zIndex: 500, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div ref={boxRef} onClick={(e) => e.stopPropagation()}
        style={{ width: "min(780px, 92vw)", maxHeight: "80vh", overflowY: "auto", background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <b>📖 Policy viewer</b>
          <button className="chat-action-btn" onClick={onClose}>✕</button>
        </div>
        {chunks.map((c, i) => (
          <div key={i} data-ref={c.ref} className="viewer-chunk">
            <span className="chip">{c.ref}</span> {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}