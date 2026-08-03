"use client";
import { useEffect, useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import AppealDocument from "@/components/AppealDocument";
import { appeal, BackendUnavailable } from "@/lib/api";
import { typeLines } from "@/lib/terminal";
import { extractFileText } from "@/lib/extractText";

export default function FightPage() {
  const [phase, setPhase] = useState("upload");
  const [sections, setSections] = useState(null);
  const [denialFile, setDenialFile] = useState(null);
  const [denialText, setDenialText] = useState("");
  const [denialExtracted, setDenialExtracted] = useState("");
  const [elapsed, setElapsed] = useState("0:00.0");
  const logRef = useRef(null);
  const progRef = useRef(null);
  const startRef = useRef(0);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 5000); };

  useEffect(() => {
    if (phase !== "analyzing") return;
    startRef.current = Date.now();
    const iv = setInterval(() => {
      const e = (Date.now() - startRef.current) / 1000;
      setElapsed("0:" + String(Math.floor(e)).padStart(2, "0") + "." + Math.floor((e % 1) * 10));
    }, 100);
    return () => clearInterval(iv);
  }, [phase]);

  const canRun = denialFile || denialText.trim().length > 20;

  function handleDenialFile(f) {
    setDenialFile(f);
    extractFileText(f).then((t) => {
      const ok = t && t.trim().length > 40;
      setDenialExtracted(ok ? t : "");
      if (!ok) showToast("Could not read text from this file in the browser. If it is scanned, paste its text below.", false);
    });
  }

  async function run() {
    setPhase("analyzing");
    await new Promise((r) => setTimeout(r, 60));
    if (progRef.current) progRef.current.style.width = "0";
    const typing = typeLines(logRef.current, [
      "> Submitting denial letter to FinePrint backend…",
      "> Auditing the cited clause against the policy…",
      "> Drafting appeal…",
    ], progRef.current);
    try {
      const res = await appeal({ denialFile, denialText: denialText || denialExtracted });
      await typing;
      if (progRef.current) progRef.current.style.width = "100%";
      const secs = Array.isArray(res?.sections) ? res.sections : [];
      if (secs.length === 0) throw new Error("Appeal generation returned an empty result.");
      setSections(secs); setPhase("appeal");
      showToast("Appeal drafted ✓", true);
    } catch (e) {
      await typing;
      showToast(e instanceof BackendUnavailable ? "Backend offline — is uvicorn running?" : (e.message || "Appeal failed"), false);
      setPhase("upload");
    }
  }

  function reset() {
    setPhase("upload"); setSections(null); setDenialFile(null); setDenialText(""); setDenialExtracted("");
    if (progRef.current) progRef.current.style.width = "0";
  }

  return (
    <section className="fade-up">
      {phase === "upload" && (
        <>
          <div className="screen-head">
            <p className="kicker">Mode 2 — ⚔ Fight the Denial</p>
            <h2>They denied the claim. The policy says otherwise.</h2>
            <p className="sub">Upload the denial letter. The agent finds the clause they cited, checks whether they applied it correctly, and drafts a complete appeal citing the policy's own language.</p>
          </div>
          <div className="dz-grid" style={{ gridTemplateColumns: "1fr" }}>
            <UploadZone icon="✉️" title="Denial Letter" hint="The letter or EOB explaining the denied claim"
              loaded={!!denialFile} fileName={denialFile?.name} onFile={handleDenialFile} />
          </div>
          <details className="paste">
            <summary>Paste denial letter text instead</summary>
            <div className="inner">
              <div><div className="ta-label">Denial letter text</div>
                <textarea className="ta" value={denialText} onChange={(e) => setDenialText(e.target.value)} placeholder="Paste the denial letter text here…" rows={6} /></div>
            </div>
          </details>
          <div className="run-row">
            <button className="btn red" disabled={!canRun} onClick={run}>⚔ Generate Appeal Packet</button>
          </div>
        </>
      )}

      {phase === "analyzing" && (
        <div className="screen-head" style={{ borderBottom: "none" }}>
          <p className="kicker">Building your case</p>
          <h2>Auditing the denial against the policy…</h2>
          <div className="terminal" ref={logRef} />
          <div className="prog"><i ref={progRef} /></div>
        </div>
      )}

      {phase === "appeal" && sections && (
        <>
          <div className="screen-head">
            <p className="kicker">Mode 2 — Appeal Packet</p>
            <h2>Appeal Generated</h2>
          </div>
          <div className="appeal-meta">
            <div className="timer"><span>{elapsed}</span><small>Generation time</small></div>
          </div>
          <AppealDocument sections={sections} />
          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn ghost" onClick={reset}>↺ Start over</button>
          </div>
        </>
      )}

      {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
    </section>
  );
}














// "use client";
// import { useEffect, useRef, useState } from "react";
// import UploadZone from "@/components/UploadZone";
// import AppealDocument from "@/components/AppealDocument";
// import { appeal, BackendUnavailable } from "@/lib/api";
// import { typeLines } from "@/lib/terminal";

// export default function FightPage() {
//   const [phase, setPhase] = useState("upload");
//   const [sections, setSections] = useState(null);
//   const [denialFile, setDenialFile] = useState(null);
//   const [denialText, setDenialText] = useState("");
//   const [elapsed, setElapsed] = useState("0:00.0");
//   const logRef = useRef(null);
//   const progRef = useRef(null);
//   const startRef = useRef(0);
//   const [toastMsg, setToastMsg] = useState(null);
//   const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 5000); };

//   useEffect(() => {
//     if (phase !== "analyzing") return;
//     startRef.current = Date.now();
//     const iv = setInterval(() => {
//       const e = (Date.now() - startRef.current) / 1000;
//       setElapsed("0:" + String(Math.floor(e)).padStart(2, "0") + "." + Math.floor((e % 1) * 10));
//     }, 100);
//     return () => clearInterval(iv);
//   }, [phase]);

//   const canRun = denialFile || denialText.trim().length > 20;

//   async function run() {
//     setPhase("analyzing");
//     await new Promise((r) => setTimeout(r, 60));
//     if (progRef.current) progRef.current.style.width = "0";
//     const typing = typeLines(logRef.current, [
//       "> Submitting denial letter to FinePrint backend…",
//       "> Auditing the cited clause against the policy…",
//       "> Drafting appeal…",
//     ], progRef.current);
//     try {
//       const res = await appeal({ denialFile, denialText });
//       await typing;
//       if (progRef.current) progRef.current.style.width = "100%";
//       setSections(res.sections || res); setPhase("appeal");
//       showToast("Appeal drafted ✓", true);
//     } catch (e) {
//       await typing;
//       showToast(e instanceof BackendUnavailable ? "Backend offline — is uvicorn running?" : (e.message || "Appeal failed"), false);
//       setPhase("upload");
//     }
//   }

//   function reset() {
//     setPhase("upload"); setSections(null); setDenialFile(null); setDenialText("");
//     if (progRef.current) progRef.current.style.width = "0";
//   }

//   return (
//     <section className="fade-up">
//       {phase === "upload" && (
//         <>
//           <div className="screen-head">
//             <p className="kicker">Mode 2 — ⚔ Fight the Denial</p>
//             <h2>They denied the claim. The policy says otherwise.</h2>
//             <p className="sub">Upload the denial letter. The agent finds the clause they cited, checks whether they applied it correctly, and drafts a complete appeal citing the policy's own language.</p>
//           </div>
//           <div className="dz-grid" style={{ gridTemplateColumns: "1fr" }}>
//             <UploadZone icon="✉️" title="Denial Letter" hint="The letter or EOB explaining the denied claim"
//               loaded={!!denialFile} fileName={denialFile?.name} onFile={(f) => setDenialFile(f)} />
//           </div>
//           <details className="paste">
//             <summary>Paste denial letter text instead</summary>
//             <div className="inner">
//               <div><div className="ta-label">Denial letter text</div>
//                 <textarea className="ta" value={denialText} onChange={(e) => setDenialText(e.target.value)} placeholder="Paste the denial letter text here…" rows={6} /></div>
//             </div>
//           </details>
//           <div className="run-row">
//             <button className="btn red" disabled={!canRun} onClick={run}>⚔ Generate Appeal Packet</button>
//           </div>
//         </>
//       )}

//       {phase === "analyzing" && (
//         <div className="screen-head" style={{ borderBottom: "none" }}>
//           <p className="kicker">Building your case</p>
//           <h2>Auditing the denial against the policy…</h2>
//           <div className="terminal" ref={logRef} />
//           <div className="prog"><i ref={progRef} /></div>
//         </div>
//       )}

//       {phase === "appeal" && sections && (
//         <>
//           <div className="screen-head">
//             <p className="kicker">Mode 2 — Appeal Packet</p>
//             <h2>Appeal Generated</h2>
//           </div>
//           <div className="appeal-meta">
//             <div className="timer"><span>{elapsed}</span><small>Generation time</small></div>
//           </div>
//           <AppealDocument sections={sections} />
//           <div className="actions" style={{ justifyContent: "center" }}>
//             <button className="btn ghost" onClick={reset}>↺ Start over</button>
//           </div>
//         </>
//       )}

//       {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
//     </section>
//   );
// }