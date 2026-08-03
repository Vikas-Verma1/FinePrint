"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

export default function UploadZone({ icon, title, hint, loaded, fileName, onFile }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFile(f);
  }

  return (
    <label
      className={cn("dz", loaded && "loaded", drag && "drag")}
      onClick={(e) => { if (e.target.tagName !== "BUTTON") input.current?.click(); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDrag(false);
      }}
      onDrop={handleDrop}
    >
      <div className="dz-icon">{drag ? "📥" : icon}</div>
      <div className="dz-title">{title}</div>
      <div className="dz-hint">{drag ? "Drop the file here…" : hint}</div>
      <span className="btn sm ghost" style={{ pointerEvents: "none" }}>Attach PDF / TXT</span>
      <span className="dz-or">or drag & drop</span>
      {loaded && <div className="dz-file">{fileName}</div>}
      <input ref={input} type="file" accept=".pdf,.txt,.md,.jpg,.png"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
    </label>
  );
}














// "use client";
// import { useRef } from "react";
// import { cn } from "@/lib/cn";

// export default function UploadZone({ icon, title, hint, loaded, fileName, onFile }) {
//   const input = useRef(null);
//   return (
//     <label className={cn("dz", loaded && "loaded")} onClick={(e) => { if (e.target.tagName !== "BUTTON") input.current?.click(); }}>
//       <div className="dz-icon">{icon}</div>
//       <div className="dz-title">{title}</div>
//       <div className="dz-hint">{hint}</div>
//       <span className="btn sm ghost" style={{ pointerEvents: "none" }}>Attach PDF / TXT</span>
//       {loaded && <div className="dz-file">{fileName}</div>}
//       <input ref={input} type="file" accept=".pdf,.txt,.md,.jpg,.png"
//         onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
//     </label>
//   );
// }