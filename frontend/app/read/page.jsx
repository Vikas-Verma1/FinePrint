"use client";
import { useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import VerdictReport, { VerdictList } from "@/components/VerdictReport";
import StressTest from "@/components/StressTest";
import { analyze, BackendUnavailable } from "@/lib/api";
import { typeLines } from "@/lib/terminal";
import { savePolicyContext } from "@/lib/policyStore";
import { extractFileText } from "@/lib/extractText";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReadPage() {
  const [phase, setPhase] = useState("upload");
  const [data, setData] = useState(null);
  const [policyFile, setPolicyFile] = useState(null);
  const [recordsFile, setRecordsFile] = useState(null);
  const [policyText, setPolicyText] = useState("");
  const [recordsText, setRecordsText] = useState("");
  const [policyExtracted, setPolicyExtracted] = useState("");
  const [recordsExtracted, setRecordsExtracted] = useState("");
  const [sbLine, setSbLine] = useState("");
  const logRef = useRef(null);
  const progRef = useRef(null);
  const saveTextTimer = useRef(null);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 5000); };

  const canRun = policyFile || recordsFile || policyText.trim().length > 20 || recordsText.trim().length > 20;

  // Chat-memory extraction (light, background, never blocks Run)
  function handlePolicyFile(f) {
    setPolicyFile(f);
    extractFileText(f).then((t) => {
      const ok = t && t.trim().length > 40;
      setPolicyExtracted(ok ? t : "");
      if (ok) savePolicyContext({ name: f.name, text: t });
      else savePolicyContext({ name: f.name });
    });
  }

  function handleRecordsFile(f) {
    setRecordsFile(f);
    extractFileText(f).then((t) => setRecordsExtracted(t && t.trim().length > 40 ? t : ""));
  }

  function handlePolicyText(v) {
    setPolicyText(v);
    clearTimeout(saveTextTimer.current);
    saveTextTimer.current = setTimeout(() => { if (v.trim().length > 40) savePolicyContext({ name: "Pasted policy", text: v }); }, 600);
  }

  async function compare() {
    const text = policyText || policyExtracted;
    if (!text) { showToast("Upload a text-based policy or paste its text to compare.", false); return; }
    setSbLine("Comparing anonymously…");
    try {
      let dev = localStorage.getItem("fineprint_device");
      if (!dev) { dev = Math.random().toString(36).slice(2); localStorage.setItem("fineprint_device", dev); }
      const res = await fetch(API + "/api/scoreboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_text: text, device_id: dev, consent: true }),
      });
      const j = await res.json();
      if (!j.ok) { setSbLine("Scoreboard not available right now."); return; }
      if (!j.total) { setSbLine(`You're among the first policies in the scoreboard — ${j.insurer}.`); return; }
      setSbLine(`📊 ${j.insurer}: PED waiting period longer than ${j.ped_percentile}% of ${j.total} analyzed policies · score better than ${j.score_percentile}%.`);
    } catch {
      setSbLine("Scoreboard unreachable right now.");
    }
  }

  async function run() {
    setPhase("analyzing");
    await new Promise((r) => setTimeout(r, 60));
    if (progRef.current) progRef.current.style.width = "0";
    const typing = typeLines(logRef.current, [
      "> Submitting documents to FinePrint backend…",
      "> Backend parses PDFs (pdfplumber) & compacts the text…",
      "> AI auditing clauses — good coverage vs. traps…",
    ], progRef.current);
    try {
      // FASTER: if a file is attached, do NOT also upload the big extracted text.
      // Extracted text is only sent as a fallback when there is no file.
      const res = await analyze({
        policyFile,
        recordsFile,
        policyText: policyFile ? policyText : (policyText || policyExtracted),
        recordsText: recordsFile ? recordsText : (recordsText || recordsExtracted),
      });
      await typing;
      if (progRef.current) progRef.current.style.width = "100%";
      const report = res.report || res;
      setData(report); setPhase("report"); setSbLine("");
      savePolicyContext({ report });
      showToast("Analysis complete ✓", true);
    } catch (e) {
      await typing;
      showToast(e instanceof BackendUnavailable ? "Backend offline — is uvicorn running?" : (e.message || "Analysis failed"), false);
      setPhase("upload");
    }
  }

  function reset() {
    setPhase("upload"); setData(null); setSbLine("");
    setPolicyFile(null); setRecordsFile(null); setPolicyText(""); setRecordsText("");
    setPolicyExtracted(""); setRecordsExtracted("");
    if (progRef.current) progRef.current.style.width = "0";
  }

  return (
    <section className="fade-up">
      {phase === "upload" && (
        <>
          <div className="screen-head">
            <p className="kicker">Mode 1 — 🛡 Read the Fine Print</p>
            <h2>Know what you're signing.</h2>
            <p className="sub">Upload a policy to see its good clauses and its traps. Add your medical records and it cross-references them against your history.</p>
          </div>
          <div className="dz-grid">
            <UploadZone icon="📄" title="Insurance Policy" hint="Policy document / terms & conditions"
              loaded={!!policyFile} fileName={policyFile?.name} onFile={handlePolicyFile} />
            <UploadZone icon="🩺" title="Medical Records (optional)" hint="Prescriptions, lab reports, discharge summaries"
              loaded={!!recordsFile} fileName={recordsFile?.name} onFile={handleRecordsFile} />
          </div>
          <details className="paste">
            <summary>Paste document text instead</summary>
            <div className="inner">
              <div><div className="ta-label">Policy text</div>
                <textarea className="ta" value={policyText} onChange={(e) => handlePolicyText(e.target.value)} placeholder="Paste the policy's terms & conditions text here…" rows={4} /></div>
              <div><div className="ta-label">Medical records text (optional)</div>
                <textarea className="ta" value={recordsText} onChange={(e) => setRecordsText(e.target.value)} placeholder="Paste medical history, conditions, medications…" rows={4} /></div>
            </div>
          </details>
          <div className="run-row">
            <button className="btn" disabled={!canRun} onClick={run}>▶ Run Coverage Analysis</button>
          </div>
        </>
      )}

      {phase === "analyzing" && (
        <div className="screen-head" style={{ borderBottom: "none" }}>
          <p className="kicker">Analyzing</p>
          <h2>Reading the fine print…</h2>
          <div className="terminal" ref={logRef} />
          <div className="prog"><i ref={progRef} /></div>
        </div>
      )}

      {phase === "report" && data && (
        <>
          <VerdictReport data={data} />
          <VerdictList verdicts={data.verdicts} />
          <StressTest scenarios={data.scenarios} />
          <div className="verdict-banner">
            <h4>📊 Anonymous insurer scoreboard</h4>
            <p>{sbLine || "Compare this policy anonymously against others (no policy text or personal data stored — only waiting periods, co-pay %, caps and score)."}</p>
            <div className="actions"><button className="btn sm ghost" onClick={compare}>Compare anonymously</button></div>
          </div>
          <div className="actions"><button className="btn ghost" onClick={reset}>↺ Analyze another policy</button></div>
        </>
      )}

      {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
    </section>
  );
}









// "use client";
// import { useRef, useState } from "react";
// import UploadZone from "@/components/UploadZone";
// import VerdictReport, { VerdictList } from "@/components/VerdictReport";
// import StressTest from "@/components/StressTest";
// import { analyze, BackendUnavailable } from "@/lib/api";
// import { typeLines } from "@/lib/terminal";
// import { savePolicyContext } from "@/lib/policyStore";
// import { extractFileText } from "@/lib/extractText";

// export default function ReadPage() {
//   const [phase, setPhase] = useState("upload");
//   const [data, setData] = useState(null);
//   const [policyFile, setPolicyFile] = useState(null);
//   const [recordsFile, setRecordsFile] = useState(null);
//   const [policyText, setPolicyText] = useState("");
//   const [recordsText, setRecordsText] = useState("");
//   const [policyExtracted, setPolicyExtracted] = useState("");
//   const [recordsExtracted, setRecordsExtracted] = useState("");
//   const logRef = useRef(null);
//   const progRef = useRef(null);
//   const saveTextTimer = useRef(null);
//   const [toastMsg, setToastMsg] = useState(null);
//   const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 5000); };

//   const canRun = policyFile || recordsFile || policyText.trim().length > 20 || recordsText.trim().length > 20;

//   // ---- policy file: extract in browser (chat memory + text fallback) ----
//   function handlePolicyFile(f) {
//     setPolicyFile(f);
//     extractFileText(f).then((t) => {
//       const ok = t && t.trim().length > 40;
//       setPolicyExtracted(ok ? t : "");
//       if (ok) savePolicyContext({ name: f.name, text: t });
//       else {
//         savePolicyContext({ name: f.name });
//         if ((f.name || "").toLowerCase().endsWith(".pdf")) {
//           showToast("PDF has no readable text layer — server OCR will try; or paste the policy text below.", false);
//         }
//       }
//     });
//   }

//   // ---- records file: extract in browser as text fallback ----
//   function handleRecordsFile(f) {
//     setRecordsFile(f);
//     extractFileText(f).then((t) => {
//       const ok = t && t.trim().length > 40;
//       setRecordsExtracted(ok ? t : "");
//       if (!ok) showToast("Could not read text from this file in the browser. If it is scanned, paste its text below.", false);
//     });
//   }

//   function handlePolicyText(v) {
//     setPolicyText(v);
//     clearTimeout(saveTextTimer.current);
//     saveTextTimer.current = setTimeout(() => {
//       if (v.trim().length > 40) savePolicyContext({ name: "Pasted policy", text: v });
//     }, 600);
//   }

//   async function run() {
//     setPhase("analyzing");
//     await new Promise((r) => setTimeout(r, 60));
//     if (progRef.current) progRef.current.style.width = "0";
//     const typing = typeLines(logRef.current, [
//       "> Submitting documents to FinePrint backend…",
//       "> Backend parses PDFs (pdfplumber) & compacts the text…",
//       "> AI auditing clauses — good coverage vs. traps…",
//     ], progRef.current);
//     try {
//       const res = await analyze({
//         policyFile, recordsFile,
//         policyText: policyText || policyExtracted,
//         recordsText: recordsText || recordsExtracted,
//       });
//       await typing;
//       if (progRef.current) progRef.current.style.width = "100%";
//       const report = res.report || res;
//       setData(report); setPhase("report");
//       savePolicyContext({ report });
//       showToast("Analysis complete ✓", true);
//     } catch (e) {
//       await typing;
//       showToast(e instanceof BackendUnavailable ? "Backend offline — is uvicorn running?" : (e.message || "Analysis failed"), false);
//       setPhase("upload");
//     }
//   }

//   function reset() {
//     setPhase("upload"); setData(null);
//     setPolicyFile(null); setRecordsFile(null); setPolicyText(""); setRecordsText("");
//     setPolicyExtracted(""); setRecordsExtracted("");
//     if (progRef.current) progRef.current.style.width = "0";
//   }

//   return (
//     <section className="fade-up">
//       {phase === "upload" && (
//         <>
//           <div className="screen-head">
//             <p className="kicker">Mode 1 — 🛡 Read the Fine Print</p>
//             <h2>Know what you're signing.</h2>
//             <p className="sub">Upload a policy to see its good clauses and its traps. Add your medical records and it cross-references them against your history — telling you, in plain language, what will be paid, what will be refused, and why.</p>
//           </div>
//           <div className="dz-grid">
//             <UploadZone icon="📄" title="Insurance Policy" hint="Policy document / terms & conditions"
//               loaded={!!policyFile} fileName={policyFile?.name} onFile={handlePolicyFile} />
//             <UploadZone icon="🩺" title="Medical Records (optional)" hint="Prescriptions, lab reports, discharge summaries"
//               loaded={!!recordsFile} fileName={recordsFile?.name} onFile={handleRecordsFile} />
//           </div>
//           <details className="paste">
//             <summary>Paste document text instead</summary>
//             <div className="inner">
//               <div><div className="ta-label">Policy text</div>
//                 <textarea className="ta" value={policyText} onChange={(e) => handlePolicyText(e.target.value)} placeholder="Paste the policy's terms & conditions text here…" rows={4} /></div>
//               <div><div className="ta-label">Medical records text (optional)</div>
//                 <textarea className="ta" value={recordsText} onChange={(e) => setRecordsText(e.target.value)} placeholder="Paste medical history, conditions, medications…" rows={4} /></div>
//             </div>
//           </details>
//           <div className="run-row">
//             <button className="btn" disabled={!canRun} onClick={run}>▶ Run Coverage Analysis</button>
//           </div>
//         </>
//       )}

//       {phase === "analyzing" && (
//         <div className="screen-head" style={{ borderBottom: "none" }}>
//           <p className="kicker">Analyzing</p>
//           <h2>Reading the fine print…</h2>
//           <div className="terminal" ref={logRef} />
//           <div className="prog"><i ref={progRef} /></div>
//         </div>
//       )}

//       {phase === "report" && data && (
//         <>
//           <VerdictReport data={data} />
//           <VerdictList verdicts={data.verdicts} />
//           <StressTest scenarios={data.scenarios} />
//           <div className="actions"><button className="btn ghost" onClick={reset}>↺ Analyze another policy</button></div>
//         </>
//       )}

//       {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
//     </section>
//   );
// }


















// "use client";
// import { useRef, useState } from "react";
// import UploadZone from "@/components/UploadZone";
// import VerdictReport, { VerdictList } from "@/components/VerdictReport";
// import StressTest from "@/components/StressTest";
// import { analyze, BackendUnavailable } from "@/lib/api";
// import { typeLines } from "@/lib/terminal";
// import { savePolicyContext } from "@/lib/policyStore";
// import { extractFileText } from "@/lib/extractText";

// export default function ReadPage() {
//   const [phase, setPhase] = useState("upload");
//   const [data, setData] = useState(null);
//   const [policyFile, setPolicyFile] = useState(null);
//   const [recordsFile, setRecordsFile] = useState(null);
//   const [policyText, setPolicyText] = useState("");
//   const [recordsText, setRecordsText] = useState("");
//   const logRef = useRef(null);
//   const progRef = useRef(null);
//   const saveTextTimer = useRef(null);
//   const [toastMsg, setToastMsg] = useState(null);
//   const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 5000); };

//   const canRun = policyFile || recordsFile || policyText.trim().length > 20 || recordsText.trim().length > 20;

//   // ---- feed the chatbot's policy memory ----
//   function handlePolicyFile(f) {
//     setPolicyFile(f);
//     extractFileText(f).then((t) => {
//       if (t && t.trim().length > 40) {
//         savePolicyContext({ name: f.name, text: t });
//         showToast("Policy saved to chat memory 📄", true);
//       } else {
//         savePolicyContext({ name: f.name });
//         if ((f.name || "").toLowerCase().endsWith(".pdf")) {
//           showToast("PDF has no readable text layer — chat will use the analysis report. Paste the policy text for exact clause answers.", false);
//         }
//       }
//     });
//   }

//   function handlePolicyText(v) {
//     setPolicyText(v);
//     clearTimeout(saveTextTimer.current);
//     saveTextTimer.current = setTimeout(() => {
//       if (v.trim().length > 40) savePolicyContext({ name: "Pasted policy", text: v });
//     }, 600);
//   }
//   // ------------------------------------------

//   async function run() {
//     setPhase("analyzing");
//     await new Promise((r) => setTimeout(r, 60));
//     if (progRef.current) progRef.current.style.width = "0";
//     const typing = typeLines(logRef.current, [
//       "> Submitting documents to FinePrint backend…",
//       "> Backend parses PDFs (pdfplumber) & compacts the text…",
//       "> AI auditing clauses — good coverage vs. traps…",
//     ], progRef.current);
//     try {
//       const res = await analyze({ policyFile, recordsFile, policyText, recordsText });
//       await typing;
//       if (progRef.current) progRef.current.style.width = "100%";
//       const report = res.report || res;
//       setData(report); setPhase("report");
//       savePolicyContext({ report }); // chatbot now also knows the analysis
//       showToast("Analysis complete ✓", true);
//     } catch (e) {
//       await typing;
//       showToast(e instanceof BackendUnavailable ? "Backend offline — is uvicorn running?" : (e.message || "Analysis failed"), false);
//       setPhase("upload");
//     }
//   }

//   function reset() {
//     setPhase("upload"); setData(null);
//     setPolicyFile(null); setRecordsFile(null); setPolicyText(""); setRecordsText("");
//     if (progRef.current) progRef.current.style.width = "0";
//   }

//   return (
//     <section className="fade-up">
//       {phase === "upload" && (
//         <>
//           <div className="screen-head">
//             <p className="kicker">Mode 1 — 🛡 Read the Fine Print</p>
//             <h2>Know what you're signing.</h2>
//             <p className="sub">Upload a policy to see its good clauses and its traps. Add your medical records and it cross-references them against your history — telling you, in plain language, what will be paid, what will be refused, and why.</p>
//           </div>
//           <div className="dz-grid">
//             <UploadZone icon="📄" title="Insurance Policy" hint="Policy document / terms & conditions"
//               loaded={!!policyFile} fileName={policyFile?.name} onFile={handlePolicyFile} />
//             <UploadZone icon="🩺" title="Medical Records (optional)" hint="Prescriptions, lab reports, discharge summaries"
//               loaded={!!recordsFile} fileName={recordsFile?.name} onFile={(f) => setRecordsFile(f)} />
//           </div>
//           <details className="paste">
//             <summary>Paste document text instead</summary>
//             <div className="inner">
//               <div><div className="ta-label">Policy text</div>
//                 <textarea className="ta" value={policyText} onChange={(e) => handlePolicyText(e.target.value)} placeholder="Paste the policy's terms & conditions text here…" rows={4} /></div>
//               <div><div className="ta-label">Medical records text (optional)</div>
//                 <textarea className="ta" value={recordsText} onChange={(e) => setRecordsText(e.target.value)} placeholder="Paste medical history, conditions, medications…" rows={4} /></div>
//             </div>
//           </details>
//           <div className="run-row">
//             <button className="btn" disabled={!canRun} onClick={run}>▶ Run Coverage Analysis</button>
//           </div>
//         </>
//       )}

//       {phase === "analyzing" && (
//         <div className="screen-head" style={{ borderBottom: "none" }}>
//           <p className="kicker">Analyzing</p>
//           <h2>Reading the fine print…</h2>
//           <div className="terminal" ref={logRef} />
//           <div className="prog"><i ref={progRef} /></div>
//         </div>
//       )}

//       {phase === "report" && data && (
//         <>
//           <VerdictReport data={data} />
//           <VerdictList verdicts={data.verdicts} />
//           <StressTest scenarios={data.scenarios} />
//           <div className="actions"><button className="btn ghost" onClick={reset}>↺ Analyze another policy</button></div>
//         </>
//       )}

//       {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
//     </section>
//   );
// }











// "use client";
// import { useRef, useState } from "react";
// import UploadZone from "@/components/UploadZone";
// import VerdictReport, { VerdictList } from "@/components/VerdictReport";
// import StressTest from "@/components/StressTest";
// import { analyze, BackendUnavailable } from "@/lib/api";
// import { typeLines } from "@/lib/terminal";

// export default function ReadPage() {
//   const [phase, setPhase] = useState("upload");
//   const [data, setData] = useState(null);
//   const [policyFile, setPolicyFile] = useState(null);
//   const [recordsFile, setRecordsFile] = useState(null);
//   const [policyText, setPolicyText] = useState("");
//   const [recordsText, setRecordsText] = useState("");
//   const logRef = useRef(null);
//   const progRef = useRef(null);
//   const [toastMsg, setToastMsg] = useState(null);

//   const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 5000); };
//   const canRun = policyFile || recordsFile || policyText.trim().length > 20 || recordsText.trim().length > 20;

//   async function run() {
//     setPhase("analyzing");
//     await new Promise((r) => setTimeout(r, 60));
//     if (progRef.current) progRef.current.style.width = "0";
//     const typing = typeLines(logRef.current, [
//       "> Submitting documents to FinePrint backend…",
//       "> Backend parses PDFs (pdfplumber) & compacts the text…",
//       "> AI auditing clauses — good coverage vs. traps…",
//     ], progRef.current);
//     try {
//       const res = await analyze({ policyFile, recordsFile, policyText, recordsText });
//       await typing;
//       if (progRef.current) progRef.current.style.width = "100%";
//       setData(res.report || res); setPhase("report");
//       showToast("Analysis complete ✓", true);
//     } catch (e) {
//       await typing;
//       showToast(e instanceof BackendUnavailable ? "Backend offline — is uvicorn running?" : (e.message || "Analysis failed"), false);
//       setPhase("upload");
//     }
//   }

//   function reset() {
//     setPhase("upload"); setData(null);
//     setPolicyFile(null); setRecordsFile(null); setPolicyText(""); setRecordsText("");
//     if (progRef.current) progRef.current.style.width = "0";
//   }

//   return (
//     <section className="fade-up">
//       {phase === "upload" && (
//         <>
//           <div className="screen-head">
//             <p className="kicker">Mode 1 — 🛡 Read the Fine Print</p>
//             <h2>Know what you're signing.</h2>
//             <p className="sub">Upload a policy to see its good clauses and its traps. Add your medical records and it cross-references them against your history — telling you, in plain language, what will be paid, what will be refused, and why.</p>
//           </div>
//           <div className="dz-grid">
//             <UploadZone icon="📄" title="Insurance Policy" hint="Policy document / terms & conditions"
//               loaded={!!policyFile} fileName={policyFile?.name} onFile={(f) => setPolicyFile(f)} />
//             <UploadZone icon="🩺" title="Medical Records (optional)" hint="Prescriptions, lab reports, discharge summaries"
//               loaded={!!recordsFile} fileName={recordsFile?.name} onFile={(f) => setRecordsFile(f)} />
//           </div>
//           <details className="paste">
//             <summary>Paste document text instead</summary>
//             <div className="inner">
//               <div><div className="ta-label">Policy text</div>
//                 <textarea className="ta" value={policyText} onChange={(e) => setPolicyText(e.target.value)} placeholder="Paste the policy's terms & conditions text here…" rows={4} /></div>
//               <div><div className="ta-label">Medical records text (optional)</div>
//                 <textarea className="ta" value={recordsText} onChange={(e) => setRecordsText(e.target.value)} placeholder="Paste medical history, conditions, medications…" rows={4} /></div>
//             </div>
//           </details>
//           <div className="run-row">
//             <button className="btn" disabled={!canRun} onClick={run}>▶ Run Coverage Analysis</button>
//           </div>
//         </>
//       )}

//       {phase === "analyzing" && (
//         <div className="screen-head" style={{ borderBottom: "none" }}>
//           <p className="kicker">Analyzing</p>
//           <h2>Reading the fine print…</h2>
//           <div className="terminal" ref={logRef} />
//           <div className="prog"><i ref={progRef} /></div>
//         </div>
//       )}

//       {phase === "report" && data && (
//         <>
//           <VerdictReport data={data} />
//           <VerdictList verdicts={data.verdicts} />
//           <StressTest scenarios={data.scenarios} />
//           <div className="actions"><button className="btn ghost" onClick={reset}>↺ Analyze another policy</button></div>
//         </>
//       )}

//       {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
//     </section>
//   );
// }