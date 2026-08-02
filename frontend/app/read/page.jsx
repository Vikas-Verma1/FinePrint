"use client";
import { useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import VerdictReport, { VerdictList } from "@/components/VerdictReport";
import StressTest from "@/components/StressTest";
import { analyze, BackendUnavailable } from "@/lib/api";
import { typeLines } from "@/lib/terminal";

export default function ReadPage() {
  const [phase, setPhase] = useState("upload");
  const [data, setData] = useState(null);
  const [policyFile, setPolicyFile] = useState(null);
  const [recordsFile, setRecordsFile] = useState(null);
  const [policyText, setPolicyText] = useState("");
  const [recordsText, setRecordsText] = useState("");
  const logRef = useRef(null);
  const progRef = useRef(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 5000); };
  const canRun = policyFile || recordsFile || policyText.trim().length > 20 || recordsText.trim().length > 20;

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
      const res = await analyze({ policyFile, recordsFile, policyText, recordsText });
      await typing;
      if (progRef.current) progRef.current.style.width = "100%";
      setData(res.report || res); setPhase("report");
      showToast("Analysis complete ✓", true);
    } catch (e) {
      await typing;
      showToast(e instanceof BackendUnavailable ? "Backend offline — is uvicorn running?" : (e.message || "Analysis failed"), false);
      setPhase("upload");
    }
  }

  function reset() {
    setPhase("upload"); setData(null);
    setPolicyFile(null); setRecordsFile(null); setPolicyText(""); setRecordsText("");
    if (progRef.current) progRef.current.style.width = "0";
  }

  return (
    <section className="fade-up">
      {phase === "upload" && (
        <>
          <div className="screen-head">
            <p className="kicker">Mode 1 — 🛡 Read the Fine Print</p>
            <h2>Know what you're signing.</h2>
            <p className="sub">Upload a policy to see its good clauses and its traps. Add your medical records and it cross-references them against your history — telling you, in plain language, what will be paid, what will be refused, and why.</p>
          </div>
          <div className="dz-grid">
            <UploadZone icon="📄" title="Insurance Policy" hint="Policy document / terms & conditions"
              loaded={!!policyFile} fileName={policyFile?.name} onFile={(f) => setPolicyFile(f)} />
            <UploadZone icon="🩺" title="Medical Records (optional)" hint="Prescriptions, lab reports, discharge summaries"
              loaded={!!recordsFile} fileName={recordsFile?.name} onFile={(f) => setRecordsFile(f)} />
          </div>
          <details className="paste">
            <summary>Paste document text instead</summary>
            <div className="inner">
              <div><div className="ta-label">Policy text</div>
                <textarea className="ta" value={policyText} onChange={(e) => setPolicyText(e.target.value)} placeholder="Paste the policy's terms & conditions text here…" rows={4} /></div>
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
          <div className="actions"><button className="btn ghost" onClick={reset}>↺ Analyze another policy</button></div>
        </>
      )}

      {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
    </section>
  );
}