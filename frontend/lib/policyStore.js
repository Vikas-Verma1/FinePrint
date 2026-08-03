// frontend/lib/policyStore.js
// Client-side "policy memory" so the chatbot answers ONLY from YOUR policy.

const KEY = "fineprint_policy_context";
const MAX_TEXT_CHARS = 40000;   // stored raw policy text cap
const MAX_REPORT_CHARS = 8000;  // stored analysis report cap

export function compactText(text, max = MAX_TEXT_CHARS) {
  if (!text) return "";
  const out = [];
  let prev = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const ln = rawLine.trim();
    if (!ln) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      prev = null;
      continue;
    }
    if (ln === prev) continue;
    prev = ln;
    out.push(ln);
  }
  let cleaned = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length > max) cleaned = cleaned.slice(0, max) + "\n[…truncated…]";
  return cleaned;
}

function summarizeReport(report) {
  if (!report || typeof report !== "object") return null;
  const slim = {
    name: report.patient?.name,
    score: report.score,
    chips: report.patient?.chips || [],
    verdicts: (report.verdicts || []).map((v) => ({
      verdict: v.verdict,
      clause: v.clause,
      record: v.record,
      why: v.why,
    })),
    scenarios: (report.scenarios || []).map((s) => ({
      name: s.name,
      when: s.when,
      payout: s.payout,
      why: s.why,
      clauses: s.clauses,
    })),
  };
  let json = JSON.stringify(slim);
  if (json.length > MAX_REPORT_CHARS) json = json.slice(0, MAX_REPORT_CHARS);
  return json;
}

export function savePolicyContext({ name, text, report } = {}) {
  if (typeof window === "undefined") return;
  try {
    const prev = loadPolicyContext() || {};
    const next = {
      name: name || prev.name || "Uploaded policy",
      text: text !== undefined ? compactText(text) : prev.text || "",
      reportJson: report !== undefined ? summarizeReport(report) : prev.reportJson || null,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("policyStore: could not save", e);
  }
}

export function loadPolicyContext() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || (!obj.text && !obj.reportJson)) return null;
    return obj;
  } catch {
    return null;
  }
}

export function clearPolicyContext() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}