"use client";
import { useState } from "react";

export default function StressTest({ scenarios }) {
  const [i, setI] = useState(-1);
  const s = i >= 0 ? scenarios[i] : null;
  const col = !s ? null : s.payout >= 75 ? "#10b981" : s.payout >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <>
      <h3 className="sec">Stress Test — <em>predict your future claims</em></h3>
      <div className="sc-row">
        {scenarios.map((sc, idx) => (
          <button key={idx} className={"sc-chip" + (idx === i ? " active" : "")} onClick={() => setI(idx)}>
            {sc.icon} {sc.name} · {sc.when}
          </button>
        ))}
      </div>
      <div className="sc-detail">
        {!s ? (
          <span className="hint text-slate-500">Select a scenario above to simulate…</span>
        ) : (
          <>
            <div className="sc-top"><span className="sc-name">{s.icon} {s.name}</span><span className="sc-when">{s.when}</span></div>
            <div className="sc-pay" style={{ color: col }}>{s.payout}% <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>predicted coverage</span></div>
            <div className="sc-bar"><i style={{ background: `linear-gradient(90deg, ${col}, ${col}80)`, width: s.payout + "%" }} /></div>
            <div className="sc-why">{s.why}</div>
            <div className="sc-clauses">{(s.clauses || []).map((c, k) => <span key={k} className="chip">{c}</span>)}</div>
          </>
        )}
      </div>
    </>
  );
}