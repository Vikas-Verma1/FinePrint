"use client";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Tilt3D from "@/components/Tilt3D";

export default function Home() {
  return (
    <section className="fade-up">
      <div className="hero-grid">
        <Tilt3D className="holo ring">
          <div className="badge-denied">DENIED</div>
          <div className="doc-head">SecureHealth Gold · Master Policy · SHG-2026 · 38 pages</div>
          <div className="doc-line"><span className="cn">§4.1</span> "Pre-existing condition" shall mean any illness for which medical advice was received within twenty-four (24) months preceding the effective date…</div>
          <div className="doc-line trap"><span className="cn">§4.2</span> No benefits shall be payable for any pre-existing condition during the <span className="trap-hl">first thirty-six (36) months</span> of continuous coverage…</div>
          <div className="doc-note">↑ the trap is buried on page 7</div>
          <div className="doc-line"><span className="cn">§7.1</span> Aggregate cardiac benefits shall not exceed five thousand dollars ($5,000) per policy year…</div>
          <div className="doc-line trap"><span className="cn">§9.3(k)</span> Exclusions: <span className="trap-hl">bariatric surgery of any kind</span>…</div>
        </Tilt3D>

        <div className="hero-copy">
          <p className="kicker">§ 1.0 — The Fine Print</p>
          <h1>Every <span className="grad">denial</span> can be <span className="hl-underline">stopped</span> before it happens.</h1>
          <p className="lede">1 in 5 health claims gets denied — and most were <b>predictable</b>, hidden in clauses nobody checked against the patient's own records. FinePrint reads the fine print, then writes the appeal.</p>

          <div className="monitor">
            <span className="lbl">Monitoring</span>
            <div className="ekg"><svg viewBox="0 0 600 32" preserveAspectRatio="none"><path d="M0,16 L130,16 L146,16 L153,4 L162,28 L170,16 L310,16 L326,16 L333,4 L342,28 L350,16 L600,16" /></svg></div>
          </div>

          <div className="mode-cards">
            <Tilt3D>
              <Link href="/read" className="mode-card ring shield">
                <div className="mc-icon">🛡</div>
                <div className="mc-tag">Mode 1 · Before you buy</div>
                <div className="mc-title">Read the Fine Print</div>
                <div className="mc-desc">Upload a policy — see its good clauses and its traps. Add medical records to cross-reference your history.</div>
                <div className="mc-go">Open file →</div>
              </Link>
            </Tilt3D>
            <Tilt3D>
              <Link href="/fight" className="mode-card ring sword">
                <div className="mc-icon">⚔</div>
                <div className="mc-tag">Mode 2 · After they deny</div>
                <div className="mc-title">Fight the Denial</div>
                <div className="mc-desc">Upload a denial letter. Get a citation-backed appeal packet, drafted in under a minute.</div>
                <div className="mc-go">Open file →</div>
              </Link>
            </Tilt3D>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="stats">
          <div className="stat"><b>1 in 5</b><span>claims denied</span></div>
          <div className="stat"><b>41%</b><span>overturned on appeal — most never appealed</span></div>
          <div className="stat"><b>&lt;60s</b><span>to draft a citation-backed appeal</span></div>
        </div>
      </Reveal>
    </section>
  );
}