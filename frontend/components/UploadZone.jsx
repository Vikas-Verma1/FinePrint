"use client";
import { useRef } from "react";
import { cn } from "@/lib/cn";

export default function UploadZone({ icon, title, hint, loaded, fileName, onFile, onSample }) {
  const input = useRef(null);
  return (
    <label className={cn("dz", loaded && "loaded")} onClick={(e) => { if (e.target.tagName !== "BUTTON") input.current?.click(); }}>
      <div className="dz-icon">{icon}</div>
      <div className="dz-title">{title}</div>
      <div className="dz-hint">{hint}</div>
      <span className="btn sm ghost" style={{ pointerEvents: "none" }}>Upload PDF / TXT</span>
      <button type="button" className="btn sm ghost" style={{ marginLeft: 8, pointerEvents: "auto" }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSample(); }}>
        Load sample
      </button>
      {loaded && <div className="dz-file">✓ {fileName}</div>}
      <input ref={input} type="file" accept=".pdf,.txt,.md,.jpg,.png"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
    </label>
  );
}