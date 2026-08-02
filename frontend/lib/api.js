const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class BackendUnavailable extends Error {}

// Turn ANY FastAPI error body into a human-readable string (kills the [object Object] toast)
function readableDetail(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (d && d.msg ? d.msg : JSON.stringify(d))).join("; ") || "Validation error";
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return "";
}

async function post(path, body) {
  let res;
  try {
    res = await fetch(API + path, { method: "POST", body });
  } catch (e) {
    throw new BackendUnavailable("Cannot reach backend at " + API + " — is uvicorn running?");
  }
  if (!res.ok) {
    let msg = "HTTP " + res.status;
    try {
      const j = await res.json();
      const d = readableDetail(j.detail);
      if (d) msg = d;
    } catch (_) {
      try { const t = await res.text(); if (t) msg = t; } catch (__) {}
    }
    throw new Error(msg);   // msg is now ALWAYS a clean string
  }
  return res.json();
}

function buildForm({ policyFile, recordsFile, denialFile, policyText, recordsText, denialText }) {
  const fd = new FormData();
  if (policyFile) fd.append("policy", policyFile);
  if (recordsFile) fd.append("records", recordsFile);
  if (denialFile) fd.append("denial", denialFile);
  if (policyText) fd.append("policy_text", policyText);
  if (recordsText) fd.append("records_text", recordsText);
  if (denialText) fd.append("denial_text", denialText);
  return fd;
}

export async function analyze(inputs) {
  const data = await post("/api/analyze", buildForm(inputs));
  if (data.job_id) return pollJob(data.job_id);
  return data;
}

export async function appeal(inputs) {
  const data = await post("/api/appeal", buildForm(inputs));
  if (data.job_id) return pollJob(data.job_id);
  return data;
}

export async function pollJob(jobId, { timeoutMs = 120000, intervalMs = 1500 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    let res;
    try { res = await fetch(API + "/api/jobs/" + jobId); } catch (e) { throw new BackendUnavailable(e.message); }
    const j = await res.json();
    if (j.status === "done") return j.result;
    if (j.status === "error") throw new Error(j.error || "job failed");
  }
  throw new Error("job timed out");
}

export async function health() {
  const res = await fetch(API + "/api/health", { cache: "no-store" });
  if (!res.ok) throw new Error("health bad");
  return res.json();
}