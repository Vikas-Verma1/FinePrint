"use client";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <section className="fade-up">
      <div className="home-grid">
        {/* Left: 3D Document Preview */}
        <div className="perspective-1000">
          <div className="glass-card p-8 transform-3d relative">
            <div className="absolute -top-4 -right-4 bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-display font-bold text-xl rotate-12 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              DENIED
            </div>
            <div className="font-mono text-xs text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">
              SecureHealth Gold · Master Policy · SHG-2026 · 38 pages
            </div>
            <div className="space-y-3 font-mono text-sm text-slate-400">
              <p><span className="text-slate-500">§4.1</span> Definitions. "Pre-existing condition" shall mean any illness, disease or injury for which medical advice or treatment was received within twenty-four (24) months preceding the effective date…</p>
              <p className="bg-red-500/10 border-l-2 border-red-500 pl-3 text-slate-200 font-semibold">
                <span className="text-red-400">§4.2</span> No benefits shall be payable for any pre-existing condition during the first thirty-six (36) months of continuous coverage under this policy…
              </p>
              <p className="text-red-400 text-xs -mt-1 rotate-[-2deg]">↑ this sentence is where the denial lives</p>
              <p><span className="text-slate-500">§7.1</span> Notwithstanding any other provision, aggregate cardiac benefits shall not exceed five thousand dollars ($5,000) per policy year…</p>
            </div>
          </div>
        </div>

        {/* Right: Hero Content */}
        <div>
          <p className="kicker">§ 1.0 — The Fine Print</p>
          <h1>
            Every denial can be <span className="hl">stopped</span><br />
            before it happens.
          </h1>
          <p className="lede">
            1 in 5 health claims gets denied — and most of those denials were <b>predictable</b>, buried in clauses nobody ever checked against the patient's own records. FinePrint reads the fine print before you sign. Then it fights back when they deny.
          </p>
          
          <div className="ekg">
            <svg viewBox="0 0 600 48" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ekgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M0,24 L120,24 L140,24 L148,8 L158,40 L166,24 L300,24 L320,24 L328,8 L338,40 L346,24 L600,24" />
            </svg>
          </div>

          <div className="mode-cards">
            <Link href="/read" className="mode-card glass-card shield">
              <div className="mc-tag">Mode 1 · Before you buy</div>
              <div className="mc-title">🛡 Read the Fine Print</div>
              <div className="mc-desc">Upload a policy + your medical records. Get a clause-by-clause coverage verdict and a stress test of your future claims.</div>
            </Link>
            <Link href="/fight" className="mode-card glass-card sword">
              <div className="mc-tag">Mode 2 · After they deny</div>
              <div className="mc-title">⚔ Fight the Denial</div>
              <div className="mc-desc">Upload a denial letter. Get a citation-backed appeal packet in under a minute.</div>
            </Link>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="stats-strip glass">
          <div className="stat">
            <b>1 in 5</b>
            <span>claims denied</span>
          </div>
          <div className="stat">
            <b>41%</b>
            <span>of denials overturned on appeal</span>
          </div>
          <div className="stat">
            <b>&lt;60s</b>
            <span>to generate a citation-backed appeal</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}