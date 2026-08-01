"use client";
import { useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import VerdictReport, { VerdictList } from "@/components/VerdictReport";
import StressTest from "@/components/StressTest";
import { DEMO, M1_LOG } from "@/lib/demo";
import { analyze, BackendUnavailable } from "@/lib/api";
import { typeLines } from "@/lib/terminal";

export default function ReadPage() {
  const [phase, setPhase] = useState("upload");
  const [data, setData] = useState(null);
  const [compare, setCompare] = useState(false);
  const [sample, setSample] = useState(false);
  const [policyFile, setPolicyFile] = useState(null);
  const [recordsFile, setRecordsFile] = useState(null);
  const [policyText, setPolicyText] = useState("");
  const [recordsText, setRecordsText] = useState("");
  const logRef = useRef(null);
  const progRef = useRef(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 3400); };
  const canRun = sample || policyFile || recordsFile || policyText.trim().length > 20 || recordsText.trim().length > 20;

  async function run() {
    setPhase("analyzing");
    if (progRef.current) progRef.current.style.width = "0";
    if (sample) {
      await typeLines(logRef.current, M1_LOG, progRef.current);
      setData(DEMO); setPhase("report"); return;
    }
    const typing = typeLines(logRef.current, [
      "> Submitting documents to FinePrint backend…",
      "> Backend parses PDFs (pdfplumber + OCR)…",
      "> Awaiting coverage analysis…",
    ], progRef.current);
    try {
      const res = await analyze({ policyFile, recordsFile, policyText, recordsText });
      await typing;
      if (progRef.current) progRef.current.style.width = "100%";
      setData(res.report || res); setPhase("report");
      showToast("Live analysis complete ✓", true);
    } catch (e) {
      await typing;
      if (e instanceof BackendUnavailable) showToast("Backend offline — running built-in demo.", false);
      else showToast("Live analysis failed (" + e.message + ") — showing demo.", false);
      await typeLines(logRef.current, M1_LOG, progRef.current);
      setData(DEMO); setPhase("report");
    }
  }

  function reset() {
    setPhase("upload"); setData(null); setCompare(false); setSample(false);
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
            <p className="sub">Upload the policy and your medical records. The agent cross-references every clause against your history and tells you — in plain language — what will be paid, what will be refused, and why.</p>
          </div>
          <div className="dz-grid">
            <UploadZone icon="📄" title="Insurance Policy" hint="Policy document / terms & conditions"
              loaded={!!policyFile || sample} fileName={policyFile ? policyFile.name : sample ? "SecureHealth_Gold_policy.pdf (sample)" : ""}
              onFile={(f) => { setPolicyFile(f); setSample(false); }}
              onSample={() => { setSample(true); setPolicyFile(null); setPolicyText(""); }} />
            <UploadZone icon="🩺" title="Medical Records" hint="Prescriptions, lab reports, discharge summaries"
              loaded={!!recordsFile || sample} fileName={recordsFile ? recordsFile.name : sample ? "Arjun_Mehta_records.pdf (sample)" : ""}
              onFile={(f) => { setRecordsFile(f); setSample(false); }}
              onSample={() => { setSample(true); setRecordsFile(null); setRecordsText(""); }} />
          </div>
          <details className="paste glass-card p-4 mt-4">
            <summary className="cursor-pointer text-sm font-mono text-slate-400 hover:text-white transition-colors">⚡ Paste document text instead (uses the backend's key)</summary>
            <div className="inner mt-4 space-y-4">
              <div>
                <div className="ta-label mb-2">Policy text</div>
                <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                  value={policyText} onChange={(e) => { setPolicyText(e.target.value); setSample(false); }} placeholder="Paste the policy's terms & conditions text here…" rows={4} />
              </div>
              <div>
                <div className="ta-label mb-2">Medical records text</div>
                <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                  value={recordsText} onChange={(e) => { setRecordsText(e.target.value); setSample(false); }} placeholder="Paste medical history, conditions, medications…" rows={4} />
              </div>
            </div>
          </details>
          <div className="run-row mt-8">
            <button className="btn" disabled={!canRun} onClick={run}>▶ Run Coverage Analysis</button>
          </div>
        </>
      )}

      {phase === "analyzing" && (
        <div className="screen-head">
          <p className="kicker">Analyzing</p>
          <h2>Cross-referencing clauses × records…</h2>
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
            <h4>⚠ Verdict: This policy is a bad fit for {data.patient.name.split(" ")[0]}.</h4>
            <p><b>HeartGuard Plus</b> covers the cardiac risk with a $25,000 limit (vs $5,000) for just <b>$4 more/month</b>. The 36-month waiting period and cardiac cap make this policy a financial trap for this profile.</p>
            <div className="actions" style={{ marginTop: 24 }}>
              <button className="btn sm ghost" onClick={() => setCompare((c) => !c)}>Show side-by-side comparison</button>
            </div>
            <div className={"compare" + (compare ? " open" : "")}>
              <table>
                <tbody>
                  <tr><th></th><th>SecureHealth Gold</th><th>HeartGuard Plus</th></tr>
                  <tr><td>Cardiac limit</td><td className="bad">$5,000 / yr</td><td className="good">$25,000 / yr</td></tr>
                  <tr><td>PED waiting period</td><td className="bad">36 months</td><td className="good">24 months</td></tr>
                  <tr><td>Bariatric surgery</td><td className="bad">Excluded</td><td className="good">Covered w/ documentation</td></tr>
                  <tr><td>Premium</td><td>$118 / mo</td><td>$122 / mo</td></tr>
                  <tr><td>Fit score</td><td className="bad">46 / 100</td><td className="good">81 / 100</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="actions"><button className="btn ghost" onClick={reset}>↺ Start over</button></div>
        </>
      )}

      {toastMsg && <div className={"toast show" + (toastMsg.ok ? " ok" : "")}>{toastMsg.m}</div>}
    </section>
  );
}