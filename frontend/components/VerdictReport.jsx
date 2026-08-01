"use client";
import { useEffect, useRef, useState } from "react";

export default function VerdictReport({ data }) {
  const [num, setNum] = useState(0);
  const [shown, setShown] = useState(false);
  const fg = useRef(null);
  const score = data.score;
  const color = score < 50 ? "#ef4444" : score < 70 ? "#f59e0b" : "#10b981";

  useEffect(() => {
    const r1 = requestAnimationFrame(() => requestAnimationFrame(() => {
      setShown(true);
      if (fg.current) {
        fg.current.style.strokeDashoffset = String(389.6 * (1 - score / 100));
        fg.current.style.stroke = color;
      }
    }));
    let n = 0;
    const iv = setInterval(() => { n += 2; if (n >= score) { n = score; clearInterval(iv); } setNum(n); }, 28);
    return () => { cancelAnimationFrame(r1); clearInterval(iv); };
  }, [score, color]);

  return (
    <div className="report-head glass-card">
      <div>
        <p className="kicker">Mode 1 — Coverage Verdict Report</p>
        <h2 className="text-3xl font-bold text-white mb-2">{data.patient.name}</h2>
        <div className="chips">
          {data.patient.chips.map((c, i) => (
            <span key={i} className={"chip" + (i < 4 ? " hot" : "")}>{c}</span>
          ))}
        </div>
      </div>
      <div className="gauge">
        <svg width="160" height="160">
          <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
          <circle ref={fg} cx="80" cy="80" r="62" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray="389.6" strokeDashoffset="389.6" transform="rotate(-90 80 80)"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.16, 1, .3, 1)", filter: `drop-shadow(0 0 8px ${color})` }} />
        </svg>
        <div className="gauge-num"><b style={{ color, textShadow: `0 0 20px ${color}40` }}>{num}</b><span>POLICY FIT</span></div>
      </div>
    </div>
    );
}

export function VerdictList({ verdicts }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 50); return () => clearTimeout(t); }, []);
  return (
    <div className="space-y-4">
      {verdicts.map((r, i) => (
        <div key={i} className={"v-row " + r.v + (shown ? " show" : "")} style={{ transitionDelay: i * 100 + "ms" }}>
          <span className={"pill " + r.v}>{r.verdict}</span>
          <div className="v-clause">{r.clause}<small>Matches: {r.record}</small></div>
          <div className="v-why">{r.why}</div>
        </div>
      ))}
    </div>
  );
}