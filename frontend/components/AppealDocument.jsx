"use client";
import { useEffect, useState } from "react";

export default function AppealDocument({ sections }) {
  const [stamp, setStamp] = useState(false);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setStamp(false); setRevealed(0);
    const timers = sections.map((_, i) => setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), i * 260));
    const t = setTimeout(() => setStamp(true), 700);
    return () => { timers.forEach(clearTimeout); clearTimeout(t); };
  }, [sections]);

  const plain = sections
    .map((s) => s.h.toUpperCase() + "\n\n" + s.p.join("\n") + (s.quote ? "\n\n  " + s.quote : "") + (s.p2 ? "\n\n" + s.p2.join("\n") : ""))
    .join("\n\n");

  const copy = () => navigator.clipboard?.writeText(plain);
  const print = () => {
    const area = document.getElementById("print-area");
    if (area) area.innerHTML = document.getElementById("appeal-doc-inner")?.innerHTML || "";
    window.print();
  };

  return (
    <>
      <div className="appeal-doc" id="appeal-doc-inner">
        <div className="lh">Appeal of Denied Claim · Prepared by FinePrint AI Advocate · Draft for patient review</div>
        {sections.map((s, i) => (
          <div key={i} className={"appeal-sec" + (i < revealed ? " show" : "")}>
            <h4>{s.h}</h4>
            {s.p.map((p, k) => <p key={k}>{p}</p>)}
            {s.quote && <blockquote>{s.quote}</blockquote>}
            {s.p2 && s.p2.map((p, k) => <p key={"b" + k}>{p}</p>)}
          </div>
        ))}
      </div>
      <div className="actions" style={{ justifyContent: "center" }}>
        <button className="btn red" onClick={print}>⬇ Download PDF</button>
        <button className="btn ghost" onClick={copy}>⧉ Copy text</button>
      </div>
      <span className={"stamp2" + (stamp ? " on" : "")} style={{ position: "fixed", top: 130, right: 40, zIndex: 60, pointerEvents: "none" }}>APPEAL FILED ✓</span>
    </>
  );
}