"use client";
import { useEffect, useRef, useState } from "react";
import GlossaryText from "./GlossaryText";

export default function VerdictReport({ data }) {
  const [num, setNum] = useState(0);
  const fg = useRef(null);
  const score = data.score;
  const color = score < 50 ? "#ff5470" : score < 70 ? "#fbbf24" : "#34d399";

  useEffect(() => {
    const r1 = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (fg.current) {
        fg.current.style.strokeDashoffset = String(389.6 * (1 - score / 100));
        fg.current.style.stroke = color;
      }
    }));
    let n = 0;
    const iv = setInterval(() => { n += 2; if (n >= score) { n = score; clearInterval(iv); } setNum(n); }, 26);
    return () => { cancelAnimationFrame(r1); clearInterval(iv); };
  }, [score, color]);

  return (
    <div className="report-head">
      <div>
        <p className="kicker">Coverage Verdict Report</p>
        <h2>{data.patient.name}</h2>
        <div className="chips">
          {data.patient.chips.map((c, i) => (
            <span key={i} className={"chip" + (i < 4 ? " hot" : "")}>
              <GlossaryText text={c} />
            </span>
          ))}
        </div>
      </div>
      <div className="gauge">
        <svg width="150" height="150">
          <circle cx="75" cy="75" r="62" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
          <circle ref={fg} cx="75" cy="75" r="62" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray="389.6" strokeDashoffset="389.6" transform="rotate(-90 75 75)"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 8px ${color}88)` }} />
        </svg>
        <div className="gauge-num"><b style={{ color }}>{num}</b><span>POLICY FIT</span></div>
      </div>
    </div>
  );
}

export function VerdictList({ verdicts }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 50); return () => clearTimeout(t); }, []);
  return (
    <>
      {verdicts.map((r, i) => (
        <div key={i} className={"v-row " + r.v + (shown ? " show" : "")} style={{ transitionDelay: i * 90 + "ms" }}>
          <span className={"pill " + r.v}>{r.verdict}</span>
          <div className="v-clause">
            <GlossaryText text={r.clause} />
            <small>Matches: {r.record}</small>
          </div>
          <div className="v-why"><GlossaryText text={r.why} /></div>
        </div>
      ))}
    </>
  );
}













// "use client";
// import { useEffect, useRef, useState } from "react";

// export default function VerdictReport({ data }) {
//   const [num, setNum] = useState(0);
//   const fg = useRef(null);
//   const score = data.score;
//   const color = score < 50 ? "#ff5470" : score < 70 ? "#fbbf24" : "#34d399";

//   useEffect(() => {
//     const r1 = requestAnimationFrame(() => requestAnimationFrame(() => {
//       if (fg.current) {
//         fg.current.style.strokeDashoffset = String(389.6 * (1 - score / 100));
//         fg.current.style.stroke = color;
//       }
//     }));
//     let n = 0;
//     const iv = setInterval(() => { n += 2; if (n >= score) { n = score; clearInterval(iv); } setNum(n); }, 26);
//     return () => { cancelAnimationFrame(r1); clearInterval(iv); };
//   }, [score, color]);

//   return (
//     <div className="report-head">
//       <div>
//         <p className="kicker">Coverage Verdict Report</p>
//         <h2>{data.patient.name}</h2>
//         <div className="chips">
//           {data.patient.chips.map((c, i) => (
//             <span key={i} className={"chip" + (i < 4 ? " hot" : "")}>{c}</span>
//           ))}
//         </div>
//       </div>
//       <div className="gauge">
//         <svg width="150" height="150">
//           <circle cx="75" cy="75" r="62" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
//           <circle ref={fg} cx="75" cy="75" r="62" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
//             strokeDasharray="389.6" strokeDashoffset="389.6" transform="rotate(-90 75 75)"
//             style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 8px ${color}88)` }} />
//         </svg>
//         <div className="gauge-num"><b style={{ color }}>{num}</b><span>POLICY FIT</span></div>
//       </div>
//     </div>
//   );
// }

// export function VerdictList({ verdicts }) {
//   const [shown, setShown] = useState(false);
//   useEffect(() => { const t = setTimeout(() => setShown(true), 50); return () => clearTimeout(t); }, []);
//   return (
//     <>
//       {verdicts.map((r, i) => (
//         <div key={i} className={"v-row " + r.v + (shown ? " show" : "")} style={{ transitionDelay: i * 90 + "ms" }}>
//           <span className={"pill " + r.v}>{r.verdict}</span>
//           <div className="v-clause">{r.clause}<small>Matches: {r.record}</small></div>
//           <div className="v-why">{r.why}</div>
//         </div>
//       ))}
//     </>
//   );
// }