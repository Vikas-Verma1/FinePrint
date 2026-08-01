"use client";
import { useEffect, useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import AppealDocument from "@/components/AppealDocument";
import { DEMO_APPEAL, M2_LOG } from "@/lib/demo";
import { appeal, BackendUnavailable } from "@/lib/api";
import { typeLines } from "@/lib/terminal";

export default function FightPage() {
  const [phase, setPhase] = useState("upload");
  const [sections, setSections] = useState(null);
  const [sample, setSample] = useState(false);
  const [denialFile, setDenialFile] = useState(null);
  const [denialText, setDenialText] = useState("");
  const [elapsed, setElapsed] = useState("0:00.0");
  const logRef = useRef(null);
  const progRef = useRef(null);
  const startRef = useRef(0);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (m, ok) => { setToastMsg({ m, ok }); setTimeout(() => setToastMsg(null), 3400); };

  useEffect(() => {
    if (phase !== "analyzing") return;
    startRef.current = Date.now();
    const iv = setInterval(() => {
      const e = (Date.now() - startRef.current) / 1000;
      setElapsed("0:" + String(Math.floor(e)).padStart(2, "0") + "." + Math.floor((e % 1) * 10));
    }, 100);
    return () => clearInterval(iv);
  }, [phase]);

  const canRun = sample || denialFile || denialText.trim().length > 20;

  async function run() {
    setPhase("analyzing");
    if (progRef.current) progRef.current.style.width = "0";
    if (sample) {
      await typeLines(logRef.current, M2_LOG, progRef.current);
      setSections(DEMO_APPEAL); setPhase("appeal"); return;
    }
    const typing = typeLines(logRef.current, [
      "> Submitting denial letter to FinePrint backend…",
      "> Auditing the cited clause against the policy…",
      "> Drafting appeal…",
    ], progRef.current);
    try {
      const res = await appeal({ denialFile, denialText });
      await typing;
      if (progRef.current) progRef.current.style.width = "100%";
      setSections(res.sections || res); setPhase("appeal");
      showToast("Appeal drafted ✓", true);
    } catch (e) {
      await typing;
      if (e instanceof BackendUnavailable) showToast("Backend offline — running built-in demo.", false);
      else showToast("Live draft failed (" + e.message + ") — showing demo.", false);
      await typeLines(logRef.current, M2_LOG, progRef.current);
      setSections(DEMO_APPEAL); setPhase("appeal");
    }
  }

  function reset() {
    setPhase("upload"); setSections(null); setSample(false); setDenialFile(null); setDenialText("");
    if (progRef.current) progRef.current.style.width = "0";
  }

  return (
    <section className="fade-up">
      {phase === "upload" && (
        <>
          <div className="screen-head">
            <p className="kicker">Mode 2 — ⚔ Fight the Denial</p>
            <h2>They denied the claim. The policy says otherwise.</h2>
            <p className="sub">Upload the denial letter. The agent finds the clause they cited, checks whether they applied it correctly — insurers misapply their own clauses constantly — and drafts a complete appeal citing the policy's own language.</p>
          </div>
          <div className="dz-grid" style={{ gridTemplateColumns: "1fr" }}>
            <UploadZone icon="✉️" title="Denial Letter" hint="The letter or EOB explaining the denied claim"
              loaded={!!denialFile || sample} fileName={denialFile ? denialFile.name : sample ? "denial_HD-2291.pdf (sample)" : ""}
              onFile={(f) => { setDenialFile(f); setSample(false); }}
              onSample={() => { setSample(true); setDenialFile(null); setDenialText(""); }} />
          </div>
          <details className="paste glass-card p-4 mt-4">
            <summary className="cursor-pointer text-sm font-mono text-slate-400 hover:text-white transition-colors">⚡ Paste denial letter text instead (uses the backend's key)</summary>
            <div className="inner mt-4">
              <div>
                <div className="ta-label mb-2">Denial letter text</div>
                <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                  value={denialText} onChange={(e) => { setDenialText(e.target.value); setSample(false); }} placeholder="Paste the denial letter text here…" rows={6} />
              </div>
            </div>
          </details>
          <div className="run-row mt-8">
            <button className="btn red" disabled={!canRun} onClick={run}>⚔ Generate Appeal Packet</button>
          </div>
        </>
      )}

      {phase === "analyzing" && (
        <div className="screen-head">
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
            <h2>Claim #HD-2291 · $11,842.00</h2>
          </div>
          <div className="appeal-meta">
            <div className="timer"><span>{elapsed}</span><small>GENERATION TIME</small></div>
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